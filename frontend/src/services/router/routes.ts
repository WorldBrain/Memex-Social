import { RouteMap, RouteName, RoutePart, SimpleRoutePart } from '../../routes'

const RoutesExternal = require('routes')

interface RoutePartGroup {
    parts: SimpleRoutePart[]
    optional: boolean
}

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
        if (urlParts.length === 1 && !urlParts[0].length) {
            urlParts.splice(0)
        }

        const isAuthenticated = this.options.isAuthenticated()
        for (const [routeName, route] of Object.entries(
            this.options.routes,
        ).reverse()) {
            const partGroups = getRoutePartGroups(route.path)
            // console.log(urlParts)
            // console.log(require('util').inspect(partGroups, { colors: true, depth: 4 }))
            // console.log('-----')

            if ('ifAuth' in route && isAuthenticated !== route.ifAuth) {
                continue
            }

            let urlPartIndex = 0
            const params: { [key: string]: string } = {}
            let match = true
            for (const partGroup of partGroups) {
                for (const routePart of partGroup.parts) {
                    if (urlPartIndex >= urlParts.length) {
                        if (!partGroup.optional) {
                            match = false
                        }
                        break
                    }
                    const urlPart = urlParts[urlPartIndex++]
                    if ('literal' in routePart) {
                        if (urlPart !== routePart.literal) {
                            match = false
                            break
                        }
                    } else if ('placeholder' in routePart) {
                        params[routePart.placeholder] = urlPart
                    }
                }
            }
            if (match) {
                return { route: routeName as RouteName, params }
            }

            // for (const [index, routePart] of route.path.entries()) {
            //     const urlPart = urlParts[index]
            //     if ('literal' in routePart) {
            //         const stripped = routePart.literal.slice(1) // strip leading slash
            //         if (stripped !== urlPart) {
            //             match = false
            //             break
            //         }
            //     } else if ('placeholder' in routePart) {
            //         params[routePart.placeholder] = urlPart
            //     }
            // }
            // if (match) {
            //     return { route: routeName as RouteName, params: {} }
            // }
        }
        return null
    }
}

export function getReactRoutePattern(parts: RoutePart[]): string {
    return ''
}

function getRoutePartGroups(parts: RoutePart[], optional = false) {
    const groups: RoutePartGroup[] = []
    let activeGroup: RoutePartGroup = { optional, parts: [] }
    const closeGroup = () => {
        if (activeGroup.parts.length) {
            groups.push(activeGroup)
            activeGroup = { optional, parts: [] }
        }
    }
    for (const part of parts) {
        if ('optional' in part) {
            closeGroup()
            groups.push(...getRoutePartGroups(part.optional, true))
        } else {
            activeGroup.parts.push(part)
        }
    }
    closeGroup()

    return groups
}
