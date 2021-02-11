import { ScenarioMap } from "../../services/scenarios/types";
import { scenario } from "../../services/scenarios/utils";
import { HomeFeedEvent, HomeFeedSignal } from "../../features/activity-streams/ui/pages/home-feed/types";
import { setupTestActivities } from "../../scenario-utils/activities";

type Targets = {
    HomeFeedPage: {
        events: HomeFeedEvent;
        signals: HomeFeedSignal;
    };
};


export const SCENARIOS: ScenarioMap<Targets> = {
    'default': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'homeFeed', params: {} },
        setup: {
            execute: setupTestActivities,
        },
        steps: []
    })),
    'bump-seen-replies': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        startRoute: { route: 'homeFeed', params: {} },
        setup: {
            execute: context => setupTestActivities({
                ...context,
                script: [
                    { type: 'login', user: 'default-user' },
                    { type: 'reply', annotation: 'default-annotation' },
                    { type: 'reply', annotation: 'default-annotation' },
                    { type: 'follow-annotation', annotation: 'default-annotation' },
                    { type: 'follow-annotation', annotation: 'second-annotation' },
                    { type: 'login', user: 'two@user.com', createProfile: true },
                    { type: 'reply', annotation: 'default-annotation' },
                    { type: 'reply', annotation: 'second-annotation' },
                    { type: 'home-feed-timestamp', user: 'default-user', time: '$now' },
                    // this reply should bump the group for the default annotation above the seen line
                    { type: 'reply', annotation: 'default-annotation' },
                    { type: 'login', user: 'default-user' },
                    // { type: 'reply', page: 'notion.so', annotation: 'third-annotation' },
                    // { type: 'reply', page: 'new.com/one', createdAnnotation: 'first' },
                ]
            }),
        },
        steps: []
    })),
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
                    annotationReference: { type: 'shared-annotation-reference', id: 'third-annotation' }
                }
            })
        ]
    })),
    'no-activities': scenario<Targets>(({ step, callModification }) => ({
        fixture: 'annotated-list-with-user',
        authenticated: true,
        startRoute: { route: 'homeFeed', params: {} },
        steps: []
    })),
    'unauthenticated': scenario<Targets>(({ step, callModification }) => ({
        authenticated: false,
        startRoute: { route: 'homeFeed', params: {} },
        steps: []
    })),
}
