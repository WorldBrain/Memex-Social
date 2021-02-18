import { RouteMap, RouteName } from '../../routes'

const RoutesExternal = require('routes')

export default class Routes {
    private router: any = new RoutesExternal()

    constructor(
        private options: { routes: RouteMap; isAuthenticated: () => boolean },
    ) {
        const byRoute: {
            [path: string]: {
                route?: string
                authDependentRoutes?: { true?: string; false?: string }
            }
        } = {}
        const resolver = (path: string) => {
            return () => {
                const routeEntry = byRoute[path]
                if (routeEntry.authDependentRoutes) {
                    const isAuthenticated = options.isAuthenticated()
                    return routeEntry.authDependentRoutes[
                        isAuthenticated ? 'true' : 'false'
                    ]
                } else {
                    return routeEntry.route
                }
            }
        }

        for (const [name, route] of Object.entries(options.routes)) {
            let routeEntry = byRoute[route.path]
            if (!routeEntry) {
                this.router.addRoute(route.path, resolver(route.path))
                routeEntry = byRoute[route.path] = {}
            }
            if (typeof route.ifAuth !== 'undefined') {
                routeEntry.authDependentRoutes =
                    routeEntry.authDependentRoutes || {}
                routeEntry.authDependentRoutes[
                    route.ifAuth ? 'true' : 'false'
                ] = name
            } else {
                routeEntry.route = name
            }
        }
    }

    getUrl(
        route: RouteName,
        params: { [key: string]: string } = {},
        options?: {},
    ): string {
        const routeConfig = this.options.routes[route]
        if (!routeConfig) {
            throw new Error(`No such route ${route}`)
        }

        let url = routeConfig.path
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`:${key}`, value)
        }

        return url
    }

    matchUrl(
        url: string,
    ): { route: RouteName; params: { [key: string]: string } } | null {
        const urlObject = new URL(url)

        const match = this.router.match(urlObject.pathname)
        if (!match) {
            return null
        }
        return { route: match.fn(), params: match.params }
    }
}
