import { useTenantGraphQlClient } from '@contember/react-client'
import { useCallback } from 'react'

const ME_QUERY = `
	query {
		me {
			person {
				id
				email
				otpEnabled
			}

			projects {
				project {
					slug
					name
				}

				memberships {
					role
					variables {
						name
						values
					}
				}
			}
		}
	}
`

interface MeResponse {
	me: {
		person: {
			id: string,
			email: string,
			otpEnabled: boolean,
		},
		projects: Array<{
			project: {
				slug: string,
				name: string,
			},
			memberships: Array<{
				role: string,
				variables: Array<{
					name: string,
					values: string[],
				}>,
			}>,
		}>,
	},
}

export const useFetchMe = (): () => Promise<{ data: MeResponse }> => {
	const client = useTenantGraphQlClient()
	return useCallback(async () => {
		return await client.sendRequest<{ data: MeResponse }>(ME_QUERY, {})
	}, [client])
}
