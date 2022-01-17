import { UILogic } from 'ui-logic-core'
import { UIEventHandler } from '../../../main-ui/classes/logic'
import { doesMemexExtDetectionElExist } from '@worldbrain/memex-common/lib/common-ui/utils/content-script'
import { isPagePdf } from '@worldbrain/memex-common/lib/page-indexing/utils'

export interface Dependencies {}

export interface ExtDetectionState {
    showFollowModal: boolean
    isInstallExtModalShown: boolean
    isMissingPDFModalShown: boolean
    clickedPageUrl: string | null
}

export interface ExtDetectionEvent {
    toggleInstallExtModal: {}
    toggleMissingPdfModal: {}
    toggleFollowSpaceOverlay: {}
    clickPageResult: {
        urlToOpen: string
        preventOpening: () => void
        isFollowedSpace: boolean
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
})

export const extDetectionEventHandlers = (
    logic: UILogic<ExtDetectionState, ExtDetectionEvent>,
    dependencies: Dependencies,
): EventHandlers => ({
    clickPageResult: async ({ previousState, event }) => {
        if (doesMemexExtDetectionElExist() && !event.isFollowedSpace) {
            event.preventOpening()
            logic.emitMutation({
                showFollowModal: { $set: true },
                clickedPageUrl: { $set: event.urlToOpen },
            })
            return
        }

        if (!doesMemexExtDetectionElExist()) {
            event.preventOpening()
            logic.emitMutation({
                isInstallExtModalShown: { $set: true },
                clickedPageUrl: { $set: event.urlToOpen },
            })
            return
        }

        // This means it's a local PDF page
        if (isPagePdf({ url: event.urlToOpen })) {
            event.preventOpening()
            logic.emitMutation({
                isMissingPDFModalShown: { $set: true },
                clickedPageUrl: { $set: null },
            })
            return
        }
    },
    toggleInstallExtModal: () => {
        logic.emitMutation({
            isInstallExtModalShown: { $apply: (shown) => !shown },
        })
    },
    toggleFollowSpaceOverlay: () => {
        logic.emitMutation({
            showFollowModal: { $apply: (shown) => !shown },
        })
    },
    toggleMissingPdfModal: () => {
        logic.emitMutation({
            isMissingPDFModalShown: { $apply: (shown) => !shown },
        })
    },
})
