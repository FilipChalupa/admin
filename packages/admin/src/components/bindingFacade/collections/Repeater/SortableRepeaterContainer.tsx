import { memo, ReactNode } from 'react'
import { SortableContainer } from 'react-sortable-hoc'

export interface SortableRepeaterContainerProps {
	children: ReactNode
}

export const SortableRepeaterContainer = memo(
	SortableContainer(({ children }: SortableRepeaterContainerProps) => <>{children}</>),
)
SortableRepeaterContainer.displayName = 'SortableRepeaterContainer'
