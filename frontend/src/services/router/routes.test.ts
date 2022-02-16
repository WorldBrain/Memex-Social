import Routes from './routes'
import { RouteMap, Route, RouteName } from '../../routes'
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

function testReverse(options: {
    routeMap: { [routeName: string]: Route }
    routeName: string
    routeParams: { [key: string]: string }
    expected: string
}) {
    const routes = new Routes({
        routes: options.routeMap as any,
        isAuthenticated: () => false,
    })
    const actual = routes.getUrl(
        options.routeName as RouteName,
        options.routeParams,
    )
    expect(actual).toEqual(options.expected)
}

describe('Routes', () => {
    describe('resolving', () => {
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
    })

    describe('reversing', () => {
        it('should reverse root URLs requiring authentication', () => {
            testReverse({
                routeMap: TEST_ROUTES,
                routeName: 'testA',
                routeParams: {},
                expected: '/',
            })
        })
        it('should reverse root URLs not requiring authentication', () => {
            testReverse({
                routeMap: TEST_ROUTES,
                routeName: 'testB',
                routeParams: {},
                expected: '/',
            })
        })
        it('should reverse URLs containing only one literal', () => {
            testReverse({
                routeMap: TEST_ROUTES,
                routeName: 'testC',
                routeParams: {},
                expected: '/test',
            })
        })
        it('should reverse URLs containing a literal and a placeholder', () => {
            testReverse({
                routeMap: TEST_ROUTES,
                routeName: 'testD',
                routeParams: { id: '123' },
                expected: '/foo/123',
            })
        })
        it('should reverse URLs containing a literal, a placeholder and an optional literal and placeholder', () => {
            testReverse({
                routeMap: TEST_ROUTES,
                routeName: 'testE',
                routeParams: { id: '123' },
                expected: '/bar/123',
            })
            testReverse({
                routeMap: TEST_ROUTES,
                routeName: 'testE',
                routeParams: { id: '123', spamId: '456' },
                expected: '/bar/123/spam/456',
            })
        })
    })

    describe('React route patterns', () => {})

    // it('should reverse URLs', () => {

    // })

    // it('should get React route patterns', () => {

    // })
})
