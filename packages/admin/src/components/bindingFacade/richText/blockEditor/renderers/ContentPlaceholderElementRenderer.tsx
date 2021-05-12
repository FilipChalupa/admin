import { EntityAccessor, RelativeEntityList } from '@contember/binding'
import { EditorPlaceholder, ErrorList } from '@contember/ui'
import { memo, MutableRefObject } from 'react'
import { RenderElementProps } from 'slate-react'
import { BlockElement } from '../../baseEditor'
import { ContemberContentPlaceholderElement } from '../elements'

export interface ContentPlaceholderElementRendererProps extends RenderElementProps {
	element: ContemberContentPlaceholderElement
	getParentEntityRef: MutableRefObject<EntityAccessor.GetEntityAccessor>
	desugaredBlockList: RelativeEntityList
}

export const ContentPlaceholderElementRenderer = memo(
	({
		attributes,
		children,
		element,
		getParentEntityRef,
		desugaredBlockList,
	}: ContentPlaceholderElementRendererProps) => {
		const blockList = getParentEntityRef.current().getRelativeEntityList(desugaredBlockList)
		const blockErrors = blockList.errors

		// TODO This is obviously awful in that we assume that errors are only to be displayed when the content placeholder
		//		is displayed as well which obviously won't hold for any other kind of error than "Field is required".
		//		This will have to do for now though.

		return (
			<BlockElement attributes={attributes} element={element}>
				<EditorPlaceholder>{element.placeholder}</EditorPlaceholder>
				{children}
				{!!blockErrors && (
					<div contentEditable={false} data-slate-editor={false}>
						<ErrorList errors={blockErrors} size="small" />
					</div>
				)}
			</BlockElement>
		)
	},
)