import { useClassNamePrefix } from '../../auxiliary'
import { DevErrorInner, DevErrorInnerProps } from './DevErrorInner'

export interface DevErrorProps extends DevErrorInnerProps
{
}

export function DevError(props: DevErrorProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={`${prefix}devError`}>
			<div className={`${prefix}devError-in`}>
				<div className={`${prefix}devError-bar`}>
					<div className={`${prefix}devError-errorSource`}>{props.source}</div>
				</div>
				<DevErrorInner {...props} />
			</div>
		</div>
	)
}
