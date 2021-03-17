import React from 'react'
import styled from 'styled-components'
import { UIElement } from '../../../../../main-ui/classes'
import Logic from './logic'
import {
    ListShareModalDependencies,
    ListShareModalEvent,
    ListShareModalState,
    InviteLink,
    LinkAccessType,
} from './types'
import Overlay from '../../../../../main-ui/containers/overlay'
import Icon from '../../../../../common-ui/components/icon'
import Button from '../../../../../common-ui/components/button'
import { linkAccessTypeToString } from './util'

export interface Props extends ListShareModalDependencies {}

export default class ListShareModal extends UIElement<
    Props,
    ListShareModalState,
    ListShareModalEvent
> {
    private static accessTypeValues: Array<{
        accessType: LinkAccessType
        header: string
        subtext: string
        isDisabled?: boolean
    }> = [
        {
            accessType: 'reader',
            header: linkAccessTypeToString('reader'),
            subtext: 'Can view content and reply to notes',
        },
        {
            accessType: 'contributor',
            header: linkAccessTypeToString('contributor'),
            subtext: 'Add pages, notes, replies and delete own entries',
        },
    ]

    constructor(props: Props) {
        super(props, { logic: new Logic(props) })
    }

    private handleAccessTypeChange: React.ChangeEventHandler<HTMLSelectElement> = (
        e,
    ) => {
        this.processEvent('setAddLinkAccessType', {
            accessType: e.target.value as LinkAccessType,
        })
    }

    private renderAccessTypeSelect = () => (
        <Select
            value={this.state.addLinkAccessType}
            onChange={this.handleAccessTypeChange}
        >
            {ListShareModal.accessTypeValues.map((value) => (
                <Option key={value.accessType} value={value.accessType}>
                    {value.header}
                </Option>
            ))}
        </Select>
    )

    private renderCopyableLink = ({
        link,
        accessType,
        linkIndex,
    }: InviteLink & { linkIndex: number }) => (
        <LinkContainer>
            <Icon
                fileName="camera.svg"
                height="18px"
                onClick={() => this.processEvent('copyLink', { linkIndex })}
            />
            <LinkBox>{link}</LinkBox>
            <Text> invite as </Text>
            <BoldText>{linkAccessTypeToString(accessType)}</BoldText>
            <Icon
                fileName="camera.svg"
                height="18px"
                onClick={() =>
                    this.processEvent('requestLinkDelete', { linkIndex })
                }
            />
        </LinkContainer>
    )

    render() {
        return (
            <Overlay
                services={this.props.services}
                onCloseRequested={this.props.onCloseRequested}
            >
                <ModalContainer>
                    <Header>Invite by Link</Header>
                    <Text>Invite other people to view or collaborate</Text>
                    <AddLinkBox>
                        <AddLinkBoxTextContainer>
                            <Text>Create an invite link that grants </Text>
                            {this.renderAccessTypeSelect()}
                            <Text> access to anyone who opens it.</Text>
                        </AddLinkBoxTextContainer>
                        <Button
                            type="primary-action"
                            onClick={() => this.processEvent('addLink', null)}
                        >
                            Add Link
                        </Button>
                    </AddLinkBox>

                    <Header>Invite Links</Header>
                    <InviteLinksContainer>
                        {this.state.inviteLinks.map((link, linkIndex) =>
                            this.renderCopyableLink({ ...link, linkIndex }),
                        )}
                    </InviteLinksContainer>
                </ModalContainer>
            </Overlay>
        )
    }
}

const ModalContainer = styled.div``

const Header = styled.h1``
const Select = styled.select``
const Option = styled.option``

const Text = styled.span``

const BoldText = styled.span``

const AddLinkBox = styled.div``

const AddLinkBoxTextContainer = styled.div``

const LinkContainer = styled.div``
const InviteLinksContainer = styled.div``

const LinkBox = styled.div``
