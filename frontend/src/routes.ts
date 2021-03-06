export type RouteName =
    | 'landingPage'
    | 'userHome'
    | 'collectionDetails'
    | 'pageDetails'
    | 'annotationDetails'
    | 'homeFeed'
export type RouteMap = { [Name in RouteName]: Route }
export interface Route {
    path: string
    ifAuth?: boolean
}

const ROUTES: RouteMap = {
    landingPage: { path: '/', ifAuth: false },
    userHome: { path: '/', ifAuth: true },
    homeFeed: { path: '/feed' },
    collectionDetails: { path: '/c/:id' },
    pageDetails: { path: '/p/:id' },
    annotationDetails: { path: '/a/:id' },
}

export default ROUTES
