import React from 'react'
import styled, { css } from 'styled-components'
import { UIElement } from '../../../main-ui/classes'
import {
    ReaderPageViewDependencies,
    ReaderPageViewEvent,
    ReaderPageViewState,
} from './types'
import { setupIframeComms } from '../utils/iframe'
import { getWebsiteHTML } from '../utils/api'
import { injectHtml } from '../utils/utils'
import { Rnd } from 'react-rnd'
import { ReaderPageViewLogic } from './logic'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import {
    SharedAnnotationListEntry,
    SharedAnnotationReference,
    SharedListEntry,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { UserReference } from '../../user-management/types'
import AnnotationsInPage from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotations-in-page'
import AuthHeader from '../../user-management/ui/containers/auth-header'

const TopBarHeight = 60
export class ReaderPageView extends UIElement<
    ReaderPageViewDependencies,
    ReaderPageViewState,
    ReaderPageViewEvent
> {
    constructor(props: ReaderPageViewDependencies) {
        super(props, { logic: new ReaderPageViewLogic({ ...props }) })

        // const { query } = props

        // this.itemRanges = {
        //     listEntry: parseRange(query.fromListEntry, query.toListEntry),
        //     annotEntry: parseRange(query.fromAnnotEntry, query.toAnnotEntry),
        //     reply: parseRange(query.fromReply, query.toReply),
        // }
    }

    // itemRanges: {
    //     [Key in 'listEntry' | 'annotEntry' | 'reply']:
    //         | TimestampRange
    //         | undefined
    // }
    private SidebarContainer = React.createRef<HTMLElement>()

    // get isListContributor(): boolean {
    //     return (
    //         this.state.permissionKeyResult === 'success' ||
    //         !!this.state.listRoleID
    //     )
    // }

    getAnnotation(
        annotationEntry: SharedAnnotationListEntry & {
            sharedAnnotation: SharedAnnotationReference
        },
    ) {
        const { state } = this
        const annotationID = this.props.storage.contentSharing.getSharedAnnotationLinkID(
            annotationEntry.sharedAnnotation,
        )
        const annotation = state.annotations[annotationID]
        return annotation ?? null
    }

    renderPageAnnotations(entry: SharedListEntry & { creator: UserReference }) {
        const { state } = this

        // const youtubeElementId = getBlockContentYoutubePlayerId(
        //     entry.normalizedUrl,
        // )

        return (
            <AnnotationsInPage
                hideThreadBar={true}
                originalUrl={entry.originalUrl}
                contextLocation={'webUI'}
                variant={'dark-mode'}
                // getYoutubePlayer={() =>
                //     this.props.services.youtube.getPlayerByElementId(
                //         youtubeElementId,
                //     )
                // }
                // newPageReply={
                //     this.isListContributor || state.isListOwner
                //         ? state.newPageReplies[entry.normalizedUrl]
                //         : undefined
                // }
                loadState={state.annotationLoadStates[entry.normalizedUrl]}
                annotations={
                    state.annotationEntryData &&
                    state.annotationEntryData[entry.normalizedUrl] &&
                    state.annotationEntryData &&
                    state.annotationEntryData[
                        entry.normalizedUrl
                    ].map((annotationEntry) =>
                        this.getAnnotation(annotationEntry),
                    )
                }
                annotationConversations={this.state.conversations}
                // shouldHighlightAnnotation={(annotation) =>
                //     isInRange(
                //         annotation.createdWhen,
                //         this.itemRanges.annotEntry,
                //     )
                // }
                // shouldHighlightReply={(_, replyData) =>
                //     isInRange(
                //         replyData.reply.createdWhen,
                //         this.itemRanges.reply,
                //     )
                // }
                getAnnotationCreator={(annotationReference) => {
                    const creatorRef = this.state.annotations[
                        annotationReference.id.toString()
                    ]?.creator
                    return creatorRef && this.state.users[creatorRef.id]
                }}
                getAnnotationCreatorRef={(annotationReference) => {
                    const creatorRef = this.state.annotations[
                        annotationReference.id.toString()
                    ]?.creator
                    return creatorRef
                }}
                // profilePopupProps={{
                //     storage: this.props.storage,
                //     services: this.props.services,
                // }}
                onToggleReplies={(event) =>
                    this.processEvent('toggleAnnotationReplies', {
                        ...event,
                        sharedListReference: this.state.listData!.reference,
                    })
                }
                newPageReplyEventHandlers={{
                    onNewReplyInitiate: () =>
                        this.processEvent('initiateNewReplyToPage', {
                            pageReplyId: entry.normalizedUrl,
                        }),
                    onNewReplyCancel: () =>
                        this.processEvent('cancelNewReplyToPage', {
                            pageReplyId: entry.normalizedUrl,
                        }),
                    onNewReplyConfirm: () =>
                        this.processEvent('confirmNewReplyToPage', {
                            normalizedPageUrl: entry.normalizedUrl,
                            pageCreatorReference: entry.creator,
                            pageReplyId: entry.normalizedUrl,
                            sharedListReference: this.state.listData!.reference,
                        }),
                    onNewReplyEdit: ({ content }) =>
                        this.processEvent('editNewReplyToPage', {
                            pageReplyId: entry.normalizedUrl,
                            content,
                        }),
                }}
                newAnnotationReplyEventHandlers={{
                    onNewReplyInitiate: (annotationReference) => () =>
                        this.processEvent('initiateNewReplyToAnnotation', {
                            annotationReference,
                            sharedListReference: this.state.listData!.reference,
                        }),
                    onNewReplyCancel: (annotationReference) => () =>
                        this.processEvent('cancelNewReplyToAnnotation', {
                            annotationReference,
                            sharedListReference: this.state.listData!.reference,
                        }),
                    onNewReplyConfirm: (annotationReference) => () =>
                        this.processEvent('confirmNewReplyToAnnotation', {
                            annotationReference,
                            sharedListReference: this.state.listData!.reference,
                        }),
                    onNewReplyEdit: (annotationReference) => ({ content }) =>
                        this.processEvent('editNewReplyToAnnotation', {
                            annotationReference,
                            content,
                            sharedListReference: this.state.listData!.reference,
                        }),
                }}
                // onAnnotationBoxRootRef={this.onAnnotEntryRef}
                // onReplyRootRef={this.onReplyRef}
            />
        )
    }

    // renderYoutubePlayer = () => {
    //     // const { youtubeService } = props
    //     const url = this.state.listData!.url

    //     const getYoutubeId = () => {
    //         let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    //         let match = url.match(regExp)

    //         if (match && match[2].length == 11) {
    //             return match[2]
    //         } else {
    //             return 'error'
    //         }
    //     }

    //     const playerId = getBlockContentYoutubePlayerId(url)

    //     return (
    //         <YoutubeIframe
    //             id={playerId}
    //             ref={(ref) => {
    //                 if (ref) {
    //                     youtubeService!.createYoutubePlayer(playerId, {
    //                         width: 'fill-available', // yes, these are meant to be strings
    //                         height: 'fill-available',
    //                         videoId: getYoutubeId(),
    //                     })
    //                 }
    //             }}
    //         />
    //     )
    // }

    render() {
        const style = {
            position: 'relative',
            right: '0px',
            top: '0px',
            zIndex: 3,
            height: 'fill-available',
        } as const

        return (
            <MainContainer>
                <LeftSide>
                    <TopBar>
                        {/* <Logo /> */}
                        <PrimaryAction
                            icon="arrowLeft"
                            type="tertiary"
                            label={this.state.listData?.title}
                            onClick={() =>
                                window.open(this.state.listData?.url, '_self')
                            }
                            padding="5px 10px 5px 5px"
                        />
                    </TopBar>
                    {this.state.isYoutubeVideo ? (
                        <YoutubeVideoContainer>
                            {/* {this.renderYoutubePlayer()} */}
                        </YoutubeVideoContainer>
                    ) : (
                        <InjectedContent
                            ref={(ref) =>
                                this.processEvent('setReaderContainerRef', {
                                    ref,
                                })
                            }
                        />
                    )}
                </LeftSide>
                <ContainerStyled
                    width={this.state.sidebarWidth}
                    id={'annotationSidebarContainer'}
                >
                    <SidebarTopBar></SidebarTopBar>
                    <Sidebar
                        ref={this.SidebarContainer}
                        style={style}
                        default={{
                            x: 0,
                            y: 0,
                            width: '400px',
                            height: 'fill-available',
                        }}
                        resizeHandleWrapperClass={'sidebarResizeHandle'}
                        className="sidebar-draggable"
                        resizeGrid={[1, 0]}
                        dragAxis={'none'}
                        minWidth={'400px'}
                        maxWidth={'1000px'}
                        disableDragging={true}
                        enableResizing={{
                            top: false,
                            right: false,
                            bottom: false,
                            left: true,
                            topRight: false,
                            bottomRight: false,
                            bottomLeft: false,
                            topLeft: false,
                        }}
                        onResizeStop={(
                            e: any,
                            direction: any,
                            ref: any,
                            delta: any,
                            position: any,
                        ) => {
                            this.processEvent('setSidebarWidth', {
                                width: ref.style.width,
                            })
                        }}
                    >
                        {this.state.listData &&
                            this.renderPageAnnotations(
                                this.state.listData.entry,
                            )}
                    </Sidebar>
                </ContainerStyled>
            </MainContainer>
        )
    }
}

type TimestampRange = { fromTimestamp: number; toTimestamp: number }

export function getBlockContentYoutubePlayerId(normalizedPageUrl: string) {
    return `block_content_youtube_player_${normalizedPageUrl}`
}

function parseRange(
    fromString: string | undefined,
    toString: string | undefined,
): TimestampRange | undefined {
    if (!fromString || !toString) {
        return undefined
    }
    const fromTimestamp = parseInt(fromString)
    const toTimestamp = parseInt(toString)
    return {
        fromTimestamp: Math.min(fromTimestamp, toTimestamp),
        toTimestamp: Math.max(fromTimestamp, toTimestamp),
    }
}

function isInRange(timestamp: number, range: TimestampRange | undefined) {
    if (!range) {
        return false
    }
    return range.fromTimestamp <= timestamp && range.toTimestamp >= timestamp
}

const YoutubeIframe = styled.div<{}>`
    border-radius: 8px;
    min-height: 150px;
    width: fill-available;
`

const MainContainer = styled.div`
    display: flex;
    height: fill-available;
    overflow: hidden;
`

const LeftSide = styled.div`
    display: flex;
    flex-direction: column;
    width: fill-available;
    height: fill-available;
`

const InjectedContent = styled.div`
    max-width: 100%;
    width: fill-available;
    height: fill-available;
    left: 0;
    bottom: 0;
    border: 0px solid;
    flex: 1;
`

const YoutubeVideoContainer = styled.div``

const SidebarTopBar = styled.div`
    height: ${TopBarHeight}px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
`

const TopBar = styled.div`
    position: sticky;
    top: 0;
    left: 0;
    height: ${TopBarHeight}px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    width: fill-available;
    background: ${(props) => props.theme.colors.black};
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
`
const Sidebar = styled(Rnd)`
    top: 0;
    right: 0;
    height: fill-available;
    background: ${(props) => props.theme.colors.black};
    overflow: scroll;
    flex: 1;
`

const ContainerStyled = styled.div<{ width: number }>`
    height: fill-available;
    display: flex;
    flex-direction: column;
    overflow-x: visible;
    position: relative;
    top: 0px;
    right: 0px;
    width: ${(props) => props.width}px;
    border-left: 1px solid ${(props) => props.theme.colors.greyScale3};
    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    box-sizing: content-box;

    &:: -webkit-scrollbar {
        display: none;
    }
    transition: all 0.2s cubic-bezier(0.3, 0.35, 0.14, 0.8);
    scrollbar-width: none;
`
