import React from 'react'
import styled from 'styled-components'
import LoadingIndicator from '../../../../common-ui/components/loading-indicator'
import ErrorBox from '../../../../common-ui/components/error-box'
import { Margin } from 'styled-components-spacing'
import { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import { AnnotationConversationState } from '../../../content-conversations/ui/types'
import { keyPressAction } from '../../../../common-ui/utils/dom-events'
import { SharedAnnotationInPage } from '../../../annotations/ui/components/types'

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
    box-shadow: rgba(0, 0, 0, 0.06) 0px 2px 4px 0px inset;
    resize: vertical;
    min-height: 40px;
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

export interface NewAnnotationReplyEventHandlers {
    onNewReplyInitiate?(event: {
        annotationReference: SharedAnnotationReference
    }): void
    onNewReplyEdit?(event: {
        annotationReference: SharedAnnotationReference
        content: string
    }): void
    onNewReplyConfirm?(event: {
        annotationReference: SharedAnnotationReference
    }): void
    onNewReplyCancel?(event: {
        annotationReference: SharedAnnotationReference
    }): void
}

export default function NewAnnotationReply(
    props: {
        annotation: SharedAnnotationInPage
        conversation: Pick<AnnotationConversationState, 'newReply'>
    } & NewAnnotationReplyEventHandlers,
) {
    const { annotation, conversation } = props
    const { newReply } = conversation
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
            <NewReplyTextArea
                autoFocus={newReply.editing}
                value={newReply.editing ? newReply.content : ''}
                editing={newReply.editing}
                placeholder={'Add a new reply'}
                onClick={() => {
                    props.onNewReplyInitiate?.({
                        annotationReference: annotation.reference,
                    })
                }}
                onChange={(e) =>
                    props.onNewReplyEdit?.({
                        annotationReference: annotation.reference,
                        content: e.target.value,
                    })
                }
                onKeyDown={(e) => {
                    const action = keyPressAction(e)
                    if (action === 'confirm' && newReply.content.length > 0) {
                        return props.onNewReplyConfirm?.({
                            annotationReference: annotation.reference,
                        })
                    } else if (action === 'cancel') {
                        return props.onNewReplyCancel?.({
                            annotationReference: annotation.reference,
                        })
                    }
                }}
            />
            {newReply.editing && (
                <NewReplyActions>
                    <NewReplyCancel
                        onClick={() =>
                            props.onNewReplyCancel?.({
                                annotationReference: annotation.reference,
                            })
                        }
                    >
                        Cancel
                    </NewReplyCancel>
                    {newReply.content.length > 0 && (
                        <NewReplyConfirm
                            onClick={() =>
                                props.onNewReplyConfirm?.({
                                    annotationReference: annotation.reference,
                                })
                            }
                        >
                            Save
                        </NewReplyConfirm>
                    )}
                </NewReplyActions>
            )}
        </>
    )
}
