import { History } from "history";
import { RouteMap, RouteName } from "../routes"
import { AuthService } from "./auth/types";
const Routes = require('routes')

export default class RouterService {
    private router: any = new Routes()

    constructor(private options: { history: History, routes: RouteMap, auth: AuthService }) {
        const byRoute: { [path: string]: { route?: string, authDependentRoutes?: { true?: string, false?: string } } } = {}
        const resolver = (path: string) => {
            return () => {
                const routeEntry = byRoute[path]
                if (routeEntry.authDependentRoutes) {
                    const isAuthenticated = !!options.auth.getCurrentUser()
                    return routeEntry.authDependentRoutes[isAuthenticated ? 'true' : 'false']
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
                routeEntry.authDependentRoutes = routeEntry.authDependentRoutes || {}
                routeEntry.authDependentRoutes[route.ifAuth ? 'true' : 'false'] = name
            } else {
                routeEntry.route = name
            }
        }
    }

    goTo(route: RouteName, params: { [key: string]: string } = {}, options?: {}) {
        this.options.history.push(this.getUrl(route, params))
    }

    getUrl(route: RouteName, params: { [key: string]: string } = {}, options?: {}): string {
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

    matchCurrentUrl(): { route: RouteName, params: { [key: string]: string } } {
        const parsed = this.matchUrl(window.location.href)
        if (!parsed) {
            throw new Error(`Tried to parse current URL, both are no routes matching current URL`)
        }
        return parsed
    }

    matchUrl(url: string): { route: RouteName, params: { [key: string]: string } } | null {
        const urlObject = new URL(url)

        const match = this.router.match(urlObject.pathname)
        if (!match) {
            return null
        }
        return { route: match.fn(), params: match.params }
    }
}
