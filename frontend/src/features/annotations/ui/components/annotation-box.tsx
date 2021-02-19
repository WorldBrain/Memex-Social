import DOMPurify from 'dompurify'
import React from 'react'
import styled from 'styled-components'
import { Margin } from 'styled-components-spacing'
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { SharedAnnotation } from '@worldbrain/memex-common/lib/content-sharing/types'
import ItemBox from '../../../../common-ui/components/item-box'
import ItemBoxBottom from '../../../../common-ui/components/item-box-bottom'
import Markdown from '../../../../common-ui/components/markdown'
import { ProfilePopupProps } from '../../../user-management/ui/containers/profile-popup-container'

const commentImage = require('../../../../assets/img/comment.svg')
const replyImage = require('../../../../assets/img/reply.svg')

const StyledAnnotationBox = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
`

const HighlightBox = styled(Margin)`
    display: flex;
    align-items: center;
    padding: 10px 15px 10px 15px;
    width: 100%;
`

// const HighlightIndicator = styled.div`
//     background-color: #d4e8ff;
//     border-radius: 5px;
//     min-width: 7px;
//     min-height: 40px;
//     margin-right: 10px;
//     height: 100%;
// `

const AnnotationBody = styled.span`
    white-space: normal;
    background-color: #d4e8ff;
    padding: 1px 5px;
    box-decoration-break: clone;
    font-size: 14px;
    color: ${(props) => props.theme.colors.primary};
    font-weight: 400;
    font-style: italic;
`

const AnnotationComment = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.primary};
    padding: 10px 15px;

    & *:first-child {
        margin-top: 0;
    }

    & *:last-child {
        margin-bottom: 0;
    }
`

const Separator = styled.div`
    border-top: 0.5px solid #e0e0e0;
`

const AnnotationTopBox = styled.div`
    padding: 5px 0 0 0;
    display: flex;
    flex-direction: column;
`

const DOM_PURIFY_CONFIG: DOMPurify.Config = {
    ALLOWED_TAGS: ['p', 'br', '#text'],
    ALLOWED_ATTR: [],
}

const preserveLinebreaks = (s: string | undefined) =>
    s
        ? (DOMPurify.sanitize(
              s.trim().replace(/\n/g, '<br>'),
              DOM_PURIFY_CONFIG,
          ) as string)
        : ''

export interface AnnotationBoxProps {
    annotation: Pick<SharedAnnotation, 'body' | 'comment' | 'createdWhen'>
    creator?: Pick<User, 'displayName'> | null
    profilePopupProps?: ProfilePopupProps
    hasReplies?: boolean
    areRepliesExpanded?: boolean
    onInitiateReply?(): void
    onToggleReplies?(): void
}

export default function AnnotationBox(props: AnnotationBoxProps) {
    const { annotation } = props
    return (
        <ItemBox>
            <StyledAnnotationBox>
                <AnnotationTopBox>
                    {annotation.body && (
                        <HighlightBox>
                            <Margin>
                                <AnnotationBody
                                    dangerouslySetInnerHTML={{
                                        __html: preserveLinebreaks(
                                            annotation.body,
                                        ),
                                    }}
                                />
                            </Margin>
                        </HighlightBox>
                    )}
                    {annotation.body && annotation.comment && <Separator />}
                    {annotation.comment && (
                        <Margin>
                            <AnnotationComment>
                                <Markdown>{annotation.comment}</Markdown>
                            </AnnotationComment>
                        </Margin>
                    )}
                </AnnotationTopBox>
                <ItemBoxBottom
                    creationInfo={{
                        createdWhen: annotation.createdWhen,
                        creator: props.creator,
                    }}
                    profilePopupProps={props.profilePopupProps}
                    actions={[
                        props.hasReplies &&
                            props.onToggleReplies && {
                                key: 'toggle-replies',
                                image: commentImage,
                                onClick: props.onToggleReplies,
                            },
                        props.onInitiateReply && {
                            key: 'new-reply',
                            image: replyImage,
                            onClick: props.onInitiateReply,
                        },
                    ]}
                />
            </StyledAnnotationBox>
        </ItemBox>
    )
}
