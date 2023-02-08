import { UILogic } from 'ui-logic-core'
import { UIEventHandler } from '../../../main-ui/classes/logic'
import { doesMemexExtDetectionElExist } from '@worldbrain/memex-common/lib/common-ui/utils/content-script'
import { isPagePdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import { Services } from '../../../services/types'
import { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    sendMessageToExtension,
    awaitExtensionReady,
} from '../../../services/auth/auth-sync'
import { ExtMessage } from '@worldbrain/memex-common/lib/authentication/auth-sync'

export interface Dependencies {
    services?: Pick<Services, 'memexExtension'>
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
                if (event.notifAlreadyShown) {
                    if (isPagePdf({ url: event.urlToOpen })) {
                        event.preventOpening()
                        logic.emitMutation({
                            isMissingPDFModalShown: { $set: true },
                            clickedPageUrl: { $set: undefined },
                        })
                        return
                    }
                    window.open(event.urlToOpen)
                } else {
                    if (isPagePdf({ url: event.urlToOpen })) {
                        event.preventOpening()
                        logic.emitMutation({
                            isMissingPDFModalShown: { $set: true },
                            clickedPageUrl: { $set: undefined },
                        })
                        return
                    } else {
                        logic.emitMutation({
                            isInstallExtModalShown: { $set: true },
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
                console.log('exists')
                await dependencies.services?.memexExtension.openLink({
                    originalPageUrl: event.urlToOpen,
                    sharedListId: event.sharedListReference?.id as string,
                })
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

const trySendingURLToOpenToExtension = async (
    url: string,
    sharedListReference: SharedListReference,
) => {
    let sendingSuccessful = false
    let didOpen

    let payload = JSON.stringify({
        originalPageUrl: url,
        sharedListId: sharedListReference?.id as string,
    })

    let extensionID = process.env.MEMEX_EXTENSION_ID
        ? process.env.MEMEX_EXTENSION_ID
        : 'abkfbakhjpmblaafnpgjppbmioombali'

    const extensionReady = await awaitExtensionReady(extensionID)

    if (extensionReady) {
        // while (!sendingSuccessful) {
        //     console.log('trying to send')
        setTimeout(async () => {
            await sendMessageToExtension(
                ExtMessage.URL_TO_OPEN,
                extensionID,
                payload.toString(),
            )
        }, 3000)
        //     sendingSuccessful = true
        //     await delay(1000)
        // }
    }
}
