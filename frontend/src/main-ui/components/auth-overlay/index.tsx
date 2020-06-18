import React from 'react';
import { UIElement, UIElementServices } from '../../classes';
import Logic, { State, Event } from './logic';
import Overlay from '../overlay';
import AuthButtonBox from '../auth-button-box';
import { AuthRequest } from '../../../services/auth/types';

interface Props {
    services : UIElementServices<'overlay' | 'auth'>
    authRequest? : AuthRequest
    onCloseRequested : () => void
}

export default class AuthOverlay extends UIElement<Props, State, Event> {
    constructor(props : Props) {
        super(props, { logic: new Logic() })
    }

    render() {
        const { authRequest } = this.props
        
        return (
            <div className={this.styles.container}>
                <Overlay services={this.props.services} onCloseRequested={this.props.onCloseRequested}>
                    {authRequest && authRequest.reason === 'follow-project' && <div className={this.styles.reason}>
                        Sign in to follow this project according to your preferences
                    </div>}
                    <div className={this.styles.authButtons}>
                        <AuthButtonBox services={this.props.services} authRequest={authRequest} />
                    </div>
                </Overlay>
            </div>
        )
    }
}
