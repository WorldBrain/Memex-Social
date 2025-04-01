import queryString from 'query-string'
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'

import { EventHandlers } from './classes/events'

import ROUTES from '../routes'
import NotFound from './pages/not-found'
import LandingPage from './pages/landing-page'
import PageLinkCreationPage from '../features/content-sharing/ui/pages/page-links'
import CollectionDetailsPage from '../features/content-sharing/ui/pages/collection-details'
import AnnotationDetailsPage from '../features/content-sharing/ui/pages/annotation-details'
import PageDetailsPage from '../features/content-sharing/ui/pages/page-details'
import HomeFeedPage from '../features/activity-streams/ui/pages/home-feed'
import { getReactRoutePattern } from '../services/router/routes'
import { ContentSharingQueryParams } from '../features/content-sharing/types'
import { ReaderPageView } from '../features/reader/ui'
import type { UIRunnerOptions } from './types'
import LoginOrSignupPage from '../features/content-sharing/ui/pages/login-or-signup'
import TutorialsPage from '../features/content-sharing/ui/pages/tutorials'
import OAuthCallbackPage from '../features/content-sharing/ui/pages/oauth-callback'
import Dashboard from '../dashboard'
import { normalizeUrl } from '@worldbrain/memex-url-utils/lib/normalize'

interface Props extends UIRunnerOptions {}
export default class RoutesComponent extends React.Component<Props> {
    private eventHandlers = new EventHandlers()

    componentDidMount() {
        this.eventHandlers.subscribeTo(
            this.props.services.auth.events,
            'changed',
            () => this.forceUpdate(),
        )
    }

    componentWillUnmount() {
        this.eventHandlers.unsubscribeAll()
    }

