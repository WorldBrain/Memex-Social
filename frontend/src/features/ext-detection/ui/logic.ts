import { UILogic } from 'ui-logic-core'
import { UIEventHandler } from '../../../main-ui/classes/logic'
import { doesMemexExtDetectionElExist } from '@worldbrain/memex-common/lib/common-ui/utils/content-script'
import { isMemexPageAPdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import { Services } from '../../../services/types'
import { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'

export interface Dependencies {
    services: Pick<Services, 'memexExtension' | 'auth'>
}

export interface ExtDetectionState {
    showFollowModal: boolean
    isInstallExtModalShown: boolean
    isMissingPDFModalShown: boolean
    clickedPageUrl: string | undefined
    notifAlreadyShown?: boolean
}

export interface ExtDetectionEvent {
    toggleInstallExtModal: {}
    toggleMissingPdfModal: {}
    toggleFollowSpaceOverlay: {}
    clickPageResult: {
        urlToOpen: string | undefined
        preventOpening: () => void
        isFollowedSpace?: boolean
        isFeed?: boolean
        notifAlreadyShown?: boolean
        sharedListReference?: SharedListReference
        pageLinkURL: string
    }
    clickFollowButtonForNotif: {
        spaceToFollow: string | undefined
        sharedListReference?: SharedListReference
        notifAlreadyShown?: boolean
        urlToSpace?: string
    }
}

export type EventHandlers = {
    [EventName in keyof ExtDetectionEvent]: UIEventHandler<
        ExtDetectionState,
        ExtDetectionEvent,
        EventName
    >
}

export const extDetectionInitialState = (): ExtDetectionState => ({
    isInstallExtModalShown: false,
    isMissingPDFModalShown: false,
    showFollowModal: false,
    clickedPageUrl: undefined,
    notifAlreadyShown: false,
})

export const extDetectionEventHandlers = (
    logic: UILogic<ExtDetectionState, ExtDetectionEvent>,
    dependencies: Dependencies,
): EventHandlers => {
    const performToggleMutation = (
        stateKey: keyof ExtDetectionState,
        previousState: ExtDetectionState,
    ) =>
        logic.emitMutation({
            [stateKey]: { $set: !previousState[stateKey] },
            ...(previousState[stateKey]
                ? { clickedPageUrl: { $set: undefined } }
                : {}),
        })

    const isIframe = () => {
        try {
            return window.self !== window.top
        } catch (e) {
            return true
        }
    }

    return {
        clickPageResult: async ({ previousState, event }) => {
            if (isIframe()) {
                event.preventOpening()
                window.open(event.urlToOpen)
                return
            }

            if (!doesMemexExtDetectionElExist()) {
                event.preventOpening()
                window.open(event.pageLinkURL, '_self')

                if (event.notifAlreadyShown) {
                    if (isMemexPageAPdf({ url: event.urlToOpen })) {
                        event.preventOpening()
                        logic.emitMutation({
                            isMissingPDFModalShown: { $set: true },
                            clickedPageUrl: { $set: undefined },
                        })
                        return
                    }
                    window.open(event.pageLinkURL, '_self')
                } else {
                    if (isMemexPageAPdf({ url: event.urlToOpen })) {
                        event.preventOpening()
                        logic.emitMutation({
                            isMissingPDFModalShown: { $set: true },
                            clickedPageUrl: { $set: undefined },
                        })
                        return
                    } else {
                        logic.emitMutation({
                            isInstallExtModalShown: { $set: false },
                            clickedPageUrl: { $set: event.urlToOpen },
                            notifAlreadyShown: { $set: true },
                        })
                    }
                    if (event.urlToOpen && event.sharedListReference) {
                        await trySendingURLToOpenToExtension(
                            event.urlToOpen,
                            event.sharedListReference,
                        )
                    }

                    // if (event.isFollowedSpace || event.isFeed) {
                    //     logic.emitMutation({
                    //         showFollowModal: { $set: true },
                    //         clickedPageUrl: { $set: event.urlToOpen },
                    //     })
                    // }
                    return
                }
            }
            if (doesMemexExtDetectionElExist()) {
                const openLink = await dependencies.services?.memexExtension.openLink(
                    {
                        originalPageUrl: event.urlToOpen,
                        sharedListId: event.sharedListReference?.id as string,
                    },
                )

                if (!openLink) {
                    window.open(event.urlToOpen)
                }
            }
            // This means it's a local PDF page
        },
        clickFollowButtonForNotif: async ({ previousState, event }) => {
            if (!doesMemexExtDetectionElExist()) {
                logic.emitMutation({
                    showFollowModal: { $set: true },
                })

                let payload = JSON.stringify({
                    type: 'returnToFollowedSpace',
                    originalPageUrl: event.urlToSpace,
                    sharedListId: undefined,
                })

                localStorage.setItem('urlAndSpaceToOpen', payload.toString())
            }
        },
        toggleInstallExtModal: ({ previousState }) => {
            performToggleMutation('isInstallExtModalShown', previousState)
        },
        toggleFollowSpaceOverlay: ({ previousState }) => {
            performToggleMutation('showFollowModal', previousState)
        },
        toggleMissingPdfModal: ({ previousState }) => {
            performToggleMutation('isMissingPDFModalShown', previousState)
        },
    }
}

const trySendingURLToOpenToExtension = async (
    url: string,
    sharedListReference: SharedListReference,
) => {
    let payload = JSON.stringify({
        type: 'pageToOpen',
        originalPageUrl: url,
        sharedListId: sharedListReference?.id as string,
    })

    localStorage.setItem('urlAndSpaceToOpen', payload.toString())
}
