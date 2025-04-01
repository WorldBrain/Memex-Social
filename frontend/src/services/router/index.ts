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
        options?: {
            query?: { [key: string]: string }
            state?: any
        },
    ) {
        this.options.history.push(
            this.getUrl(route, params, options),
            options?.state,
        )
    }

    goToExternalUrl(url: string) {
        if (typeof window !== 'undefined') {
            window.location.href = url
        }
    }

    getUrl(
        route: RouteName,
        params: { [key: string]: string } = {},
        options?: { query?: { [key: string]: string } },
    ): string {
        let url = this.routes.getUrl(route, params)
        if (options?.query) {
            url += '?'
            url += Object.entries(options.query)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join('&')
        }
        return url
    }

    matchCurrentUrl(): { route: RouteName; params: { [key: string]: string } } {
        const parsed = this.matchUrl(
            window.location.origin + this.options.history.location.pathname,
        )
        if (!parsed) {
            throw new Error(
                `Tried to parse current URL, both are no routes matching current URL`,
            )
        }
        return parsed
    }
    getSpaceId() {
        const parts = window.location.pathname.split('/')
        if (parts[1] === 'c') {
            return parts[2]
        }
        return null
    }

    matchUrl(
        url: string,
    ): { route: RouteName; params: { [key: string]: string } } | null {
        return this.routes.matchUrl(url)
    }

    getQueryParam(key: keyof ProgramQueryParams): string | null {
        return this.options.queryParams[key] ?? null
    }

    delQueryParam(key: keyof ProgramQueryParams): void {
        delete this.options.queryParams[key]
        const nextUrl = new URL(window.location.href)
        nextUrl.searchParams.delete(key)
        window.history.replaceState({}, '', nextUrl.href)
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

    replaceRoute(
        route: RouteName,
        params: { [key: string]: string } = {},
        options?: {
            query?: { [key: string]: string }
            state?: any
        },
    ) {
        this.options.history.replace(
            this.getUrl(route, params, options),
            options?.state,
        )
    }
}
