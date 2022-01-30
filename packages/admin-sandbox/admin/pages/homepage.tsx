import { EditPage } from '@contember/admin'
import { ContentField } from '../components/ContentField'

export default () => (
	<EditPage entity="Homepage(unique = One)" setOnCreate="(unique = One)">
		<ContentField field="content" />
	</EditPage>
)
