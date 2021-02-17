import { ScenarioMap } from '../../services/scenarios/types'
import { scenario } from '../../services/scenarios/utils'
import {
    AnnotationDetailsEvent,
    AnnotationDetailsSignal,
} from '../../features/content-sharing/ui/pages/annotation-details/types'

type Targets = {
    AnnotationDetailsPage: {
        events: AnnotationDetailsEvent
        signals: AnnotationDetailsSignal
    }
}

export const SCENARIOS: ScenarioMap<Targets> = {
    default: scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: {
            route: 'annotationDetails',
            params: { id: 'default-annotation' },
        },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'annotation-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'getAnnotation',
                    modifier: 'block',
                }),
                callModification({
                    name: 'page-info-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'getPageInfoByCreatorAndUrl',
                    modifier: 'block',
                }),
                callModification({
                    name: 'creator-loading',
                    object: storage.serverModules.users,
                    property: 'getUser',
                    modifier: 'block',
                }),
            ],
        },
        steps: [
            step({
                name: 'annotation-loaded',
                callModifications: ({ storage }) => [
                    {
                        name: 'annotation-loading',
                        modifier: 'undo',
                    },
                ],
            }),
            step({
                name: 'page-info-loaded',
                callModifications: ({ storage }) => [
                    {
                        name: 'page-info-loading',
                        modifier: 'undo',
                    },
                ],
            }),
            step({
                name: 'creator-loaded',
                callModifications: ({ storage }) => [
                    {
                        name: 'creator-loading',
                        modifier: 'undo',
                    },
                ],
            }),
        ],
    })),
    'not-found': scenario<Targets>(({ step, callModification }) => ({
        startRoute: {
            route: 'annotationDetails',
            params: { id: 'default-annotation' },
        },
        setup: {},
        steps: [],
    })),
    'annotation-load-error': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            startRoute: {
                route: 'annotationDetails',
                params: { id: 'default-annotation' },
            },
            setup: {
                callModifications: ({ storage }) => [
                    callModification({
                        name: 'annotation-entries-loading',
                        object: storage.serverModules.contentSharing,
                        property: 'getAnnotation',
                        modifier: 'sabotage',
                    }),
                ],
            },
            steps: [],
        }),
    ),
    'page-info-load-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: {
            route: 'annotationDetails',
            params: { id: 'default-annotation' },
        },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'annotation-entries-loading',
                    object: storage.serverModules.contentSharing,
                    property: 'getPageInfoByCreatorAndUrl',
                    modifier: 'sabotage',
                }),
            ],
        },
        steps: [],
    })),
    'creator-load-error': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: {
            route: 'annotationDetails',
            params: { id: 'default-annotation' },
        },
        setup: {
            callModifications: ({ storage }) => [
                callModification({
                    name: 'annotation-entries-loading',
                    object: storage.serverModules.users,
                    property: 'getUser',
                    modifier: 'sabotage',
                }),
            ],
        },
        steps: [],
    })),
}
