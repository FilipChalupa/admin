import { MarkerSubTreeParameters, ReferenceMarker } from '../markers'
import {
	BoxedQualifiedEntityList,
	BoxedQualifiedSingleEntity,
	ExpectedEntityCount,
	Filter,
	UniqueWhere,
} from '../treeParameters'
import { assertNever } from './assertNever'

export class Hashing {
	public static hashReferenceConstraints(constraints: ReferenceMarker.ReferenceConstraints): number {
		const where: Array<Filter | UniqueWhere | ExpectedEntityCount | undefined> = [
			constraints.filter,
			constraints.reducedBy,
			constraints.expectedCount,
		]

		return Hashing.hashArray(where)
	}

	public static hashMarkerTreeParameters(parameters: MarkerSubTreeParameters): number {
		if (parameters.isConstrained) {
			if (parameters instanceof BoxedQualifiedSingleEntity) {
				return Hashing.hashArray([
					parameters.type,
					parameters.value.where,
					parameters.value.entityName,
					parameters.value.filter,
				])
			} else if (parameters instanceof BoxedQualifiedEntityList) {
				const value = parameters.value
				return Hashing.hashArray([
					parameters.type,
					value.entityName,
					value.filter,
					value.orderBy,
					value.offset,
					value.limit,
					value.connectTo,
				])
			}
		} else {
			return Hashing.hashArray([parameters.type, parameters.value.entityName, parameters.value.connectTo])
		}
		return assertNever(parameters)
	}

	private static hashArray(array: any[]): number {
		const json = array.map(item => JSON.stringify(item)).join('_')
		return Hashing.hash(json)
	}

	// Taken from Java
	public static hash(str: string): number {
		let hash = 0
		if (str.length === 0) {
			return hash
		}
		for (let i = 0; i < str.length; i++) {
			hash = (hash << 5) - hash + str.charCodeAt(i)
			hash = hash & hash // Convert to 32bit integer
		}
		return Math.abs(hash)
	}
}
