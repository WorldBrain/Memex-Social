import React from 'react'
import styled from 'styled-components'
import { useLogic } from '../../../../hooks/useLogic'
import { ChatInputDependencies, ChatInputLogic } from './logic'
import { RESULTS_LIST_MAX_WIDTH } from '../../../../dashboard'
export default function ChatInput(props: ChatInputDependencies) {
    const { logic, state } = useLogic(() => new ChatInputLogic(props))

    return (
        <BottomBox>
            <ChatInputContainer>
                <Input
                    value={state.message}
                    onChange={(e) => logic.updateMessage(e.target.value)}
                    placeholder="Ask a question or generate reports..."
                />
                <SendButton onClick={() => logic.sendMessage(state.message)}>
                    Send
                </SendButton>
            </ChatInputContainer>
        </BottomBox>
    )
}

const BottomBox = styled.div`
    position: absolute;
    width: 100%;
    height: 10%;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: linear-gradient(180deg, rgba(17, 19, 23, 0) 0%, #111317 67.51%);
    padding: 0 20px 20px 20px;
    box-sizing: border-box;
    justify-content: center;
    display: flex;
`

const ChatInputContainer = styled.div`
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 11.7132px 11.7132px 11.7132px 23.4263px;
    gap: 11.71px;
    background: rgba(67, 67, 67, 0.49);
    box-shadow: -1.17132px -1.17132px 1.02224px -0.51112px
            rgba(121, 121, 121, 0.7),
        inset 0px 1.78892px 0px rgba(49, 38, 38, 0.25);
    backdrop-filter: blur(7.565px);
    /* Note: backdrop-filter has minimal browser support */
    border-radius: 70.279px;
    max-width: ${RESULTS_LIST_MAX_WIDTH}px;
    width: 100%;
`

const Input = styled.input`
    font-family: 'Geist', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.51em;
    color: #c8c7c5;
    background: transparent;
    border: none;
    outline: none;
    width: 100%;
    &::placeholder {
        color: #c8c7c5;
    }
`

const SendButton = styled.button`
    background: #5e6ad2;
    border-radius: 117.13px;
    padding: 5.71px;
    width: 87.85px;
    border: none;
    cursor: pointer;
    font-family: 'Geist', sans-serif;
    font-weight: 400;
    font-size: 16.4px;
    color: #eeeeee;
    box-shadow: 0px 4.69px 4.69px rgba(23, 23, 23, 0.25);
`
