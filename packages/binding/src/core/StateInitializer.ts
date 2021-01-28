import { GraphQlBuilder } from '@contember/client'
import { BindingOperations, EntityAccessor, EntityListAccessor, ErrorAccessor, FieldAccessor } from '../accessors'
import { EntityFieldPersistedData, RuntimeId, ServerGeneratedUuid, UnpersistedEntityDummyId } from '../accessorTree'
import { BindingError } from '../BindingError'
import { FieldMarker, HasManyRelationMarker, HasOneRelationMarker, Marker, SubTreeMarker } from '../markers'
import { FieldName, Scalar } from '../treeParameters'
import { assertNever } from '../utils'
import { AccessorErrorManager } from './AccessorErrorManager'
import { Config } from './Config'
import { EventManager } from './EventManager'
import { EntityOperations, FieldOperations, ListOperations } from './operations'
import { RealmKeyGenerator } from './RealmKeyGenerator'
import {
	EntityListBlueprint,
	EntityListState,
	EntityRealmBlueprint,
	EntityRealmState,
	EntityRealmStateStub,
	EntityState,
	FieldState,
	RootStateNode,
	StateType,
} from './state'
import { TreeParameterMerger } from './TreeParameterMerger'
import { TreeStore } from './TreeStore'

export class StateInitializer {
	private readonly fieldOperations: FieldOperations
	private readonly entityOperations: EntityOperations
	private readonly listOperations: ListOperations

	public constructor(
		private readonly accessorErrorManager: AccessorErrorManager,
		private readonly bindingOperations: BindingOperations,
		private readonly config: Config,
		private readonly eventManager: EventManager,
		private readonly treeStore: TreeStore,
	) {
		this.fieldOperations = new FieldOperations(this.eventManager, this.treeStore)
		this.entityOperations = new EntityOperations(this.bindingOperations, this.eventManager, this, this.treeStore)
		this.listOperations = new ListOperations(
			this.bindingOperations,
			this.entityOperations,
			this.eventManager,
			this,
			this.treeStore,
		)
	}

	public initializeSubTree(tree: SubTreeMarker): RootStateNode {
		let subTreeState: RootStateNode
		const persistedRootData = this.treeStore.subTreePersistedData.get(tree.placeholderName)

		if (tree.parameters.type === 'qualifiedEntityList' || tree.parameters.type === 'unconstrainedQualifiedEntityList') {
			const persistedEntityIds: Set<string> = persistedRootData instanceof Set ? persistedRootData : new Set()
			subTreeState = this.initializeEntityListState(
				{
					creationParameters: tree.parameters.value,
					environment: tree.environment,
					initialEventListeners: tree.parameters.value,
					markersContainer: tree.fields,
					parent: undefined,
					placeholderName: tree.placeholderName,
				},
				persistedEntityIds,
			)
		} else {
			const id = persistedRootData instanceof ServerGeneratedUuid ? persistedRootData : new UnpersistedEntityDummyId()
			const blueprint: EntityRealmBlueprint = {
				creationParameters: tree.parameters.value,
				environment: tree.environment,
				initialEventListeners: tree.parameters.value,
				markersContainer: tree.fields,
				parent: undefined,
				placeholderName: tree.placeholderName,
			}
			subTreeState = this.initializeEntityRealm(this.initializeEntityRealmStub(id, blueprint))
		}
		this.treeStore.subTreeStates.set(tree.placeholderName, subTreeState)

		return subTreeState
	}

	public initializeEntityRealmStub(id: RuntimeId, blueprint: EntityRealmBlueprint): EntityRealmStateStub {
		const entity = this.initializeEntityState(id)
		const realmKey = RealmKeyGenerator.getRealmKey(id, blueprint)

		const existing = entity.realms.get(realmKey)

		if (existing !== undefined) {
			if (existing.type === StateType.EntityRealmStub) {
				return existing
			}
			throw new BindingError() // TODO
		}

		const stub: EntityRealmStateStub = {
			type: StateType.EntityRealmStub,

			blueprint,
			entity,
			realmKey,
			getAccessor: () => this.initializeEntityRealm(stub).getAccessor(),
		}
		// if (__DEV_MODE__) {
		// 	const fromParent = entity.realms.get(realmKey)
		// 	const fromStore = this.treeStore.entityRealmStore.get(realmKey)
		// 	const sameBlueprintParent = fromParent?.blueprint === blueprint
		// 	const sameBlueprintStore = fromParent?.blueprint === blueprint
		// 	if (fromParent !== undefined || fromStore !== undefined) {
		// 		// TODO As far as I can tell, these shouldn't happen. To the point that this check may even be unnecessary.
		// 		//		Let's see if the reality has something to say about that.
		// 		console.log(sameBlueprintParent, sameBlueprintStore)
		// 		throw new BindingError()
		// 	}
		// }
		entity.realms.set(realmKey, stub)
		this.treeStore.entityRealmStore.set(realmKey, stub)
		return stub
	}

