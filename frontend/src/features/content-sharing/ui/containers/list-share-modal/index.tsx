import React from 'react'
import styled from 'styled-components'
import { UIElement } from '../../../../../main-ui/classes'
import Logic from './logic'
import {
    ListShareModalDependencies,
    ListShareModalEvent,
    ListShareModalState,
    InviteLink,
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

    private renderDeleteModal = () =>
        this.state.linkDeleteIndex != null && (
            <Overlay
                services={this.props.services}
                onCloseRequested={() =>
                    this.processEvent('cancelLinkDelete', null)
                }
            >
                <DeleteModalContainer>
                    <Header>Sure you want to delete this link?</Header>
                    <Text>This action cannnot be undone.</Text>
                    <DeleteModalBtnContainer>
                        <Button
                            type="small"
                            onClick={() =>
                                this.processEvent('confirmLinkDelete', null)
                            }
                        >
                            Delete
                        </Button>
                        <Button
                            type="small"
                            onClick={() =>
                                this.processEvent('cancelLinkDelete', null)
                            }
                        >
                            Cancel
                        </Button>
                    </DeleteModalBtnContainer>
                </DeleteModalContainer>
            </Overlay>
        )

    private renderCopyableLink = ({
        link,
        accessType,
        linkIndex,
    }: InviteLink & { linkIndex: number }) => (
        <LinkContainer key={linkIndex}>
            <Icon
                fileName="web-logo.svg"
                height="18px"
                onClick={() => this.processEvent('copyLink', { linkIndex })}
            />
            <LinkBox>{link}</LinkBox>
            <Text> invite as </Text>
            <BoldText>{linkAccessTypeToString(accessType)}</BoldText>
            <Icon
                fileName="web-logo.svg"
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
            <>
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
                                onClick={() =>
                                    this.processEvent('addLink', null)
                                }
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
                        {this.state.showSuccessMsg && (
                            <AddSuccessBox>
                                <Icon fileName="memex-icon.svg" height="28px" />
                                <Text>
                                    Link created and copied to clipboard
                                </Text>
                            </AddSuccessBox>
                        )}
                    </ModalContainer>
                </Overlay>
                {this.renderDeleteModal()}
            </>
        )
    }
}

const ModalContainer = styled.div``

const DeleteModalContainer = styled.div``

const DeleteModalBtnContainer = styled.div``

const Header = styled.h1``

const Text = styled.span``

const BoldText = styled.span``

const AddLinkBox = styled.div``

const AddLinkBoxTextContainer = styled.div``

const LinkContainer = styled.div`
    display: flex;
`

const InviteLinksContainer = styled.div``

const AddSuccessBox = styled.div`
    display: flex;
`

const LinkBox = styled.div``
