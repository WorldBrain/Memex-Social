import React from 'react'
import styled, { css } from 'styled-components'
import { Margin } from 'styled-components-spacing'

import { UIElement } from '../../../../../main-ui/classes'
import { Theme } from '../../../../../main-ui/styles/types'
import {
    ProfileEditModalDependencies,
    ProfileEditModalEvent,
    ProfileEditModalState,
} from './types'
import { ProfileWebLinkName, UserPublicProfile } from '../../../types'

import { theme } from '../../../../../main-ui/styles/theme'
import ProfileEditModalLogic from './logic'
import { VALID_URL_TEST } from '../../../../../constants'
import Overlay from '../../../../../main-ui/containers/overlay'
import { UITaskState } from '../../../../../main-ui/types'
import LoadingScreen from '../../../../../common-ui/components/loading-screen'
import ErrorBox from '../../../../../common-ui/components/error-box'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import LoadingIndicator from '../../../../../common-ui/components/loading-indicator'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import TextArea from '@worldbrain/memex-common/lib/common-ui/components/text-area'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'

export type ProfilePopupProps = ProfileEditModalDependencies

export default class ProfileEditModal extends UIElement<
    ProfileEditModalDependencies,
    ProfileEditModalState,
    ProfileEditModalEvent
> {
    constructor(props: ProfileEditModalDependencies) {
        super(props, { logic: new ProfileEditModalLogic(props) })
    }

    private webMonetizationLearnMoreURL: string =
        'https://worldbrain.io/tutorial/WebMonetization-Curator'

    handleSaveClick() {
        this.runAllTests()
        this.state.inputErrorArray.forEach((val, idx) => {
            if (val) {
                console.log(
                    `Aborting save due to error in inputErrorArray[${idx}]`,
                )
                return
            }
        })
        this.processEvent('saveProfile', {
            profileData: this.state.userPublicProfile!,
            displayName: this.state.user?.displayName ?? '',
        })
    }

    runAllTests() {
        const newArray = []
        newArray[0] = this.testDisplayName()
        this.state.profileLinks?.forEach?.(
            (val, idx) =>
                (newArray[idx + 1] = this.testValidURL(
                    this.state.userPublicProfile![val.urlPropName],
                )),
        )
        this.processEvent('setErrorArray', { newArray })
    }

    handleSetDisplayName(value: string) {
        this.processEvent('setDisplayName', { value: value })
    }

    handleSetEmail(value: string) {
        this.processEvent('setEmail', { value: value })
    }

    confirmEmailChange(value: string) {
        this.processEvent('confirmEmailChange', { value })
    }

    handleSetProfileValue(key: keyof UserPublicProfile, value: string): void {
        this.processEvent('setProfileValue', { key, value })
    }

    sendPasswordResetEmail(value: string) {
        this.processEvent('sendPasswordResetEmail', { value })
    }

    handleURLChange = (
        evt: any,
        errorIndex: number,
        urlPropName: ProfileWebLinkName,
    ) => {
        if (this.state.inputErrorArray[errorIndex]) {
            const newArray = [...this.state.inputErrorArray]
            const profileTypesHack: { [key: string]: string | undefined } = {
                ...(this.state.userPublicProfile ?? {}),
            }
            newArray[errorIndex] = this.testValidURL(
                profileTypesHack[urlPropName],
            )
            this.processEvent('setErrorArray', { newArray })
        }
        this.handleSetProfileValue(urlPropName, evt.currentTarget.value)
    }

    testDisplayName(): boolean {
        return !this.state.user?.displayName
    }

    testValidURL(url?: string): boolean {
        return url ? !VALID_URL_TEST.test(url) : false
    }

    handleWebLinkClick = (url: string): void => {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
        if (newWindow) newWindow.opener = null
    }

    handleEnterKeyDown: React.KeyboardEventHandler = (evt) => {
        if (evt.charCode === 13) {
            this.handleSaveClick()
        }
    }

    renderContent() {
        const { loadState } = this.state
        if (loadState === 'pristine' || loadState === 'running') {
            return (
                <Margin horizontal="large" vertical="large">
                    <LoadingScreen />
                </Margin>
            )
        }
        if (loadState === 'error') {
            return (
                <Margin horizontal="large" vertical="large">
                    <ErrorBox>
                        Something went wrong loading your account settings
                    </ErrorBox>
                </Margin>
            )
        }

        return (
            <Container
                loadState={loadState}
                onKeyDown={this.handleEnterKeyDown}
            >
                <HeaderSection vertical="medium">
                    <SectionHeader theme={theme}>Profile</SectionHeader>
                    <ButtonContainer>
                        <PrimaryAction
                            disabled={this.state.inputErrorArray.some(
                                (val) => val,
                            )}
                            label="Cancel"
                            onClick={() => this.props.onCloseRequested()}
                            type={'tertiary'}
                            size={'medium'}
                        />
                        <PrimaryAction
                            disabled={this.state.inputErrorArray.some(
                                (val) => val,
                            )}
                            label="Save"
                            onClick={() => this.handleSaveClick()}
                            type={'primary'}
                            size={'medium'}
                        />
                    </ButtonContainer>
                </HeaderSection>
                <DisplayNameContainer>
                    <TextField
                        icon={'personFine'}
                        value={this.state.user?.displayName}
                        onChange={(evt) => {
                            if (this.state.inputErrorArray[0]) {
                                this.testDisplayName()
                            }
                            this.handleSetDisplayName(
                                (evt.currentTarget as HTMLInputElement).value,
                            )
                        }}
                        placeholder="Display Name"
                    />
                    <TextInputInfoText>
                        Name shown on shared Spaces, page links and annotations
                    </TextInputInfoText>
                </DisplayNameContainer>

                <TextArea
                    value={this.state.userPublicProfile?.bio ?? ''}
                    onChange={(evt) =>
                        this.handleSetProfileValue(
                            'bio',
                            (evt.currentTarget as HTMLTextAreaElement).value,
                        )
                    }
                    placeholder="Your Bio or Description"
                />
                <Margin top={'large'}>
                    <SectionHeader small theme={theme}>
                        Social Links
                    </SectionHeader>
                </Margin>
                {this.state.profileLinks.map((linkObj, idx) => (
                    <Margin top={'small'}>
                        <TextField
                            icon={linkObj.icon}
                            value={
                                this.state.userPublicProfile?.[
                                    linkObj.urlPropName
                                ] ?? ''
                            }
                            onChange={(evt) =>
                                this.handleURLChange(
                                    evt,
                                    idx + 1,
                                    linkObj.urlPropName,
                                )
                            }
                            placeholder={linkObj.label}
                        />
                    </Margin>
                ))}
                {/* <Margin top="largest" bottom="small">
                    <SectionHeader>Web Monetization Settings</SectionHeader>
                </Margin>
                <InfoText>
                    People can pay for your curations with WebMonetization
                    micropayments. <br /> Takes 5 minutes to set up.
                    <WebLink
                        as="span"
                        onClick={() =>
                            this.handleWebLinkClick(
                                this.webMonetizationLearnMoreURL,
                            )
                        }
                    >
                        {`How to find your payment pointer >>`}
                    </WebLink>
                </InfoText>

                <TextField
                    icon={'webMonetizationLogo'}
                    value={this.state.userPublicProfile?.paymentPointer ?? ''}
                    onChange={(evt) =>
                        this.handleSetProfileValue(
                            'paymentPointer',
                            (evt.currentTarget as HTMLInputElement).value,
                        )
                    }
                    placeholder={'Add your payment pointer'}
                /> */}

                <Margin top="largest" bottom={'medium'}>
                    <SectionHeader theme={theme}>
                        Account Information
                    </SectionHeader>
                </Margin>
                <EmailBox>
                    <TextField
                        icon={'mail'}
                        type={'email'}
                        value={this.state.email}
                        onChange={(event) =>
                            this.handleSetEmail(
                                (event.currentTarget as HTMLInputElement).value,
                            )
                        }
                        placeholder="Email Address"
                    />
                    {this.state.showEmailEditButton && (
                        <>
                            {this.state.emailEditSuccess === 'pristine' && (
                                <PrimaryAction
                                    label={'Save new email'}
                                    onClick={() =>
                                        this.confirmEmailChange(
                                            this.state.email,
                                        )
                                    }
                                />
                            )}
                            {this.state.emailEditSuccess === 'running' && (
                                <PrimaryAction
                                    label={
                                        <LoadingBox>
                                            <LoadingIndicator size={16} />
                                        </LoadingBox>
                                    }
                                    onClick={() => null}
                                />
                            )}
                        </>
                    )}
                    {this.state.emailEditSuccess === 'success' && (
                        <SectionCircle size="30px">
                            <Icon
                                icon={'check'}
                                heightAndWidth="16px"
                                color="prime1"
                            />
                        </SectionCircle>
                    )}
                </EmailBox>
                {this.state.emailEditSuccess === 'error' && (
                    <ErrorMessage>
                        <Icon
                            icon={'warning'}
                            heightAndWidth="20px"
                            color="white"
                        />
                        Please log out and login again to change your email
                        address.
                    </ErrorMessage>
                )}
                <Margin top={'medium'}>
                    {!this.state.passwordResetSuccessful ? (
                        <PrimaryAction
                            label="Reset Password"
                            onClick={() =>
                                this.sendPasswordResetEmail(this.state.email)
                            }
                            icon={'reload'}
                            type={'secondary'}
                            size={'medium'}
                        />
                    ) : (
                        <ResetEmailConfirmation>
                            <IconBox background={'light'} heightAndWidth="30px">
                                <Icon
                                    icon={'check'}
                                    heightAndWidth="20px"
                                    color="prime1"
                                />
                            </IconBox>
                            Check your email account.
                        </ResetEmailConfirmation>
                    )}
                </Margin>
                {/* {this.state.saveState === 'error' && (
                    <>
                        Log out and login again, then change your email.
                    </>
                )} */}
            </Container>
        )
    }

    render() {
        return (
            <Overlay
                services={this.props.services}
                onCloseRequested={this.props.onCloseRequested}
            >
                {this.renderContent()}
            </Overlay>
        )
    }
}

