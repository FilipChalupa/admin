import {
	AnchorButton,
	CreatePage,
	DataGridPage,
	DeleteEntityButton,
	EditPage,
	EnumCell,
	GenericCell,
	HasManySelectCell,
	HasOneSelectCell,
	LinkButton,
	MultiSelectField,
	RichTextField,
	SelectField,
	SlugField,
	TextCell,
	TextField,
	useCurrentRequest,
} from '@contember/admin'


const stateOptions = {
	draft: 'Draft',
	published: 'Published',
	removed: 'Removed',
}

const articleForm = (
	<>
		<MultiSelectField label={'tags'} field={'tags'} options={{
			fields: 'Tag.locales(locale.code=\'cs\').name',
			orderBy: 'name desc',
		}} />

		<SelectField label={'category'} field={'category'} options={{
			fields: 'Category.locales(locale.code=\'cs\').name',
			orderBy: 'name desc',
		}} />

		<TextField field={'title'} label={'Title'} />
		<RichTextField field={'content'} label={'Content'} />
		<SlugField field={'slug'} label={'Slug'} derivedFrom={'title'} unpersistedHardPrefix={'http://localhost/'} persistedHardPrefix={'bar/'}
		           persistedSoftPrefix={'lorem/'} linkToExternalUrl />
		<SelectField field={'state'} label={'State'} options={Object.entries(stateOptions).map(([value, label]) => ({ value, label }))} allowNull />
	</>
)

export default () => {
	const request = useCurrentRequest()
	const action = request?.parameters.action

	if (action === 'list') {
		return (
			<DataGridPage entities="Article" itemsPerPage={20} rendererProps={{
				actions: <LinkButton to="article(action: 'create')">Add article</LinkButton>,
				title: 'Articles',
			}}>
				<TextCell field="title" header="Title" />
				<TextCell field="content" header="Content" />
				<HasOneSelectCell field="category" options={`Category.locales(locale.code = 'cs').name`} header="Category" />
				<HasManySelectCell field="tags" options={`Tag.locales(locale.code = 'cs').name`} header="Tags" />
				<EnumCell field={'state'} options={stateOptions} header={'State'} />

				<GenericCell canBeHidden={false} justification="justifyEnd">
					<LinkButton to={`article(action: 'edit', id: $entity.id)`} Component={AnchorButton}>Edit</LinkButton>
					<DeleteEntityButton title="Delete" immediatePersist={true} />
				</GenericCell>
			</DataGridPage>
		)

	} else if (action === 'create') {
		return (
			<CreatePage entity="Article" redirectOnSuccess="article(action: 'edit', id: $entity.id)">
				{articleForm}
			</CreatePage>
		)

	} else if (action === 'edit') {
		return (
			<EditPage entity="Article(id = $id)" rendererProps={{ title: 'Article' }}>
				{articleForm}
			</EditPage>
		)

	} else {
		return null
	}
}
