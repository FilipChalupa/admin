import { MultiEditPage, Repeater, SelectField, TextField } from '@contember/admin'

export const Tags = (
	<MultiEditPage entities="Tag" rendererProps={{
		title: 'Abcd',
	}}>
		<TextField field={'name'} label={'Name'}/>
		<Repeater field={'locales'} label={'Locales'} orderBy={'id'}>
			<SelectField label={'Locale'} options={'Locale.code'} field={'locale'}/>
			<TextField field={'name'} label={'Name'}/>
		</Repeater>
	</MultiEditPage>
)
