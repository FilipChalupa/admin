import { Button, FieldContainer, FieldContainerProps, FieldErrors, FileDropZone } from '@contember/ui'
import type { ReactNode } from 'react'
import type { DropzoneState } from 'react-dropzone'
import type { MessageFormatter } from '../../../../i18n'
import type { RepeaterFieldContainerPublicProps } from '../../collections'
import type { UploadDictionary } from '../uploadDictionary'

export interface FileInputPublicProps
	extends Omit<
			RepeaterFieldContainerPublicProps,
			'emptyMessage' | 'emptyMessageComponent' | 'emptyMessageComponentExtraProps'
		>,
		Pick<FieldContainerProps, 'label' | 'description' | 'labelDescription'> {
	addButtonSubText?: ReactNode
}

export interface FileInputProps extends FileInputPublicProps {
	dropzoneState: DropzoneState
	formatMessage: MessageFormatter<UploadDictionary>
	errors: FieldErrors | undefined
	children: ReactNode
}

export function FileInput({
	dropzoneState,
	errors,

	label,
	description,
	labelDescription,
	children,
	formatMessage,
	enableAddingNew = true,

	// emptyMessage,
	// emptyMessageComponent: EmptyMessageComponent = EmptyMessage,
	// emptyMessageComponentExtraProps,

	addButtonComponent: AddButton = Button,
	addButtonComponentExtraProps,
	addButtonProps,
	addButtonText,
	addButtonSubText,
}: FileInputProps) {
	const { getRootProps, isDragActive, isDragAccept, isDragReject, getInputProps } = dropzoneState

	return (
		<FieldContainer
			label={label}
			useLabelElement={false}
			description={description}
			labelDescription={labelDescription}
			errors={errors}
		>
			<div className="fileInput">
				{/*{children === undefined && (*/}
				{/*	<EmptyMessageComponent {...emptyMessageComponentExtraProps}>*/}
				{/*		{formatMessage(emptyMessage, 'upload.emptyMessage.text')}*/}
				{/*	</EmptyMessageComponent>*/}
				{/*)}*/}
				{children !== undefined && children}
				{enableAddingNew && (
					<FileDropZone
						{...getRootProps()}
						isActive={isDragActive}
						isAccepting={isDragAccept}
						isRejecting={isDragReject}
						className="fileInput-dropZone"
					>
						<input {...getInputProps()} />
						<div className="fileInput-cta">
							<AddButton
								size="small"
								{...addButtonComponentExtraProps}
								children={formatMessage(addButtonText, 'upload.addButton.text')}
								{...addButtonProps}
							/>
							<span className="fileInput-cta-label">{formatMessage(addButtonSubText, 'upload.addButton.subText')}</span>
						</div>
					</FileDropZone>
				)}
			</div>
		</FieldContainer>
	)
}
