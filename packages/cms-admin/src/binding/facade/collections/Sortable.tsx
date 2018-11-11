import { Icon } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import {
	SortableContainer,
	SortableContainerProps,
	SortableElement,
	SortableElementProps,
	SortableHandle,
	SortEndHandler
} from 'react-sortable-hoc'
import { FieldName } from '../../bindingTypes'
import {
	DataContext,
	DataContextValue,
	EnforceSubtypeRelation,
	Field,
	Props,
	SyntheticChildrenProvider
} from '../../coreComponents'
import { EntityAccessor, EntityCollectionAccessor, FieldAccessor } from '../../dao'

export interface SortablePublicProps {
	sortBy: FieldName
}

export interface SortableInternalProps {
	entities?: EntityCollectionAccessor
}

export interface SortableProps extends SortablePublicProps, SortableInternalProps {}

class Sortable extends React.Component<SortableProps> {
	public static displayName = 'Sortable'

	public render() {
		if (this.props.entities) {
			return (
				<Sortable.SortableInner sortBy={this.props.sortBy} entities={this.props.entities}>
					{this.props.children}
				</Sortable.SortableInner>
			)
		}
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityCollectionAccessor) {
						return (
							<Sortable.SortableInner sortBy={this.props.sortBy} entities={data}>
								{this.props.children}
							</Sortable.SortableInner>
						)
					}
				}}
			</DataContext.Consumer>
		)
	}

	public static generateSyntheticChildren(props: Props<SortableProps>): React.ReactNode {
		return (
			<>
				<Field name={props.sortBy} />
				{props.children}
			</>
		)
	}
}

namespace Sortable {
	export interface DragHandleProps {}

	export const DragHandle = SortableHandle((props: Props<DragHandleProps>) => (
		<Icon icon={IconNames.DRAG_HANDLE_HORIZONTAL} className="sortable-item-handle" />
	))

	export interface SortableItemProps {
		entity: EntityAccessor
	}

	export const SortableItem = SortableElement((props: Props<SortableItemProps & SortableElementProps>) => (
		<li className="sortable-item">
			<DragHandle />
			<div className="sortable-item-content">{props.children}</div>
		</li>
	))

	export interface SortableListProps {
		entities: EntityAccessor[]
	}

	export const SortableList = SortableContainer((props: Props<SortableListProps & SortableContainerProps>) => {
		return (
			<ul className="sortable">
				{props.entities.map((item, index) => {
					return (
						<SortableItem entity={item} key={item.getKey()} index={index}>
							<DataContext.Provider value={item}>{props.children}</DataContext.Provider>
						</SortableItem>
					)
				})}
			</ul>
		)
	})

	export interface SortableInnerProps {
		entities: EntityCollectionAccessor
		sortBy: FieldName
	}

	export class SortableInner extends React.PureComponent<SortableInnerProps> {
		private entities: EntityAccessor[] = []

		private onSortEnd: SortEndHandler = ({ oldIndex, newIndex }, e) => {
			const persistedOrder: { [primaryKey: string]: number } = {}
			const unpersistedOrder: { [primaryKey: string]: number } = {}

			for (let i = 0, len = this.entities.length; i < len; i++) {
				const entity = this.entities[i]
				const orderField = entity.data.getField(this.props.sortBy)

				if (orderField instanceof FieldAccessor && orderField.onChange) {
					let targetValue

					if (i === oldIndex) {
						targetValue = newIndex
					} else if (oldIndex < newIndex && i > oldIndex && i <= newIndex) {
						targetValue = i - 1
					} else if (oldIndex > newIndex && i >= newIndex && i < oldIndex) {
						targetValue = i + 1
					} else {
						targetValue = i
					}

					if (!(typeof orderField.currentValue === 'number') || orderField.currentValue !== targetValue) {
						if (typeof entity.primaryKey === 'string') {
							persistedOrder[entity.primaryKey] = targetValue
						} else {
							unpersistedOrder[entity.primaryKey.value] = targetValue
						}
					}
				}
			}
			for (const entity of this.entities) {
				const orderField = entity.data.getField(this.props.sortBy)
				const target =
					typeof entity.primaryKey === 'string'
						? persistedOrder[entity.primaryKey]
						: unpersistedOrder[entity.primaryKey.value]

				if (target !== undefined && orderField instanceof FieldAccessor && orderField.onChange) {
					orderField.onChange(target)
				}
			}
		}

		public render() {
			const entities = this.props.entities.entities.filter(
				(item): item is EntityAccessor => item instanceof EntityAccessor
			)

			this.entities = entities.sort((a, b) => {
				const [aField, bField] = [a.data.getField(this.props.sortBy), b.data.getField(this.props.sortBy)]

				if (
					aField instanceof FieldAccessor &&
					bField instanceof FieldAccessor &&
					typeof aField.currentValue === 'number' &&
					typeof bField.currentValue === 'number'
				) {
					return aField.currentValue - bField.currentValue
				}
				return 0
			})

			return (
				<SortableList entities={this.entities} onSortEnd={this.onSortEnd} useDragHandle={true} lockAxis="y">
					{this.props.children}
				</SortableList>
			)
		}
	}
}

export { Sortable }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Sortable, SyntheticChildrenProvider<SortableProps>>