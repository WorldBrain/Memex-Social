import { Trans } from 'react-i18next'
import React from 'react'
// import styled from "styled-components";
import { UIElement } from '../../classes'
import { UIElementServices } from '../../../services/types'
import Logic, { LandingPageState } from './logic'
import { LandingPageEvent } from './types'

interface LandingPageProps {
    services: UIElementServices<'auth' | 'router'>
}

export default class LandingPage extends UIElement<
    LandingPageProps,
    LandingPageState,
    LandingPageEvent
> {
    constructor(props: LandingPageProps) {
        super(props, { logic: new Logic() })
    }

    componentDidMount() {
        this.props.services.router.goToExternalUrl('https://home.memex.social')
    }

    render() {
        return <Trans>Redirecting...</Trans>
    }
}
