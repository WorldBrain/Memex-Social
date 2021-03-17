import { LinkAccessType } from './types'

export const linkAccessTypeToString = (accessType: LinkAccessType): string => {
    if (accessType === 'reader') {
        return 'Reader'
    }
    if (accessType === 'contributor') {
        return 'Contributor'
    }
    return ''
}
