import { CrudQueryBuilder } from '@contember/client'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import {
	ConnectionMarker,
	EntityFieldMarkers,
	FieldMarker,
	MarkerSubTree,
	MarkerTreeRoot,
	ReferenceMarker,
} from '../markers'
import {
	BoxedQualifiedEntityList,
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedEntityList,
	BoxedUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { assertNever, ucfirst } from '../utils'

type BaseQueryBuilder = Omit<CrudQueryBuilder.CrudQueryBuilder, CrudQueryBuilder.Mutations>

type ReadBuilder = CrudQueryBuilder.ReadBuilder.Builder<never>

export class QueryGenerator {
	constructor(private tree: MarkerTreeRoot) {}

	public getReadQuery(): string | undefined {
		try {
			let baseQueryBuilder: BaseQueryBuilder = new CrudQueryBuilder.CrudQueryBuilder()

			for (const [, subTreeMarker] of this.tree.subTrees) {
				baseQueryBuilder = this.addSubQuery(subTreeMarker, baseQueryBuilder)
			}
			return baseQueryBuilder.getGql()
		} catch (e) {
			return undefined
		}
	}

	private addSubQuery(subTree: MarkerSubTree, baseQueryBuilder: BaseQueryBuilder): BaseQueryBuilder {
		switch (subTree.parameters.type) {
			case 'qualifiedSingleEntity':
				return this.addGetQuery(baseQueryBuilder, subTree as MarkerSubTree<BoxedQualifiedSingleEntity>)
			case 'qualifiedEntityList':
				return this.addListQuery(baseQueryBuilder, subTree as MarkerSubTree<BoxedQualifiedEntityList>)
			case 'unconstrainedQualifiedSingleEntity':
			case 'unconstrainedQualifiedEntityList': {
				const [populatedBaseQueryBuilder] = this.addMarkerSubTreeQueries(
					baseQueryBuilder,
					this.registerQueryPart(subTree.fields, CrudQueryBuilder.ReadBuilder.instantiate()),
				)
				return populatedBaseQueryBuilder
			}
		}
		assertNever(subTree.parameters)
	}

	private addGetQuery(
		baseQueryBuilder: BaseQueryBuilder,
		subTree: MarkerSubTree<BoxedQualifiedSingleEntity>,
	): BaseQueryBuilder {
		const [populatedBaseQueryBuilder, populatedListQueryBuilder] = this.addMarkerSubTreeQueries(
			baseQueryBuilder,
			this.registerQueryPart(
				subTree.fields,
				CrudQueryBuilder.ReadBuilder.instantiate<CrudQueryBuilder.GetQueryArguments>().by(
					subTree.parameters.value.where,
				),
			),
		)

		return populatedBaseQueryBuilder.get(
			subTree.entityName,
			CrudQueryBuilder.ReadBuilder.instantiate(
				populatedListQueryBuilder ? populatedListQueryBuilder.objectBuilder : undefined,
			),
			subTree.placeholderName,
		)
	}

	private addListQuery(
		baseQueryBuilder: BaseQueryBuilder,
		subTree: MarkerSubTree<BoxedQualifiedEntityList>,
	): BaseQueryBuilder {
		let finalBuilder: ReadBuilder

		if (subTree.parameters) {
			const parametersValue = subTree.parameters.value
			const withFilter: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
				CrudQueryBuilder.ReadArguments,
				'filter'
			>> = parametersValue.filter
				? CrudQueryBuilder.ReadBuilder.instantiate().filter(parametersValue.filter)
				: CrudQueryBuilder.ReadBuilder.instantiate()

			const withOrderBy: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
				CrudQueryBuilder.ReadArguments,
				'filter' | 'orderBy'
			>> = parametersValue.orderBy ? withFilter.orderBy(parametersValue.orderBy) : withFilter

			const withOffset: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
				CrudQueryBuilder.ReadArguments,
				'filter' | 'orderBy' | 'offset'
			>> = parametersValue.offset === undefined ? withOrderBy : withOrderBy.offset(parametersValue.offset)

			finalBuilder = parametersValue.limit === undefined ? withOffset : withOffset.limit(parametersValue.limit)
		} else {
			finalBuilder = CrudQueryBuilder.ReadBuilder.instantiate()
		}

		const [newBaseQueryBuilder, newReadBuilder] = this.addMarkerSubTreeQueries(
			baseQueryBuilder,
			this.registerQueryPart(subTree.fields, finalBuilder),
		)

		return newBaseQueryBuilder.list(
			subTree.entityName,
			newReadBuilder || CrudQueryBuilder.ReadBuilder.instantiate(),
			subTree.placeholderName,
		)
	}

	private *registerQueryPart(fields: EntityFieldMarkers, builder: ReadBuilder): Generator<MarkerSubTree, ReadBuilder> {
		builder = builder.column(PRIMARY_KEY_NAME)
		builder = builder.column(TYPENAME_KEY_NAME)

		for (const [, fieldValue] of fields) {
			if (fieldValue instanceof FieldMarker) {
				if (fieldValue.fieldName !== PRIMARY_KEY_NAME) {
					builder = builder.column(fieldValue.fieldName)
				}
			} else if (fieldValue instanceof ReferenceMarker) {
				for (const referenceName in fieldValue.references) {
					const reference = fieldValue.references[referenceName]

					let builderWithBody = CrudQueryBuilder.ReadBuilder.instantiate()
					const subPart = this.registerQueryPart(reference.fields, builderWithBody)

					let item = subPart.next()

					while (!item.done) {
						yield item.value
						item = subPart.next()
					}
					builderWithBody = CrudQueryBuilder.ReadBuilder.instantiate(item.value.objectBuilder)

					const filteredBuilder: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
						CrudQueryBuilder.ReadArguments,
						'filter'
					>> = reference.filter ? builderWithBody.filter(reference.filter) : builderWithBody

					if (reference.reducedBy) {
						// Assuming there's exactly one reducer field as enforced by MarkerTreeGenerator
						const relationField = `${fieldValue.fieldName}By${ucfirst(Object.keys(reference.reducedBy)[0])}`
						builder = builder.reductionRelation(
							relationField,
							filteredBuilder.by(reference.reducedBy),
							referenceName === relationField ? undefined : referenceName,
						)
					} else {
						builder = builder.anyRelation(
							fieldValue.fieldName,
							filteredBuilder,
							referenceName === fieldValue.fieldName ? undefined : referenceName,
						)
					}
				}
			} else if (fieldValue instanceof ConnectionMarker) {
				// Do nothing ‒ connections are only relevant to mutations.
			} else {
				yield fieldValue
			}
		}

		return builder
	}

	private addMarkerSubTreeQueries(
		baseQueryBuilder: BaseQueryBuilder,
		subTrees: Generator<MarkerSubTree, ReadBuilder>,
	): [BaseQueryBuilder, ReadBuilder | undefined] {
		let item = subTrees.next()
		while (!item.done) {
			baseQueryBuilder = this.addSubQuery(item.value, baseQueryBuilder)
			item = subTrees.next()
		}

		return [baseQueryBuilder, item.value]
	}
}
