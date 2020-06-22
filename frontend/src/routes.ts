export type RouteName = 'landingPage' | 'userHome' | 'newProject' | 'projectHome' | 'accountSettings'
export type RouteMap = { [Name in RouteName]: Route }
export interface Route {
    path: string,
    ifAuth?: boolean
}

const ROUTES: RouteMap = {
    landingPage: { path: '/', ifAuth: false },
    userHome: { path: '/', ifAuth: true },
    accountSettings: { path: '/account' },
    newProject: { path: '/p/admin/new' },
    projectHome: { path: '/p/:slug' },
}

export default ROUTES
