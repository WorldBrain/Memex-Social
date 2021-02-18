import React from 'react'
import styled from 'styled-components'
import { UITaskState } from '../../../../main-ui/types'
import LoadingIndicator from '../../../../common-ui/components/loading-indicator'
import ErrorBox from '../../../../common-ui/components/error-box'
import { Margin } from 'styled-components-spacing'
import { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import AnnotationBox, { AnnotationBoxProps } from './annotation-box'
import {
    AnnotationConversationStates,
    AnnotationConversationState,
} from '../../../content-conversations/ui/types'
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import AnnotationReply, {
    AnnotationReplyProps,
} from '../../../content-conversations/ui/components/annotation-reply'
import NewAnnotationReply, {
    NewAnnotationReplyEventHandlers,
} from '../../../content-conversations/ui/components/new-annotation-reply'
import { SharedAnnotationInPage } from './types'
import { ConversationReplyReference } from '@worldbrain/memex-common/lib/content-conversations/types'
import { ProfilePopupProps } from '../../../user-management/ui/containers/profile-popup-container'
import { UserReference } from '../../../user-management/types'

const AnnotationContainer = styled(Margin)`
    display: flex;
    justify-content: center;
`

const AnnotationLine = styled.span`
    height: auto;
    width: 4px;
    background: #e0e0e0;
    margin: -8px 10px 15px;
`

const AnnotationReplyContainer = styled.div`
    padding-top: 0.5rem;
    border-left: 4px solid #e0e0e0;
    padding-left: 10px;
`

const AnnotationList = styled.div`
    min-height: 60px;
    width: 100%;
`

const CenteredContent = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
`

export default function AnnotationsInPage(
    props: {
        loadState: UITaskState
        annotations?: Array<SharedAnnotationInPage | null> | null
        annotationConversations?: AnnotationConversationStates | null
        renderAnnotationBox?: (
            props: AnnotationBoxProps & { annotation: SharedAnnotationInPage },
        ) => React.ReactNode
        getAnnotationConversation?: (
            annotationReference: SharedAnnotationReference,
        ) => AnnotationConversationState | null
        hideNewReplyIfNotEditing?: boolean
        getAnnotationCreator?: (
            annotationReference: SharedAnnotationReference,
        ) => Pick<User, 'displayName'> | null | undefined
        getAnnotationCreatorRef?: (
            annotationReference: SharedAnnotationReference,
        ) => UserReference | null | undefined
        profilePopupProps?: Omit<ProfilePopupProps, 'userRef'>
        getReplyCreator?: (
            annotationReference: SharedAnnotationReference,
            replyReference: ConversationReplyReference,
        ) => Pick<User, 'displayName'> | null | undefined
        renderBeforeReplies?: (
            annotationReference: SharedAnnotationReference,
        ) => React.ReactNode
        renderReply?: (
            props: {
                annotationReference: SharedAnnotationReference
                replyReference: ConversationReplyReference
            } & AnnotationReplyProps,
        ) => React.ReactNode
        renderReplyBox?: (props: {
            annotationReference: SharedAnnotationReference
            replyReference: ConversationReplyReference
            children: React.ReactNode
        }) => React.ReactNode
        onToggleReplies?(event: {
            annotationReference: SharedAnnotationReference
        }): void
    } & NewAnnotationReplyEventHandlers,
) {
    if (props.loadState === 'pristine' || props.loadState === 'running') {
        return (
            <AnnotationContainer bottom="large">
                <AnnotationLine />
                <AnnotationList>
                    <CenteredContent>
                        <LoadingIndicator />
                    </CenteredContent>
                </AnnotationList>
            </AnnotationContainer>
        )
    }

    if (props.loadState === 'error') {
        return (
            <AnnotationContainer>
                <AnnotationLine />
                <CenteredContent>
                    <Margin bottom={'medium'}>
                        <ErrorBox>
                            Error loading page notes. <br /> Reload page to
                            retry.
                        </ErrorBox>
                    </Margin>
                </CenteredContent>
            </AnnotationContainer>
        )
    }

    if (!props.annotations) {
        return null
    }

    const renderAnnotation = (annotation: SharedAnnotationInPage) => {
        const conversation =
            props.getAnnotationConversation?.(annotation.reference) ??
            props.annotationConversations?.[annotation.linkId]
        return (
            <Margin key={annotation.linkId} bottom={'medium'}>
                <AnnotationWithReplies
                    {...props}
                    annotation={annotation}
                    annotationCreator={props.getAnnotationCreator?.(
                        annotation.reference,
                    )}
                    profilePopupProps={
                        props.profilePopupProps && {
                            ...props.profilePopupProps,
                            userRef: props.getAnnotationCreatorRef?.(
                                annotation.reference,
                            ) ?? { type: 'user-reference', id: '' },
                        }
                    }
                    conversation={conversation}
                    renderReplyBox={props.renderReplyBox}
                    hideNewReplyIfNotEditing={props.hideNewReplyIfNotEditing}
                />
            </Margin>
        )
    }

    return (
        <AnnotationContainer bottom="large">
            <AnnotationLine />
            <AnnotationList>
                {props.annotations.map(
                    (annotation) => annotation && renderAnnotation(annotation),
                )}
            </AnnotationList>
        </AnnotationContainer>
    )
}

export function AnnotationWithReplies(
    props: {
        annotation: SharedAnnotationInPage
        annotationCreator?: Pick<User, 'displayName'> | null
        profilePopupProps?: ProfilePopupProps
        renderAnnotationBox?: (
            props: AnnotationBoxProps & { annotation: SharedAnnotationInPage },
        ) => React.ReactNode
        conversation?: AnnotationConversationState
        hideNewReplyIfNotEditing?: boolean
        getReplyCreator?: (
            annotationReference: SharedAnnotationReference,
            replyReference: ConversationReplyReference,
        ) => Pick<User, 'displayName'> | null | undefined
        onToggleReplies?(event: {
            annotationReference: SharedAnnotationReference
        }): void
        renderBeforeReplies?: (
            annotationReference: SharedAnnotationReference,
        ) => React.ReactNode
        renderReply?: (
            props: {
                annotationReference: SharedAnnotationReference
                replyReference: ConversationReplyReference
            } & AnnotationReplyProps,
        ) => React.ReactNode
        renderReplyBox?: (props: {
            annotationReference: SharedAnnotationReference
            replyReference: ConversationReplyReference
            children: React.ReactNode
        }) => React.ReactNode
    } & NewAnnotationReplyEventHandlers,
) {
    const { annotation, conversation } = props

    const renderReply =
        props.renderReply ?? ((props) => <AnnotationReply {...props} />)

    return (
        <>
            <AnnotationBox
                annotation={annotation}
                creator={props.annotationCreator}
                profilePopupProps={props.profilePopupProps}
                hasReplies={!!conversation?.thread}
                onInitiateReply={() =>
                    props.onNewReplyInitiate?.({
                        annotationReference: annotation.reference,
                    })
                }
                onToggleReplies={() =>
                    props.onToggleReplies?.({
                        annotationReference: annotation.reference,
                    })
                }
            />
            {conversation && (
                <>
                    {conversation.expanded && (
                        <>
                            {props.renderBeforeReplies && (
                                <Margin left="small">
                                    <AnnotationReplyContainer>
                                        {props.renderBeforeReplies(
                                            annotation.reference,
                                        )}
                                    </AnnotationReplyContainer>
                                </Margin>
                            )}
                            {conversation.replies?.map?.((replyData) => {
                                const renderedReply = renderReply({
                                    ...replyData,
                                    annotationReference: annotation.reference,
                                    replyReference: replyData.reference,
                                    user:
                                        props.getReplyCreator?.(
                                            annotation.reference,
                                            replyData.reference,
                                        ) ?? replyData.user,
                                    profilePopupProps: props.profilePopupProps,
                                    renderItemBox:
                                        props.renderReplyBox &&
                                        ((boxProps) =>
                                            props.renderReplyBox?.({
                                                annotationReference:
                                                    annotation.reference,
                                                replyReference:
                                                    replyData.reference,
                                                ...boxProps,
                                            })),
                                })
                                if (!renderedReply) {
                                    return null
                                }
                                return (
                                    <Margin
                                        key={replyData.reference.id}
                                        left="small"
                                    >
                                        <AnnotationReplyContainer>
                                            {renderedReply}
                                        </AnnotationReplyContainer>
                                    </Margin>
                                )
                            })}
                            {(conversation.newReply.editing ||
                                !props.hideNewReplyIfNotEditing) && (
                                <Margin left="small">
                                    <AnnotationReplyContainer>
                                        <NewAnnotationReply
                                            conversation={conversation}
                                            {...props}
                                        />
                                    </AnnotationReplyContainer>
                                </Margin>
                            )}
                        </>
                    )}
                </>
            )}
        </>
    )
}
