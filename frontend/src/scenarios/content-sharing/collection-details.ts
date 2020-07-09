import { ScenarioMap } from "../../services/scenarios/types";
import { scenario } from "../../services/scenarios/utils";
import { CollectionDetailsEvent } from "../../features/content-sharing/ui/pages/collection-details/types";

export const SCENARIOS: ScenarioMap = {
    'default': scenario<{ CollectionDetailsPage: CollectionDetailsEvent }>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'default-list' } },
        steps: [
            step({ name: 'first-description-toggle', target: 'CollectionDetailsPage', eventName: 'toggleDescriptionTruncation', eventArgs: {} }),
            step({ name: 'second-description-toggle', target: 'CollectionDetailsPage', eventName: 'toggleDescriptionTruncation', eventArgs: {} }),
        ]
    })),
}
