import { ToolbarButton } from '../../../toolbars'
import { boldMark } from './withBold'

export const boldToolbarButton: ToolbarButton = {
	marks: { [boldMark]: true },
	label: 'Bold',
	title: 'Bold',
	blueprintIcon: 'bold',
}