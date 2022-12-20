import React from 'react'
import { UIElement } from '../../../../../main-ui/classes'
import Logic from './logic'
import {
    AuthDialogEvent,
    AuthDialogDependencies,
    AuthDialogState,
} from './types'
import styled, { css } from 'styled-components'
import Overlay from '../../../../../main-ui/containers/overlay'
import { Margin } from 'styled-components-spacing'
import { AuthError } from '../../../../../services/auth/types'
import ProfileSetupForm from '../../components/profile-setup-form'
import LoadingScreen from '../../../../../common-ui/components/loading-screen'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

import { getViewportBreakpoint } from '../../../../../main-ui/styles/utils'
import { ViewportBreakpoint } from '../../../../../main-ui/styles/types'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'

const FRIENDLY_ERRORS: { [Key in AuthError['reason']]: string } = {
    'popup-blocked': 'Could not open a popup for you to log in',
    'invalid-email': 'Please enter a valid e-mail address',
    'user-not-found': `There's nobody registered with that e-mail address`,
    'wrong-password': 'You entered a wrong password',
    'email-exists': `There's already an account with that e-mail address registered`,
    'weak-password': 'Please enter a stronger password',
    unknown: 'Sorry, something went wrong on our side. Please try again later',
}

export default class AuthDialog extends UIElement<
    AuthDialogDependencies,
    AuthDialogState,
    AuthDialogEvent
