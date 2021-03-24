import { UIEvent } from '../../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../../main-ui/types'
import { UIElementServices } from '../../../../../services/types'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'

export interface InviteLink {
    roleID: SharedListRoleID
    link: string
}

export interface ListShareModalDependencies {
    services: UIElementServices<
        'contentSharing' | 'overlay' | 'clipboard' | 'router'
    >
    listID: string
    onCloseRequested: () => void
}

export interface ListShareModalState {
    addLinkRoleID: SharedListRoleID
    inviteLinks: InviteLink[]
    linkDeleteIndex: number | null
    showSuccessMsg: boolean

    deleteLinkState: UITaskState
    addLinkState: UITaskState
    loadState: UITaskState
}

export type ListShareModalEvent = UIEvent<{
    setAddLinkRoleID: { roleID: SharedListRoleID }
    addLink: null

    requestLinkDelete: { linkIndex: number }
    confirmLinkDelete: null
    cancelLinkDelete: null

    copyLink: { linkIndex: number }
}>
