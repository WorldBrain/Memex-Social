import { ScenarioMap } from "../../services/scenarios/types";
import { scenario } from "../../services/scenarios/utils";
import { CollectionDetailsEvent } from "../../features/content-sharing/ui/pages/collection-details/types";

export const SCENARIOS: ScenarioMap = {
    'default': scenario<{ CollectionDetailsPage: CollectionDetailsEvent }>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'default-list' } },
        steps: [
        ]
    })),
    'list-not-found': scenario<{ CollectionDetailsPage: CollectionDetailsEvent }>(({ step }) => ({
        startRoute: { route: 'collectionDetails', params: { id: 'non-existing' } },
        steps: []
    })),
    'no-entries': scenario<{ CollectionDetailsPage: CollectionDetailsEvent }>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'no-entries-list' } },
        steps: []
    })),
    'no-description': scenario<{ CollectionDetailsPage: CollectionDetailsEvent }>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'no-description-list' } },
        steps: []
    })),
    'short-description': scenario<{ CollectionDetailsPage: CollectionDetailsEvent }>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'short-description-list' } },
        steps: []
    })),
    'toggle-long-description': scenario<{ CollectionDetailsPage: CollectionDetailsEvent }>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'default-list' } },
        steps: [
            step({ name: 'first-description-toggle', target: 'CollectionDetailsPage', eventName: 'toggleDescriptionTruncation', eventArgs: {} }),
            step({ name: 'second-description-toggle', target: 'CollectionDetailsPage', eventName: 'toggleDescriptionTruncation', eventArgs: {} }),
        ]
    })),
    'with-annotations': scenario<{ CollectionDetailsPage: CollectionDetailsEvent }>(({ step }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'default-list' } },
        steps: [
        ]
    })),
}
