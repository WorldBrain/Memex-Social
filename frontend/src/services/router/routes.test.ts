import Routes from './routes'
import { RouteMap, Route } from '../../routes'
import expect from 'expect'

const TEST_ROUTES: { [routeName: string]: Route } = {
    testA: { ifAuth: true, path: [] },
    testB: { ifAuth: false, path: [] },
    testC: { path: [{ literal: 'test' }] },
    testD: { path: [{ literal: 'foo' }, { placeholder: 'id' }] },
    testE: {
        path: [
            { literal: 'bar' },
            { placeholder: 'id' },
            {
                optional: [{ literal: 'spam' }, { placeholder: 'spamId' }],
            },
        ],
    },
}

function testResolve(options: {
    routeMap: { [routeName: string]: Route }
    authenticated: boolean
    path: string
    expected: { route: string; params: { [key: string]: string } }
}) {
    const routes = new Routes({
        routes: options.routeMap as any,
        isAuthenticated: () => options.authenticated,
    })
    const actual = routes.matchUrl(options.path)
    expect(actual).toEqual(options.expected)
}

describe('Routes', () => {
    it('should resolve root URLs requiring authentication', () => {
        testResolve({
            routeMap: TEST_ROUTES,
            authenticated: true,
            path: '/',
            expected: {
                route: 'testA',
                params: {},
            },
        })
    })
    it('should resolve root URLs not requiring authentication', () => {
        testResolve({
            routeMap: TEST_ROUTES,
            authenticated: false,
            path: '/',
            expected: {
                route: 'testB',
                params: {},
            },
        })
    })
    it('should resolve URLs containing only one literal', () => {
        testResolve({
            routeMap: TEST_ROUTES,
            authenticated: false,
            path: '/test',
            expected: {
                route: 'testC',
                params: {},
            },
        })
    })
    it('should resolve URLs containing a literal and a placeholder', () => {
        testResolve({
            routeMap: TEST_ROUTES,
            authenticated: false,
            path: '/foo/123',
            expected: {
                route: 'testD',
                params: { id: '123' },
            },
        })
        testResolve({
            routeMap: TEST_ROUTES,
            authenticated: false,
            path: '/bar/123',
            expected: {
                route: 'testE',
                params: { id: '123' },
            },
        })
    })
    it('should resolve URLs containing a literal, a placeholder and an optional literal and placeholder', () => {
        testResolve({
            routeMap: TEST_ROUTES,
            authenticated: false,
            path: '/bar/123',
            expected: {
                route: 'testE',
                params: { id: '123' },
            },
        })
        testResolve({
            routeMap: TEST_ROUTES,
            authenticated: false,
            path: '/bar/123/spam/456',
            expected: {
                route: 'testE',
                params: { id: '123', spamId: '456' },
            },
        })
    })

    // it('should reverse URLs', () => {

    // })

    // it('should get React route patterns', () => {

    // })
})
