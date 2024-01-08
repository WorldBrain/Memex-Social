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
        super(props, {
            logic: new Logic({
                ...props,
                windowObj: globalThis.window,
            }),
        })
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
                {this.state.loadState === 'success' && (
                    <>
                        <MainText>Preparing conversation</MainText>
                        <SubText>Just a moment 🤙🏻</SubText>
                    </>
                )}
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
    grid-gap: 10px;
    align-items: center;
    justify-content: center;
`

const MainText = styled.div`
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
    font-size: 3.5rem;
    font-weight: 900;
    @media (max-width: 1200px) {
        font-size: 3rem;
    }

    @media (max-width: 992px) {
        font-size: 2.5rem;
    }

    @media (max-width: 768px) {
        font-size: 2rem;
    }

    @media (max-width: 576px) {
        font-size: 1.5rem;
    }
`
const SubText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    margin-bottom: 40px;
    font-size: 20px;

    @media (max-width: 1200px) {
        font-size: 20px;
    }

    @media (max-width: 992px) {
        font-size: 18px;
    }

    @media (max-width: 768px) {
        font-size: 16px;
    }

    @media (max-width: 576px) {
        font-size: 16px;
    }
`