> {
    constructor(props: AuthDialogDependencies) {
        super(props, { logic: new Logic(props) })
    }

    get viewportBreakpoint(): ViewportBreakpoint {
        return getViewportBreakpoint(this.getViewportWidth())
    }

    private checkPasswordMatch(value: string) {
        if (this.state.password === value) {
            this.processEvent('passwordMatch', { value: true })
            console.log('true')
        } else {
            this.processEvent('passwordMatch', { value: false })
            console.log('false')
        }
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
            <StyledAuthDialog viewportBreakpoint={this.viewportBreakpoint}>
                {/* HEADER AREA */}
                {state.mode === 'login' && (
                    <>
                        {header && (
                            <InvitationBox>
                                <FormTitle
                                    viewportBreakpoint={this.viewportBreakpoint}
                                >
                                    {header.title}
                                </FormTitle>
                                {header.subtitle && (
                                    <Margin top="medium">
                                        <FormSubtitle>
                                            {header.subtitle}
                                        </FormSubtitle>
                                    </Margin>
                                )}
                            </InvitationBox>
                        )}
                        <Margin bottom="small">
                            <Header>{state.mode === 'login' && 'Login'}</Header>
                        </Margin>
                        <Footer>
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
                        </Footer>
                    </>
                )}
                {state.mode === 'register' && (
                    <>
                        {header && (
                            <InvitationBox>
                                <FormTitle
                                    viewportBreakpoint={this.viewportBreakpoint}
                                >
                                    {' '}
                                    {header.title}
                                </FormTitle>
                                {header.subtitle && (
                                    <Margin top="medium">
                                        <FormSubtitle>
                                            {header.subtitle}
                                        </FormSubtitle>
                                    </Margin>
                                )}
                            </InvitationBox>
                        )}
                        <Margin bottom="small">
                            <Header>
                                {state.mode === 'register' && 'Sign up'}
                            </Header>
                        </Margin>
                        <Footer>
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
                        </Footer>
                    </>
                )}
                {this.state.mode === 'resetPassword' && (
                    <HeaderBox>
                        <IconBox heightAndWidth={'40px'} background="light">
                            <Icon
                                icon={'reload'}
                                color={'purple'}
                                heightAndWidth={'20px'}
                                hoverOff
                            />
                        </IconBox>
                        <Header>Reset your Password</Header>
                        <Footer>
                            Enter the email address you used for sign up.
                        </Footer>
                    </HeaderBox>
                )}

                {this.state.mode === 'ConfirmResetPassword' && (
                    <HeaderBox>
                        <IconBox heightAndWidth={'40px'} background="light">
                            <Icon
                                icon={'mail'}
                                color={'purple'}
                                heightAndWidth={'40px'}
                                hoverOff
                            />
                        </IconBox>
                        <Header>Check your email account</Header>
                        <Footer>Don't forget your spam folder.</Footer>
                    </HeaderBox>
                )}

                {/* FIELDS */}

                <AuthBox top="medium">
                    <AuthenticationMethods>
                        <EmailPasswordLogin>
                            {this.state.mode !== 'ConfirmResetPassword' && (
                                <TextField
                                    icon={'mail'}
                                    type={'email'}
                                    placeholder="Email"
                                    value={this.state.email}
                                    onChange={(e) =>
                                        this.processEvent('editEmail', {
                                            value: (e.target as HTMLInputElement)
                                                .value,
                                        })
                                    }
                                    onKeyDown={this.handleEnter(() => {
                                        this.processEvent(
                                            'emailPasswordConfirm',
                                            null,
                                        )
                                    })}
                                />
                            )}
                            {this.state.mode === 'login' && (
                                <Margin vertical={'medium'}>
                                    <TextField
                                        icon={'lock'}
                                        type="password"
                                        placeholder="Password"
                                        value={this.state.password}
                                        onChange={(e) =>
                                            this.processEvent('editPassword', {
                                                value: (e.target as HTMLInputElement)
                                                    .value,
                                            })
                                        }
                                        onKeyDown={this.handleEnter(() => {
                                            this.processEvent(
                                                'emailPasswordConfirm',
                                                null,
                                            )
                                        })}
                                    />
                                    <ForgotPassword
                                        onClick={() => {
                                            this.processEvent(
                                                'passwordResetSwitch',
                                                null,
                                            )
                                        }}
                                    >
                                        Forgot Password?
                                    </ForgotPassword>

                                    {/* <TextInputContainer>
                                        <Icon
                                            icon={theme.icons.lockFine}
                                            heightAndWidth="20px"
                                            hoverOff
                                        />
                                        <TextInputOneLine
                                            type="password"
                                            placeholder="Password"
                                            value={this.state.password}
                                            onChange={(e) =>
                                                this.processEvent(
                                                    'editPassword',
                                                    {
                                                        value: e.target.value,
                                                    },
                                                )
                                            }
                                            onKeyDown={this.handleEnter(() => {
                                                this.processEvent(
                                                    'emailPasswordConfirm',
                                                    null,
                                                )
                                            })}
                                        />
                                    </TextInputContainer> */}
                                </Margin>
                            )}
                            {this.state.mode === 'register' && (
                                <Margin vertical={'medium'}>
                                    <TextField
                                        icon={'lock'}
                                        type={'password'}
                                        placeholder="Password"
                                        value={this.state.password}
                                        onChange={(e) =>
                                            this.processEvent('editPassword', {
                                                value: (e.target as HTMLInputElement)
                                                    .value,
                                            })
                                        }
                                        onKeyDown={this.handleEnter(() => {
                                            this.processEvent(
                                                'emailPasswordConfirm',
                                                null,
                                            )
                                        })}
                                    />
                                    <Margin vertical={'medium'}>
                                        <TextField
                                            icon={'reload'}
                                            type={'password'}
                                            placeholder="Password"
                                            value={this.state.passwordRepeat}
                                            onChange={(e) => {
                                                this.processEvent(
                                                    'passwordRepeat',
                                                    {
                                                        value: (e.target as HTMLInputElement)
                                                            .value,
                                                    },
                                                )
                                                this.checkPasswordMatch(
                                                    (e.target as HTMLInputElement)
                                                        .value,
                                                )
                                            }}
                                            onKeyDown={this.handleEnter(() => {
                                                this.processEvent(
                                                    'emailPasswordConfirm',
                                                    null,
                                                )
                                            })}
                                        />
                                    </Margin>
                                </Margin>
                            )}

                            {/* BUTTONS */}

                            {this.state.mode === 'login' && (
                                <PrimaryActionContainer>
                                    <PrimaryAction
                                        onClick={() =>
                                            this.processEvent(
                                                'emailPasswordConfirm',
                                                null,
                                            )
                                        }
                                        label={'Log in'}
                                        width={'100%'}
                                        disabled={
                                            !(
                                                this.state.password.length >
                                                    0 &&
                                                this.state.email.includes(
                                                    '@',
                                                ) &&
                                                this.state.email.includes('.')
                                            )
                                        }
                                    />
                                </PrimaryActionContainer>
                            )}
                            {this.state.mode === 'register' && (
                                <PrimaryActionContainer>
                                    <PrimaryAction
                                        onClick={() =>
                                            this.processEvent(
                                                'emailPasswordConfirm',
                                                null,
                                            )
                                        }
                                        label={'Sign Up'}
                                        width={'100%'}
                                        disabled={
                                            !(
                                                this.state.passwordMatch &&
                                                this.state.email.includes(
                                                    '@',
                                                ) &&
                                                this.state.email.includes(
                                                    '.',
                                                ) &&
                                                this.state.password.length >
                                                    0 &&
                                                this.state.passwordRepeat
                                                    .length > 0
                                            )
                                        }
                                    />
                                </PrimaryActionContainer>
                            )}
                            {this.state.mode === 'resetPassword' && (
                                <PrimaryActionContainer>
                                    <PrimaryAction
                                        onClick={() => {
                                            this.processEvent(
                                                'passwordReset',
                                                null,
                                            )
                                            this.processEvent(
                                                'passwordResetConfirm',
                                                null,
                                            )
                                        }}
                                        label={'Reset Password'}
                                        disabled={
                                            !(
                                                this.state.email.includes(
                                                    '@',
                                                ) &&
                                                this.state.email.includes('.')
                                            )
                                        }
                                        width={'100%'}
                                    />
                                </PrimaryActionContainer>
                            )}

                            {this.state.mode === 'ConfirmResetPassword' && (
                                <>
                                    <PrimaryActionContainer>
                                        <PrimaryAction
                                            onClick={() => {
                                                this.processEvent(
                                                    'toggleMode',
                                                    null,
                                                )
                                            }}
                                            label={'Go back'}
                                        />
                                    </PrimaryActionContainer>
                                </>
                            )}
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
                </AuthBox>
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
            return (
                <LoadingBox>
                    <LoadingScreen />
                </LoadingBox>
            )
        }
        if (this.state.mode === 'profile') {
            return this.renderProfileForm()
        }
        return this.renderAuthForm()
    }

    handleEnter(f: () => void) {
        const handler = (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.keyCode === 13) {
                f()
            }
        }
        return handler
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

