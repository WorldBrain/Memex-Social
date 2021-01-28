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

const Container = styled.div<{ theme: Theme }>`
    min-height: 358px;
    max-height: 70vh;
    width: 648px;
    overflow-y: scroll;
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

export type ProfilePopupProps = ProfileEditModalDependencies

export default class ProfileEditModal extends UIElement<
    ProfileEditModalDependencies,
    ProfileEditModalState,
    ProfileEditModalEvent
> {
    constructor(props: ProfileEditModalDependencies) {
        super(props, { logic: new ProfileEditModalLogic(props) })
    }

    handleSaveClick() {
        this.processEvent('saveUserPublicProfile', { profileData: this.state.profileData,  })
    }

    handleCancelClick() {
        this.processEvent('hidePopup', null)
    }

    handleSetDisplayName

    handleSetProfileValue(key: keyof UserPublicProfile, value: string): void {
        this.processEvent('setProfileValue', { key, value })
    }

    render() {
        return (
            <Container>
                <Padding horizontal="large" vertical="large">
                    <Margin vertical="large">
                        <ButtonContainer>
                            <PrimaryActionButton
                                label="Save"
                                onClick={this.handleSaveClick}
                                minWidth="82px"
                            />
                            <SecondaryActionButton
                                label="Cancel"
                                onClick={this.handleCancelClick}
                                minWidth="82px"
                            />
                        </ButtonContainer>
                    </Margin>
                    <FormContainer>
                        <Margin vertical="medium">
                            <SectionHeader theme={theme}>
                                Profile Information
                            </SectionHeader>
                        </Margin>
                        <FormColumn maxWidth="260px">
                            <TextInput 
                                label="Display Name"
                                value={this.state.user?.displayName}
                            />
                        </FormColumn>
                    </FormContainer>
                </Padding>
            </Container>
        )
    }
}