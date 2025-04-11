import React, { useRef } from 'react'
import styled, { css } from 'styled-components'
import { useLogic } from '../../../../hooks/useLogic'
import { ChatInputDependencies, ChatInputLogic } from './logic'
import { RESULTS_LIST_MAX_WIDTH } from '../../../../dashboard'
import {
    AIEditor,
    MemexAIqueryInstance,
} from '@worldbrain/memex-common/ts/ai-chat/editor'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { AvailableModels } from '@worldbrain/memex-common/lib/ai-chat/constants'

export default function ChatInput(props: ChatInputDependencies) {
    const { logic, state } = useLogic(ChatInputLogic, props)
    const modelSelectorRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<MemexAIqueryInstance>()

    const renderModelSelector = () => {
        return (
            <PopoutBox
                getPortalRoot={props.getRootElement}
                closeComponent={() => logic.setShowModelSelector(false)}
                targetElementRef={modelSelectorRef.current ?? undefined}
            >
                {AvailableModels.map((model) => {
                    return (
                        <PrimaryAction
                            key={model.id}
                            label={model.name}
                            type="glass"
                            onClick={() => logic.selectModel(model)}
                        />
                    )
                })}
            </PopoutBox>
        )
    }

    return (
        <ChatInputContainer
            // onClick={() => logic.focusEditor()}
            expanded={state.editorOptionsExpanded}
        >
            {/* <Input
                    value={state.message}
                    onChange={(e) => logic.updateMessage(e.target.value)}
                    placeholder="Ask a question or generate reports..."
                /> */}
            <AIEditor
                getRootElement={props.getRootElement}
                imageSupport={props.imageSupport}
                openImageInPreview={() => Promise.resolve()}
                // sendOffUserPrompt={() => logic.sendMessage(state.message)}
                updatePromptState={async () => {
                    const markdown = await editorRef.current?.getMarkdown()
                    if (markdown) {
                        logic.updateMessage(markdown)
                    }
                }}
                setEditorInstanceRef={(editor: MemexAIqueryInstance) => {
                    editorRef.current = editor
                }}
                readOnly={false}
                // activeEditor={true}
                // placeholder="Ask a question or generate reports..."
                // getYoutubePlayer={() => {}}
                onFocus={() => logic.focusEditor()}
            />
            <BottomBar>
                {state.showModelSelector && renderModelSelector()}
                <PrimaryAction
                    label={state.selectedModel?.name || 'Select Model'}
                    type="glass"
                    onClick={() => {
                        logic.setShowModelSelector(true)
                    }}
                    innerRef={modelSelectorRef}
                />
                <SendButton onClick={() => logic.sendMessage(state.message)}>
                    Send
                </SendButton>
            </BottomBar>
        </ChatInputContainer>
    )
}

const ChatInputContainer = styled.div<{ expanded: boolean }>`
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: fit-content;
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
    ${({ expanded }) =>
        expanded &&
        css`
            width: 100%;
            flex-direction: column;
            border-radius: 20px;
        `}
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

const BottomBar = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 11.71px;
    width: 100%;
    justify-content: flex-end;
`
