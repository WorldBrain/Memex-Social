import { Trans } from 'react-i18next'
import React from 'react'
import styled from 'styled-components'
import { UIElement } from '../../classes'
import { UIElementServices } from '../../../services/types'
import Logic, { LandingPageState } from './logic'
import { LandingPageEvent } from './types'
import LoadingIndicator from '../../../common-ui/components/loading-indicator'

interface LandingPageProps {
    services: UIElementServices<'auth' | 'router'>
}

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
        super(props, { logic: new Logic() })
    }

    async componentDidMount() {
        await super.componentDidMount()
        this.props.services.router.goToExternalUrl('https://memex.garden/')
    }

    render() {
        return (
            <Trans>
                <Container>
                    <LoadingIndicator />
                </Container>
            </Trans>
        )
    }
}