	public initializeEntityRealm({ realmKey, entity, blueprint }: EntityRealmStateStub): EntityRealmState {
		// TODO can there already legally be a realm with the same key?
		//		If the realms were clearly identical, it should have been caught at the marker level. Otherwise,
		//		they should be different realms. So how does this ever reasonably happen?

		const entityRealm: EntityRealmState = {
			type: StateType.EntityRealm,

			blueprint,
			realmKey,
			entity,

			children: new Map(),
			childrenWithPendingUpdates: undefined,
			errors: undefined,
			eventListeners: TreeParameterMerger.cloneSingleEntityEventListeners(
				blueprint.initialEventListeners?.eventListeners,
			),
			fieldsWithPendingConnectionUpdates: undefined,
			hasPendingParentNotification: false,
			hasStaleAccessor: true,
			plannedHasOneDeletions: undefined,
			unpersistedChangesCount: 0,

			addError: error => {
				return this.accessorErrorManager.addError(entityRealm, { type: ErrorAccessor.ErrorType.Validation, error })
			},
			addEventListener: (type: EntityAccessor.EntityEventType, ...args: unknown[]) => {
				return this.entityOperations.addEventListener(entityRealm, type, ...args)
			},
			batchUpdates: performUpdates => {
				this.entityOperations.batchUpdates(entityRealm, performUpdates)
			},
			connectEntityAtField: (fieldName, entityToConnectOrItsKey) => {
				// this.entityOperations.connectEntityAtField(entityRealm, fieldName, entityToConnectOrItsKey)
			},
			disconnectEntityAtField: (fieldName, initializeReplacement) => {
				// this.entityOperations.disconnectEntityAtField(entityRealm, fieldName, initializeReplacement)
			},
			getAccessor: (() => {
				let accessor: EntityAccessor | undefined = undefined
				return () => {
					if (entityRealm.hasStaleAccessor || accessor === undefined) {
						entityRealm.hasStaleAccessor = false
						accessor = new EntityAccessor(
							entityRealm.entity.id,
							entityRealm.realmKey,

							// We're technically exposing more info in runtime than we'd like but that way we don't have to allocate and
							// keep in sync two copies of the same data. TS hides the extra info anyway.
							entityRealm.children,
							this.treeStore.persistedEntityData.get(entityRealm.entity.id.value),
							entityRealm.errors,
							entityRealm.blueprint.environment,
							entityRealm.addError,
							entityRealm.addEventListener,
							entityRealm.batchUpdates,
							entityRealm.connectEntityAtField,
							entityRealm.disconnectEntityAtField,
							entityRealm.entity.deleteEntity,
						)
					}
					return accessor
				}
			})(),
		}

		this.treeStore.entityRealmStore.set(realmKey, entityRealm)

		if (blueprint.creationParameters.forceCreation && !entity.id.existsOnServer) {
			entityRealm.unpersistedChangesCount += 1
		}

		const persistedData = this.treeStore.persistedEntityData.get(entity.id.value)
		for (const [placeholderName, field] of blueprint.markersContainer.markers) {
			this.initializeEntityField(entityRealm, field, persistedData?.get(placeholderName))
		}

		this.eventManager.registerNewlyInitialized(entityRealm)

		blueprint.parent?.children.set(blueprint.placeholderName, entityRealm)

		return entityRealm
	}

	private initializeEntityState(id: RuntimeId): EntityState {
		const entityKey = id.value
		const existingState = this.treeStore.entityStore.get(entityKey)

		if (existingState) {
			return existingState
		}

		const entityState: EntityState = {
			hasIdSetInStone: false,
			id,
			isScheduledForDeletion: false,
			maidenId: id instanceof UnpersistedEntityDummyId ? id : undefined,
			realms: new Map(),

			deleteEntity: () => {
				this.entityOperations.deleteEntity(entityState)
			},
		}
		this.treeStore.entityStore.set(entityKey, entityState)

		return entityState
	}

