import { UILogic } from 'ui-logic-core'
import { UIEventHandler } from '../../../main-ui/classes/logic'
import { doesMemexExtDetectionElExist } from '@worldbrain/memex-common/lib/common-ui/utils/content-script'
import { isMemexPageAPdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import { Services } from '../../../services/types'
import { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import { sleepPromise } from '../../../utils/promises'

export interface Dependencies {
    services: Pick<Services, 'memexExtension' | 'auth' | 'router'>
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
    // TODO: Clean up these params - I don't think these are all needed
    clickPageResult: {
        urlToOpen: string | undefined
        preventOpening: () => void
        isFollowedSpace?: boolean
        isFeed?: boolean
        notifAlreadyShown?: boolean
        sharedListReference?: SharedListReference
        listID: string
        listEntryID: string
        openInWeb?: boolean
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

            // Memex PDFs go straight to the reader, which will figure out how to get access to them
            if (isMemexPageAPdf({ url: event.urlToOpen })) {
                dependencies.services.router.goTo(
                    'pageView',
                    {
                        id: event.listID,
                        entryId: event.listEntryID,
                    },
                    {
                        query: { noAutoOpen: 'true' },
                    },
                )
                return
            }

            if (!doesMemexExtDetectionElExist()) {
                if (event.listEntryID) {
                    dependencies.services.router.goTo('collectionDetails', {
                        id: event.listID,
                        entryId: event.listEntryID,
                    })
                    return
                }

                if (event.openInWeb) {
                    window.open(event.urlToOpen, '_blank')
                    return
                }
                const currentBaseURL = new URL(window.location.href).origin
                const pageLinkURL =
                    currentBaseURL +
                    '/c/' +
                    event.listID +
                    '/p/' +
                    event.listEntryID

                event.preventOpening()
                window.open(pageLinkURL, '_self')

                if (event.notifAlreadyShown) {
                    window.open(pageLinkURL, '_self')
                } else {
                    logic.emitMutation({
                        isInstallExtModalShown: { $set: false },
                        clickedPageUrl: { $set: event.urlToOpen },
                        notifAlreadyShown: { $set: true },
                    })
                    if (event.urlToOpen && event.sharedListReference) {
                        await trySendingURLToOpenToExtension(
                            event.urlToOpen,
                            event.sharedListReference,
                        )
                    }
                    return
                }
                return
            }
            const userAgent = navigator.userAgent
            const sourceUrl = event.urlToOpen as string
            const sharedListId = event.sharedListReference?.id as string

            if (/Firefox/i.test(userAgent)) {
                // Create a new DOM element, let's assume it's a `div`
                const injectedElement = document.createElement('div')

                // Set an ID so the MutationObserver can identify it
                injectedElement.id = 'openPageInSelectedListModeTriggerElement'

                // Attach the necessary data as data attributes
                injectedElement.setAttribute('sourceurl', sourceUrl)
                injectedElement.setAttribute('sharedlistid', sharedListId)

                // Append the element to the body (or any other parent element)
                document.body.appendChild(injectedElement)
                await sleepPromise(500)
                injectedElement.remove()
            } else {
                await dependencies.services?.memexExtension.openLink({
                    originalPageUrl: event.urlToOpen,
                    sharedListId: event.sharedListReference?.id as string,
                })
            }
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
