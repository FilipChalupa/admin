import { useMemo } from 'react'
import { QueryLanguage } from '../queryLanguage'
import { RelativeSingleEntity, SugaredRelativeSingleEntity } from '../treeParameters'
import { useEnvironment } from './useEnvironment'

function useDesugaredRelativeSingleEntity(
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity,
): RelativeSingleEntity
function useDesugaredRelativeSingleEntity(
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined,
): RelativeSingleEntity | undefined
function useDesugaredRelativeSingleEntity(
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined,
): RelativeSingleEntity | undefined {
	const environment = useEnvironment()

	let normalizedSugared: SugaredRelativeSingleEntity | undefined = undefined
	let hasEntity: boolean

	if (sugaredRelativeSingleEntity === undefined) {
		hasEntity = false
	} else if (typeof sugaredRelativeSingleEntity === 'string') {
		hasEntity = true
		normalizedSugared = {
			field: sugaredRelativeSingleEntity,
		}
	} else {
		hasEntity = true
		normalizedSugared = sugaredRelativeSingleEntity
	}

	return useMemo(
		() =>
			hasEntity
				? QueryLanguage.desugarRelativeSingleEntity(
						{
							field: normalizedSugared!.field,
							isNonbearing: normalizedSugared?.isNonbearing,
							setOnCreate: normalizedSugared?.setOnCreate,
						},
						environment,
				  )
				: undefined,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[normalizedSugared?.field, normalizedSugared?.isNonbearing, normalizedSugared?.setOnCreate, environment, hasEntity],
	)
}

export { useDesugaredRelativeSingleEntity }
