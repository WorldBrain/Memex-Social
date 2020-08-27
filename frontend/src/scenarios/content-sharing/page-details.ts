import { ScenarioMap } from "../../services/scenarios/types";
import { scenario } from "../../services/scenarios/utils";
import { PageDetailsEvent, PageDetailsSignal } from "../../features/content-sharing/ui/pages/page-details/types";

type Targets = {
    PageDetailsPage: {
        events: PageDetailsEvent;
        signals: PageDetailsSignal;
    };
};

export const SCENARIOS: ScenarioMap<Targets> = {
    'default': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'page-info-loading',
                    object: storage.serverModules.contentSharing, property: 'getPageInfo',
                    modifier: 'block'
                }),
                callModification({
                    name: 'annotations-loading',
                    object: storage.serverModules.contentSharing, property: 'getAnnotationsByCreatorAndPageUrl',
                    modifier: 'block'
                }),
                callModification({
                    name: 'creator-loading',
                    object: storage.serverModules.users, property: 'getUser',
                    modifier: 'block'
                }),
            ]
        },
        steps: [
            step({
                name: 'page-info-loaded',
                callModifications: ({ storage }) => [{
                    name: 'page-info-loading',
                    modifier: 'undo',
                }]
            }),
            step({
                name: 'annotations-loaded',
                callModifications: ({ storage }) => [{
                    name: 'annotations-loading',
                    modifier: 'undo',
                }]
            }),
            step({
                name: 'creator-loaded',
                callModifications: ({ storage }) => [{
                    name: 'creator-loading',
                    modifier: 'undo',
                }]
            }),
        ]
    })),
    'not-found': scenario<Targets>(({ step, callModification }) => ({
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
        },
        steps: [
        ]
    })),
    'no-annotations': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'empty-page' } },
        setup: {
        },
        steps: [
        ]
    })),
    'page-info-load-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'page-info-loading',
                    object: storage.serverModules.contentSharing, property: 'getPageInfo',
                    modifier: 'sabotage'
                }),
            ]
        },
        steps: [
        ]
    })),
    'creator-load-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'creator-loading',
                    object: storage.serverModules.users, property: 'getUser',
                    modifier: 'sabotage'
                }),
            ]
        },
        steps: [
        ]
    })),
    'annotations-load-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'pageDetails', params: { id: 'default-page' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'annotations-loading',
                    object: storage.serverModules.contentSharing, property: 'getAnnotationsByCreatorAndPageUrl',
                    modifier: 'sabotage'
                }),
            ]
        },
        steps: [
        ]
    })),
}
