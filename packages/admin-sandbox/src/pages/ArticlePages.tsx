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
	SelectField,
	SlugField,
	TextCell,
	TextField,
} from '@contember/admin'


export const ArticleListPage = (
	<DataGridPage pageName="articleList" entities="Article" itemsPerPage={20} rendererProps={{
		actions: <LinkButton to="articleCreate">Add article</LinkButton>,
		title: 'Articles',
	}}>
		<TextCell field="title" header="Title" />
		<TextCell field="content" header="Content" />
		<HasOneSelectCell field="category" options={`Category.locales(locale.code = 'cs').name`} header="Category" />
		<HasManySelectCell field="tags" options={`Tag.locales(locale.code = 'cs').name`} header="Tags" />
				<EnumCell field={'state'} options={{
					draft: 'Draft',
					published: 'Published',
					removed: 'Removed',
				}} header={'State'}/>

		<GenericCell canBeHidden={false} justification="justifyEnd">
			<LinkButton to={`articleEdit(id: $entity.id)`} Component={AnchorButton}>Edit</LinkButton>
			<DeleteEntityButton title="Delete" immediatePersist={true}></DeleteEntityButton>
		</GenericCell>
	</DataGridPage>
)

const form = <>
	<MultiSelectField label={'tags'} field={'tags'} options={{
		fields: "Tag.locales(locale.code='cs').name",
		orderBy: 'name desc',
	}} />
	<SelectField label={'category'} field={'category'} options={{
		fields: "Category.locales(locale.code='cs').name",
		orderBy: 'name desc',
	}} />
	<TextField field={'title'} label={'Title'} />
	<SlugField field={'slug'} label={'Slug'} derivedFrom={'title'} unpersistedHardPrefix={'http://localhost/'} persistedHardPrefix={'bar/'} persistedSoftPrefix={'lorem/'} linkToExternalUrl/>
	<SelectField field={'state'} label={'State'} options={[
		{ value: 'draft', label: 'Draft' },
		{ value: 'published', label: 'Published' },
		{ value: 'removed', label: 'Removed' },
	]} allowNull />
</>

export const ArticleCreatePage = (
	<CreatePage pageName={'articleCreate'} entity={'Article'} redirectOnSuccess={req => ({ ...req, pageName: 'articleList', parameters: {} })}>
		{form}
	</CreatePage>
)

export const ArticleEditPage = (
	<EditPage pageName={'articleEdit'} entity={'Article(id=$id)'} rendererProps={{
		title: 'Article',
	}}>
		{form}
	</EditPage>
)
