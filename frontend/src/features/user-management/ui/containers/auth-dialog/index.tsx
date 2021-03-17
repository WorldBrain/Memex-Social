import React from 'react'
import { UIElement } from '../../../../../main-ui/classes'
import Logic from './logic'
import {
    AuthDialogEvent,
    AuthDialogDependencies,
    AuthDialogState,
} from './types'
import styled from 'styled-components'
import Overlay from '../../../../../main-ui/containers/overlay'
import Button from '../../../../../common-ui/components/button'
import TextInput from '../../../../../common-ui/components/text-input'
import { Margin } from 'styled-components-spacing'
import { AuthError } from '../../../../../services/auth/types'
import ProfileSetupForm from '../../components/profile-setup-form'
import LoadingScreen from '../../../../../common-ui/components/loading-screen'

const FRIENDLY_ERRORS: { [Key in AuthError['reason']]: string } = {
    'popup-blocked': 'Could not open a popup for you to log in',
    'invalid-email': 'Please enter a valid e-mail address',
    'user-not-found': `There's nobody registered with that e-mail address`,
    'wrong-password': 'You entered a wrong password',
    'email-exists': `There's already an account with that e-mail address registered`,
    'weak-password': 'Please enter a stronger password',
    unknown: 'Sorry, something went wrong on our side. Please try again later',
}

const StyledAuthDialog = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 40px;
`
const Header = styled.div`
    text-align: center;
    font-size: 16px;
    font-weight: bold;
`
const AuthenticationMethods = styled.div`
  display: flex;
  align-items: flex-start;
  }

  & > div {
    width: 350px;
  }
`
const EmailPasswordLogin = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    & > *,
    input {
        width: 100%;
    }
`
const EmailPasswordError = styled.div`
    color: red;
    font-weight: bold;
    text-align: center;
`

const FormTitle = styled.div`
    font-weight: bold;
    font-size: 24px;
    color: ${(props) => props.theme.colors.primary};
    text-align: center;
`
const FormSubtitle = styled.div`
    font-weight: 500;
    font-size: 16px;
    text-align: center;
    color: ${(props) => props.theme.colors.secondary};
`

// const SocialLogins = styled.div`
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
// `;
// const SocialLoginButton = styled.div`
//   padding: 10px 30px;
//   background: grey;
//   font-size: 12px;
//   width: 200px;
//   cursor: pointer;
// `;
// const SocialLoginIcon = styled.div<{ image: string }>``;
// const SocialLoginLabel = styled.div``;

const Footer = styled.div`
    text-align: center;
    user-select: none;
    color: ${(props) => props.theme.colors.primary};
    font-size: 12px;
    opacity: 0.8;
`
const ModeSwitch = styled.span`
    cursor: pointer;
    font-weight: bold;
`

export default class AuthDialog extends UIElement<
    AuthDialogDependencies,
    AuthDialogState,
    AuthDialogEvent
