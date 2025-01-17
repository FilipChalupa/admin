import {
	Component,
	SugaredQualifiedEntityList,
	TreeRootId,
	useBindingOperations,
	useEnvironment,
} from '@contember/binding'
import { FunctionComponent, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import type { DataGridContainerPublicProps, DataGridState } from '../base'
import { useGridPagingState } from '../paging'
import { extractDataGridColumns } from '../structure'
import { renderGrid, RenderGridOptions } from './renderGrid'
import { useFilters } from './useFilters'
import { useHiddenColumnsState } from './useHiddenColumnsState'
import { useOrderBys } from './useOrderBys'
import { ContainerSpinner } from '@contember/ui'
import { useCurrentRequest } from '../../../../../routing'
import { noop } from '@contember/react-utils'

export interface DataGridProps extends DataGridContainerPublicProps {
	dataGridKey?: string

	entities: SugaredQualifiedEntityList['entities']
	children: ReactNode

	itemsPerPage?: number | null
}

export const DataGrid: FunctionComponent<DataGridProps> = Component(
	props => {
		const { extendTree } = useBindingOperations()
		const isMountedRef = useRef(true)
		const environment = useEnvironment()

		const columns = useMemo(() => extractDataGridColumns(props.children), [props.children])

		const pageName = useCurrentRequest()?.pageName
		const entityName = typeof props.entities === 'string' ? props.entities : props.entities.entityName
		const dataGridKey = props.dataGridKey ?? `${pageName}__${entityName}`

		const [pageState, updatePaging] = useGridPagingState(props.itemsPerPage ?? null, dataGridKey)

		const [hiddenColumns, setIsColumnHidden] = useHiddenColumnsState(columns, dataGridKey)
		const [orderDirections, setOrderBy] = useOrderBys(columns, updatePaging, dataGridKey)
		const [filterArtifacts, setFilter] = useFilters(columns, updatePaging, dataGridKey)

		const containerProps: DataGridContainerPublicProps = useMemo(
			() => ({
				emptyMessageComponentExtraProps: props.emptyMessageComponentExtraProps,
				emptyMessage: props.emptyMessage,
				emptyMessageComponent: props.emptyMessageComponent,
			}),
			[props.emptyMessage, props.emptyMessageComponent, props.emptyMessageComponentExtraProps],
		)
		const gridOptions = useMemo(
			(): RenderGridOptions => ({
				entities: props.entities,
				setIsColumnHidden,
				updatePaging,
				setFilter,
				setOrderBy,
				containerProps,
			}),
			[props.entities, setIsColumnHidden, updatePaging, setFilter, setOrderBy, containerProps],
		)

		const loadAbortControllerRef = useRef<AbortController | undefined>(undefined)

		const desiredState = useMemo(
			(): DataGridState => ({
				paging: pageState,
				columns,
				hiddenColumns,
				filterArtifacts,
				orderDirections,
			}),
			[pageState, columns, hiddenColumns, filterArtifacts, orderDirections],
		)

		const [displayedState, setDisplayedState] = useState<{
			gridState: DataGridState | undefined
			treeRootId: TreeRootId | undefined
		}>({
			gridState: undefined,
			treeRootId: undefined,
		})

		useEffect(() => {
			const extend = async () => {
				if (displayedState.gridState === desiredState) {
					return
				}
				loadAbortControllerRef.current?.abort()

				const newController = new AbortController()
				loadAbortControllerRef.current = newController

				let newTreeRootId: TreeRootId | undefined = undefined

				try {
					newTreeRootId = await extendTree(
						renderGrid(gridOptions, undefined, desiredState, desiredState, environment),
						{
							signal: newController.signal,
						},
					)
				} catch {
					// TODO Distinguish abort vs actual error
					return
				}
				if (!isMountedRef.current) {
					return
				}
				setDisplayedState({
					gridState: desiredState,
					treeRootId: newTreeRootId,
				})
			}
			extend()
		}, [desiredState, displayedState, environment, extendTree, gridOptions])

		useEffect(
			() => () => {
				isMountedRef.current = false
			},
			[],
		)
		if (!displayedState.gridState) {
			return <ContainerSpinner />
		}

		return renderGrid(gridOptions, displayedState.treeRootId, displayedState.gridState, desiredState, environment)
	},
	(props, environment) => {
		const columns = extractDataGridColumns(props.children)
		const fakeState: DataGridState = {
			columns,
			paging: {
				itemsPerPage: props.itemsPerPage ?? null,
				pageIndex: 0,
			},
			hiddenColumns: {},
			filterArtifacts: {},
			orderDirections: {},
		}

		return renderGrid(
			{
				entities: props.entities,
				updatePaging: noop,
				setIsColumnHidden: noop,
				setOrderBy: noop,
				setFilter: noop,
				containerProps: props,
			},
			undefined,
			fakeState,
			fakeState,
			environment,
		)
	},
	'DataGrid',
)
