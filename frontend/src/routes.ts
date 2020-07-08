export type RouteName = 'landingPage' | 'userHome' | 'collectionDetails'
export type RouteMap = { [Name in RouteName]: Route }
export interface Route {
    path: string,
    ifAuth?: boolean
}

const ROUTES: RouteMap = {
    landingPage: { path: '/', ifAuth: false },
    userHome: { path: '/', ifAuth: true },
    collectionDetails: { path: '/c/:id' },
}

export default ROUTES
