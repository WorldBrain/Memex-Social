import { RouteMap, RouteName, RoutePart } from '../../routes'

const RoutesExternal = require('routes')

export default class Routes {
    private router: any = new RoutesExternal()

    constructor(
        private options: { routes: RouteMap; isAuthenticated: () => boolean },
    ) {}

    getUrl(
        route: RouteName,
        params: { [key: string]: string } = {},
        options?: {},
    ): string {
        return ''
    }

    matchUrl(
        url: string,
    ): { route: RouteName; params: { [key: string]: string } } | null {
        const urlParts = url.split('/').slice(1)

        const isAuthenticated = this.options.isAuthenticated()
        for (const [routeName, route] of Object.entries(
            this.options.routes,
        ).reverse()) {
            if ('ifAuth' in route && isAuthenticated !== route.ifAuth) {
                continue
            }
            if (urlParts.length > route.path.length + 1) {
                continue
            }

            let match = true
            const params: { [key: string]: string } = {}
            for (const [index, routePart] of route.path.entries()) {
                const urlPart = urlParts[index]
                if ('literal' in routePart) {
                    const stripped = routePart.literal.slice(1) // strip leading slash
                    if (stripped !== urlPart) {
                        match = false
                        break
                    }
                } else if ('placeholder' in routePart) {
                    params[routePart.placeholder] = urlPart
                }
            }
            if (match) {
                return { route: routeName as RouteName, params: {} }
            }

            console.log(urlParts)
            console.log(route.path)
            console.log('-----')
        }
        return null
    }
}

export function getReactRoutePattern(parts: RoutePart[]): string {
    return ''
}