	private initializeEntityListState(blueprint: EntityListBlueprint, persistedEntityIds: Set<string>): EntityListState {
		const entityListState: EntityListState = {
			type: StateType.EntityList,
			blueprint,
			persistedEntityIds,
			addEventListener: undefined as any,
			children: new Map(),
			childrenWithPendingUpdates: undefined,
			eventListeners: TreeParameterMerger.cloneEntityListEventListeners(
				blueprint.initialEventListeners?.eventListeners,
			),
			errors: undefined,
			plannedRemovals: undefined,
			hasPendingParentNotification: false,
			hasStaleAccessor: true,
			unpersistedChangesCount: 0, // TODO force creation?
			getAccessor: (() => {
				let accessor: EntityListAccessor | undefined = undefined
				return () => {
					if (entityListState.hasStaleAccessor || accessor === undefined) {
						entityListState.hasStaleAccessor = false
						accessor = new EntityListAccessor(
							entityListState.children,
							entityListState.persistedEntityIds,
							entityListState.errors,
							entityListState.blueprint.environment,
							entityListState.addError,
							entityListState.addEventListener,
							entityListState.batchUpdates,
							entityListState.connectEntity,
							entityListState.createNewEntity,
							entityListState.disconnectEntity,
							entityListState.getChildEntityById,
						)
					}
					return accessor
				}
			})(),
			addError: error =>
				this.accessorErrorManager.addError(entityListState, { type: ErrorAccessor.ErrorType.Validation, error }),
			batchUpdates: performUpdates => {
				this.listOperations.batchUpdates(entityListState, performUpdates)
			},
			connectEntity: entityToConnectOrItsKey => {
				// this.listOperations.connectEntity(entityListState, entityToConnectOrItsKey)
			},
			createNewEntity: initialize => {
				this.listOperations.createNewEntity(entityListState, initialize)
			},
			disconnectEntity: childEntityOrItsKey => {
				// this.listOperations.disconnectEntity(entityListState, childEntityOrItsKey)
			},
			getChildEntityById: id => {
				return this.listOperations.getChildEntityById(entityListState, id)
			},
		}
		entityListState.addEventListener = this.getAddEventListener(entityListState)

		const initialData: Set<string | undefined> =
			persistedEntityIds.size === 0
				? new Set(Array.from({ length: blueprint.creationParameters.initialEntityCount }))
				: persistedEntityIds
		for (const entityId of initialData) {
			this.initializeListEntityStub(entityListState, entityId)
		}

		return entityListState
	}

	private initializeFieldState(
		parent: EntityRealmState,
		placeholderName: FieldName,
		fieldMarker: FieldMarker,
		persistedValue: Scalar | undefined,
	): FieldState {
		const resolvedFieldValue = persistedValue ?? fieldMarker.defaultValue ?? null

		const fieldState: FieldState = {
			type: StateType.Field,
			fieldMarker,
			placeholderName,
			persistedValue,
			parent,
			value: resolvedFieldValue,
			addEventListener: undefined as any,
			eventListeners: {
				beforeUpdate: undefined,
				update: undefined,
			},
			errors: undefined,
			touchLog: undefined,
			hasUnpersistedChanges: false,
			hasStaleAccessor: true,
			getAccessor: (() => {
				let accessor: FieldAccessor | undefined = undefined
				return () => {
					if (fieldState.hasStaleAccessor || accessor === undefined) {
						fieldState.hasStaleAccessor = false
						accessor = new FieldAccessor<Scalar | GraphQlBuilder.Literal>(
							fieldState.placeholderName,
							fieldState.value,
							fieldState.persistedValue === undefined ? null : fieldState.persistedValue,
							fieldState.fieldMarker.defaultValue,
							fieldState.errors,
							fieldState.hasUnpersistedChanges,
							fieldState.touchLog,
							fieldState.addError,
							fieldState.addEventListener,
							fieldState.updateValue,
						)
					}
					return accessor
				}
			})(),
			addError: error =>
				this.accessorErrorManager.addError(fieldState, { type: ErrorAccessor.ErrorType.Validation, error }),
			updateValue: (newValue, options) => {
				this.fieldOperations.updateValue(fieldState, newValue, options)
			},
		}
		fieldState.addEventListener = this.getAddEventListener(fieldState)
		return fieldState
	}

	private initializeFromFieldMarker(
		entityRealm: EntityRealmState,
		field: FieldMarker,
		fieldDatum: EntityFieldPersistedData | undefined,
	) {
		if (fieldDatum instanceof Set) {
			throw new BindingError(
				`Received a collection of referenced entities where a single '${field.fieldName}' field was expected. ` +
					`Perhaps you wanted to use a <Repeater />?`,
			)
		}
		if (fieldDatum instanceof ServerGeneratedUuid) {
			throw new BindingError(
				`Received a referenced entity where a single '${field.fieldName}' field was expected. ` +
					`Perhaps you wanted to use <HasOne />?`,
			)
		}
		entityRealm.children.set(
			field.placeholderName,
			this.initializeFieldState(entityRealm, field.placeholderName, field, fieldDatum),
		)
	}

