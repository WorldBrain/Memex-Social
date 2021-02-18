import React from 'react'
import { UIElement } from '../../../../../main-ui/classes'
import Logic from './logic'
import {
    AccountSettingsEvent,
    AccountSettingsDependencies,
    AccountSettingsState,
} from './types'
import styled from 'styled-components'
import Overlay from '../../../../../main-ui/containers/overlay'

const StyledAccountSettings = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
`

export default class AccountSettings extends UIElement<
    AccountSettingsDependencies,
    AccountSettingsState,
    AccountSettingsEvent
> {
    constructor(props: AccountSettingsDependencies) {
        super(props, { logic: new Logic(props) })
    }

    render() {
        return (
            <Overlay
                services={this.props.services}
                onCloseRequested={this.props.onCloseRequested}
            >
                {this.state.loadState === 'success' && (
                    <StyledAccountSettings>
                        {this.state.displayName}
                    </StyledAccountSettings>
                )}
            </Overlay>
        )
    }
}
