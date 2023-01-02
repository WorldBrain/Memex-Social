import { UILogic } from 'ui-logic-core'
import { UIEventHandler } from '../../../main-ui/classes/logic'
import { doesMemexExtDetectionElExist } from '@worldbrain/memex-common/lib/common-ui/utils/content-script'
import { isPagePdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import { Services } from '../../../services/types'
import { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'

export interface Dependencies {
    services?: Pick<Services, 'memexExtension'>
}

export interface ExtDetectionState {
    showFollowModal: boolean
    isInstallExtModalShown: boolean
    isMissingPDFModalShown: boolean
    clickedPageUrl: string | null
    notifAlreadyShown?: boolean
}

export interface ExtDetectionEvent {
    toggleInstallExtModal: {}
    toggleMissingPdfModal: {}
    toggleFollowSpaceOverlay: {}
    clickPageResult: {
        urlToOpen: string
        preventOpening: () => void
        isFollowedSpace?: boolean
        isFeed?: boolean
        notifAlreadyShown?: boolean
        sharedListReference?: SharedListReference
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
    clickedPageUrl: null,
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
                ? { clickedPageUrl: { $set: null } }
                : {}),
        })

    return {
        clickPageResult: async ({ previousState, event }) => {
            if (event.notifAlreadyShown) {
                if (
                    isPagePdf({ url: event.urlToOpen }) &&
                    doesMemexExtDetectionElExist()
                ) {
                    event.preventOpening()
                    logic.emitMutation({
                        isMissingPDFModalShown: { $set: true },
                        clickedPageUrl: { $set: null },
                    })
                    return
                } else {
                    window.open(event.urlToOpen)
                }
            } else {
                if (
                    isPagePdf({ url: event.urlToOpen }) &&
                    doesMemexExtDetectionElExist()
                ) {
                    event.preventOpening()
                    logic.emitMutation({
                        isMissingPDFModalShown: { $set: true },
                        clickedPageUrl: { $set: null },
                    })
                    return
                }

                if (event.isFollowedSpace || event.isFeed) {
                    logic.emitMutation({
                        showFollowModal: { $set: false },
                        clickedPageUrl: { $set: event.urlToOpen },
                    })
                }

                if (doesMemexExtDetectionElExist()) {
                    if (!event.isFollowedSpace && !event.isFeed) {
                        event.preventOpening()
                        logic.emitMutation({
                            showFollowModal: { $set: true },
                            clickedPageUrl: { $set: event.urlToOpen },
                            notifAlreadyShown: { $set: true },
                        })
                        const didOpen = await dependencies.services?.memexExtension.openLink(
                            {
                                originalPageUrl: event.urlToOpen,
                                sharedListId: event.sharedListReference
                                    ?.id as string,
                            },
                        )
                        // if the extension does not respond, didOpen is `false` and we can do something useful
                        return
                    }
                }

                if (!doesMemexExtDetectionElExist()) {
                    event.preventOpening()
                    logic.emitMutation({
                        isInstallExtModalShown: { $set: true },
                        clickedPageUrl: { $set: event.urlToOpen },
                        notifAlreadyShown: { $set: true },
                    })
                    return
                }
            }
            // This means it's a local PDF page
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
