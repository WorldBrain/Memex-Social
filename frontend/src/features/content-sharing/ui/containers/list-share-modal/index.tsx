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
import Select from '../../../../../common-ui/components/select'
import { linkAccessTypeToString } from './util'

export interface Props extends ListShareModalDependencies {}

export default class ListShareModal extends UIElement<
    Props,
    ListShareModalState,
    ListShareModalEvent
> {
    constructor(props: Props) {
        super(props, { logic: new Logic(props) })
    }

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

    renderAccessTypeSelect = () => (
        <Select
            value={this.state.addLinkAccessType}
            onChange={(accessType) =>
                this.processEvent('setAddLinkAccessType', {
                    accessType,
                })
            }
            options={[
                {
                    value: 'reader',
                    headerText: linkAccessTypeToString('reader'),
                    subText: 'Can view content and reply to notes',
                },
                {
                    value: 'contributor',
                    headerText: linkAccessTypeToString('contributor'),
                    subText: 'Add pages, notes, replies and delete own entries',
                },
            ]}
        />
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

const Text = styled.span``

const BoldText = styled.span``

const AddLinkBox = styled.div``

const AddLinkBoxTextContainer = styled.div``

const LinkContainer = styled.div``
const InviteLinksContainer = styled.div``

const LinkBox = styled.div``
