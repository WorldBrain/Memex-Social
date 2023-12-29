import React from 'react'
import styled from 'styled-components'
import type { ViewportBreakpoint } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { getViewportBreakpoint } from '@worldbrain/memex-common/lib/common-ui/styles/utils'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import ErrorBox from '../../../../../common-ui/components/error-box'
import DefaultPageLayout from '../../../../../common-ui/layouts/default-page-layout'
import { UIElement } from '../../../../../main-ui/classes'
import Logic, { PdfUploadState } from './logic'
import type { PdfUploadPageDependencies, PdfUploadPageEvent } from './types'

export interface Props extends PdfUploadPageDependencies {}

export default class PageLinkCreationPage extends UIElement<
    Props,
    PdfUploadState,
    PdfUploadPageEvent
> {
    constructor(props: Props) {
        super(props, { logic: new Logic(props) })
    }

    private get viewportBreakpoint(): ViewportBreakpoint {
        return getViewportBreakpoint(this.getViewportWidth())
    }

    render() {
        return (
            <DefaultPageLayout
                services={this.props.services}
                storage={this.props.storage}
                viewportBreakpoint={this.viewportBreakpoint}
            >
                <p style={{ color: 'white' }}>Hi</p>
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
    color: ${(props) => props.theme.colors.white};
`
const SubText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    margin-bottom: 40px;
`
