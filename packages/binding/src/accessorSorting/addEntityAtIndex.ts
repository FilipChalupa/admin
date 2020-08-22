import { EntityAccessor, EntityListAccessor } from '../accessors'
import { RelativeSingleField } from '../treeParameters'
import { throwNonWritableError } from './errors'
import { repairEntitiesOrder } from './repairEntitiesOrder'
import { sortEntities } from './sortEntities'

export const addEntityAtIndex = (
	entityList: EntityListAccessor,
	sortableByField: RelativeSingleField,
	index: number,
	preprocess?: EntityAccessor.BatchUpdatesHandler,
) => {
	const createNewEntity = entityList.createNewEntity

	if (!createNewEntity) {
		return throwNonWritableError(entityList)
	}
	const sortedEntities = sortEntities(Array.from(entityList), sortableByField)
	entityList.batchUpdates(() => {
		createNewEntity(getNewlyAdded => {
			let newlyAdded = getNewlyAdded()

			const sortableField = newlyAdded.getRelativeSingleField<number>(sortableByField)

			if (sortableField.updateValue) {
				sortableField.updateValue(index)
				newlyAdded = getNewlyAdded()

				sortedEntities.splice(index, 0, newlyAdded)
				repairEntitiesOrder(sortableByField, sortedEntities)
			} else {
				return throwNonWritableError(sortableField.fieldName)
			}

			preprocess?.(getNewlyAdded)
		})
	})
}