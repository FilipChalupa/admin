import { createContext } from 'react'
import type { DialogOptions } from './DialogOptions'

export const DialogContext = createContext<DialogOptions | undefined>(undefined)
