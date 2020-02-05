import * as React from 'react'

/*
 * This is a hack. If we change referential identity of contember blocks between updates, Slate will generate new keys
 * for each node, causing React to unmount and re-mount our components, which completely ruins them. If we do the
 * opposite though, that is actually change the reference, Slate bails out of re-rendering our blocks. To circumvent
 * this, we introduce this context in order to notify all contember blocks about the update. The value itself does not
 * matter ‒ it is just something we can easily change between renders.
 */
export const ContemberBlockElementRefreshContext = React.createContext<number>(0)