	private initializeFromHasOneRelationMarker(
		entityRealm: EntityRealmState,
		field: HasOneRelationMarker,
		fieldDatum: EntityFieldPersistedData | undefined,
	) {
		const relation = field.relation

		if (fieldDatum instanceof Set) {
			throw new BindingError(
				`Received a collection of entities for field '${relation.field}' where a single entity was expected. ` +
					`Perhaps you wanted to use a <Repeater />?`,
			)
		} else if (fieldDatum instanceof ServerGeneratedUuid || fieldDatum === null || fieldDatum === undefined) {
			const entityId = fieldDatum instanceof ServerGeneratedUuid ? fieldDatum : new UnpersistedEntityDummyId()
			entityRealm.children.set(
				field.placeholderName,
				this.initializeEntityRealmStub(entityId, {
					creationParameters: field.relation,
					environment: field.environment,
					initialEventListeners: field.relation,
					markersContainer: field.fields,
					parent: entityRealm,
					placeholderName: field.placeholderName,
				}),
			)
		} else {
			throw new BindingError(
				`Received a scalar value for field '${relation.field}' where a single entity was expected.` +
					`Perhaps you meant to use a variant of <Field />?`,
			)
		}
	}

	private initializeFromHasManyRelationMarker(
		entityRealm: EntityRealmState,
		field: HasManyRelationMarker,
		fieldDatum: EntityFieldPersistedData | undefined,
	) {
		const relation = field.relation

		if (fieldDatum === undefined || fieldDatum instanceof Set) {
			entityRealm.children.set(
				field.placeholderName,
				this.initializeEntityListState(
					{
						markersContainer: field.fields,
						initialEventListeners: field.relation,
						parent: entityRealm,
						placeholderName: field.placeholderName,
						environment: field.environment,
						creationParameters: field.relation,
					},
					fieldDatum || new Set(),
				),
			)
		} else if (typeof fieldDatum === 'object') {
			// Intentionally allowing `fieldDatum === null` here as well since this should only happen when a *hasOne
			// relation is unlinked, e.g. a Person does not have a linked Nationality.
			throw new BindingError(
				`Received a referenced entity for field '${relation.field}' where a collection of entities was expected.` +
					`Perhaps you wanted to use a <HasOne />?`,
			)
		} else {
			throw new BindingError(
				`Received a scalar value for field '${relation.field}' where a collection of entities was expected.` +
					`Perhaps you meant to use a variant of <Field />?`,
			)
		}
	}

	public initializeEntityField(
		entityRealm: EntityRealmState,
		field: Marker,
		fieldDatum: EntityFieldPersistedData | undefined,
	): void {
		if (field instanceof FieldMarker) {
			this.initializeFromFieldMarker(entityRealm, field, fieldDatum)
		} else if (field instanceof HasOneRelationMarker) {
			this.initializeFromHasOneRelationMarker(entityRealm, field, fieldDatum)
		} else if (field instanceof HasManyRelationMarker) {
			this.initializeFromHasManyRelationMarker(entityRealm, field, fieldDatum)
		} else if (field instanceof SubTreeMarker) {
			// Do nothing: all sub trees have been hoisted and shouldn't appear here.
		} else {
			assertNever(field)
		}
	}

	private getAddEventListener(state: {
		eventListeners: {
			[eventType: string]: Set<Function> | undefined
		}
	}) {
		return (type: string, listener: Function) => {
			if (state.eventListeners[type] === undefined) {
				state.eventListeners[type] = new Set<never>()
			}
			state.eventListeners[type]!.add(listener as any)
			return () => {
				if (state.eventListeners[type] === undefined) {
					return // Throw an error? This REALLY should not happen.
				}
				state.eventListeners[type]!.delete(listener as any)
				if (state.eventListeners[type]!.size === 0) {
					state.eventListeners[type] = undefined
				}
			}
		}
	}

	private initializeListEntityStub(
		entityListState: EntityListState,
		entityId: string | undefined,
	): EntityRealmStateStub {
		const id = entityId ? new ServerGeneratedUuid(entityId) : new UnpersistedEntityDummyId()
		const stub = this.initializeEntityRealmStub(id, this.createListEntityBlueprint(entityListState, id))
		entityListState.hasStaleAccessor = true
		entityListState.children.set(id.value, stub)

		return stub
	}

	public createListEntityBlueprint(
		parent: EntityListState,
		id: UnpersistedEntityDummyId | ServerGeneratedUuid,
	): EntityRealmBlueprint {
		return {
			creationParameters: parent.blueprint.creationParameters,
			environment: parent.blueprint.environment,
			initialEventListeners: this.eventManager.getEventListenersForListEntity(parent),
			markersContainer: parent.blueprint.markersContainer,
			parent: parent,
			placeholderName: id.value,
		}
	}
}
