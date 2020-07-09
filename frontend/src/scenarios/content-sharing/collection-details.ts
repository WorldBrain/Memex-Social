import { ScenarioMap } from "../../services/scenarios/types";
import { scenario } from "../../services/scenarios/utils";
import { CollectionDetailsEvent } from "../../features/content-sharing/ui/pages/collection-details/types";

export const SCENARIOS: ScenarioMap = {
    'default': scenario<{ CollectionDetails: CollectionDetailsEvent }>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'default-list' } },
        steps: []
    })),
}
