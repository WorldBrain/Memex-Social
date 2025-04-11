export type RouteName =
    | 'landingPage'
    | 'userHome'
    | 'pageView'
    | 'collectionDetails'
    | 'dashboard'
    | 'pageDetails'
    | 'annotationDetails'
    | 'homeFeed'
    | 'pageLinkCreation'
    | 'loginOrSignupPage'
    | 'tutorials'
    | 'oauthCallback'

export type RouteMap = { [Name in RouteName]: Route }
export interface Route {
    path: RoutePart[]
    ifAuth?: boolean
}
export type RoutePart = SimpleRoutePart | { optional: SimpleRoutePart[] }
export type SimpleRoutePart = { literal: string } | { placeholder: string }

const ROUTES: RouteMap = {
    landingPage: {
        path: [],
        ifAuth: false,
    },
    userHome: { path: [], ifAuth: true },
    homeFeed: { path: [{ literal: 'feed' }] },
    pageView: {
        path: [
            // { literal: 'c' },
            // { placeholder: 'id' },
            // { literal: 'p' },
            // { placeholder: 'entryId' },
            // { optional: [{ literal: 'a' }, { placeholder: 'noteId' }] },
        ],
    },
    dashboard: {
        path: [
            { literal: 'd' },
            { optional: [{ placeholder: 'id' }] },
            {
                optional: [
                    { literal: 'p' },
                    { placeholder: 'entryId' },
                    { literal: 'a' },
                    { placeholder: 'noteId' },
                ],
            },
        ],
    },
    collectionDetails: {
        path: [
            { literal: 'c' },
            { placeholder: 'id' },
            {
                optional: [
                    { literal: 'p' },
                    { placeholder: 'entryId' },
                    { literal: 'a' },
                    { placeholder: 'noteId' },
                ],
            },
        ],
    },
    pageDetails: { path: [{ literal: 'p' }, { placeholder: 'id' }] },
    annotationDetails: { path: [{ literal: 'a' }, { placeholder: 'id' }] },
    pageLinkCreation: { path: [{ literal: 'new' }] },
    loginOrSignupPage: { path: [{ literal: 'auth' }] },
    tutorials: { path: [{ literal: 'tutorials' }] },
    oauthCallback: { path: [{ literal: 'oauth' }, { literal: 'callback' }] },
}

export default ROUTES
