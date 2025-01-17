import { Component, useEntity } from '@contember/binding'
import { LayoutPage, Message } from '@contember/ui'
import { ReactChild, ReactNode } from 'react'

export const NotFoundWrapper = Component<{ children: ReactChild, title?: ReactNode }>(
	({ children, title }) => {
		const accessor = useEntity()
		if (accessor.environment.getSystemVariable('rootShouldExists') === 'yes' && !accessor.existsOnServer) {
			return (
				<LayoutPage title={title}>
					<Message intent="danger">Requested entity of type {accessor.name} was not found</Message>
				</LayoutPage>
			)
		}
		return <>{children}</>
	},
	({ children }) => <>{children}</>,
)
