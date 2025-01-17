import { FilterRendererProps } from '../base'
import { BaseDynamicChoiceField } from '../../../fields/ChoiceField/BaseDynamicChoiceField'
import { useSelectOptions } from '../../../fields/ChoiceField/useSelectOptions'
import { useMemo } from 'react'
import { useMessageFormatter } from '../../../../../i18n'
import { dataGridCellsDictionary } from './dataGridCellsDictionary'
import { MultiSelectFieldInner } from '../../../fields'
import { Checkbox } from '@contember/ui'


// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SelectCellArtifacts = {
	id: string[]
	nullCondition: boolean
}
type SelectCellFilterProps =
	& FilterRendererProps<SelectCellArtifacts>
	& {
		optionProps: BaseDynamicChoiceField
	}

export const SelectCellFilter = ({ filter, setFilter, environment, optionProps }: SelectCellFilterProps) => {
	const [entities, options] = useSelectOptions(optionProps)
	const currentValues = useMemo(() => {
		const values: number[] = []
		for (const id of filter.id) {
			const val = entities.findIndex(it => it.id === id)
			if (val >= 0) {
				values.push(val)
			}
		}
		return values
	}, [entities, filter])
	const formatMessage = useMessageFormatter(dataGridCellsDictionary)

	return <>
		<MultiSelectFieldInner
			label={undefined}
			environment={environment}
			onChange={(val, isChosen) => {
				const id = entities[val].id
				if (isChosen) {
					setFilter({ ...filter, id: [...filter.id, id] })
				} else {
					setFilter({ ...filter, id: filter.id.filter(it => it !== id) })
				}
			}}
			data={options}
			errors={undefined}
			currentValues={currentValues} clear={() => {
			setFilter({ ...filter, id: [] })
		}}
			isMutating={false} />

		<Checkbox
			value={filter.nullCondition}
			onChange={checked => {
				setFilter({
					...filter,
					nullCondition: checked,
				})
			}}
		>
			<span style={{ whiteSpace: 'nowrap' }}>
				{formatMessage('dataGridCells.textCell.includeNull', {
					strong: chunks => <strong>{chunks}</strong>,
				})}
			</span>
		</Checkbox>
	</>
}
