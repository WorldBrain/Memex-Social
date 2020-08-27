import { History } from "history";
import { RouteMap, RouteName } from "../../routes"
import { AuthService } from "../auth/types";
import Routes from "./routes";

export default class RouterService {
    private routes: Routes

    constructor(private options: { history: History, routes: RouteMap, auth: AuthService }) {
        this.routes = new Routes({
            routes: options.routes,
            isAuthenticated: () => !!options.auth.getCurrentUser()
        })
    }

    goTo(route: RouteName, params: { [key: string]: string } = {}, options?: {}) {
        this.options.history.push(this.getUrl(route, params))
    }

    getUrl(route: RouteName, params: { [key: string]: string } = {}, options?: {}): string {
        return this.routes.getUrl(route, params)
    }

    matchCurrentUrl(): { route: RouteName, params: { [key: string]: string } } {
        const parsed = this.matchUrl(window.location.href)
        if (!parsed) {
            throw new Error(`Tried to parse current URL, both are no routes matching current URL`)
        }
        return parsed
    }

    matchUrl(url: string): { route: RouteName, params: { [key: string]: string } } | null {
        return this.routes.matchUrl(url)
    }
}
