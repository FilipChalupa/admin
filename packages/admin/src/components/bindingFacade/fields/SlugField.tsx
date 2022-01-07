import {
	Component,
	Environment,
	Field,
	SugaredRelativeSingleField,
	useDerivedField,
	useEnvironment,
} from '@contember/binding'
import { isSpecialLinkClick, SingleLineTextInputProps, SlugInput } from '@contember/ui'
import slugify from '@sindresorhus/slugify'
import { useCallback, useMemo, useState } from 'react'
import type { SimpleRelativeSingleFieldProps } from '../auxiliary'
import { SimpleRelativeSingleField } from '../auxiliary'
import { stringFieldParser, useTextInput } from './useTextInput'

type SlugPrefix = string | ((environment: Environment) => string)

export type SlugFieldProps =
	& SimpleRelativeSingleFieldProps
	& Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'>
	& {
		derivedFrom: SugaredRelativeSingleField['field']
		unpersistedHardPrefix?: SlugPrefix
		persistedHardPrefix?: SlugPrefix
		persistedSoftPrefix?: SlugPrefix
		linkToExternalUrl?: boolean
	}

const useNormalizedPrefix = (value?: SlugPrefix) => {
	const environment = useEnvironment()
	return useMemo(() => typeof value === 'function' ? value(environment) : value ?? '', [value, environment])
}

export const SlugField = Component<SlugFieldProps>(
	props => <SlugFieldInner {...props}/>,
	props => <>
		<Field field={props.derivedFrom} />
		<SlugFieldInner {...props} />
	</>,
)

export const SlugFieldInner = SimpleRelativeSingleField<SlugFieldProps, string>(
	(fieldMetadata, {
		name,
		label,
		onBlur,
		unpersistedHardPrefix,
		persistedHardPrefix,
		persistedSoftPrefix,
		derivedFrom,
		field,
		...props
	}) => {
		const normalizedUnpersistedHardPrefix = useNormalizedPrefix(unpersistedHardPrefix)
		const normalizedPersistedHardPrefix = useNormalizedPrefix(persistedHardPrefix)
		const normalizedPersistedSoftPrefix = useNormalizedPrefix(persistedSoftPrefix)

		const { ref: inputRef, ...inputProps } = useTextInput({
			fieldMetadata,
			onBlur,
			parse: (val, field) => {
				const parsedValue = stringFieldParser(val, field)
				return parsedValue !== null ? `${normalizedPersistedHardPrefix}${parsedValue}` : null
			},
			format: val => val !== null ? val.substring(normalizedPersistedHardPrefix.length) : '',
		})
		const transform = useCallback(
			(driverFieldValue: string | null) => {
				const slugValue = slugify(driverFieldValue || '')
				return `${normalizedPersistedHardPrefix}${normalizedPersistedSoftPrefix}${slugValue}`
			},
			[normalizedPersistedHardPrefix, normalizedPersistedSoftPrefix],
		)
		useDerivedField<string>(derivedFrom, field, transform)
		const [editing, setEditing] = useState(false)

		const hardPrefix = normalizedUnpersistedHardPrefix + normalizedPersistedHardPrefix
		const fullValue = hardPrefix + inputProps.value
		const overlay = <>
			{props.linkToExternalUrl && (
				<a
					href={fullValue}
					onClick={event => {
						if (isSpecialLinkClick(event.nativeEvent)) {
							event.stopPropagation()
						} else {
							inputRef.current?.focus()
							event.preventDefault()
						}
					}}
				/>)}
		</>
		return (
			<SlugInput
				{...props}
				{...inputProps}
				inputRef={inputRef}
				prefix={hardPrefix}
				link={props.linkToExternalUrl ? fullValue : undefined}
				onOverlayClick={editing ? undefined : () => setEditing(true)}
				overlay={editing ? undefined : overlay}
				readOnly={!editing}
				onBlur={e => {
					inputProps.onBlur(e)
					setTimeout(() => {
						if (document.activeElement !== inputRef.current) {
							setEditing(false)
						}
					}, 2000)
				}}
			/>
		)
	},
	'SlugField',
)
