import { Environment, useEnvironment } from '@contember/binding'
import { memo, ReactElement, ReactNode, useMemo } from 'react'

interface VariableProps {
	name: Environment.Name
	format?: (value: ReactNode) => ReactNode
}

export const Variable = memo(({ name, format }: VariableProps): ReactElement => {
	const environment = useEnvironment()
	const value = environment.getValueOrElse(name, null)

	const formatted = useMemo(() => (format ? format(value) : value), [format, value])

	return <>{formatted}</>
})
Variable.displayName = 'Variable'
