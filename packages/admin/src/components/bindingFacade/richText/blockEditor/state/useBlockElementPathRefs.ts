import { Editor, PathRef } from 'slate'
import { useCallback, useState } from 'react'
import { SugaredRelativeEntityList, useDesugaredRelativeEntityList, useEntityPersistSuccess } from '@contember/binding'

export type BlockElementPathRefs = Map<string, PathRef>
export const useBlockElementPathRefs = ({ editor, blockList }: {
	editor: Editor,
	blockList: SugaredRelativeEntityList,
}): BlockElementPathRefs => {
	const [blockElementPathRefs] = useState(() => new Map<string, PathRef>())
	const desugaredBlockList = useDesugaredRelativeEntityList(blockList)
	// TODO this isn't particularly great. We should probably react to id changes more directly.
	useEntityPersistSuccess(
		useCallback(
			getEntity => {
				for (const ref of blockElementPathRefs.values()) {
					ref.unref()
				}
				blockElementPathRefs.clear()
				const blocks = getEntity().getRelativeEntityList(desugaredBlockList)
				let blockIndex = 0
				for (const topLevelBlock of blocks) {
					blockElementPathRefs.set(topLevelBlock.id, Editor.pathRef(editor, [blockIndex++], { affinity: 'backward' }))
				}
			},
			[blockElementPathRefs, desugaredBlockList, editor],
		),
	)
	return blockElementPathRefs
}
