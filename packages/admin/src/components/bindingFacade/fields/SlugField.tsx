import { FormGroup, TextInput } from '@contember/ui'
import slugify from '@sindresorhus/slugify'
import * as React from 'react'
import {
	Component,
	Environment,
	Field,
	SugaredRelativeSingleField,
	useEntityContext,
	useEnvironment,
	useMutationState,
	useRelativeSingleField,
} from '@contember/binding'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'
import { ConcealableField, ConcealableFieldProps } from '../ui'

export type SlugFieldProps = Pick<ConcealableFieldProps, 'buttonProps' | 'concealTimeout'> &
	SimpleRelativeSingleFieldProps & {
		drivenBy: SugaredRelativeSingleField['field']
		format?: (currentValue: string, environment: Environment) => string
		unpersistedHardPrefix?: string
		persistedHardPrefix?: string
		concealTimeout?: number
	}

export const SlugField = Component<SlugFieldProps>(
	({ buttonProps, concealTimeout, format, unpersistedHardPrefix, persistedHardPrefix, drivenBy, field, ...props }) => {
		const [hasEditedSlug, setHasEditedSlug] = React.useState(false)
		const hostEntity = useEntityContext() // TODO this will fail for some QL uses
		const slugField = useRelativeSingleField<string>(field)
		const driverField = useRelativeSingleField<string>(drivenBy)
		const environment = useEnvironment()
		const isMutating = useMutationState()

		let slugValue = slugField.currentValue || ''

		if (!hasEditedSlug && !hostEntity.isPersisted()) {
			slugValue = slugify(driverField.currentValue || '')

			if (format) {
				slugValue = format(slugValue, environment)
			}
			if (persistedHardPrefix) {
				slugValue = `${persistedHardPrefix}${slugValue}`
			}
		}

		React.useEffect(() => {
			if (slugField.currentValue === slugValue || !slugField.updateValue) {
				return
			}
			slugField.updateValue(slugValue)
		}, [slugField, slugValue])

		const completePrefix = `${unpersistedHardPrefix || ''}${persistedHardPrefix || ''}`
		const presentedValue = `${unpersistedHardPrefix || ''}${slugValue}`

		return (
			<ConcealableField
				renderConcealedValue={() => presentedValue}
				buttonProps={buttonProps}
				concealTimeout={concealTimeout}
			>
				{({ inputRef, onFocus, onBlur }) => (
					<FormGroup
						label={props.label ? environment.applySystemMiddleware('labelMiddleware', props.label) : undefined}
						errors={slugField.errors}
						labelDescription={props.labelDescription}
						labelPosition={props.labelPosition || 'labelInlineLeft'}
						description={props.description}
						size="small"
					>
						<TextInput
							value={presentedValue}
							onChange={e => {
								hasEditedSlug || setHasEditedSlug(true)
								if (slugField.updateValue) {
									const rawValue = e.target.value
									const unprefixedValue = rawValue.substring(completePrefix.length)
									slugField.updateValue(`${persistedHardPrefix || ''}${unprefixedValue}`)
								}
							}}
							readOnly={isMutating}
							validationState={slugField.errors.length ? 'invalid' : undefined}
							size="small"
							ref={inputRef}
							onFocus={onFocus}
							onBlur={onBlur}
							{...props}
						/>
					</FormGroup>
				)}
			</ConcealableField>
		)
	},
	props => (
		<>
			<Field field={props.field} defaultValue={props.defaultValue} isNonbearing={true} />
			<Field field={props.drivenBy} />
			{props.label}
		</>
	),
	'SlugField',
)