> {
    constructor(props: AuthDialogDependencies) {
        super(props, { logic: new Logic(props) })
    }

    renderAuthError() {
        const { state } = this

        const error = (text: string) => {
            return (
                <Margin vertical={'medium'}>
                    <EmailPasswordError>{text}</EmailPasswordError>
                </Margin>
            )
        }

        if (state.error) {
            return error(FRIENDLY_ERRORS[state.error])
        }

        if (state.saveState === 'error') {
            const action = state.mode === 'login' ? 'log you in' : 'sign you up'
            return error(
                `Something went wrong trying to ${action}. Please try again later.`,
            )
        }

        return null
    }

    renderAuthForm() {
        const { state } = this
        const { header } = state

        return (
            <StyledAuthDialog>
                {header && (
                    <Margin bottom="largest">
                        <FormTitle>{header.title}</FormTitle>
                        {header.subtitle && (
                            <Margin top="medium">
                                <FormSubtitle>{header.subtitle}</FormSubtitle>
                            </Margin>
                        )}
                    </Margin>
                )}
                <Margin bottom="small">
                    <Header>
                        {state.mode === 'login' && 'Login'}
                        {state.mode === 'register' && 'Sign up'}
                    </Header>
                </Margin>
                <Footer>
                    {state.mode === 'login' && (
                        <>
                            Don’t have an account?{' '}
                            <ModeSwitch
                                onClick={() =>
                                    this.processEvent('toggleMode', null)
                                }
                            >
                                Sign up
                            </ModeSwitch>
                        </>
                    )}
                    {state.mode === 'register' && (
                        <>
                            Already have an account?{' '}
                            <ModeSwitch
                                onClick={() =>
                                    this.processEvent('toggleMode', null)
                                }
                            >
                                Log in
                            </ModeSwitch>
                        </>
                    )}
                </Footer>
                <Margin top="medium">
                    <AuthenticationMethods>
                        <EmailPasswordLogin>
                            <TextInput
                                type="email"
                                placeholder="E-mail"
                                onChange={(e) =>
                                    this.processEvent('editEmail', {
                                        value: e.target.value,
                                    })
                                }
                                onConfirm={() => {
                                    this.processEvent(
                                        'emailPasswordConfirm',
                                        null,
                                    )
                                }}
                            />
                            <Margin vertical={'medium'}>
                                <TextInput
                                    type="password"
                                    placeholder="Password"
                                    onChange={(e) =>
                                        this.processEvent('editPassword', {
                                            value: e.target.value,
                                        })
                                    }
                                    onConfirm={() => {
                                        this.processEvent(
                                            'emailPasswordConfirm',
                                            null,
                                        )
                                    }}
                                />
                            </Margin>
                            <Margin top={'medium'}>
                                <Button
                                    type="primary-action"
                                    onClick={() =>
                                        this.processEvent(
                                            'emailPasswordConfirm',
                                            null,
                                        )
                                    }
                                >
                                    {state.mode === 'login' && 'Log in'}
                                    {state.mode === 'register' && 'Register'}
                                </Button>
                            </Margin>
                            {this.renderAuthError()}
                        </EmailPasswordLogin>
                        {/* <SocialLogins>
                <SocialLogin
                  icon={"path to icon"}
                  provider="facebook"
                  onClick={onSocialLogin}
                />
                <SocialLogin
                  icon={"path to icon"}
                  provider="google"
                  onClick={onSocialLogin}
                />
                <SocialLogin
                  icon={"path to icon"}
                  provider="github"
                  onClick={onSocialLogin}
                />
                <SocialLogin
                  icon={"path to icon"}
                  provider="twitter"
                  onClick={onSocialLogin}
                />
              </SocialLogins> */}
                    </AuthenticationMethods>
                </Margin>
            </StyledAuthDialog>
        )
    }

    renderProfileForm() {
        return (
            <ProfileSetupForm
                displayName={this.state.displayName}
                onDisplayNameChange={(value) =>
                    this.processEvent('editDisplayName', { value })
                }
                onConfirm={() => this.processEvent('confirmDisplayName', null)}
            />
        )
    }

    renderOverlayContent() {
        if (this.state.saveState === 'running') {
            return <LoadingScreen />
        }
        if (this.state.mode === 'profile') {
            return this.renderProfileForm()
        }
        return this.renderAuthForm()
    }

    render() {
        return (
            this.state.mode !== 'hidden' && (
                <Overlay
                    services={this.props.services}
                    onCloseRequested={() => this.processEvent('close', null)}
                >
                    {this.renderOverlayContent()}
                </Overlay>
            )
        )
    }
}

// function SocialLogin(props: {
//   icon: string;
//   provider: AuthProvider;
//   onClick(event: { provider: AuthProvider }): void;
// }) {
//   return (
//     <Margin vertical="smallest">
//       <SocialLoginButton
//         onClick={() => props.onClick({ provider: props.provider })}
//       >
//         <SocialLoginIcon image={props.icon} />
//         <SocialLoginLabel>
//           Login with{" "}
//           {props.provider.charAt(0).toUpperCase() + props.provider.slice(1)}
//         </SocialLoginLabel>
//       </SocialLoginButton>
//     </Margin>
//   );
// }