const HeaderSection = styled(Margin)`
    display: flex;
    justify-content: space-between;
    align-items: center;
`

const Container = styled.div<{ loadState: UITaskState; theme: Theme }>`
    margin: auto;
    min-height: 358px;
    max-height: 100%;
    width: 520px;
    padding: 20px;
    flex-direction: column;
    & * {
        font-family: ${(props) => props.theme.fonts.primary};
    }

    ${(props) =>
        (props.loadState === 'running' || props.loadState === 'pristine') &&
        css`
            background: transparent;
        `}
`

const SectionCircle = styled.div<{ size: string }>`
    border-radius: 100px;
    height: ${(props) => (props.size ? props.size : '60px')};
    width: ${(props) => (props.size ? props.size : '60px')};
    display: flex;
    justify-content: center;
    align-items: center;
`

const ButtonContainer = styled.div`
    width: 100%;
    height: min-content;
    display: flex;
    justify-content: flex-end;
    grid-gap: 5px;
`

const TextInputInfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 12px;
    opacity: 0.7;
    padding-left: 10px;
    font-family: ${(props) => props.theme.fonts.primary};
`

const InfoText = styled.div<{ margin?: string }>`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    margin: ${(props) => (props.margin ? props.margin : '0 0 20px 0')};
    font-weight: 300;
    line-height: 20px;
