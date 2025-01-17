import { useAuthedTenantQuery } from '../lib'

export const PROJECT_ROLES_FRAGMENT = `
	fragment ProjectRoles on Project {
		roles {
			name
			variables {
				... on RoleEntityVariableDefinition {
					name
					entityName
				}
			}
		}
	}
`
const LIST_ROLES_QUERY = `
	${PROJECT_ROLES_FRAGMENT}
	query($slug: String!) {
		project: projectBySlug(slug: $slug) {
			id
			... ProjectRoles
		}
	}
`

interface RoleVariableDefinitionBase {
	name: string
}

interface RoleEntityVariableDefinition extends RoleVariableDefinitionBase {
	entityName: string
}

export type RoleVariableDefinition = RoleEntityVariableDefinition

export interface RoleDefinition {
	name: string
	variables: RoleVariableDefinition[]
}

interface ListRolesQueryResult {
	project: {
		id: string
		roles: RoleDefinition[]
	}
}

interface ListRolesQueryVariables {
	slug: string
}

export const useListRolesQuery = (projectSlug: string) =>
	useAuthedTenantQuery<ListRolesQueryResult, ListRolesQueryVariables>(LIST_ROLES_QUERY, { slug: projectSlug })
