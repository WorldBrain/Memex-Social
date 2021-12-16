import React from 'react'
import styled from 'styled-components'
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
import {
    PrimaryActionButton,
    SecondaryActionButton,
} from '../../components/ActionButtons'
import TextInput from '../../../../../common-ui/components/text-input'
import { VALID_URL_TEST } from '../../../../../constants'
import TextArea from '../../../../../common-ui/components/text-area'
import Overlay from '../../../../../main-ui/containers/overlay'
import { UITaskState } from '../../../../../main-ui/types'
import LoadingScreen from '../../../../../common-ui/components/loading-screen'
import ErrorBox from '../../../../../common-ui/components/error-box'

const Container = styled.div<{ theme: Theme }>`
    margin: auto;
    min-height: 358px;
    max-height: 100%;
    width: 100%;

    background-color: ${(props) => props.theme.colors.background};
    padding-left: ${(props) => props.theme.spacing.small};
    padding-right: ${(props) => props.theme.spacing.small};
    padding-top: ${(props) => props.theme.spacing.small};
    padding-bottom: ${(props) => props.theme.spacing.small};
`

const ButtonContainer = styled.div`
    width: 100%;
    height: min-content;
    display: flex;
    justify-content: flex-start;
`

const FormRow = styled.div`
    display: flex;
`

const SectionHeader = styled.div<{
    theme: Theme
}>`
    width: 100%;
    font-family: ${(props) => props.theme.fonts.primary};
    font-weight: ${(props) => props.theme.fontWeights.bold};
    font-size: ${(props) => props.theme.fontSizes.header};
    line-height: ${(props) => props.theme.lineHeights.header};
    color: ${(props) => props.theme.colors.primary};
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
`

const FormColumn = styled.div<{
    maxWidth?: string
}>`
    display: flex;
    flex-direction: column;
    width: 100%;
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

const StyledPrimaryButton = styled(PrimaryActionButton)<{
    theme: Theme
    taskState: UITaskState
}>`
    background: ${(props) =>
        props.taskState === 'pristine' || props.taskState === 'success'
            ? props.theme.colors.purple
            : props.taskState === 'running' || props.disabled
            ? props.theme.colors.background
            : props.theme.colors.warning};
    ${(props) =>
        props.taskState === 'running' || props.disabled
            ? `1px solid ${props.theme.colors.purple};`
            : ''}
    padding-top: 0;
    padding-bottom: 0;
`

const StyledSecondaryButton = styled(SecondaryActionButton)`
    padding-top: 0;
    padding-bottom: 0;
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
    private displayNameErrorMessage: string = 'Display Name must not be empty'
    private urlInputErrorMessage: string = 'This must be a valid URL'

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

    handleSetProfileValue(key: keyof UserPublicProfile, value: string): void {
        this.processEvent('setProfileValue', { key, value })
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
            <Container onKeyDown={this.handleEnterKeyDown}>
                <Margin bottom="large">
                    <ButtonContainer>
                        <StyledPrimaryButton
                            theme={theme}
                            taskState={this.state.savingTaskState}
                            disabled={this.state.inputErrorArray.some(
                                (val) => val,
                            )}
                            label="Save"
                            onClick={() => this.handleSaveClick()}
                            minWidth="82px"
                        />
                        <StyledSecondaryButton
                            label="Cancel"
                            onClick={() => this.props.onCloseRequested()}
                            minWidth="82px"
                        />
                    </ButtonContainer>
                </Margin>
                <FormRow>
                    <Margin vertical="medium">
                        <SectionHeader theme={theme}>
                            Profile Information
                        </SectionHeader>
                    </Margin>
                </FormRow>
                <FormRow>
                    <FormColumn maxWidth="263px">
                        <TextInput
                            label="Display Name"
                            value={this.state.user?.displayName}
                            onChange={(evt) => {
                                if (this.state.inputErrorArray[0]) {
                                    this.testDisplayName()
                                }
                                this.handleSetDisplayName(
                                    evt.currentTarget.value,
                                )
                            }}
                            error={this.state.inputErrorArray[0]}
                            errorMessage={this.displayNameErrorMessage}
                        />
                        <Margin vertical="small">
                            <TextArea
                                label="Bio"
                                rows={5}
                                value={this.state.userPublicProfile?.bio ?? ''}
                                onChange={(evt) =>
                                    this.handleSetProfileValue(
                                        'bio',
                                        evt.currentTarget.value,
                                    )
                                }
                            />
                        </Margin>
                        {this.state.profileLinks.map((linkObj, idx) => (
                            <TextInput
                                key={idx}
                                label={linkObj.label}
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
                                error={this.state.inputErrorArray[idx + 1]}
                                errorMessage={this.urlInputErrorMessage}
                            />
                        ))}
                        <FormRow>
                            <Margin top="medium">
                                <SectionHeader theme={theme}>
                                    Web Monetization Settings
                                </SectionHeader>
                                <SectionHeaderDescription>
                                    People can pay for your curations with
                                    WebMonetization micropayments. <br /> Takes
                                    5 minutes to set up.
                                    <WebLink
                                        as="span"
                                        onClick={() =>
                                            this.handleWebLinkClick(
                                                this
                                                    .webMonetizationLearnMoreURL,
                                            )
                                        }
                                    >
                                        {`How to find your payment pointer >>`}
                                    </WebLink>
                                </SectionHeaderDescription>
                            </Margin>
                        </FormRow>
                    </FormColumn>
                    {/*<FormColumn maxWidth="186px">
                    {this.state.userPublicProfile.avatarURL && (
                        <LargeUserAvatar
                            path={
                                this.state.userPublicProfile.avatarURL
                            }
                        />
                    )}
                    {!this.state.userPublicProfile.avatarURL && (
                        <AvatarPlaceholder>
                            <CameraIcon
                                height="30px"
                                fileName="camera.svg"
                            />
                        </AvatarPlaceholder>
                    )}
                </FormColumn>
            */}
                </FormRow>
                <FormRow>
                    <FormColumn maxWidth="263px">
                        <TextInput
                            label=""
                            value={
                                this.state.userPublicProfile?.paymentPointer ??
                                ''
                            }
                            onChange={(evt) =>
                                this.handleSetProfileValue(
                                    'paymentPointer',
                                    evt.currentTarget.value,
                                )
                            }
                        />
                    </FormColumn>
                </FormRow>
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
