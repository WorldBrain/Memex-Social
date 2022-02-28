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
import { SecondaryActionButton } from '../../components/ActionButtons'
import { VALID_URL_TEST } from '../../../../../constants'
import Overlay from '../../../../../main-ui/containers/overlay'
import { UITaskState } from '../../../../../main-ui/types'
import LoadingScreen from '../../../../../common-ui/components/loading-screen'
import ErrorBox from '../../../../../common-ui/components/error-box'
import { PrimaryAction } from '../../../../../common-ui/components/PrimaryAction'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { SecondaryAction } from '../../../../../common-ui/components/SecondaryAction'
import LoadingIndicator from '../../../../../common-ui/components/loading-indicator'

const Container = styled.div<{ loadState: UITaskState; theme: Theme }>`
    margin: auto;
    min-height: 358px;
    max-height: 100%;
    width: 520px;
    flex-direction: column;

    background-color: ${(props) => props.theme.colors.background};
    padding-left: ${(props) => props.theme.spacing.small};
    padding-right: ${(props) => props.theme.spacing.small};
    padding-top: ${(props) => props.theme.spacing.small};
    padding-bottom: ${(props) => props.theme.spacing.small};
    & * {
        font-family: ${(props) => props.theme.fonts.primary};
    }

    ${(props) =>
        (props.loadState === 'running' || props.loadState === 'pristine') &&
        css`
            background: transparent;
        `}
`

const TextInputContainer = styled.div`
    display: flex;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-start;
    border: 1px solid ${(props) => props.theme.colors.lineLightGrey};
    min-height: 50px;
    border-radius: 8px;
    width: 100%;
    padding: 0 0 0 15px;
    align-items: center;
`

const TextInputOneLine = styled.input`
    outline: none;
    height: fill-available;
    width: fill-available;
    color: #96a0b5;
    font-size: 14px;
    border: none;
    background: transparent;
    color: ${(props) => props.theme.colors.darkerText};

    &::placeholder {
        color: #96a0b5;
    }
`
const SectionCircle = styled.div<{ size: string }>`
    background: ${(props) => props.theme.colors.backgroundHighlight};
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
    justify-content: flex-start;
`

const TextInputInfoText = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 12px;
    opacity: 0.7;
    padding-left: 10px;
    font-family: ${(props) => props.theme.fonts.primary};
`

const InfoText = styled.div<{ margin?: string }>`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 16px;
    margin: ${(props) => (props.margin ? props.margin : '0 0 20px 0')};
    font-weight: 500;
    line-height: 26px;
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
    color: ${(props) => props.theme.colors.darkerText};
    text-align: left;
`

const SectionHeaderDescription = styled(SectionHeader)`
    font-weight: ${(props) => props.theme.fontWeights.normal};
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

const TextInputMultiLine = styled.textarea`
    outline: none;
    height: fill-available;
    width: fill-available;
    color: #96a0b5;
    font-size: 14px;
    border: none;
    padding: 15px 0px;
    min-height: 150px;
    font-family: 'Inter';
    background: transparent;
    &::placeholder {
        color: ${(props) => props.theme.colors.lighterText};
    }
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

// const LargeUserAvatar = styled.div<{ path: string }>`
//     height: 100px;
//     width: 100px;
//     border-radius: 50px;
//     background-position: center;
//     background-size: contain;
//     background: url(${(props) => props.path});
// `

// const AvatarPlaceholder = styled.div<{ theme: Theme }>`
//     height: 100px;
//     width: 100px;
//     border-radius: 50px;
//     background: ${(props) => props.theme.colors.grey};
//     display: flex;
//     justify-content: center;
//     align-items: center;
// `

// const CameraIcon = styled(Icon)`
//     background-position: center;
//     background-size: contain;
// `

const StyledSecondaryButton = styled(SecondaryActionButton)`
    padding-top: 0;
    padding-bottom: 0;
`

const ResetEmailConfirmation = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    font-size: 14px;
    color: ${(props) => props.theme.colors.purple};
    justify-content: center;
