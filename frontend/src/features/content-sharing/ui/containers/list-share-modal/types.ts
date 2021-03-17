import { UIEvent } from '../../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../../main-ui/types'

export type LinkAccessType = 'reader' | 'contributor'

export interface InviteLink {
    accessType: LinkAccessType
    link: string
}

export interface ListShareModalDependencies {
    copyLink: (link: string) => void
}

export interface ListShareModalState {
    addLinkAccessType: LinkAccessType
    inviteLinks: InviteLink[]
    linkDeleteIndex: number | null

    deleteLinkState: UITaskState
    addLinkState: UITaskState
    loadState: UITaskState
}

export type ListShareModalEvent = UIEvent<{
    setAddLinkAccessType: { accessType: LinkAccessType }
    addLink: null

    requestLinkDelete: { linkIndex: number }
    confirmLinkDelete: null
    cancelLinkDelete: null

    copyLink: { linkIndex: number }
}>