    render() {
        const { serverModules } = this.props.storage
        const route = this.props.history.location
        console.log('route', route)
        const queryParams = new URLSearchParams(route.search)

        // Extract IDs from the path
        const pathParts = route.pathname.split('/')
        const listId = pathParts[2] || '' // after /c/
        const entryId = pathParts[4] || '' // after /p/
        const noteId = pathParts[6] || '' // after /a/
        return (
            <BrowserRouter>
                <Routes>
                    <Route
                        path={getReactRoutePattern(ROUTES.landingPage.path)}
                        Component={() => {
                            return (
                                <LandingPage
                                    storage={serverModules}
                                    services={this.props.services}
                                    generateServerId={
                                        this.props.generateServerId
                                    }
                                    getRootElement={this.props.getRootElement}
                                />
                            )
                        }}
                    />
                    <Route
                        path={getReactRoutePattern(ROUTES.homeFeed.path)}
                        Component={() => {
                            return (
                                <HomeFeedPage
                                    services={this.props.services}
                                    storage={serverModules}
                                    getRootElement={this.props.getRootElement}
                                />
                            )
                        }}
                    />
                    <Route
                        path={getReactRoutePattern(
                            ROUTES.pageLinkCreation.path,
                        )}
                        Component={() => {
                            return (
                                <PageLinkCreationPage
                                    services={this.props.services}
                                    storage={this.props.storage.serverModules}
                                    generateServerId={
                                        this.props.generateServerId
                                    }
                                    fullPageUrl={queryParams.get('url')}
                                    getRootElement={this.props.getRootElement}
                                />
                            )
                        }}
                    />
                    <Route
                        path={getReactRoutePattern(ROUTES.pageView.path)}
                        Component={() => {
                            const query = queryString.parse(
                                route.search,
                            ) as ContentSharingQueryParams
                            return (
                                <ReaderPageView
                                    services={this.props.services}
                                    listID={listId}
                                    entryID={entryId}
                                    noteId={noteId}
                                    storage={this.props.storage.serverModules}
                                    storageManager={
                                        this.props.storage.serverStorageManager
                                    }
                                    query={query}
                                    normalizeUrl={normalizeUrl}
                                    generateServerId={
                                        this.props.generateServerId
                                    }
                                    pdfBlob={route.state?.pdfBlob}
                                    imageSupport={this.props.imageSupport}
                                    getRootElement={this.props.getRootElement}
                                />
                            )
                        }}
                    />
                    <Route
                        path={getReactRoutePattern(ROUTES.dashboard.path)}
                        Component={() => {
                            return (
                                <Dashboard
                                    listID={listId}
                                    entryID={entryId}
                                    noteId={noteId}
                                    services={this.props.services}
                                    storage={serverModules}
                                    imageSupport={this.props.imageSupport}
                                    getRootElement={this.props.getRootElement}
                                    storageManager={
                                        this.props.storage.serverStorageManager
                                    }
                                    normalizeUrl={normalizeUrl}
                                    generateServerId={
                                        this.props.generateServerId
                                    }
                                    pdfBlob={route.state?.pdfBlob}
                                    query={route}
                                />

                                // <CollectionDetailsPage
                                //     listID={route.match.params.id}
                                //     entryID={route.match.params.entryId}
                                //     noteId={route.match.params.noteId}
                                //     services={this.props.services}
                                //     storageManager={
                                //         this.props.storage.serverStorageManager
                                //     }
                                //     storage={serverModules}
                                //     query={query}
                                //     imageSupport={this.props.imageSupport}
                                //     getRootElement={this.props.getRootElement}
                                // />
                            )
                        }}
                    />
                    <Route
                        path={getReactRoutePattern(
                            ROUTES.collectionDetails.path,
                        )}
                        Component={() => {
                            return (
                                // <Dashboard
                                //     listID={route.match.params.id}
                                //     entryID={route.match.params.entryId}
                                //     services={this.props.services}
                                //     storage={serverModules}
                                //     imageSupport={this.props.imageSupport}
                                //     getRootElement={this.props.getRootElement}
                                //     storageManager={
                                //         this.props.storage.serverStorageManager
                                //     }
                                // />

                                <CollectionDetailsPage
                                    listID={listId}
                                    entryID={entryId}
                                    services={this.props.services}
                                    storageManager={
                                        this.props.storage.serverStorageManager
                                    }
                                    storage={serverModules}
                                    query={route}
                                    imageSupport={this.props.imageSupport}
                                    getRootElement={this.props.getRootElement}
                                />
                            )
                        }}
                    />
                    <Route
                        path={getReactRoutePattern(ROUTES.pageDetails.path)}
                        Component={() => {
                            return (
                                <PageDetailsPage
                                    pageID={entryId}
                                    services={this.props.services}
                                    storage={serverModules}
                                    userManagement={serverModules.users}
                                    imageSupport={this.props.imageSupport}
                                    getRootElement={this.props.getRootElement}
                                    users={{}}
                                />
                            )
                        }}
                    />
                    <Route
                        path={getReactRoutePattern(
                            ROUTES.annotationDetails.path,
                        )}
                        Component={() => {
                            return (
                                <AnnotationDetailsPage
                                    annotationID={noteId}
                                    services={this.props.services}
                                    storage={serverModules}
                                    getRootElement={this.props.getRootElement}
                                    imageSupport={this.props.imageSupport}
                                />
                            )
                        }}
                    />
                    <Route
                        path={getReactRoutePattern(
                            ROUTES.loginOrSignupPage.path,
                        )}
                        Component={(route) => {
                            return (
                                <LoginOrSignupPage
                                    services={this.props.services}
                                    storage={serverModules}
                                    getRootElement={this.props.getRootElement}
                                />
                            )
                        }}
                    />
                    <Route
                        path={getReactRoutePattern(ROUTES.tutorials.path)}
                        Component={() => {
                            const tutorialId = queryParams.get('id')
                            return (
                                <TutorialsPage
                                    services={this.props.services}
                                    storage={serverModules}
                                    getRootElement={this.props.getRootElement}
                                    tutorialId={tutorialId as string}
                                />
                            )
                        }}
                    />
                    <Route
                        path={getReactRoutePattern(ROUTES.oauthCallback.path)}
                        Component={(route) => {
                            return (
                                <OAuthCallbackPage
                                    services={this.props.services}
                                    storage={serverModules}
                                    getRootElement={this.props.getRootElement}
                                />
                            )
                        }}
                    />
                    <Route Component={NotFound} />
                </Routes>
            </BrowserRouter>
        )
    }
}
