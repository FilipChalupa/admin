import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import {
	ReactNode,
	ComponentType,
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	FC,
	FunctionComponent,
	Fragment,
	PureComponent,
	useEffect,
} from 'react'
import { DataGridColumn, DataGridColumnProps, DataGridColumns } from '../base'

class BoxedGridColumnProps {
	public constructor(public readonly value: DataGridColumnProps) {}
}

const gridColumnLeaf = new Leaf(node => new BoxedGridColumnProps(node.props), DataGridColumn)

const gridTemplateAnalyzer = new ChildrenAnalyzer<BoxedGridColumnProps>([gridColumnLeaf], {
	ignoreUnhandledNodes: false,
	unhandledNodeErrorMessage: `DataGrid: encountered an illegal child node.`,
})

export const extractDataGridColumns = (nodes: ReactNode): DataGridColumns => {
	const processed = gridTemplateAnalyzer.processChildren(nodes, undefined)
	return new Map(processed.map((column, i) => [i, column.value]))
}
