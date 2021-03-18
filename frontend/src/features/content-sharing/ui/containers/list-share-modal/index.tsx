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
import { Margin } from 'styled-components-spacing'

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

    private AddLink = () => {
        this.processEvent('addLink', null)
        setTimeout(() => {
            this.setState({
                showSuccessMsg: false
            })
            console.log(this.state.showSuccessMsg)
        }
            ,2000)
    }

    private renderCopyableLink = ({
        link,
        accessType,
        linkIndex,
    }: InviteLink & { linkIndex: number }) => (
        <Margin bottom="smallest">
        <LinkContainer key={linkIndex}>
            <CopyLinkBox>
                <Icon
                    fileName="copy.svg"
                    height="16px"
                    onClick={() => this.processEvent('copyLink', { linkIndex })}
                />
                <Margin horizontal="small">
                    <LinkBox>{link}</LinkBox>
                </Margin>
                <PermissionText> 
                    <Margin right="smallest">invite as</Margin>
                    <BoldText>{linkAccessTypeToString(accessType)}</BoldText>
                </PermissionText>
            </CopyLinkBox>
            <Icon
                fileName="remove.svg"
                height="16px"
                onClick={() =>
                    this.processEvent('requestLinkDelete', { linkIndex })
                }
            />
        </LinkContainer>
        </Margin>
    )

    renderAccessTypeSelect = () => (
        <Margin horizontal="small">
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
        </Margin>
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
                        <Text>Invite other people to view or collaborate on this collection</Text>
                        <Margin top="medium">
                            <AddLinkBox>
                                <Margin bottom="small">
                                    <AddLinkBoxTextContainer>
                                        <Text>Create an invite link that grants </Text>
                                        {this.renderAccessTypeSelect()}
                                        <Text> access to anyone who opens it.</Text>
                                    </AddLinkBoxTextContainer>
                                </Margin>
                                <ButtonBox>
                                    <Button
                                        type="primary-action"
                                        onClick={()=> this.AddLink()}
                                    >
                                        Add Link
                                    </Button>
                                    {this.state.showSuccessMsg && (
                                        <Margin left="medium">
                                        <SuccessContainer>
                                                <AddSuccessBox>
                                                    <Margin right="small">
                                                    <Icon fileName="checkRound.svg" height="20px" />
                                                    </Margin>
                                                    <SuccessText>
                                                        Link created and copied to clipboard
                                                    </SuccessText>
                                                </AddSuccessBox>
                                        </SuccessContainer>
                                        </Margin>
                                    )}
                                </ButtonBox>
                            </AddLinkBox>
                        </Margin>
                        {this.state.inviteLinks.length !== 0 && (
                            <InviteLinksBox>
                                <Margin top="medium">
                                    <Margin bottom="small">
                                        <Header>Invite Links</Header>
                                    </Margin>
                                    <InviteLinksContainer>
                                        {this.state.inviteLinks.map((link, linkIndex) =>
                                            this.renderCopyableLink({ ...link, linkIndex }),
                                        )}
                                    </InviteLinksContainer>
                                </Margin>
                            </InviteLinksBox>
                        )}
                    </ModalContainer>
                </Overlay>
                {this.renderDeleteModal()}
            </>
        )
    }
}

const ModalContainer = styled.div`
    width: 100%;
    Padding: 20px;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;

    & * {
        font-family: ${(props) => props.theme.fonts.primary};
    }
`

const DeleteModalContainer = styled.div``

const DeleteModalBtnContainer = styled.div``

const Header = styled.div`
    font-size: 18px;
    font-weight: bold;
    color: ${(props) => props.theme.colors.primary};
`

const Text = styled.span`
    font-size: 14px;
    color: ${(props) => props.theme.colors.primary};
    opacity: 0.8;
`

const PermissionText = styled.span`
    font-size: 14px;
    color: ${(props) => props.theme.colors.primary};
    opacity: 0.8;
    display: flex;
    flex-direction: row;
`

const SuccessText = styled.span`
    font-size: 12px;
    color: ${(props) => props.theme.colors.primary};
    font-weight: bold;
    display: flex;
    flex-direction: row;
`

const BoldText = styled.span`
    font-weight: bold;
`

const AddLinkBox = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    background: ${(props) => props.theme.colors.lightgrey};
    border-radius: 5px;
    padding 20px 20px; 
    flex-direction: column;   
`

const AddLinkBoxTextContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`

const LinkContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`

const PrimaryButton = styled.div`
    display: flex;
    justify-content: center;
    padding: 5px 10px;
    font-size: 14px;
    background-color: ${(props) => props.theme.colors.secondary};
    border-radius: 3px;
    cursor: pointer;
    font-weight: 600;
    color: ${(props) => props.theme.colors.primary};
    text-decoration: none;
`

const InviteLinksContainer = styled.div`
    
`

const AddSuccessBox = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
    height: 34px;
    border-radius: 3px;
`

const InviteLinksBox = styled.div `
    width: 100%;
`

const LinkBox = styled.div`
    display: flex;
    background-color: ${(props) => props.theme.colors.grey};
    font-size: 12px;
    padding: 5px 10px;
    border-radius: 3px;
`

const CopyLinkBox = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
`

const SuccessContainer = styled.div`

    > div {
        width: 100%;
    }
`

const ButtonBox = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
`



