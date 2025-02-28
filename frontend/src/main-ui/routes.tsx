import queryString from 'query-string'
import React from 'react'
import { Router, Route, Switch } from 'react-router'

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
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import type { UIRunnerOptions } from './types'
import LoginOrSignupPage from '../features/content-sharing/ui/pages/login-or-signup'
import TutorialsPage from '../features/content-sharing/ui/pages/tutorials'
import OAuthCallbackPage from '../features/content-sharing/ui/pages/oauth-callback'

interface Props extends UIRunnerOptions {}
export default class Routes extends React.Component<Props> {
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
        return (
            <Router history={this.props.history}>
                <Switch>
                    <Route
                        exact
                        path={getReactRoutePattern(ROUTES.landingPage.path)}
                        render={() => {
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
                        exact
                        path={getReactRoutePattern(ROUTES.homeFeed.path)}
                        render={() => {
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
                        exact
                        path={getReactRoutePattern(
                            ROUTES.pageLinkCreation.path,
                        )}
                        render={(route) => {
                            const queryParams = new URLSearchParams(
                                route.location.search,
                            )
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
                        exact
                        path={getReactRoutePattern(ROUTES.pageView.path)}
                        render={(route) => {
                            const query = queryString.parse(
                                route.location.search,
                            ) as ContentSharingQueryParams
                            return (
                                <ReaderPageView
                                    query={query}
                                    normalizeUrl={normalizeUrl}
                                    services={this.props.services}
                                    listID={route.match.params.id}
                                    entryID={route.match.params.entryId}
                                    noteId={route.match.params.noteId}
                                    storage={this.props.storage.serverModules}
                                    storageManager={
                                        this.props.storage.serverStorageManager
                                    }
                                    generateServerId={
                                        this.props.generateServerId
                                    }
                                    pdfBlob={route.location.state?.pdfBlob}
                                    imageSupport={this.props.imageSupport}
                                    getRootElement={this.props.getRootElement}
                                />
                            )
                        }}
                    />
                    <Route
                        exact
                        path={getReactRoutePattern(
                            ROUTES.collectionDetails.path,
                        )}
                        render={(route) => {
                            const query = queryString.parse(
                                route.location.search,
                            ) as ContentSharingQueryParams
                            return (
                                <CollectionDetailsPage
                                    listID={route.match.params.id}
                                    entryID={route.match.params.entryId}
                                    services={this.props.services}
                                    storageManager={
                                        this.props.storage.serverStorageManager
                                    }
                                    storage={serverModules}
                                    query={query}
                                    imageSupport={this.props.imageSupport}
                                    getRootElement={this.props.getRootElement}
                                />
                            )
                        }}
                    />
                    <Route
                        exact
                        path={getReactRoutePattern(ROUTES.pageDetails.path)}
                        render={(route) => {
                            return (
                                <PageDetailsPage
                                    pageID={route.match.params.id}
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
                        exact
                        path={getReactRoutePattern(
                            ROUTES.annotationDetails.path,
                        )}
                        render={(route) => {
                            return (
                                <AnnotationDetailsPage
                                    annotationID={route.match.params.id}
                                    services={this.props.services}
                                    storage={serverModules}
                                    getRootElement={this.props.getRootElement}
                                    imageSupport={this.props.imageSupport}
                                />
                            )
                        }}
                    />
                    <Route
                        exact
                        path={getReactRoutePattern(
                            ROUTES.loginOrSignupPage.path,
                        )}
                        render={(route) => {
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
                        exact
                        path={getReactRoutePattern(ROUTES.tutorials.path)}
                        render={(route) => {
                            const queryParams = queryString.parse(
                                route.location.search,
                            )
                            const tutorialId = queryParams.id

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
                        exact
                        path={getReactRoutePattern(ROUTES.oauthCallback.path)}
                        render={(route) => {
                            return (
                                <OAuthCallbackPage
                                    services={this.props.services}
                                    storage={serverModules}
                                    getRootElement={this.props.getRootElement}
                                />
                            )
                        }}
                    />
                    <Route component={NotFound} />
                </Switch>
            </Router>
        )
    }
}
