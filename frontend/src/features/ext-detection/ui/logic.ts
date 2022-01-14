import { UILogic } from 'ui-logic-core'
import { UIEventHandler } from '../../../main-ui/classes/logic'
import { doesMemexExtDetectionElExist } from '@worldbrain/memex-common/lib/common-ui/utils/content-script'
import { isPagePdf } from '@worldbrain/memex-common/lib/page-indexing/utils'

export interface Dependencies {}

export interface ExtDetectionState {
    isInstallExtModalShown: boolean
    isMissingPDFModalShown: boolean
}

export interface ExtDetectionEvent {
    toggleInstallExtModal: {}
    toggleMissingPdfModal: {}
    clickPageResult: { urlToOpen: string; preventOpening: () => void }
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
})

export const extDetectionEventHandlers = (
    logic: UILogic<ExtDetectionState, ExtDetectionEvent>,
    dependencies: Dependencies,
): EventHandlers => ({
    clickPageResult: async ({ previousState, event }) => {
        if (!doesMemexExtDetectionElExist()) {
            event.preventOpening()
            logic.emitMutation({
                isInstallExtModalShown: { $set: true },
            })
            return
        }

        // This means it's a local PDF page
        if (isPagePdf({ url: event.urlToOpen })) {
            event.preventOpening()
            logic.emitMutation({
                isMissingPDFModalShown: { $set: true },
            })
            return
        }
    },
    toggleInstallExtModal: () => {
        logic.emitMutation({
            isInstallExtModalShown: { $apply: (shown) => !shown },
        })
    },
    toggleMissingPdfModal: () => {
        logic.emitMutation({
            isMissingPDFModalShown: { $apply: (shown) => !shown },
        })
    },
})
