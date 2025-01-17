import {
	EntityAccessor,
	QueryLanguage,
	RelativeSingleEntity,
	SugaredRelativeSingleEntity,
	useAccessorUpdateSubscription,
	useEntityKey,
	useEnvironment,
	useGetEntityByKey,
	useMutationState,
} from '@contember/binding'
import { useCallback, useMemo } from 'react'
import { BaseDynamicChoiceField, useCurrentValues } from './BaseDynamicChoiceField'
import type { ChoiceFieldData } from './ChoiceFieldData'
import { useSelectOptions } from './useSelectOptions'
import { useAccessorErrors } from '../../errors'

export type DynamicSingleChoiceFieldProps = SugaredRelativeSingleEntity & BaseDynamicChoiceField

export const useDynamicSingleChoiceField = (
	props: DynamicSingleChoiceFieldProps,
): ChoiceFieldData.SingleChoiceFieldMetadata => {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const environment = useEnvironment()
	const isMutating = useMutationState()

	const desugaredRelativePath = useMemo<RelativeSingleEntity>(() => {
		return QueryLanguage.desugarRelativeSingleEntity(props, environment)
	}, [environment, props])

	const lastHasOneRelation =
		desugaredRelativePath.hasOneRelationPath[desugaredRelativePath.hasOneRelationPath.length - 1]
	const currentValueFieldName = lastHasOneRelation.field

	const getCurrentValueParent = useCallback((): EntityAccessor => {
		const parentEntity = getEntityByKey(entityKey)
		return desugaredRelativePath.hasOneRelationPath.length > 1
			? parentEntity.getRelativeSingleEntity({
					hasOneRelationPath: desugaredRelativePath.hasOneRelationPath.slice(0, -1),
			  })
			: parentEntity
	}, [entityKey, desugaredRelativePath, getEntityByKey])
	const currentValueParent = useAccessorUpdateSubscription(getCurrentValueParent)
	const currentValueEntity = currentValueParent.getRelativeSingleEntity({
		hasOneRelationPath: [lastHasOneRelation],
	})
	const currentlyChosenEntities = currentValueEntity.existsOnServer || currentValueEntity.hasUnpersistedChanges ? [currentValueEntity] : []

	const [entities, options] = useSelectOptions(props, currentlyChosenEntities)

	const currentValues = useCurrentValues(currentlyChosenEntities, entities)
	const errors = useAccessorErrors(currentValueEntity)

	return {
		data: options,
		errors,
		isMutating,
		environment,
		currentValue: currentValues.length ? currentValues[0] : -1,
		onChange: (newValue: ChoiceFieldData.ValueRepresentation) => {
			if (newValue === -1) {
				currentValueParent.disconnectEntityAtField(currentValueFieldName)
			} else {
				currentValueParent.connectEntityAtField(currentValueFieldName, entities[newValue])
			}
		},
	}
}
