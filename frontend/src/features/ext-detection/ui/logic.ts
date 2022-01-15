import { UILogic } from 'ui-logic-core'
import { UIEventHandler } from '../../../main-ui/classes/logic'
import { doesMemexExtDetectionElExist } from '@worldbrain/memex-common/lib/common-ui/utils/content-script'
import { isPagePdf } from '@worldbrain/memex-common/lib/page-indexing/utils'

export interface Dependencies {}

export interface ExtDetectionState {
    isInstallExtModalShown: boolean
    isMissingPDFModalShown: boolean
    showFollowModal: boolean
    currentUrl: string | undefined
}

export interface ExtDetectionEvent {
    toggleInstallExtModal: {}
    toggleFollowSpaceOverlay: {}
    toggleMissingPdfModal: {}
    clickPageResult: {
        urlToOpen: string
        preventOpening: () => void
        isFollowedSpace: boolean
        currentUrl: string
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
    currentUrl: '',
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
                currentUrl: { $set: event.currentUrl },
            })
            return
        }

        if (!doesMemexExtDetectionElExist()) {
            event.preventOpening()
            logic.emitMutation({
                isInstallExtModalShown: { $set: true },
                currentUrl: { $set: event.currentUrl },
            })
            return
        }

        // This means it's a local PDF page
        if (isPagePdf({ url: event.urlToOpen })) {
            event.preventOpening()
            logic.emitMutation({
                isMissingPDFModalShown: { $set: true },
                currentUrl: { $set: event.currentUrl },
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
