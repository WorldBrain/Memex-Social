import {
    UILogic,
    UIEventHandler,
    loadInitial,
    executeUITask,
} from '../../../../../main-ui/classes/logic'
import {
    ListShareModalDependencies,
    ListShareModalEvent,
    ListShareModalState,
    InviteLink,
} from './types'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'

type EventHandler<EventName extends keyof ListShareModalEvent> = UIEventHandler<
    ListShareModalState,
    ListShareModalEvent,
    EventName
>

export default class ListShareModalLogic extends UILogic<
    ListShareModalState,
    ListShareModalEvent
> {
    constructor(private dependencies: ListShareModalDependencies) {
        super()
    }

    getInitialState(): ListShareModalState {
        return {
            addLinkRoleID: SharedListRoleID.Reader,
            deleteLinkState: 'pristine',
            addLinkState: 'pristine',
            loadState: 'pristine',
            showSuccessMsg: false,
            linkDeleteIndex: null,
            inviteLinks: [],
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        await loadInitial<ListShareModalState>(this, async () => {
            // TODO: figure out how to load existing links
        })
    }

    setAddLinkRoleID: EventHandler<'setAddLinkRoleID'> = ({ event }) => {
        this.emitMutation({ addLinkRoleID: { $set: Number(event.roleID) } })
    }

    addLink: EventHandler<'addLink'> = async ({ previousState }) => {
        const { clipboard, contentSharing } = this.dependencies.services
        const roleID = previousState.addLinkRoleID

        await executeUITask<ListShareModalState>(
            this,
            'addLinkState',
            async () => {
                const { link } = await contentSharing.generateKeyLink({
                    key: { roleID },
                    listReference: {
                        id: this.dependencies.listID,
                        type: 'shared-list-reference',
                    },
                })

                this.emitMutation({
                    inviteLinks: { $push: [{ link, roleID }] },
                    showSuccessMsg: { $set: true },
                })

                await clipboard.copy(link)
            },
        )

        setTimeout(
            () => this.emitMutation({ showSuccessMsg: { $set: false } }),
            2000,
        )
    }

    requestLinkDelete: EventHandler<'requestLinkDelete'> = ({ event }) => {
        this.emitMutation({
            linkDeleteIndex: { $set: event.linkIndex },
        })
    }

    cancelLinkDelete: EventHandler<'cancelLinkDelete'> = () => {
        this.emitMutation({ linkDeleteIndex: { $set: null } })
    }

    confirmLinkDelete: EventHandler<'confirmLinkDelete'> = async ({
        previousState,
    }) => {
        const { linkDeleteIndex } = previousState
        if (linkDeleteIndex == null) {
            throw new Error(
                'Index of link to delete is not set - cannot confirm deletion',
            )
        }
        await executeUITask<ListShareModalState>(
            this,
            'deleteLinkState',
            async () => {
                // TODO: figure out how to delete link
                this.emitMutation({
                    linkDeleteIndex: { $set: null },
                    inviteLinks: {
                        $apply: (links: InviteLink[]) => [
                            ...links.slice(0, linkDeleteIndex),
                            ...links.slice(linkDeleteIndex + 1),
                        ],
                    },
                })
            },
        )
    }

    copyLink: EventHandler<'copyLink'> = async ({ event, previousState }) => {
        const { clipboard } = this.dependencies.services
        const inviteLink = previousState.inviteLinks[event.linkIndex]

        if (inviteLink == null) {
            throw new Error('Link to copy does not exist - cannot copy')
        }

        await clipboard.copy(inviteLink.link)
    }
}
