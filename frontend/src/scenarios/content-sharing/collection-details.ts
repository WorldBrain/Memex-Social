import { ScenarioMap } from "../../services/scenarios/types";
import { scenario } from "../../services/scenarios/utils";
import { CollectionDetailsEvent, CollectionDetailsSignal } from "../../features/content-sharing/ui/pages/collection-details/types";

type Targets = {
    CollectionDetailsPage: {
        events: CollectionDetailsEvent;
        signals: CollectionDetailsSignal;
    };
};

export const SCENARIOS: ScenarioMap<Targets> = {
    'default': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'default-lists-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'default-list' } },
        setup: {
            callModifications: ({ storage }) => [callModification({
                name: 'block-list-loading',
                object: storage.serverModules.contentSharing, property: 'retrieveList',
                modifier: 'block'
            })],
            waitForSignal: { target: 'CollectionDetailsPage', signal: { type: 'loading-started' } }
        },
        steps: [
            step({
                name: 'list-loaded',
                callModifications: ({ storage }) => [callModification({
                    name: 'block-list-loading',
                    modifier: 'undo'
                })],
                waitForSignal: { type: 'loaded-list-data', success: true },
            })
        ]
    })),
    'list-load-error': scenario<Targets>(({ step, callModification }) => ({
        startRoute: { route: 'collectionDetails', params: { id: 'non-existing' } },
        setup: {
            callModifications: ({ storage }) => [callModification({
                name: 'error-list-loading',
                object: storage.serverModules.contentSharing,
                property: 'retrieveList',
                modifier: 'sabotage'
            })]
        },
        steps: []
    })),
    'list-not-found': scenario<Targets>(({ step }) => ({
        startRoute: { route: 'collectionDetails', params: { id: 'non-existing' } },
        steps: []
    })),
    'no-entries': scenario<Targets>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'no-entries-list' } },
        steps: []
    })),
    'no-description': scenario<Targets>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'no-description-list' } },
        steps: []
    })),
    'short-description': scenario<Targets>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'short-description-list' } },
        steps: []
    })),
    'toggle-long-description': scenario<Targets>(({ step }) => ({
        fixture: 'default-lists-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'default-list' } },
        steps: [
            step({ name: 'first-description-toggle', target: 'CollectionDetailsPage', eventName: 'toggleDescriptionTruncation', eventArgs: {} }),
            step({ name: 'second-description-toggle', target: 'CollectionDetailsPage', eventName: 'toggleDescriptionTruncation', eventArgs: {} }),
        ]
    })),
    'annotations': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'default-list' } },
        steps: [
        ]
    })),
    'annotation-toggle': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'default-list' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'block-entries-loading',
                    object: storage.serverModules.contentSharing, property: 'getAnnotationListEntries',
                    modifier: 'block'
                }),
                callModification({
                    name: 'block-annotations-loading',
                    object: storage.serverModules.contentSharing, property: 'getAnnotations',
                    modifier: 'block'
                }),
            ]
        },
        steps: [
            step({
                name: 'entries-loaded',
                callModifications: ({ storage }) => [{
                    name: 'block-entries-loading',
                    modifier: 'undo',
                }]
            }),
            step({
                name: 'first-annotations-toggle',
                target: 'CollectionDetailsPage',
                eventName: 'togglePageAnnotations',
                eventArgs: {
                    normalizedUrl: 'getmemex.com'
                }
            }),
            step({
                name: 'annotations-loaded',
                callModifications: ({ storage }) => [{
                    name: 'block-annotations-loading',
                    modifier: 'undo',
                }]
            }),
        ]
    })),
    'annotations-entries-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'default-list' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'annotation-entries-loading',
                    object: storage.serverModules.contentSharing, property: 'getAnnotationListEntries',
                    modifier: 'sabotage'
                }),
            ]
        },
        steps: [
        ]
    })),
    'annotations-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'default-list' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'annotation-loading',
                    object: storage.serverModules.contentSharing, property: 'getAnnotations',
                    modifier: 'sabotage'
                }),
            ]
        },
        steps: [
            step({
                name: 'first-annotations-toggle',
                target: 'CollectionDetailsPage',
                eventName: 'togglePageAnnotations',
                eventArgs: {
                    normalizedUrl: 'getmemex.com'
                }
            }),
        ]
    })),
    'toggle-all-annotations': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'collectionDetails', params: { id: 'default-list' } },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'first-annotations-loading',
                    object: storage.serverModules.contentSharing, property: 'getAnnotations',
                    modifier: 'block'
                }),
            ]
        },
        steps: [
            step({
                name: 'all-annotations-toggle',
                target: 'CollectionDetailsPage',
                eventName: 'toggleAllAnnotations',
                eventArgs: {}
            }),
            step({
                name: 'first-annotations-loaded',
                callModifications: ({ storage }) => [
                    {
                        name: 'first-annotations-loading',
                        modifier: 'undo',
                    },
                    {
                        name: 'second-annotations-loading',
                        object: storage.serverModules.contentSharing, property: 'getAnnotations',
                        modifier: 'block'
                    }
                ]
            }),
            step({
                name: 'first-waypoint-hit',
                target: 'CollectionDetailsPage',
                eventName: 'pageBreakpointHit',
                eventArgs: { entryIndex: 10 }
            }),
            step({
                name: 'second-annotations-loaded',
                callModifications: ({ storage }) => [
                    {
                        name: 'second-annotations-loading',
                        modifier: 'undo',
                    },
                ]
            }),
        ]
    })),
    'large-data-set': scenario<Targets>(({ step }) => ({
        excludeFromMetaUI: true,
        fixture: {
            seed: 5,
            counts: {
                user: 1,
                sharedList: 1,
                sharedListEntry: 200,
                sharedAnnotation: 1000,
                sharedAnnotationListEntry: 5000,
            },
        },
        startRoute: { route: 'collectionDetails', params: { id: 'non-existing' } },
        steps: []
    })),
}
