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
            addLinkAccessType: 'reader',
            deleteLinkState: 'pristine',
            addLinkState: 'pristine',
            loadState: 'pristine',
            linkDeleteIndex: null,
            inviteLinks: [],
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        await loadInitial<ListShareModalState>(this, async () => {
            // TODO: figure out how to load links
        })
    }

    setAddLinkAccessType: EventHandler<'setAddLinkAccessType'> = ({
        event,
    }) => {
        this.emitMutation({ addLinkAccessType: { $set: event.accessType } })
    }

    addLink: EventHandler<'addLink'> = async ({ previousState }) => {
        await executeUITask<ListShareModalState>(
            this,
            'addLinkState',
            async () => {
                // TODO: figure out how to create link
                const mockLink: InviteLink = {
                    accessType: previousState.addLinkAccessType,
                    link: 'https://memex.social/c/test?key=TEST',
                }
                this.emitMutation({ inviteLinks: { $push: [mockLink] } })
            },
        )
    }

    requestLinkDelete: EventHandler<'requestLinkDelete'> = ({ event }) => {
        this.emitMutation({ linkDeleteIndex: { $set: event.linkIndex } })
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
                            ...links.splice(0, linkDeleteIndex),
                            ...links.splice(linkDeleteIndex + 1),
                        ],
                    },
                })
            },
        )
    }

    copyLink: EventHandler<'copyLink'> = ({ event, previousState }) => {
        const inviteLink = previousState.inviteLinks[event.linkIndex]

        if (inviteLink == null) {
            throw new Error('Link to copy does not exist - cannot copy')
        }

        this.dependencies.copyLink(inviteLink.link)
    }
}