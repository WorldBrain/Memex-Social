import { History } from 'history'
import { RouteMap, RouteName } from '../../routes'
import { AuthService } from '../auth/types'
import Routes from './routes'
import { ProgramQueryParams } from '../../setup/types'

export default class RouterService {
    private routes: Routes
    private blockLeaveMessage: string | null = null

    constructor(
        private options: {
            history: History
            routes: RouteMap
            auth: AuthService
            queryParams: ProgramQueryParams
            setBeforeLeaveHandler(handler: null | (() => string)): void
        },
    ) {
        this.routes = new Routes({
            routes: options.routes,
            isAuthenticated: () => !!options.auth.getCurrentUser(),
        })
    }

    goTo(
        route: RouteName,
        params: { [key: string]: string } = {},
        options?: {},
    ) {
        this.options.history.push(this.getUrl(route, params))
    }

    goToExternalUrl(url: string) {
        if (typeof window !== 'undefined') {
            window.location.href = url
        }
    }

    getUrl(
        route: RouteName,
        params: { [key: string]: string } = {},
        options?: {},
    ): string {
        return this.routes.getUrl(route, params)
    }

    matchCurrentUrl(): { route: RouteName; params: { [key: string]: string } } {
        const parsed = this.matchUrl(window.location.href)
        if (!parsed) {
            throw new Error(
                `Tried to parse current URL, both are no routes matching current URL`,
            )
        }
        return parsed
    }

    matchUrl(
        url: string,
    ): { route: RouteName; params: { [key: string]: string } } | null {
        return this.routes.matchUrl(url)
    }

    getQueryParam(key: keyof ProgramQueryParams): string | null {
        return this.options.queryParams[key] ?? null
    }

    blockLeave(message: string) {
        if (this.blockLeaveMessage) {
            throw new Error(
                `Tried to block user from leaving, but this is already blocked with this message: ${this.blockLeaveMessage}`,
            )
        }

        this.blockLeaveMessage = message
        this.options.setBeforeLeaveHandler(() => message)
        return () => {
            this.blockLeaveMessage = null
            this.options.setBeforeLeaveHandler(null)
        }
    }
}
