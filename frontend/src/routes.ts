export type RouteName = 'landingPage' | 'userHome' | 'collectionDetails' | 'annotationDetails'
export type RouteMap = { [Name in RouteName]: Route }
export interface Route {
    path: string,
    ifAuth?: boolean
}

const ROUTES: RouteMap = {
    landingPage: { path: '/', ifAuth: false },
    userHome: { path: '/', ifAuth: true },
    collectionDetails: { path: '/c/:id' },
    annotationDetails: { path: '/a/:id' },
}

export default ROUTES
