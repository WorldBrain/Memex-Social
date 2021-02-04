import React from 'react'
import styled from 'styled-components'
import { Margin, Padding } from "styled-components-spacing";

import { UIElement } from '../../../../../main-ui/classes'
import { Theme } from '../../../../../main-ui/styles/types'
import {
    ProfileEditModalDependencies,
    ProfileEditModalEvent,
    ProfileEditModalState,
} from './types'
import { UserPublicProfile } from '../../../types'

import { theme } from '../../../../../main-ui/styles/theme'
import ProfileEditModalLogic from './logic'
import { PrimaryActionButton, SecondaryActionButton } from '../../components/ActionButtons';
import TextInput from '../../../../../common-ui/components/text-input'
import { DOMAIN_TLD_PATTERN } from '../../../../../constants';
import TextArea from '../../../../../common-ui/components/text-area';
import Icon from '../../../../../common-ui/components/icon';
import Overlay from '../../../../../main-ui/containers/overlay';

const Container = styled.div<{ theme: Theme }>`
    margin: auto;
    min-height: 358px;
    max-height: 70vh;
    width: 648px;
    overflow-y: scroll;

    background-color: ${props => props.theme.colors.background};
    padding-left: ${props => props.theme.spacing.large};
    padding-right: ${props => props.theme.spacing.large};
    padding-top: ${props => props.theme.spacing.large};
    padding-bottom: ${props => props.theme.spacing.large};
`

const ButtonContainer = styled.div`
    width: 100%;
    height: min-content;
    display: flex;
    justify-content: center;
`

const FormContainer = styled.div`
    display: flex;
`

const SectionHeader = styled.div<{
    theme: Theme
}>`
    width: 100%;
    font-family: ${props => props.theme.fonts.primary};
    font-weight: ${props => props.theme.fontWeights.bold};
    font-size: ${props => props.theme.fontSizes.header};
    line-height: ${props => props.theme.lineHeights.header};
    color: ${props => props.theme.colors.primary};
    text-align: left;
`

const FormColumn = styled.div<{
    maxWidth?: string
}>`
    display: flex;
    flex-direction: column;
    ${props => props.maxWidth && `max-width: ${props.maxWidth}`};
`

const LargeUserAvatar = styled.div<{ path: string }>`
    height: 100px;
    width: 100px;
    border-radius: 50px;
    background-position: center;
    background-size: contain;
    background: url(${props => props.path});
`

const AvatarPlaceholder = styled.div<{ theme: Theme }>`
    height: 100px;
    width: 100px;
    border-radius: 50px;
    background: ${props => props.theme.colors.grey};
    display: flex;
    justify-content: center;
    align-items: center;
`

const CameraIcon = styled(Icon)`
    background-position: center;
    background-size: contain;
`

const StyledPrimaryButton = styled(PrimaryActionButton)`
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

    private displayNameErrorMessage: string = 'Display Name must not be empty'
    private urlInputErrorMessage: string = 'This must be a valid URL'

    handleSaveClick() {
        this.processEvent('saveProfile', { profileData: this.state.userPublicProfile, displayName: this.state.user?.displayName ?? '' })
    }

    handleSetDisplayName(evt: React.ChangeEvent<HTMLInputElement>) {
        this.processEvent('setDisplayName', { value: evt.currentTarget.value })
    }

    handleSetProfileValue(key: keyof UserPublicProfile, value: string): void {
        this.processEvent('setProfileValue', { key, value })
    }

    testDisplayName() {
        const newArray = [...this.state.inputErrorArray]
        newArray[0] = !this.state.user?.displayName
        this.processEvent('setErrorArray', { newArray })
    }

    testValidURL(index: number, url: string) {
        const newArray = [...this.state.inputErrorArray]
        newArray[index] = !DOMAIN_TLD_PATTERN.test(url)
        this.processEvent('setErrorArray', { newArray })
    }

    render() {
        return (
            <Overlay services={this.props.services} onCloseRequested={this.props.onCloseRequested}>
                <Container>
                    <Margin vertical="large">
                        <ButtonContainer>
                            <StyledPrimaryButton
                                label="Save"
                                onClick={this.handleSaveClick}
                                minWidth="82px"
                            />
                            <StyledSecondaryButton
                                label="Cancel"
                                onClick={() => this.props.onCloseRequested()}
                                minWidth="82px"
                            />
                        </ButtonContainer>
                    </Margin>
                    <FormContainer>
                        <FormColumn maxWidth="263px">
                            <Margin vertical="medium">
                                <SectionHeader theme={theme}>
                                    Profile Information
                                </SectionHeader>
                            </Margin>
                            <TextInput 
                                label="Display Name"
                                value={this.state.user?.displayName}
                                onConfirm={() => this.testDisplayName()}
                                error={this.state.inputErrorArray[0]}
                                errorMessage={this.displayNameErrorMessage}
                            />
                            <TextArea
                                label="Bio"
                                rows={5}
                                value={this.state.userPublicProfile.bio}
                            />
                            <TextInput
                                label="Website"
                                value={this.state.userPublicProfile.websiteURL}
                                onConfirm={() => this.testValidURL(1, this.state.userPublicProfile.websiteURL)}
                                error={this.state.inputErrorArray[1]}
                                errorMessage={this.urlInputErrorMessage}
                            />
                            <TextInput
                                label="Twitter"
                                value={this.state.userPublicProfile.twitterURL}
                                onConfirm={() => this.testValidURL(2, this.state.userPublicProfile.twitterURL)}
                                error={this.state.inputErrorArray[2]}
                                errorMessage={this.urlInputErrorMessage}
                            />
                            <TextInput
                                label="Medium"
                                value={this.state.userPublicProfile.mediumURL}
                                onConfirm={() => this.testValidURL(3, this.state.userPublicProfile.mediumURL)}
                                error={this.state.inputErrorArray[3]}
                                errorMessage={this.urlInputErrorMessage}
                            />
                            <TextInput
                                label="Substack"
                                value={this.state.userPublicProfile.substackURL}
                                onConfirm={() => this.testValidURL(4, this.state.userPublicProfile.substackURL)}
                                error={this.state.inputErrorArray[4]}
                                errorMessage={this.urlInputErrorMessage}
                            />
                        </FormColumn>
                        <FormColumn maxWidth="186px">
                            {this.state.userPublicProfile.avatarURL && <LargeUserAvatar path={this.state.userPublicProfile.avatarURL} />}
                            {!this.state.userPublicProfile.avatarURL && <AvatarPlaceholder>
                                <CameraIcon height="30px" fileName="camera.svg" />
                            </AvatarPlaceholder>}
                        </FormColumn>
                    </FormContainer>
                </Container>
            </Overlay>
        )
    }
}