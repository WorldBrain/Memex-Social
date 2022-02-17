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
        routeName: RouteName,
        routeParams: { [key: string]: string } = {},
        options?: {},
    ): string {
        const route = this.options.routes[routeName]
        if (!route.path.length) {
            return '/'
        }
        const groups = getRoutePartGroups(route.path)
        const urlParts: string[] = ['']
        for (const group of groups) {
            const groupParts: string[] = []
            let undefinedPlaceholderFound: string | undefined
            for (const part of group.parts) {
                if ('placeholder' in part) {
                    const value = routeParams[part.placeholder]
                    if (value) {
                        groupParts.push(value)
                    } else {
                        undefinedPlaceholderFound = part.placeholder
                    }
                } else if ('literal' in part) {
                    groupParts.push(part.literal)
                }
            }
            if (undefinedPlaceholderFound) {
                if (!group.optional) {
                    throw new Error(
                        `Tried to reverse URL '${routeName}', but couldn't find needed parameter '${undefinedPlaceholderFound}'`,
                    )
                }
            } else {
                urlParts.push(...groupParts)
            }
        }
        return urlParts.join('/')
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
        }
        return null
    }
}

export function getReactRoutePattern(routeParts: RoutePart[]): string {
    if (!routeParts.length) {
        return '/'
    }

    const groups = getRoutePartGroups(routeParts)
    const patternParts: string[] = ['']
    for (const group of groups) {
        for (const part of group.parts) {
            const suffix = group.optional ? '?' : ''
            if ('literal' in part) {
                patternParts.push(`${part.literal}${suffix}`)
            } else if ('placeholder' in part) {
                patternParts.push(`:${part.placeholder}${suffix}`)
            }
        }
    }
    return patternParts.join('/')
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
