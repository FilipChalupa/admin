import { ContemberClient } from '@contember/react-client'
import { Button, ErrorList, Icon, Stack } from '@contember/ui'
import { FC, ReactNode, useMemo, useState } from 'react'
import { Link, RequestProvider, RoutingContext, RoutingContextValue } from '../../routing'
import {
	CreateResetPasswordRequestForm,
	FillResetPasswordTokenForm,
	IDP,
	IDPInitButton,
	IDPResponseHandler,
	Login,
	ResetPasswordForm,
} from '../../tenant'
import { IdentityProvider, useLogout, useOptionalIdentity } from '../Identity'
import { MiscPageLayout } from '../MiscPageLayout'
import { Page, Pages } from '../pageRouting'
import { Project, ProjectListButtons } from '../Project'
import { Toaster, ToasterProvider } from '../Toaster'


export interface LoginEntrypointProps {
	apiBaseUrl: string
	loginToken: string
	sessionToken?: string
	basePath?: string
	projects: readonly string[]
	identityProviders?: readonly IDP[]
	formatProjectUrl: (project: Project) => string
	heading?: string
	projectsPageActions?: ReactNode
	collapsedEmailLogin?: boolean
}

const indexPageName = 'index'
const resetRequestPageName = 'resetRequest'
const redirectOnSuccessPageName = 'resetRequestSuccess'
const passwordResetPageName = 'passwordReset'

export const LoginEntrypoint = (props: LoginEntrypointProps) => {
	const routing: RoutingContextValue = {
		basePath: props.basePath ?? '/',
		routes: {},
		defaultDimensions: {},
		pageInQuery: true,
	}

	return (
		<ContemberClient
			apiBaseUrl={props.apiBaseUrl}
			sessionToken={props.sessionToken}
			loginToken={props.loginToken}
		>
			<ToasterProvider>
				<RoutingContext.Provider value={routing}>
					<RequestProvider>
						<Pages>
							<Page name={indexPageName}>
								<IdentityProvider allowUnauthenticated={true}>
									<LoginEntrypointIndex
										projects={props.projects}
										formatProjectUrl={props.formatProjectUrl}
										identityProviders={props.identityProviders}
										heading={props.heading}
										projectsPageActions={props.projectsPageActions}
										collapsedEmailLogin={props.collapsedEmailLogin}
									/>
								</IdentityProvider>
							</Page>
							<Page name={resetRequestPageName}>
								<MiscPageLayout heading="Password reset" actions={<>
									<Link to={indexPageName}>&larr; Back to login</Link>
								</>}>
									<CreateResetPasswordRequestForm redirectOnSuccess={redirectOnSuccessPageName} />
								</MiscPageLayout>
							</Page>
							<Page name={redirectOnSuccessPageName}>
								<MiscPageLayout heading="Password reset" actions={<>
									<Link to={indexPageName}>&larr; Back to login</Link>
								</>}>
									<p>
										Password reset request has been successfully created. Please check your inbox for the instructions.
									</p>
									<p>
										Please follow the link in e-mail or copy the reset token here:
									</p>
									<FillResetPasswordTokenForm resetLink={token => ({ pageName: passwordResetPageName, parameters: { token } })} />
								</MiscPageLayout>
							</Page>
							<Page name={passwordResetPageName}>
								{({ token }: { token: string }) => (
									<MiscPageLayout heading="Set a new password" actions={<>
										<Link to={indexPageName}>&larr; Back to login</Link>
									</>}>
										<ResetPasswordForm token={token} redirectOnSuccess={indexPageName} />
									</MiscPageLayout>
								)}
							</Page>
						</Pages>
					</RequestProvider>
				</RoutingContext.Provider>
				<Toaster />
			</ToasterProvider>
		</ContemberClient>
	)
}

const LoginEntrypointIndex: FC<Pick<LoginEntrypointProps, 'projects' | 'formatProjectUrl' | 'identityProviders' | 'heading' | 'projectsPageActions' | 'collapsedEmailLogin'>> = props => {
	const logout = useLogout()
	const identity = useOptionalIdentity()
	const projects = useMemo(() => {
		return identity?.projects.filter(it => props.projects.includes(it.slug))
	}, [identity?.projects, props.projects])

	if (!projects) {
		return (
			<MiscPageLayout heading={props.heading ?? 'Contember Admin'}>
				<LoginContainer identityProviders={props.identityProviders} collapsedEmailLogin={props.collapsedEmailLogin} />
			</MiscPageLayout>
		)

	} else if (projects.length === 1) {
		window.location.href = props.formatProjectUrl(projects[0])
		return null

	} else {
		return (
			<MiscPageLayout
				heading="Projects"
				actions={<>
					{props.projectsPageActions}
					<Button onClick={() => logout()} size={'small'} distinction={'seamless'}><Icon blueprintIcon={'log-out'} /></Button>
				</>}
			>
				<ProjectListButtons projects={projects} formatProjectUrl={props.formatProjectUrl} />
			</MiscPageLayout>
		)
	}
}

interface LoginContainerProps {
	identityProviders?: readonly IDP[]
	collapsedEmailLogin?: boolean
}

const LoginContainer = ({ identityProviders, collapsedEmailLogin: initialCollapsedEmailLogin }: LoginContainerProps) => {
	const [collapsedEmailLogin, setCollapsedEmailLogin] = useState(initialCollapsedEmailLogin ?? false)
	const [error, setError] = useState<string>()

	const hasOauthResponse = useMemo(() => {
		const params = new URLSearchParams(window.location.search)
		return params.has('state') && (params.has('code') || params.has('id_token'))
	}, [])

	if (hasOauthResponse) {
		return <IDPResponseHandler />
	}

	return <>
		<ErrorList errors={error ? [{ message: error }] : []} />
		{!collapsedEmailLogin && <Login resetLink={resetRequestPageName} />}
		{((identityProviders?.length ?? 0) > 0 || collapsedEmailLogin) && (
			<Stack direction="vertical">
				{identityProviders?.map(it => <IDPInitButton provider={it} onError={setError}/>)}
				{collapsedEmailLogin && <Button onClick={() => setCollapsedEmailLogin(false)}>Login with email</Button>}
			</Stack>
		)}
	</>
}