`

const SectionHeader = styled.div<{
    theme?: Theme
    small?: boolean
}>`
    width: 100%;
    font-family: ${(props) => props.theme.fonts.primary};
    font-weight: 800;
    font-size: ${(props) => (props.small ? '16px' : '22px')};
    line-height: ${(props) => props.theme.lineHeights.header};
    color: ${(props) => props.theme.colors.white};
    text-align: left;
`

const SectionHeaderDescription = styled(SectionHeader)`
    font-weight: 'normal';
    font-size: ${(props) => props.theme.fontSizes.text};
    line-height: ${(props) => props.theme.lineHeights.text};
    padding-bottom: ${(props) => props.theme.spacing.small};
`

const WebLink = styled(SectionHeaderDescription)`
    text-decoration: underline;
    cursor: pointer;
    padding-left: 5px;
    font-size: inherit;
    color: inherit;
`

const DisplayNameContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-gap: 5px;
    grid-auto-flow: row;
    justify-content: flex-start;
    margin-bottom: 20px;
`

const EmailBox = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    grid-gap: 10px;
`

const ErrorMessage = styled.div`
    margin: 15px 0px;
    padding: 20px;
    background: ${(props) => props.theme.colors.warning};
    color: ${(props) => props.theme.colors.white};
    font-weight: normal;
    display: flex;
    font-size: 14px;
    grid-gap: 10px;
    align-items: center;
    border-radius: 8px;
    justify-content: center;
`

const LoadingBox = styled.div`
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
`

const ResetEmailConfirmation = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    font-size: 14px;
    color: ${(props) => props.theme.colors.prime1};
    justify-content: center;
`