const StyledAuthDialog = styled.div<{ viewportBreakpoint: ViewportBreakpoint }>`
    font-family: ${(props) => props.theme.fonts.primary};
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
    padding: 60px 70px 70px 70px;
    height: fit-content;
    width: 600px;

    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            padding: 10px;
        `}
`
const Header = styled.div`
    text-align: center;
    font-size: 26px;
    font-weight: 900;
    color: ${(props) => props.theme.colors.normalText};
    margin-bottom: 10px;
`
const AuthenticationMethods = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  }

  & > div {
      width: 100%;
    max-width: 350px;
  }
`
const EmailPasswordLogin = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;

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

const FormTitle = styled.div<{ viewportBreakpoint: ViewportBreakpoint }>`
    font-weight: 900;
    font-size: 24px;
    color: ${(props) => props.theme.colors.lighterText};
    text-align: center;
    white-space: break-spaces;

    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            font-size: 18px;
        `}
`
const FormSubtitle = styled.div`
    font-weight: 400;
    font-size: 16px;
    text-align: center;
    color: ${(props) => props.theme.colors.lighterText};
`

const AuthBox = styled(Margin)`
    display: flex;
    justify-content: center;
    width: 100%;
`

const LoadingBox = styled.div`
    min-height: 200px;
    min-width: 200px;
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
    color: ${(props) => props.theme.colors.greyScale8};
    font-size: 16px;
    margin: -10px 0 20px 0;
`
const ModeSwitch = styled.span`
    cursor: pointer;
    font-weight: bold;
    color: ${(props) => props.theme.colors.purple};
    text-decoration: none;
`

const PrimaryActionContainer = styled.div`
    margin: 20px 0 0 0;

    & > div {
        height: 50px;

        & * {
            font-weight: 500;
            font-size: 14px;
        }
    }
`

const ForgotPassword = styled.div`
    white-space: nowrap;
    color: ${(props) => props.theme.colors.purple};
    cursor: pointer;
    font-weight: 500;
    font-size: 12px;
    text-align: right;
    padding: 10px 0px;
    float: right;
    width: fit-content;
`

const InvitationBox = styled.div`
    height: 150px;
    width: fill-available;
    background: ${(props) => props.theme.colors.lightgrey}90;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 50px;
`

const HeaderBox = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    grid-gap: 10px;
`
