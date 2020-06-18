import React from 'react';
import { Storage } from '../../../storage/types';
import { UIElement, UIElementServices } from '../../classes';
import PageLoadingIndictor from '../../components/page-loading-indicator';
import ActionPageHeader from '../../components/action-page-header';
import PageContent from '../../components/page-content';
import MainListElement from '../../components/main-list-element';
import RouteLink from '../../components/route-link';
import { shouldTranslate } from '../../../utils/translation';
import Logic, { State, Event } from './logic';

interface Props {
    storage : Storage
    services : UIElementServices<'auth' | 'router'>
}

export default class UserHome extends UIElement<Props, State, Event> {
    constructor(props : Props) {
        super(props, { logic: new Logic(props) })
    }

    renderOverview() {
        return (<div className={this.styles.pageSection}>
            <div className={this.styles.pageSectionTop}>
                <div className={this.styles.pageSectionTitle}>What I'm following</div>
                {this.state.userRights && this.state.userRights.canCreateProjects && <div
                    className={this.styles.createNewProjectButton}
                    onClick={() => this.processEvent('requestCreateProject', {})}
                >
                    Create new page
                </div>}
            </div>
            <div className={this.styles.pageSectionContent}>
            {this.state.projectsFollowing && <React.Fragment>
                {this.state.projectsFollowing.length >= 1 && this.state.projectsFollowing.map(project =>
                    <MainListElement
                        key={project.id}
                        services={this.props.services}
                        title={
                            <RouteLink
                                services={this.props.services}
                                className={this.styles.projectLink}
                                route='projectHome'
                                params={{slug: project.slug}}
                            >
                                {project.name}
                            </RouteLink>
                        }>
                            {project.shortDescription}
                    </MainListElement>
                )}
                {!this.state.projectsFollowing.length && "You're not following anything yet"}
            </React.Fragment>}
            </div>
        </div>)
    }

    renderContent() {
        let content : React.ReactNode
        if (this.state.loadState === 'running') {
            content = (
                <div className={this.styles.pageSection}>
                    <PageLoadingIndictor />
                </div>
            )
        } else {
            content = this.renderOverview()
        }

        return (<PageContent services={this.props.services}>
            {content}
        </PageContent>)
    }

    render() {
        const user = this.props.services.auth.getCurrentUser()
        if (!user) {
            throw new Error('User home activated without active user')
        }
        if (!user.displayName) {
            throw new Error('User has no display name')
        }
        if (!user.picture) {
            throw new Error('User has no profile picture')
        }

        return (
            <div className={this.styles.container}>
                <ActionPageHeader
                    services={this.props.services}
                    title={user.displayName}
                    imageUrl={user.picture}
                    actions={
                        <React.Fragment>
                            <div className={this.styles.accountSettingsButton}
                                onClick={() => this.processEvent('requestAccountSettings', {})}
                            >
                                {shouldTranslate('Account settings')}
                            </div>
                        </React.Fragment>
                    }
                />
                {this.renderContent()}
            </div>
        )
    }
}
