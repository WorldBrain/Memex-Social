import { ScenarioMap } from '../../services/scenarios/types'
import { scenario } from '../../services/scenarios/utils'
import { HomeFeedEvent } from '../../features/activity-streams/ui/pages/home-feed/types'
import { setupTestActivities } from '../../scenario-utils/activities'

type Targets = {
    HomeFeedPage: {
        events: HomeFeedEvent
    }
}

export const SCENARIOS: ScenarioMap<Targets> = {
    default: scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'homeFeed', params: {} },
        setup: {
            execute: setupTestActivities,
        },
        steps: [],
    })),
    'bump-seen-replies': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'homeFeed', params: {} },
        setup: {
            execute: (context) =>
                setupTestActivities({
                    ...context,
                    script: [
                        { type: 'login', user: 'default-user' },
                        {
                            type: 'reply',
                            annotation: 'default-annotation',
                            list: 'default-list',
                        },
                        {
                            type: 'reply',
                            annotation: 'default-annotation',
                            list: 'default-list',
                        },
                        {
                            type: 'follow-annotation',
                            annotation: 'default-annotation',
                        },
                        {
                            type: 'follow-annotation',
                            annotation: 'second-annotation',
                        },
                        {
                            type: 'login',
                            user: 'two@user.com',
                            createProfile: true,
                        },
                        {
                            type: 'reply',
                            annotation: 'default-annotation',
                            list: 'default-list',
                        },
                        {
                            type: 'reply',
                            annotation: 'second-annotation',
                            list: 'default-list',
                        },
                        {
                            type: 'home-feed-timestamp',
                            user: 'default-user',
                            time: '$now',
                        },
                        // this reply should bump the group for the default annotation above the seen line
                        {
                            type: 'reply',
                            annotation: 'default-annotation',
                            list: 'default-list',
                        },
                        { type: 'login', user: 'default-user' },
                    ],
                }),
        },
        steps: [],
    })),
    'bump-seen-list-entries': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            startRoute: { route: 'homeFeed', params: {} },
            setup: {
                execute: (context) =>
                    setupTestActivities({
                        ...context,
                        script: [
                            { type: 'login', user: 'default-user' },
                            { type: 'follow-list', list: 'default-list' },
                            { type: 'follow-list', list: 'empty-list' },
                            {
                                type: 'follow-annotation',
                                annotation: 'default-annotation',
                            },
                            {
                                type: 'login',
                                user: 'two@user.com',
                                createProfile: true,
                            },
                            {
                                type: 'list-entries',
                                list: 'empty-list',
                                pages: ['empty.com/one', 'empty.com/two'],
                                time: '$now',
                            },
                            {
                                type: 'list-entries',
                                list: 'default-list',
                                pages: ['new.com/one'],
                                time: '$now',
                            },
                            {
                                type: 'reply',
                                annotation: 'default-annotation',
                                list: 'default-list',
                            },
                            {
                                type: 'home-feed-timestamp',
                                user: 'default-user',
                                time: '$now',
                            },
                            {
                                type: 'list-entries',
                                list: 'default-list',
                                pages: ['new.com/two'],
                                time: '$now',
                            },
                            { type: 'login', user: 'default-user' },
                        ],
                    }),
            },
            steps: [],
        }),
    ),
    'load-more-replies': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'homeFeed', params: {} },
        setup: {
            execute: setupTestActivities,
        },
        steps: [
            step({
                name: 'load-more-replies',
                target: 'HomeFeedPage',
                eventName: 'loadMoreReplies',
                eventArgs: {
                    groupId: 'act-5',
                    annotationReference: {
                        type: 'shared-annotation-reference',
                        id: 'third-annotation',
                    },
                },
            }),
        ],
    })),
    'list-item-with-replies': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: { route: 'homeFeed', params: {} },
            setup: {
                execute: (context) =>
                    setupTestActivities({
                        ...context,
                        script: [
                            { type: 'login', user: 'default-user' },
                            { type: 'follow-list', list: 'default-list' },
                            {
                                type: 'login',
                                user: 'two@user.com',
                                createProfile: true,
                            },

                            {
                                type: 'list-entries',
                                list: 'default-list',
                                pages: [
                                    'new.com/one',
                                    'new.com/two',
                                    'new.com/three',
                                ],
                            },
                            {
                                type: 'create-annotation',
                                page: 'new.com/one',
                                list: 'default-list',
                                createdId: 'first',
                            },
                            {
                                type: 'reply',
                                createdAnnotation: 'first',
                                list: 'default-list',
                            },
                            {
                                type: 'reply',
                                createdAnnotation: 'first',
                                list: 'default-list',
                            },
                            { type: 'login', user: 'default-user' },
                        ],
                    }),
            },
            steps: [
                // step({
                //     name: 'load-more-replies',
                //     target: 'HomeFeedPage',
                //     eventName: 'toggleListEntryActivityAnnotations',
                //     eventArgs: {
                //         groupId: 'act-1',
                //         listReference: { type: 'shared-list-reference', id: 'default-list' },
                //         listEntryReference: { type: 'shared-list-entry-reference', id:  },
                //     }
                // })
            ],
        }),
    ),
    'list-item-multi-annots-single-reply': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: { route: 'homeFeed', params: {} },
            setup: {
                execute: (context) =>
                    setupTestActivities({
                        ...context,
                        script: [
                            { type: 'login', user: 'default-user' },
                            { type: 'follow-list', list: 'default-list' },
                            {
                                type: 'login',
                                user: 'two@user.com',
                                createProfile: true,
                            },

                            {
                                type: 'list-entries',
                                list: 'default-list',
                                pages: ['new.com/one'],
                            },
                            {
                                type: 'create-annotation',
                                page: 'new.com/one',
                                list: 'default-list',
                                createdId: 'first',
                            },
                            {
                                type: 'create-annotation',
                                page: 'new.com/one',
                                list: 'default-list',
                                createdId: 'second',
                            },
                            {
                                type: 'reply',
                                createdAnnotation: 'first',
                                list: 'default-list',
                            },
                            {
                                type: 'reply',
                                createdAnnotation: 'second',
                                list: 'default-list',
                            },
                            { type: 'login', user: 'default-user' },
                        ],
                    }),
            },
            steps: [
                // step({
                //     name: 'load-more-replies',
                //     target: 'HomeFeedPage',
                //     eventName: 'toggleListEntryActivityAnnotations',
                //     eventArgs: {
                //         groupId: 'act-1',
                //         listReference: { type: 'shared-list-reference', id: 'default-list' },
                //         listEntryReference: { type: 'shared-list-entry-reference', id:  },
                //     }
                // })
            ],
        }),
    ),
    'list-item-without-replies': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: { route: 'homeFeed', params: {} },
            setup: {
                execute: (context) =>
                    setupTestActivities({
                        ...context,
                        script: [
                            { type: 'login', user: 'default-user' },
                            { type: 'follow-list', list: 'default-list' },
                            {
                                type: 'login',
                                user: 'two@user.com',
                                createProfile: true,
                            },
                            {
                                type: 'list-entries',
                                list: 'default-list',
                                pages: [
                                    'new.com/one',
                                    'new.com/two',
                                    'new.com/three',
                                ],
                            },
                            {
                                type: 'create-annotation',
                                page: 'new.com/one',
                                list: 'default-list',
                                createdId: 'first',
                            },
                            { type: 'login', user: 'default-user' },
                        ],
                    }),
            },
            steps: [],
        }),
    ),
    'new-note-from-follower': scenario<Targets>(
        ({ step, callModification }) => ({
            fixture: 'annotated-list-with-user',
            authenticated: true,
            startRoute: { route: 'homeFeed', params: {} },
            setup: {
                execute: (context) =>
                    setupTestActivities({
                        ...context,
                        script: [
                            { type: 'login', user: 'default-user' },
                            { type: 'follow-list', list: 'default-list' },
                            { type: 'create-page-info', page: 'new-note.com' },
                            {
                                type: 'list-entries',
                                list: 'default-list',
                                pages: ['new-note.com'],
                            },
                            {
                                type: 'login',
                                user: 'two@user.com',
                                createProfile: true,
                            },
                            { type: 'follow-list', list: 'default-list' },
                            {
                                type: 'create-annotation',
                                page: 'new-note.com',
                                list: 'default-list',
                                createdId: 'first',
                            },
                            {
                                type: 'create-annotation',
                                page: 'new-note.com',
                                list: 'default-list',
                                createdId: 'second',
                            },
                            { type: 'login', user: 'default-user' },
                        ],
                    }),
            },
            steps: [],
        }),
    ),
    'new-note-after-note': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        authenticated: true,
        startRoute: { route: 'homeFeed', params: {} },
        setup: {
            execute: (context) =>
                setupTestActivities({
                    ...context,
                    script: [
                        { type: 'login', user: 'default-user' },
                        { type: 'follow-list', list: 'default-list' },
                        { type: 'create-page-info', page: 'new-note.com' },
                        {
                            type: 'list-entries',
                            list: 'default-list',
                            pages: ['new-note.com'],
                        },
                        {
                            type: 'create-annotation',
                            page: 'new-note.com',
                            list: 'default-list',
                            createdId: 'first',
                        },
                        {
                            type: 'login',
                            user: 'two@user.com',
                            createProfile: true,
                        },
                        { type: 'follow-list', list: 'default-list' },
                        {
                            type: 'create-annotation',
                            page: 'new-note.com',
                            list: 'default-list',
                            createdId: 'second',
                        },
                        { type: 'login', user: 'default-user' },
                        {
                            type: 'create-annotation',
                            page: 'new-note.com',
                            list: 'default-list',
                            createdId: 'third',
                        },
                        {
                            type: 'login',
                            user: 'two@user.com',
                        },
                    ],
                }),
        },
        steps: [],
    })),
    'new-note-after-reply': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        authenticated: true,
        startRoute: { route: 'homeFeed', params: {} },
        setup: {
            execute: (context) =>
                setupTestActivities({
                    ...context,
                    script: [
                        { type: 'login', user: 'default-user' },
                        { type: 'follow-list', list: 'default-list' },
                        { type: 'create-page-info', page: 'new-note.com' },
                        {
                            type: 'list-entries',
                            list: 'default-list',
                            pages: ['new-note.com'],
                        },
                        {
                            type: 'create-annotation',
                            page: 'new-note.com',
                            list: 'default-list',
                            createdId: 'first',
                        },
                        {
                            type: 'login',
                            user: 'two@user.com',
                            createProfile: true,
                        },
                        { type: 'follow-list', list: 'default-list' },
                        {
                            type: 'reply',
                            createdAnnotation: 'first',
                            list: 'default-list',
                        },
                        { type: 'login', user: 'default-user' },
                        {
                            type: 'create-annotation',
                            page: 'new-note.com',
                            list: 'default-list',
                            createdId: 'second',
                        },
                        {
                            type: 'login',
                            user: 'two@user.com',
                        },
                    ],
                }),
        },
        steps: [],
    })),
    'no-activities': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        authenticated: true,
        startRoute: { route: 'homeFeed', params: {} },
        steps: [],
    })),
    unauthenticated: scenario<Targets>(({ step, callModification }) => ({
        authenticated: false,
        startRoute: { route: 'homeFeed', params: {} },
        steps: [],
    })),
}
