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
import { PrimaryAction } from '../../../../../common-ui/components/PrimaryAction'

import { getViewportBreakpoint } from '../../../../../main-ui/styles/utils'
import { ViewportBreakpoint } from '../../../../../main-ui/styles/types'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { theme } from '../../../../../main-ui/styles/theme'

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
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
    padding: 20px;
    height: fit-content;
    min-height: 450px;
    width: 600px;
    margin-top: 30px;
`
const Header = styled.div`
    text-align: center;
    font-size: 26px;
    font-weight: 900;
    color: ${(props) => props.theme.colors.darkerText};
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

const FormTitle = styled.div<{ viewportBreakPoint: ViewportBreakpoint }>`
    font-weight: 900;
    font-size: 24px;
    color: ${(props) => props.theme.colors.primary};
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
    color: ${(props) => props.theme.colors.secondary};
`

const AuthBox = styled(Margin)`
    display: flex;
    justify-content: center;
    width: 100%;
`

const TextInputContainer = styled.div`
    display: flex;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-start;
    border: 1px solid ${(props) => props.theme.colors.lineLightGrey};
    height: 50px;
    border-radius: 8px;
    width: 350px;
    padding: 0 15px;
`

const TextInputOneLine = styled.input`
    outline: none;
    height: fill-available;
    width: fill-available;
    color: #96a0b5;
    font-size: 14px;
    border: none;
    background: transparent;
    font-family: 'Inter';
    color: ${(props) => props.theme.colors.darkerText};

    &::placeholder {
        color: #96a0b5;
    }
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
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 16px;
    margin: 0 0 20px 0;
`
const ModeSwitch = styled.span`
    cursor: pointer;
    font-weight: bold;
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
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 60px;
    width: 60px;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
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
                {/* HEADER AREA */}
                {state.mode === 'login' && (
                    <>
                        {header && (
                            <InvitationBox>
                                <FormTitle
                                    viewportBreakPoint={this.viewportBreakpoint}
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
                                    viewportBreakPoint={this.viewportBreakpoint}
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
                    <>
                        <SectionCircle width={'30px'}>
                            <Icon
                                icon={'reload'}
                                color={'purple'}
                                heightAndWidth={'20px'}
                            />
                        </SectionCircle>
                        <Header>Reset your Password</Header>
                    </>
                )}

                {this.state.mode === 'ConfirmResetPassword' && (
                    <>
                        <SectionCircle width={'30px'}>
                            <Icon
                                icon={'mail'}
                                color={'purple'}
                                heightAndWidth={'20px'}
                            />
                        </SectionCircle>
                        <Header>Check your email account</Header>
                        <Footer>Don't forget your spam folder.</Footer>
                    </>
                )}

                {/* FIELDS */}

                <AuthBox top="medium">
                    <AuthenticationMethods>
                        <EmailPasswordLogin>
                            {this.state.mode !== 'ConfirmResetPassword' && (
                                <TextInputContainer>
                                    <Icon
                                        icon={theme.icons.mail}
                                        heightAndWidth="20px"
                                        hoverOff
                                    />
                                    <TextInputOneLine
                                        type="email"
                                        placeholder="E-mail"
                                        value={this.state.email}
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
                                        autoFocus
                                    />
                                </TextInputContainer>
                            )}
                            {this.state.mode === 'login' && (
                                <Margin vertical={'medium'}>
                                    <TextInputContainer>
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
                                            onConfirm={() => {
                                                this.processEvent(
                                                    'emailPasswordConfirm',
                                                    null,
                                                )
                                            }}
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
                                    </TextInputContainer>
                                </Margin>
                            )}
                            {this.state.mode === 'register' && (
                                <Margin vertical={'medium'}>
                                    <TextInputContainer>
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
                                            onConfirm={() => {
                                                this.processEvent(
                                                    'emailPasswordConfirm',
                                                    null,
                                                )
                                            }}
                                        />
                                    </TextInputContainer>
                                    <Margin top={'medium'}>
                                        <TextInputContainer>
                                            <Icon
                                                icon={theme.icons.reload}
                                                heightAndWidth="20px"
                                                hoverOff
                                            />
                                            <TextInputOneLine
                                                type="password"
                                                placeholder="Confirm Password"
                                                value={
                                                    this.state.passwordRepeat
                                                }
                                                onChange={(e) => {
                                                    this.processEvent(
                                                        'passwordRepeat',
                                                        {
                                                            value:
                                                                e.target.value,
                                                        },
                                                    )
                                                }}
                                            />
                                        </TextInputContainer>
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
                                    />
                                </PrimaryActionContainer>
                            )}
                            {this.state.mode === 'register' &&
                                state.passwordRepeat === state.password && (
                                    <PrimaryActionContainer>
                                        <PrimaryAction
                                            onClick={() =>
                                                this.processEvent(
                                                    'emailPasswordConfirm',
                                                    null,
                                                )
                                            }
                                            label={'Sign Up'}
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
