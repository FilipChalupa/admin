import classNames from 'classnames'
import {
	createContext,
	forwardRef,
	FunctionComponent,
	KeyboardEvent,
	KeyboardEventHandler,
	memo,
	ReactNode, SyntheticEvent,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { useComponentClassName } from '../../auxiliary'
import { useNavigationLink } from '../../Navigation'
import { isSpecialLinkClick, toStateClass, toViewClass } from '../../utils'
import { Collapsible } from '../Collapsible'
import { usePreventCloseContext } from '../PreventCloseContext'
import { Label } from '../Typography'

const DepthContext = createContext(0)

const randomId = () => (Math.random() + 1).toString(36).substring(7)

const FocusContext = createContext<{
	nextFocusable: () => HTMLLIElement | null
	previousFocusable: () => HTMLLIElement | null
	mouseIsActive: boolean
}>({
	nextFocusable: () => null,
	previousFocusable: () => null,
	mouseIsActive: false,
})

function useFocusContext() {
	return useContext(FocusContext)
}

function getFocusableItems<E extends HTMLElement = HTMLElement>(parent: E): HTMLLIElement[] {
	return Array.from(parent.querySelectorAll('li[tabindex="0"]'))
}

function getClosestFocusable<E extends HTMLElement = HTMLElement>(parent: E, offset: number) {
	if (!document.activeElement) {
		return null
	}

	if (!(document.activeElement instanceof HTMLLIElement)) {
		return null
	}

	const list = getFocusableItems(parent)
	const currentlyFocusedIndex = list.indexOf(document.activeElement)

	return list[currentlyFocusedIndex + offset] ?? null
}

export interface MenuProps {
	children?: ReactNode
	showCaret?: boolean
}

export interface ItemProps<T extends any = any> {
	children?: ReactNode
	title?: string | ReactNode
	to?: T
	href?: string
	external?: boolean
	expandedByDefault?: boolean
}

interface MenuLinkProps {
	href: string
	onClick?: (e: SyntheticEvent<HTMLElement>) => void
	suppressTo: boolean
	isActive?: boolean
	className?: string
	external?: boolean | undefined
	children?: ReactNode
}

function MenuLink({ className, children, external, href, isActive, onClick: onNavigate, suppressTo }: MenuLinkProps) {
	const onClick = useCallback((event: SyntheticEvent<HTMLAnchorElement>) => {
		if (event.nativeEvent instanceof MouseEvent && !isSpecialLinkClick(event.nativeEvent)) {
			onNavigate?.(event)

			if (suppressTo) {
				event.preventDefault()
			}
		}
	}, [onNavigate, suppressTo])

	return <a
		tabIndex={-1}
		className={classNames(className, toStateClass('active', isActive))}
		href={href}
		onClick={onClick}
		target={external ? '_blank' : undefined}
		rel={external ? 'noopener noreferrer' : undefined}
	>
		{children}
	</a>
}

interface ToggleProps {
	controls: string
	disabled: boolean
	checked: boolean
	onChange: (checked: boolean) => void
}

const Toggle = memo(forwardRef<HTMLButtonElement, ToggleProps>(({
	controls,
	checked,
	disabled,
	onChange,
}, ref) => {
	const componentClassName = useComponentClassName('menu-expand-toggle')

	return <button
		tabIndex={-1}
		ref={ref}
		type="button"
		disabled={disabled}
		className={classNames(
			componentClassName,
			toStateClass('collapsed', !checked),
		)}
		aria-haspopup="true"
		aria-controls={controls}
		aria-expanded={checked}
		onClick={useCallback(event => {
			onChange(!checked)
		}, [checked, onChange])}
		onKeyPress={useCallback(event => {
			switch (event.code) {
				case 'ArrowRight': onChange(true)
					break
				case 'ArrowLeft': onChange(false)
					break
			}
		}, [onChange])}
	>
		<span className={`${componentClassName}-label`}>{checked ? '-' : '+'}</span>
	</button>
}))

export function Item({ children, ...props }: ItemProps) {
	const depth = useContext(DepthContext)

	const { isActive, href, navigate } = useNavigationLink(props.to, props.href)

	const hasSubItems = !!children
	const isInteractive = hasSubItems && depth > 0
	const tabIndex = (depth > 0 && hasSubItems) || href ? 0 : -1

	const [expanded, setExpanded] = useState(!!props.expandedByDefault || depth === 0 || !props.title)
	const preventMenuClose = usePreventCloseContext()

	const onLabelClick = useCallback((event: SyntheticEvent) => {
		if (event.defaultPrevented) {
			return
		}

		if (isInteractive && !expanded) {
			preventMenuClose()
		}

		if (navigate) {
			navigate(event)
			isInteractive && setExpanded(true)
		} else {
			isInteractive && setExpanded(!expanded)
		}

		event.preventDefault()
	}, [expanded, isInteractive, navigate, preventMenuClose])

	const changeExpand = useCallback((nextExpanded: boolean) => {
		if (!isInteractive) {
			return
		}

		if (nextExpanded === false)	{
			listItemRef.current?.focus()
		}

		setExpanded(nextExpanded)
	}, [isInteractive])

	const id = useRef(`cui-menu-id-${randomId()}`)
	const listItemRef = useRef<HTMLLIElement>(null)
	const listItemTitleRef = useRef<HTMLDivElement>(null)

	const { nextFocusable, previousFocusable, mouseIsActive } = useFocusContext()

	useEffect(() => {
		if (tabIndex < 0 || !listItemTitleRef.current || !listItemRef.current) {
			return
		}

		const liRef = listItemRef.current
		const titleRef = listItemTitleRef.current

		const mouseOverListener = (event: MouseEvent) => {
			if (event.defaultPrevented || !mouseIsActive || liRef === document.activeElement) {
				return
			}

			liRef.focus()
			event.preventDefault()
		}

		const mouseOutListener = (event: MouseEvent) => {
			liRef.blur()
		}

		titleRef.addEventListener('mouseover', mouseOverListener)
		titleRef.addEventListener('mouseout', mouseOutListener)

		return () => {
			titleRef.removeEventListener('mouseover', mouseOverListener)
			titleRef.removeEventListener('mouseout', mouseOutListener)
		}
	}, [mouseIsActive, tabIndex])

	const onKeyPress = useCallback<KeyboardEventHandler<HTMLLIElement>>((event: KeyboardEvent<HTMLLIElement>) => {
		if (!listItemRef.current || event.defaultPrevented) {
			return
		}

		if (document.activeElement !== listItemRef.current) {
			if (depth > 0 && event.code === 'ArrowLeft' && expanded) {
				changeExpand(false)
				listItemRef.current.focus()
				event.preventDefault()
			}

			return
		}

		switch (event.code) {
			case 'ArrowLeft':
				if (expanded) {
					changeExpand(false)
				} else {
					previousFocusable()?.focus()
				}
				event.preventDefault()
				break
			case 'ArrowRight':
				if (!expanded && isInteractive) {
					changeExpand(true)
				} else {
					nextFocusable()?.focus()
				}
				event.preventDefault()
				break
			case 'Space':
				changeExpand(!expanded)
				event.preventDefault()
				break
			case 'Enter':
				onLabelClick(event)
				event.preventDefault()
				break
			case 'ArrowUp':
				previousFocusable()?.focus()
				event.preventDefault()
				break
			case 'ArrowDown':
				nextFocusable()?.focus()
				event.preventDefault()
				break
		}
	}, [changeExpand, depth, expanded, isInteractive, nextFocusable, onLabelClick, previousFocusable])

	const componentClassName = useComponentClassName(depth === 0 ? 'menu-section' : 'menu-group')

	return <DepthContext.Provider value={depth + 1}>
		<li
			tabIndex={tabIndex}
			ref={listItemRef}
			className={classNames(
				componentClassName,
				hasSubItems && (expanded ? 'is-expanded' : 'is-collapsed'),
				toStateClass('interactive', isInteractive),
			)}
			onKeyDown={onKeyPress}
			aria-haspopup="true"
			aria-controls={id.current}
			aria-expanded={expanded}
		>
			{props.title && <div ref={listItemTitleRef} className={`${componentClassName}-title`}>
					<Toggle
						checked={expanded}
						controls={id.current}
						disabled={!isInteractive}
						onChange={changeExpand}
					/>
					{href
					? <MenuLink
							className={`${componentClassName}-title-content`}
							external={props.external}
							href={href}
							isActive={isActive}
							onClick={onLabelClick}
							suppressTo={expanded}
						>
							<Label className={`${componentClassName}-title-label`}>{props.title}</Label>
						</MenuLink>
					: <span
							className={`${componentClassName}-title-content`}
							onClick={onLabelClick}
						>
							<Label className={`${componentClassName}-label`}>{props.title}</Label>
						</span>}
				</div>}
			{children && (
				<Collapsible expanded={expanded}>
					<ul aria-labelledby={id.current} className={`${componentClassName}-list`}>{expanded ? children : undefined}</ul>
				</Collapsible>
			)}
		</li>
	</DepthContext.Provider>
}

export const Menu: FunctionComponent<MenuProps> & {
	Item: any
} = (props: MenuProps) => {
	const componentClassName = useComponentClassName('menu')
	const menuRef = useRef<HTMLUListElement>(null)

	const [mouseIsActive, setMouseIsActive] = useState(false)

	const nextFocusable = useCallback((): HTMLLIElement | null => {
		if (!menuRef.current) {
			return null
		}

		return getClosestFocusable(menuRef.current, 1)
	}, [])

	const previousFocusable = useCallback((): HTMLLIElement | null => {
		if (!menuRef.current) {
			return null
		}

		return getClosestFocusable(menuRef.current, -1)
	}, [])

	const coordinates = useRef<[number | undefined, number | undefined]>([undefined, undefined])
	const movingTimeout = useRef<number>(0)

	useEffect(() => {
		if (!menuRef.current) {
			return
		}

		const menu = menuRef.current

		const mouseMoveListener = (event: MouseEvent) => {
			const [x, y] = coordinates.current

			if (x && y && (event.x !== x || event.y !== y)) {
				setMouseIsActive(true)

				window.clearTimeout(movingTimeout.current)
				movingTimeout.current = window.setTimeout(() => {
					setMouseIsActive(false)
				}, 300)
			}

			coordinates.current = [event.x, event.y]
		}

		menu.addEventListener('mousemove', mouseMoveListener)

		return () => {
			menu.removeEventListener('mousemove', mouseMoveListener)
		}
	}, [])

	return <DepthContext.Provider value={0}>
		<section className={classNames(
			componentClassName,
			toViewClass('showCaret', props.showCaret ?? true),
		)}>
			<ul ref={menuRef} className={`${componentClassName}-list`}>
				<FocusContext.Provider value={useMemo(() => ({
					nextFocusable,
					previousFocusable,
					mouseIsActive,
				}), [nextFocusable, mouseIsActive, previousFocusable])}>
					{props.children}
				</FocusContext.Provider>
			</ul>
		</section>
	</DepthContext.Provider>
}

Menu.Item = Item
