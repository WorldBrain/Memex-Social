export type RouteName =
    | 'landingPage'
    | 'userHome'
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
        path: [{ literal: '/' }],
        ifAuth: false,
    },
    userHome: { path: [{ literal: '/' }], ifAuth: true },
    homeFeed: { path: [{ literal: '/feed' }] },
    collectionDetails: {
        path: [
            { literal: '/c/' },
            { placeholder: 'id' },
            {
                optional: [{ literal: '/p/' }, { placeholder: 'entryId' }],
            },
        ],
    },
    pageDetails: { path: [{ literal: '/p/' }, { placeholder: 'id' }] },
    annotationDetails: { path: [{ literal: '/a/' }, { placeholder: 'id' }] },
}

export default ROUTES
