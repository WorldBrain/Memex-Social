import React from 'react'
import styled, { css } from 'styled-components'
import { useLogic } from '../../hooks/useLogic'
import { AnnotationItemDependencies, AnnotationItemLogic } from './logic'
import ItemBox from '../../common-ui/components/item-box'
import Markdown from '../../common-ui/components/markdown'
import { RGBAobjectToString } from '@worldbrain/memex-common/ts/common-ui/components/highlightColorPicker/utils'
import AnnotationEdit from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotation-edit'
import { theme } from '../../main-ui/styles/theme'

export default function AnnotationItem(props: AnnotationItemDependencies) {
    const { logic, state } = useLogic(() => new AnnotationItemLogic(props))
    return (
        <ItemBox
            onMouseOver={() => logic.setIsHovering(true)}
            onMouseLeave={() => logic.setIsHovering(false)}
            highlight={state.isSelected}
        >
            {props.annotation.body && (
                <HighlightBox onClick={props.onClick}>
                    {!state.isScreenshotAnnotation && (
                        <HighlightBar
                            color={
                                props.annotation.color
                                    ? RGBAobjectToString(
                                          JSON.parse(
                                              props.annotation.color as string,
                                          )[0],
                                      )
                                    : theme.colors.prime2
                            }
                        />
                    )}
                    <HighlightContainer
                        isScreenshotAnnotation={state.isScreenshotAnnotation}
                    >
                        {props.annotation.color &&
                            JSON.parse(props.annotation.color as string)[1] !=
                                null && (
                                <HighlightLabelPill
                                    color={
                                        props.annotation.color &&
                                        RGBAobjectToString(
                                            JSON.parse(
                                                props.annotation
                                                    .color as string,
                                            )[0],
                                        )
                                    }
                                >
                                    {
                                        JSON.parse(
                                            props.annotation.color as string,
                                        )[1]
                                    }
                                </HighlightLabelPill>
                            )}
                        <MarkdownBox
                            isHighlight
                            isScreenshotAnnotation={
                                state.isScreenshotAnnotation
                            }
                        >
                            {props.annotation.body}
                        </MarkdownBox>
                    </HighlightContainer>
                </HighlightBox>
            )}
            <AnnotationEdit
                rows={2}
                comment={props.annotation.comment ?? ''}
                onEditCancel={() => logic.setCommentEditing(false)}
                onEditConfirm={(showExternalConfirmations) => (
                    shouldShare,
                    isProtected,
                ) => {}}
                onCommentChange={(comment: string) => {}}
                imageSupport={props.imageSupport}
                getRootElement={props.getRootElement}
                isEditMode={state.isEditing}
                setEditing={() => logic.setCommentEditing(true)}
                key={props.annotationId}
                readOnly={true}
                contextLocation={'in-page'}
                openImageInPreview={async (imageSource: string) => {}}
            />
        </ItemBox>
    )

    /*
     - Feature: 
     - Edit mode
     - Delete mode
     - Toggle replies
     - Select Color
     - Actions:
        - Edit
        - Delete
        - Toggle replies
        - Copy Link
    - Elements: 
        - Highlight
        - Comment
        - Creator Info
        - Date info
        - Reply button
        - Replies list
        - 
    
    */
}

const Container = styled.div`
    background: linear-gradient(to top right, #111317, #111317);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    height: 100vh;
`

const MarkdownBox = styled(Markdown)<{
    isScreenshotAnnotation: boolean
}>`
    flex: 1;
    margin-left: 20px;

    ${(props) =>
        props.isScreenshotAnnotation &&
        css`
            margin-left: 0px;
        `}
`

const HighlightContainer = styled.div<{
    isScreenshotAnnotation: boolean
}>`
    margin-left: 20px;
    flex: 1;

    width: 100%;

    ${(props) =>
        props.isScreenshotAnnotation &&
        css`
            margin-left: 0px;
        `}
`

const HighlightBox = styled.div`
    display: flex;
    align-items: center;
    padding: 15px 15px 15px 15px;
    width: 100%;
    position: relative;
    height: fit-content;
`

const HighlightBar = styled.div<{ color: string }>`
    background-color: ${(props) =>
        props.color ? props.color : props.theme.colors.prime1};
    margin-right: 10px;
    border-radius: 2px;
    width: 4px;
    top: 0px;
    height: calc(100% - 30px);
    position: absolute;
    margin: 15px 0px 15px 0;
    align-self: center;
    max-height: 100%;
`

const HighlightLabelPill = styled.div<{ color: string }>`
    display: flex;
    align-items: center;
    background: ${(props) => props.color};
    padding: 2px 8px;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    width: fit-content;
    border-radius: 50px;
    font-size: 13px;
    color: ${(props) => props.theme.colors.black};
`
