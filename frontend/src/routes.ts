export type RouteName =
    | 'landingPage'
    | 'userHome'
    | 'pageView'
    | 'collectionDetails'
    | 'pageDetails'
    | 'annotationDetails'
    | 'homeFeed'
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
            { literal: 'c' },
            { placeholder: 'id' },
            { literal: 'p' },
            { placeholder: 'entryId' },
        ],
    },
    collectionDetails: {
        path: [{ literal: 'c' }, { placeholder: 'id' }],
    },
    pageDetails: { path: [{ literal: 'p' }, { placeholder: 'id' }] },
    annotationDetails: { path: [{ literal: 'a' }, { placeholder: 'id' }] },
}

export default ROUTES
