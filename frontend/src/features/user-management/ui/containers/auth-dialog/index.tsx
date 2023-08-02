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
import LoadingScreen from '../../../../../common-ui/components/loading-screen'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

import { getViewportBreakpoint } from '../../../../../main-ui/styles/utils'
import { ViewportBreakpoint } from '../../../../../main-ui/styles/types'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { AuthProvider } from '../../../../../types/auth'
import { theme } from '../../../../../main-ui/styles/theme'

const FRIENDLY_ERRORS: { [Key in AuthError['reason']]: string } = {
    'popup-blocked': 'Could not open a popup for you to log in',
    'invalid-email': 'Please enter a valid e-mail address',
    'user-not-found': `There's nobody registered with that e-mail address`,
    'wrong-password': 'You entered a wrong password',
    'email-exists': `There's already an account with that e-mail address registered`,
    'weak-password': 'Please enter a stronger password',
    'display-name-missing': 'Please enter a display name for your account',
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
        } else {
            this.processEvent('passwordMatch', { value: false })
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
                                color={'prime1'}
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
                                color={'prime1'}
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
                            {(this.state.mode === 'login' ||
                                this.state.mode === 'register') && (
                                <>
                                    <SocialLogins>
                                        <SocialLogin
                                            icon={'path to icon'}
                                            provider="google"
                                            onClick={() =>
                                                this.processEvent(
                                                    'socialSignIn',
                                                    {
                                                        provider: 'google',
                                                    },
                                                )
                                            }
                                            mode={state.mode}
                                        />
                                        <SocialLogin
                                            icon={'path to icon'}
                                            provider="twitter"
                                            onClick={() =>
                                                this.processEvent(
                                                    'socialSignIn',
                                                    {
                                                        provider: 'twitter',
                                                    },
                                                )
                                            }
                                            mode={state.mode}
                                        />
                                    </SocialLogins>
                                    <HorizontalLine />
                                </>
                            )}
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
                                    width="100%"
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
                                            placeholder="Repeat Password"
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
                                    {this.state.mode === 'register' && (
                                        <>
                                            <TextField
                                                icon={'smileFace'}
                                                type={'text'}
                                                placeholder={'Display Name'}
                                                value={this.state.displayName}
                                                onChange={(event) =>
                                                    this.processEvent(
                                                        'editDisplayName',
                                                        (event.target as HTMLInputElement)
                                                            .value,
                                                    )
                                                }
                                                onKeyDown={this.handleEnter(
                                                    () => {
                                                        if (
                                                            this.state
                                                                .displayName
                                                                .length > 0
                                                        ) {
                                                            this.processEvent(
                                                                'emailPasswordConfirm',
                                                                null,
                                                            )
                                                        }
                                                    },
                                                )}
                                            />
                                            <InfoText>
                                                Name shown on shared Spaces,
                                                page links and annotations
                                            </InfoText>
                                        </>
                                    )}
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
                                        type={'primary'}
                                        size={'large'}
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
                                        type={'primary'}
                                        size={'large'}
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
                                                    .length > 0 &&
                                                this.state.displayName.trim()
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
                                        type={'primary'}
                                        size={'large'}
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
                                            type={'primary'}
                                            size={'large'}
                                        />
                                    </PrimaryActionContainer>
                                </>
                            )}
                            {this.renderAuthError()}
                        </EmailPasswordLogin>
                    </AuthenticationMethods>
                </AuthBox>
            </StyledAuthDialog>
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

function SocialLogin(props: {
    icon: string
    provider: AuthProvider
    onClick(event: { provider: AuthProvider }): void
    mode: string
}) {
    let modeName: string

    if (props.mode === 'login') {
        modeName = 'Login'
    } else if (props.mode === 'register') {
        modeName = 'Sign up'
    }

    let providerName: string

    if (props.provider === 'google') {
        providerName = 'Google'
    } else {
        providerName = 'Twitter'
    }

    return (
        <PrimaryAction
            onClick={() => props.onClick({ provider: props.provider })}
            label={`${modeName} with ${providerName}`}
            size="large"
            backgroundColor={props.provider === 'twitter' ? 'twitter' : null}
            type="secondary"
            icon={props.provider === 'google' ? 'googleLogo' : 'twitterLogo'}
            width="100%"
        />
    )
}

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
    color: ${(props) => props.theme.colors.white};
    margin-bottom: 10px;
`
const AuthenticationMethods = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: center;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 12px;
    margin-top: 5px;
    margin-bottom: 15px;
    text-align: center;
    padding: 0px;
`

const EmailPasswordLogin = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    width: 300px;

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
    color: ${(props) => props.theme.colors.greyScale5};
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
    color: ${(props) => props.theme.colors.greyScale5};
`

const AuthBox = styled(Margin)`
    display: flex;
    justify-content: center;
    width: 500px;
`

const LoadingBox = styled.div`
    min-height: 450px;
    min-width: 600px;
`

const SocialLogins = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    grid-gap: 10px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
`

const HorizontalLine = styled.div`
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    width: 50%;
    margin: 20px 0px;
    align-self: center;
`

const SocialLoginButton = styled.div`
    padding: 10px 30px;
    background: grey;
    font-size: 12px;
    width: 200px;
    cursor: pointer;
`
const SocialLoginIcon = styled.div<{ image: string }>``
const SocialLoginLabel = styled.div``

const Footer = styled.div`
    text-align: center;
    user-select: none;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
    margin: -10px 0 20px 0;
`
const ModeSwitch = styled.span`
    cursor: pointer;
    font-weight: bold;
    color: ${(props) => props.theme.colors.prime1};
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
    color: ${(props) => props.theme.colors.prime1};
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
    background: ${(props) => props.theme.colors.greyScale5}90;
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
