import { BindingError } from '../BindingError'
import { Environment } from '../dao'
import { HasManyRelation } from '../treeParameters'
import { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer'
import { PlaceholderGenerator } from './PlaceholderGenerator'

// This doesn't represent reduced has many relations.
export class HasManyRelationMarker {
	public readonly placeholderName: string

	public constructor(
		public readonly relation: HasManyRelation,
		public readonly fields: EntityFieldMarkersContainer,
		public readonly environment: Environment,
	) {
		if (__DEV_MODE__) {
			if (relation.initialEntityCount < 0 || !Number.isInteger(relation.initialEntityCount)) {
				throw new BindingError(`The preferred 'initialEntityCount' for a relation must be a non-negative integer!`)
			}
		}
		this.placeholderName = PlaceholderGenerator.generateHasManyRelationMarkerPlaceholder(this)
	}
}