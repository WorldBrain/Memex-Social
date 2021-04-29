import React from 'react'
import styled from 'styled-components'
import LoadingIndicator from '../../../../common-ui/components/loading-indicator'
import ErrorBox from '../../../../common-ui/components/error-box'
import { Margin } from 'styled-components-spacing'
import { keyPressAction } from '../../../../common-ui/utils/dom-events'
import TextArea from '../../../../common-ui/components/text-area'
import { NewReplyState } from '../types'

const NewReplyTextArea = styled.textarea<{ editing: boolean }>`
    width: 100%;
    height: ${(props) => (props.editing ? '150px' : '40px')};
    border: 0;
    background: #fff;
    border-radius: 3px;
    padding: 10px;
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 14px;
    outline: none;
    resize: vertical;
    min-height: 44px;
    border: 1px solid #e0e0e0;
`

const NewReplyActions = styled.div`
    display: flex;
    font-family: ${(props) => props.theme.fonts.primary};
`

const NewReplyConfirm = styled.div`
    cursor: pointer;
    border-radius: 3px;
    padding: 3px 6px;

    &:hover {
        background-color: #e0e0e0;
    }
`

const NewReplyCancel = styled.div`
    color: ${(props) => props.theme.colors.warning};
    cursor: pointer;
    border-radius: 3px;
    padding: 3px 6px;

    &:hover {
        background-color: #e0e0e0;
    }
`

const NewReplyRunning = styled.div`
    display: flex;
    justify-content: center;
`

export interface NewReplyEventHandlers {
    onNewReplyEdit?(event: { content: string }): void
    onNewReplyInitiate?(): void
    onNewReplyConfirm?(): void
    onNewReplyCancel?(): void
}

export default function NewReply(
    props: {
        newReply: NewReplyState
    } & NewReplyEventHandlers,
) {
    const { newReply } = props
    if (newReply.saveState === 'running') {
        return (
            <NewReplyRunning>
                <Margin vertical="medium">
                    <LoadingIndicator />
                </Margin>
            </NewReplyRunning>
        )
    }

    return (
        <>
            {newReply.saveState === 'error' && (
                <Margin bottom="small">
                    <ErrorBox>
                        Something went wrong saving your reply. Please try again
                        later.
                    </ErrorBox>
                </Margin>
            )}
            <TextArea
                autoFocus={newReply.editing}
                value={newReply.editing ? newReply.content : ''}
                // editing={newReply.editing}
                placeholder={'Add a new reply'}
                onClick={() => {
                    props.onNewReplyInitiate?.()
                }}
                onChange={(e) =>
                    props.onNewReplyEdit?.({
                        content: e.target.value,
                    })
                }
                onKeyDown={(e) => {
                    const action = keyPressAction(e)
                    if (action === 'confirm' && newReply.content.length > 0) {
                        return props.onNewReplyConfirm?.()
                    } else if (action === 'cancel') {
                        return props.onNewReplyCancel?.()
                    }
                }}
                renderTextarea={(inputProps) => (
                    <NewReplyTextArea
                        {...inputProps}
                        editing={newReply.editing}
                    />
                )}
            />
            {newReply.editing && (
                <NewReplyActions>
                    <NewReplyCancel onClick={() => props.onNewReplyCancel?.()}>
                        Cancel
                    </NewReplyCancel>
                    {newReply.content.length > 0 && (
                        <NewReplyConfirm
                            onClick={() => props.onNewReplyConfirm?.()}
                        >
                            Save
                        </NewReplyConfirm>
                    )}
                </NewReplyActions>
            )}
        </>
    )
}
