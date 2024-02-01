import { Trans } from 'react-i18next'
import React from 'react'
import styled from 'styled-components'
import { UIElement } from '../../classes'
import Logic, { LandingPageState } from './logic'
import type { LandingPageDependencies, LandingPageEvent } from './types'
import LoadingIndicator from '../../../common-ui/components/loading-indicator'

interface LandingPageProps extends LandingPageDependencies {}

const Container = styled.div`
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
`

export default class LandingPage extends UIElement<
    LandingPageProps,
    LandingPageState,
    LandingPageEvent
> {
    constructor(props: LandingPageProps) {
        super(props, { logic: new Logic(props) })
    }

    render() {
        return (
            <Trans>
                <Container>
                    <p style={{ color: 'white' }}>My Landing Page</p>
                </Container>
            </Trans>
        )
    }
}
