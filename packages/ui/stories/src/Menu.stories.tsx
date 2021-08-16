import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Aether, Menu, Navigation } from '../../src'

export default {
	title: 'Menu',
	component: Menu,
	decorators: [
		Story => (
			<Aether style={{ padding: '2em' }}>
				<Story />
			</Aether>
		),
	],
} as ComponentMeta<typeof Menu>

const Template: ComponentStory<typeof Menu> = args => (
	<Navigation.IsActiveContext.Provider value={(s: any) => s === '#active-page'}>
		<Menu {...args} />
	</Navigation.IsActiveContext.Provider>
)

export const Simple = Template.bind({})

Simple.args = {
	children: (
		<>
			<Menu.Item title="Front page" to="#active-page" />
			<Menu.Item title="Pages">
				<Menu.Item title="List all" to="#other-page" />
				<Menu.Item title="Add new" to="#active-page" />
			</Menu.Item>
			<Menu.Item title="Products">
				<Menu.Item title="List all" to="#other-page" />
				<Menu.Item title="Orders" to="#other-page" />
				<Menu.Item title="Clients" to="#active-page" />
				<Menu.Item title="Invoices" to="#other-page" />
				<Menu.Item title="Add new" to="#other-page" />
			</Menu.Item>
			<Menu.Item title="Other">
				<Menu.Item title="External link" to="https://example.com" external />
				<Menu.Item title="Code of conduct" to="#other-page" />
				<Menu.Item title="Terms and conditions" to="#other-page" />
			</Menu.Item>
			<Menu.Item title="Experiments">
				<Menu.Item title="Depth test">
					<Menu.Item title="Ok" to="#other-page">
						<Menu.Item title="Too deep">
							<Menu.Item title="Even deeper" to="#active-page">
								<Menu.Item title="How far this can go?">
									<Menu.Item title="I'm scared">
										<Menu.Item title="So dark in here">
											<Menu.Item title="I don't feel safe anymore" />
											<Menu.Item title="Let me out!" />
										</Menu.Item>
									</Menu.Item>
								</Menu.Item>
							</Menu.Item>
						</Menu.Item>
					</Menu.Item>
				</Menu.Item>
				<Menu.Item title={<button type="button">Arbitrary JSX content</button>} />
				<Menu.Item title="Last item" to="#active-page" />
			</Menu.Item>
		</>
	),
}