import { Environment, OrderBy, QueryLanguage } from '@contember/binding'
import { DataGridColumnKey, DataGridColumns, DataGridOrderDirection } from '../base'

export const getColumnOrderBy = (
	columns: DataGridColumns,
	key: DataGridColumnKey,
	direction: DataGridOrderDirection,
	environment: Environment,
): OrderBy | undefined => {
	const column = columns.get(key)
	if (column === undefined || column.enableOrdering === false) {
		return undefined
	}
	const sugaredOrderBy = column.getNewOrderBy(direction, {
		environment,
	})
	if (sugaredOrderBy === undefined) {
		return undefined
	}
	return QueryLanguage.desugarOrderBy(sugaredOrderBy, environment)
}