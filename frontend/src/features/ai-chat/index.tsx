import React, { useRef } from 'react'
import styled, { css } from 'styled-components'
import { useLogic } from '../../hooks/useLogic'
import { AiChatDependencies, AiChatLogic } from './logic'
import ChatInput from './components/chatInput'
import {
    AiChatMessageAssistantClient,
    AiChatMessageUserClient,
    AiChatResponseChunk,
    AiChatThreadClient,
} from '@worldbrain/memex-common/lib/ai-chat/service/types'

export default function AiChat(props: AiChatDependencies) {
    const { logic, state } = useLogic(AiChatLogic, props)
    const messagesRef = useRef<HTMLDivElement[]>([])

    let referenceIndex = 0

    const renderAssistantMessage = (message: string) => {
        return <AssistantMessage>{message}</AssistantMessage>
    }

    const renderUserMessage = (message: AiChatMessageUserClient) => {
        if (state.editingMessageId === message.messageId) {
            return (
                <ChatInput
                    services={props.services}
                    storage={props.storage}
                    imageSupport={props.imageSupport}
                    getRootElement={props.getRootElement}
                    storageManager={props.storageManager}
                    sendMessage={(newContent: string) => {
                        logic.sendMessage(message.messageId)
                    }}
                />
            )
        }

        return (
            <UserMessageContainer>
                <UserMessageContent>{message.content}</UserMessageContent>
                <EditButton
                    onClick={() => logic.editMessage(message.messageId)}
                >
                    Edit
                </EditButton>
            </UserMessageContainer>
        )
    }

    return (
        <Container>
            {state.thread?.messages.map(
                (
                    message:
                        | AiChatMessageUserClient
                        | AiChatMessageAssistantClient,
                ) => {
                    return (
                        <ChatMessage key={message.messageId}>
                            {message.role === 'assistant'
                                ? renderAssistantMessage(message.content)
                                : renderUserMessage(message)}
                        </ChatMessage>
                    )
                },
            )}
            <ChatInput
                services={props.services}
                storage={props.storage}
                imageSupport={props.imageSupport}
                getRootElement={props.getRootElement}
                storageManager={props.storageManager}
                sendMessage={(message: string) => logic.sendMessage(message)}
            />
        </Container>
    )
}

const Container = styled.div`
    background: linear-gradient(to top right, #111317, #111317);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    height: 100vh;
`
const ChatMessage = styled.div`
    color: white;
`

const AssistantMessage = styled.div<{
    type: 'header' | 'paragraph' | 'list' | 'error'
}>`
    color: ${(props) => props.theme.colors.greyScale7};
    opacity: 0;
    animation: fadeIn 300ms ease-in-out forwards;
    display: flex;

    ${({ type }) => {
        if (type === 'header') {
            return css`
                font-size: 16px;
                font-weight: 600;
            `
        }
    }}

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`

const ReferencePill = styled.span`
    background-color: ${(props) => props.theme.colors.greyScale3};
    color: ${(props) => props.theme.colors.white};
    padding: 3px 7px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 400;
    margin-left: 5px;
    width: fit-content;
`

const UserMessageContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`

const UserMessageContent = styled.div`
    flex: 1;
`

const EditButton = styled.button`
    background: transparent;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    color: ${(props) => props.theme.colors.greyScale7};
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;

    &:hover {
        background: ${(props) => props.theme.colors.greyScale3};
    }
`
