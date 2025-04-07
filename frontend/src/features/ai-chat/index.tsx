import React from 'react'
import styled, { css } from 'styled-components'
import { useLogic } from '../../hooks/useLogic'
import { AiChatDependencies, AiChatLogic } from './logic'
import { AiChatResponseClient } from '@worldbrain/memex-common/lib/llm-endpoints/types'
import { AiChatMessageClient } from '@worldbrain/memex-common/lib/llm-endpoints/types'
import ChatInput from './components/chatInput'
import { Colors } from '../../constants/Colors'
export default function AiChat(props: AiChatDependencies) {
    const { logic, state } = useLogic(() => new AiChatLogic(props))

    let referenceIndex = 0

    const renderAssistantMessage = (message: AiChatResponseClient) => {
        return message.message.map((chunk, chunkIndex) => {
            console.log('chunk', chunk)
            return (
                <AssistantMessage type={chunk.type} key={chunk.text}>
                    {chunk.text}{' '}
                    {chunk.references?.map((reference, index) => {
                        referenceIndex++
                        console.log('reference', reference)
                        return (
                            <ReferencePill
                                onClick={() => logic.openReference(reference)}
                                key={reference.id}
                            >
                                {referenceIndex}
                            </ReferencePill>
                        )
                    })}
                </AssistantMessage>
            )
        })
    }

    const renderUserMessage = (message: AiChatMessageClient) => {
        return <div key={message.messageId}>{message.message}</div>
    }

    console.log('state.thread', state.thread)
    return (
        <Container>
            {state.thread?.messages.map(
                (message: AiChatMessageClient | AiChatResponseClient) => (
                    <ChatMessage key={message.messageId}>
                        {message.role === 'assistant'
                            ? renderAssistantMessage(message)
                            : renderUserMessage(message)}
                    </ChatMessage>
                ),
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
    type: 'header' | 'paragraph' | 'error'
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
