import { RoleRendererFactory } from './RoleRenderer'
import { RoutingLinkTarget } from '../../routing'
import { memo } from 'react'
import { MemberList } from './MemberList'

export interface ApiKeyListProps {
	project: string
	children?: undefined
	createRoleRenderer?: RoleRendererFactory
	createApiKeyEditLink: (id: string) => RoutingLinkTarget
}

export const ApiKeyList = memo<ApiKeyListProps>(({ createApiKeyEditLink, ...props }) => (
	<MemberList
		{...props}
		createEditIdentityLink={createApiKeyEditLink}
		memberType={'API_KEY'}
		Identity={({ identity }) => <>{identity.description ?? 'unknown key'}</>}
	/>
))