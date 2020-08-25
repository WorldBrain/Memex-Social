import { ScenarioMap } from "../../services/scenarios/types";
import { scenario } from "../../services/scenarios/utils";
import { AnnotationDetailsEvent, AnnotationDetailsSignal } from "../../features/content-sharing/ui/pages/annotation-details/types";

type Targets = {
    AnnotationDetailsPage: {
        events: AnnotationDetailsEvent;
        signals: AnnotationDetailsSignal;
    };
};

export const SCENARIOS: ScenarioMap<Targets> = {
    'default': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'default-lists-with-user',
        startRoute: { route: 'AnnotationDetails', params: { id: 'annotation-1' } },
        setup: {
        },
        steps: [
        ]
    })),
}
