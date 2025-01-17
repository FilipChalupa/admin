import {
	Block,
	BlockEditor,
	BlockEditorProps,
	Component,
	horizontalRuleToolbarButton,
	ImageUploadField,
	paragraphNumberedToolbarButton,
	paragraphToolbarButton,
	RichEditor,
	Scheme,
	scrollTargetToolbarButton,
	tableToolbarButton,
	TextField,
} from '@contember/admin'
import { withAnchorsAsReference } from './AnchorInsertHandler'
import * as React from 'react'
import { InsertLink, LinkElement } from './customLinks'


const RB = RichEditor.buttons
export const fullEditorInlineButtons: BlockEditorProps['inlineButtons'] = [
	[RB.bold, RB.italic, RB.underline, RB.anchor],
	[RB.headingOne, RB.headingTwo, RB.headingThree, RB.headingFour, RB.unorderedList, RB.orderedList],
	[RB.strikeThrough, RB.code],
	[
		{
			discriminateBy: 'link',
			referenceContent: InsertLink,
			label: 'Insert link',
			title: 'Insert link',
			blueprintIcon: 'link',
		},
	],
]

export interface ContentFieldProps {
	field: string
	toolbarScheme?: Scheme
}

export const ContentField = Component<ContentFieldProps>(
	({ field, toolbarScheme }) => (
		<BlockEditor
			augmentEditorBuiltins={editor => {

				withAnchorsAsReference(
					editor,
					{
						elementType: 'link',
						updateReference: (url, getAccessor) => {
							getAccessor().getField('link.type').updateValue('external')
							getAccessor().getField('link.externalLink').updateValue(url)
						},
					},
				)

				editor.registerElement({
					type: 'link',
					isInline: true,
					render: LinkElement,
				})
			}}
			leadingFieldBackedElements={[
				{
					element: <TextField field={'title'} label={undefined} placeholder={'Title'} distinction={'seamless'} />,
				},
				{
					field: 'lead',
					placeholder: 'Lead',
					format: 'richText',
				},
			]}
			trailingFieldBackedElements={[
				{
					field: 'footer',
					placeholder: 'Footer',
					format: 'richText',
				},
			]}
			referencesField="references"
			referenceDiscriminationField="type"
			field={`${field}.blocks`}
			inlineButtons={fullEditorInlineButtons}
			label="Content"
			contentField="json"
			sortableBy="order"
			blockButtons={[
				{
					blueprintIcon: 'media',
					discriminateBy: 'image',
					title: 'Image',
				},
				{
					blueprintIcon: 'citation',
					discriminateBy: 'quote',
					title: 'Quote',
				},
				tableToolbarButton,
				scrollTargetToolbarButton,
				paragraphToolbarButton,
				paragraphNumberedToolbarButton,
				horizontalRuleToolbarButton,
			]}
			toolbarScheme={toolbarScheme}
		>
			<Block discriminateBy="image" label="Image">
				<BlockEditor.ContentOutlet placeholder="Text" />
				<ImageUploadField
					label="Image"
					baseEntity="image"
					urlField="url"
					widthField="width"
					heightField="height"
					fileSizeField="size"
					fileTypeField="type"
				/>
			</Block>
			<Block discriminateBy="quote" label="Quote">
				<BlockEditor.ContentOutlet />
				<TextField field="primaryText" label="Quote" />
				<TextField field="secondaryText" label="Author" />
			</Block>
		</BlockEditor>
	),
	'ContentField',
)
