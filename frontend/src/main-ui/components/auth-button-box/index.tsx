import React from 'react';
import classNames from 'classnames'
import { UIElement, UIElementServices } from '../../classes';
import Logic, { State, Event } from './logic';
import TextInput from '../forms/text-input';
import { AuthProvider } from '../../../types/auth';
import { capitalize } from '../../../utils/string';
import { AuthRequest } from '../../../services/auth/types';

interface Props {
    services : UIElementServices<'auth'>
    authRequest? : AuthRequest
}

export default class AuthButtonBox extends UIElement<Props, State, Event> {
    constructor(props : Props) {
        super(props, { logic: new Logic({ services: props.services, authRequest: props.authRequest }) })
    }

    render() {
        const authButton = (provider : AuthProvider) => <AuthButton
            services={this.props.services}
            provider={provider}
            label={`Continue with ${capitalize(provider)}`}
            onClick={() => this.processEvent('providerLogin', { provider })}
        />

        return (<div className={this.styles.authBox}>
            {authButton('facebook')}
            {authButton('google')}
            <EmailAuthBox
                services={this.props.services}
                showEmailLogin={this.state.showEmailLogin}
                email={this.state.email}
                emailValid={this.state.emailValid}
                onStartEmailLogin={() => this.processEvent('startEmailLogin', { })}
                onEmailChange={(value : string) => this.processEvent('emailChange', { value })}
                onEmailSubmit={() => this.processEvent('emailSubmit', { })}
            />
        </div>)
    }
}

interface AuthButtonProps {
    services : UIElementServices
    provider : AuthProvider | 'email'
    label : string
    onClick : () => void
}
export class AuthButton extends UIElement<AuthButtonProps> {
    styleModule = 'AuthButtonBox'

    render() {
        const iconClassNames = ({
            facebook: 'fab fa-facebook',
            google: 'fab fa-google',
            email: 'fas fa-envelope',
        } as any)[this.props.provider]

        return (
            <div
                className={`${this.styles.authButton} ${this.props.provider ? this.styles[`authProvider-${this.props.provider}`] : ''}`}
                onClick={this.props.onClick}
            >
                {/* <i className={`${iconClassNames} ${this.styles.providerIcon}`} /> */}
                {this.props.label}
            </div>
        )
    }
}

interface EmailAuthBoxProps {
    services : UIElementServices
    showEmailLogin : boolean
    email : string
    emailValid : boolean
    onStartEmailLogin : () => void
    onEmailChange : (value : string) => void
    onEmailSubmit : () => void
}
export class EmailAuthBox extends UIElement<EmailAuthBoxProps> {
    styleModule = 'AuthButtonBox'
    
    render() {
        return (
            <div className={this.styles.emailAuthBox}>
                {!this.props.showEmailLogin && <AuthButton
                    services={this.props.services}
                    provider='email' label='Continue with e-mail' onClick={this.props.onStartEmailLogin}
                />}
                {this.props.showEmailLogin && <div>
                    Enter your e-mail for your magic sign in link
                    <TextInput
                        services={this.props.services}
                        value={this.props.email}
                        onChange={this.props.onEmailChange}
                        onConfirm={this.props.onEmailSubmit}
                        contentType='email'
                        className={this.styles.emailInput}
                        placeholder='your@email.com'
                    />
                    <div className={classNames(this.styles.emailSubmitButton, !this.props.emailValid && this.styles.disabled)}>Sign in</div>
                </div>}
            </div>
        )
    }
}
