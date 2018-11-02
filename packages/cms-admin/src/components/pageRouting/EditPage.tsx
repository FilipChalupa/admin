import { lcfirst } from 'cms-common'
import * as React from 'react'
import { SingleEntityDataProvider } from '../../binding'
import { DataRendererProps } from '../../binding/coreComponents/DataProvider'
import CommonRendererProps from '../../binding/facade/renderers/CommonRendererProps'
import { ParametersContext } from './Pages'
import PageWithLayout from './PageWithLayout'
import SpecificPageProps from './SpecificPageProps'

interface EditPageProps<DRP> extends SpecificPageProps<DRP> {}

export default class EditPage<DRP extends CommonRendererProps = CommonRendererProps> extends React.Component<EditPageProps<DRP>> {
	static getPageName(props: EditPageProps<DataRendererProps>) {
		return `edit_${lcfirst(props.entity)}`
	}

	render(): React.ReactNode {
		return (
			<PageWithLayout layout={this.props.layout}>
				<ParametersContext.Consumer>
					{({ id }: { id: string }) => (
						<SingleEntityDataProvider
							where={{ id }}
							name={this.props.entity}
							renderer={this.props.renderer}
							rendererProps={this.props.rendererProps}
						>
							{this.props.children}
						</SingleEntityDataProvider>
					)}
				</ParametersContext.Consumer>
			</PageWithLayout>
		)
	}
}
