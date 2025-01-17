import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useSessionToken } from '@contember/react-client'
import { useFetchMe } from '../../tenant'
import { ContainerSpinner, Message } from '@contember/ui'
import { MiscPageLayout } from '../MiscPageLayout'
import { InvalidIdentityFallback } from './InvalidIdentityFallback'
import { useLogout } from './useLogout'

export interface Identity {
	email: string
	otpEnabled: boolean
	personId: string
	projects: IdentityProject[]
}

export interface IdentityProject {
	slug: string
	name: string
	roles: string[]
}

interface IdentityContext {
	clearIdentity: () => void
	identity: Identity
}

export const IdentityContext = createContext<IdentityContext | undefined>(undefined)
export const IdentityRefreshContext = createContext<(() => void)>(() => {
	throw new Error('IdentityRefreshContext is not initialized')
})

interface IdentityProviderProps {
	onInvalidIdentity?: () => void
	allowUnauthenticated?: boolean
}

type IdentityState =
	| { state: 'none' }
	| { state: 'loading'}
	| { state: 'failed'}
	| { state: 'success', identity: Identity }
	| { state: 'cleared'}

export const IdentityProvider: React.FC<IdentityProviderProps> = ({ children, onInvalidIdentity, allowUnauthenticated }) => {
	const sessionToken = useSessionToken()
	const fetchMe = useFetchMe()

	const [identityState, setIdentityState] = useState<IdentityState>(() => ({ state: sessionToken ? 'loading' : 'none' }))

	const logout = useLogout()

	const clearIdentity = useCallback(() => setIdentityState({ state: 'cleared' }), [])

	const refetch = useCallback(async () => {
		setIdentityState({ state: 'loading' })
		try {
			const response = await fetchMe()
			const person = response.data.me.person
			const projects = response.data.me.projects

			setIdentityState({
				state: 'success',
				identity: {
					email: person.email,
					otpEnabled: person.otpEnabled,
					personId: person.id,
					projects: projects.map(it => ({
						name: it.project.name,
						slug: it.project.slug,
						roles: it.memberships.map(it => it.role),
					})),
				},
			})
		} catch (e) {
			console.error(e)
			if ('status' in e && e.status === 401) {
				onInvalidIdentity?.()
				logout({ noRedirect: true })
				clearIdentity()
				if (window.location.pathname !== '/') {
					window.location.href = '/' // todo better redirect?
				}
			} else {
				setIdentityState({ state: 'failed' })
			}
		}
	}, [clearIdentity, fetchMe, logout, onInvalidIdentity])


	useEffect(
		() => {
			if (sessionToken === undefined) {
				setIdentityState({ state: 'none' })
				if (!allowUnauthenticated) {
					window.location.href = '/' // todo better redirect?
				}
				return
			}
		},
		[sessionToken, allowUnauthenticated],
	)

	useEffect(
		() => {
			if (sessionToken !== undefined) {
				refetch()
			}
		},
		[sessionToken, refetch],
	)


	const identityContextValue = useMemo(
		() => identityState.state === 'success' ? { clearIdentity, identity: identityState.identity } : undefined,
		[identityState, clearIdentity],
	)

	if (identityState.state === 'cleared') {
		return (
			<MiscPageLayout>
				<Message size="large" flow="generousBlock">Logging out&hellip;</Message>
			</MiscPageLayout>
		)
	}

	if (identityState.state === 'failed') {
		return <InvalidIdentityFallback />
	}

	if (identityState.state === 'loading' || (!allowUnauthenticated && identityState.state === 'none')) {
		return <ContainerSpinner />
	}

	return (
		<IdentityContext.Provider value={identityContextValue}>
			<IdentityRefreshContext.Provider value={refetch}>
				{children}
			</IdentityRefreshContext.Provider>
		</IdentityContext.Provider>
	)
}
