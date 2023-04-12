import React from 'react'
import styled from 'styled-components'
import type { ViewportBreakpoint } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { getViewportBreakpoint } from '@worldbrain/memex-common/lib/common-ui/styles/utils'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import ErrorBox from '../../../../../common-ui/components/error-box'
import DefaultPageLayout from '../../../../../common-ui/layouts/default-page-layout'
import { UIElement } from '../../../../../main-ui/classes'
import Logic, { PageLinkCreationState } from './logic'
import type {
    PageLinkCreationPageDependencies,
    PageLinkCreationPageEvent,
} from './types'

export interface Props extends PageLinkCreationPageDependencies {}

export default class PageLinkCreationPage extends UIElement<
    Props,
    PageLinkCreationState,
    PageLinkCreationPageEvent
> {
    constructor(props: Props) {
        super(props, { logic: new Logic(props) })
    }

    private get viewportBreakpoint(): ViewportBreakpoint {
        return getViewportBreakpoint(this.getViewportWidth())
    }

    private renderMainContent() {
        if (this.state.linkCreationState === 'error') {
            return (
                <ErrorBox>
                    An error was encountered when attempting to create your page
                    link
                </ErrorBox>
            )
        }
        if (this.state.needsAuth) {
            return <ErrorBox>You need to log in to create a page link</ErrorBox>
        }

        return (
            <MainContainer>
                <MainText>Going to create page link for:</MainText>
                <MainText>{this.props.fullPageUrl}</MainText>
                <LoadingIndicator />
            </MainContainer>
        )
    }

    render() {
        return (
            <DefaultPageLayout
                services={this.props.services}
                storage={this.props.storage}
                viewportBreakpoint={this.viewportBreakpoint}
            >
                {this.renderMainContent()}
            </DefaultPageLayout>
        )
    }
}

const MainContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const MainText = styled.div`
    color: white;
`
