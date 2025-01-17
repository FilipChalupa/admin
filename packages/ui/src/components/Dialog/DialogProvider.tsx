import { memo, ReactNode, useMemo, useReducer, useRef } from 'react'
import { Portal } from '../Portal'
import { Dialog } from './Dialog'
import { DialogContext } from './DialogContext'
import type { DialogOptions } from './DialogOptions'
import { dialogReducer, initialDialogState } from './dialogReducer'
import type { DialogSettings } from './DialogSettings'

export interface DialogProviderProps {
	children: ReactNode
}

export const DialogProvider = memo((props: DialogProviderProps) => {
	const [dialogState, dispatch] = useReducer(dialogReducer, initialDialogState)
	const idSeed = useRef<number>(1)

	const options = useMemo<DialogOptions>(() => {
		return {
			openDialog: <Success extends unknown>(settings: DialogSettings<Success>) =>
				new Promise<Success>((promiseResolve, promiseReject) => {
					if (settings.signal?.aborted) {
						return promiseReject()
					}
					const dialogId = idSeed.current++
					const resolve = (value: Success) => {
						dispatch({
							type: 'closeDialog',
							dialogId,
						})
						promiseResolve(value)
					}
					const reject = () => {
						dispatch({
							type: 'closeDialog',
							dialogId,
						})
						promiseReject()
					}

					settings.signal?.addEventListener('abort', reject)

					dispatch({
						type: 'openDialog',
						dialogId,
						dialog: {
							resolve,
							reject,
							settings,
						},
					})
				}),
		}
	}, [])

	// TODO This *looks* like it supports nested dialogs but it really doesn't.
	return (
		<DialogContext.Provider value={options}>
			{props.children}
			{Array.from(dialogState.dialogs, ([dialogId, dialogWithMetadata]) => (
				<Portal key={dialogId} to={dialogWithMetadata.settings.container}>
					<Dialog settings={dialogWithMetadata} dialogId={dialogId} />
				</Portal>
			))}
		</DialogContext.Provider>
	)
})