`

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
        this.processEvent('confirmEmailChange', { value: value })
    }

    handleSetProfileValue(key: keyof UserPublicProfile, value: string): void {
        this.processEvent('setProfileValue', { key, value })
    }

    sendPasswordResetEmail(value: string) {
        this.processEvent('sendPasswordResetEmail', { value: value })
    }

    handleURLChange = (
        evt: React.ChangeEvent<HTMLInputElement>,
        errorIndex: number,
        urlPropName: ProfileWebLinkName,
    ) => {
        if (this.state.inputErrorArray[errorIndex]) {
            const newArray = [...this.state.inputErrorArray]
            const profileTypesHack: { [key: string]: string } = {
                ...this.state.userPublicProfile,
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

    testValidURL(url: string): boolean {
        return !VALID_URL_TEST.test(url)
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
                <Margin bottom="large">
                    <ButtonContainer>
                        <PrimaryAction
                            disabled={this.state.inputErrorArray.some(
                                (val) => val,
                            )}
                            label="Save"
                            onClick={() => this.handleSaveClick()}
                        />
                        <StyledSecondaryButton
                            label="Cancel"
                            onClick={() => this.props.onCloseRequested()}
                            minWidth="82px"
                        />
                    </ButtonContainer>
                </Margin>
                <Margin vertical="medium">
                    <SectionHeader theme={theme}>
                        Profile Information
                    </SectionHeader>
                </Margin>
                <DisplayNameContainer>
                    <TextInputContainer>
                        <Icon
                            icon={'personFine'}
                            heightAndWidth="20px"
                            hoverOff
                        />
                        <TextInputOneLine
                            value={this.state.user?.displayName}
                            onChange={(evt) => {
                                if (this.state.inputErrorArray[0]) {
                                    this.testDisplayName()
                                }
                                this.handleSetDisplayName(
                                    evt.currentTarget.value,
                                )
                            }}
                            placeholder="Display Name"
                        />
                    </TextInputContainer>
                    <TextInputInfoText>
                        Name shown on shared Spaces, page links and annotations
                    </TextInputInfoText>
                </DisplayNameContainer>

                <TextInputContainer>
                    <TextInputMultiLine
                        placeholder="Your Bio or Description"
                        value={this.state.userPublicProfile?.bio ?? ''}
                        onChange={(evt) =>
                            this.handleSetProfileValue(
                                'bio',
                                evt.currentTarget.value,
                            )
                        }
                    />
                </TextInputContainer>
                <Margin top={'large'}>
                    <SectionHeader small theme={theme}>
                        Social Links
                    </SectionHeader>
                </Margin>
                {this.state.profileLinks.map((linkObj, idx) => (
                    <Margin top={'small'}>
                        <TextInputContainer>
                            <Icon
                                icon={linkObj.icon}
                                heightAndWidth="16px"
                                hoverOff
                            />
                            <TextInputOneLine
                                placeholder={linkObj.label}
                                key={idx}
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
                            />
                        </TextInputContainer>
                    </Margin>
                ))}
                <Margin top="largest" bottom="small">
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

                <TextInputContainer>
                    <Icon
                        icon={'webMonetizationLogo'}
                        heightAndWidth="16px"
                        hoverOff
                    />
                    <TextInputOneLine
                        placeholder={'Add your payment pointer'}
                        value={
                            this.state.userPublicProfile?.paymentPointer ?? ''
                        }
                        onChange={(evt) =>
                            this.handleSetProfileValue(
                                'paymentPointer',
                                evt.currentTarget.value,
                            )
                        }
                    />
                </TextInputContainer>

                <Margin top="largest" bottom={'medium'}>
                    <SectionHeader theme={theme}>
                        Account Information
                    </SectionHeader>
                </Margin>
                <EmailBox>
                    <TextInputContainer>
                        <Icon icon={'mail'} heightAndWidth="20px" hoverOff />
                        <TextInputOneLine
                            value={this.state.email}
                            onChange={(event) =>
                                this.handleSetEmail(event.currentTarget.value)
                            }
                        />
                    </TextInputContainer>
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
                                color="purple"
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
                        <SecondaryAction
                            label="Reset Password"
                            onClick={() =>
                                this.sendPasswordResetEmail(this.state.email)
                            }
                            fontSize="14px"
                            icon={'reload'}
                            iconSize={'14px'}
                            iconColor={'purple'}
                            iconHoverOff={true}
                        />
                    ) : (
                        <ResetEmailConfirmation>
                            <SectionCircle size="30px">
                                <Icon
                                    icon={'check'}
                                    heightAndWidth="20px"
                                    color="purple"
                                />
                            </SectionCircle>
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
