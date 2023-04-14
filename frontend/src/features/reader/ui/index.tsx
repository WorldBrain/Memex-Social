import React from 'react'
import styled, { css } from 'styled-components'
import { UIElement } from '../../../main-ui/classes'
import {
    ReaderPageViewDependencies,
    ReaderPageViewEvent,
    ReaderPageViewState,
} from './types'
import { Rnd } from 'react-rnd'
import { ReaderPageViewLogic } from './logic'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { SharedListEntry } from '@worldbrain/memex-common/lib/content-sharing/types'
import { UserReference } from '../../user-management/types'
import AnnotationsInPage from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotations-in-page'
import AuthHeader from '../../user-management/ui/containers/auth-header'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { getSinglePageShareUrl } from '@worldbrain/memex-common/lib/content-sharing/utils'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

const TopBarHeight = 60
const memexLogo = require('../../../assets/img/memex-logo-beta.svg')

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
        ;(window as any)['_state'] = () => ({ ...this.state })
    }

    // itemRanges: {
    //     [Key in 'listEntry' | 'annotEntry' | 'reply']:
    //         | TimestampRange
    //         | undefined
    // }
    private sidebarContainer = React.createRef<HTMLElement>()
    private reportButtonRef = React.createRef<HTMLDivElement>()
    private sharePageButton = React.createRef<HTMLDivElement>()

    // get isListContributor(): boolean {
    //     return (
    //         this.state.permissionKeyResult === 'success' ||
    //         !!this.state.listRoleID
    //     )
    // }

    private get pageLinks(): { reader: string; collab: string | null } | null {
        const pageLinkIds = {
            remoteListEntryId: this.props.entryID,
            remoteListId: this.props.listID,
        }

        if (this.state.collaborationKeyLoadState !== 'success') {
            return null // Still loading
        }

        return {
            reader: getSinglePageShareUrl(pageLinkIds),
            collab: this.state.collaborationKey
                ? getSinglePageShareUrl({
                      ...pageLinkIds,
                      collaborationKey: this.state.collaborationKey,
                  })
                : null,
        }
    }

    private renderPageAnnotations(
        entry: SharedListEntry & { creator: UserReference },
    ) {
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
                    state.annotationEntryData[entry.normalizedUrl].map(
                        (annotationEntry) =>
                            this.state.annotations[
                                annotationEntry.sharedAnnotation.id.toString()
                            ] ?? null,
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

    private renderInstallTooltip = () => {
        if (this.state.showInstallTooltip) {
            return (
                <PopoutBox
                    targetElementRef={this.reportButtonRef.current ?? undefined}
                    placement="bottom"
                    closeComponent={() =>
                        this.processEvent('closeInstallTooltip', null)
                    }
                    offsetX={10}
                >
                    <TooltipBox>
                        <Title>Page does not render correctly?</Title>
                        <Description>
                            Try installing the Memex browser extension to view,
                            annotate and reply on the live page.
                            <br /> And it's just 2 clicks away.
                        </Description>
                        <PrimaryAction
                            label="Install Extension"
                            onClick={() =>
                                this.processEvent('installMemexClick', {
                                    urlToOpen: this.state.listData!.entry
                                        .originalUrl,
                                    sharedListReference: this.state.listData!
                                        .reference,
                                })
                            }
                            type="secondary"
                            size="medium"
                        />
                    </TooltipBox>
                </PopoutBox>
            )
        }
    }

    private renderShareTooltip = () => {
        const links = this.pageLinks

        if (this.state.showShareMenu) {
            return (
                <PopoutBox
                    targetElementRef={this.sharePageButton.current ?? undefined}
                    placement="bottom"
                    closeComponent={() =>
                        this.processEvent('showSharePageMenu', null)
                    }
                    offsetX={10}
                >
                    <TooltipBox>
                        {this.state.linkCopiedToClipBoard ? (
                            <>
                                <Icon
                                    filePath="checkRound"
                                    heightAndWidth="30px"
                                    hoverOff
                                />
                                <Title>Copied to Clipboard</Title>
                            </>
                        ) : (
                            <>
                                <Title>Invite Links</Title>
                                {links?.collab != null &&
                                this.state.collaborationKeyLoadState ===
                                    'success' ? (
                                    <LinksContainer>
                                        <LinkTitle>Read & Reply</LinkTitle>
                                        <LinkBox>
                                            <LinkField>
                                                {links!.reader}
                                            </LinkField>
                                            <PrimaryAction
                                                type="secondary"
                                                size="small"
                                                icon={'copy'}
                                                label={'copy'}
                                                padding={'4px 10px 4px 5px'}
                                                onClick={() =>
                                                    this.processEvent(
                                                        'copyLink',
                                                        {
                                                            url: links!.reader,
                                                        },
                                                    )
                                                }
                                            />
                                        </LinkBox>
                                        <LinkTitle>Annotate & Reply</LinkTitle>
                                        <LinkBox>
                                            <LinkField>
                                                {links!.collab}
                                            </LinkField>
                                            <PrimaryAction
                                                type="secondary"
                                                size="small"
                                                icon={'copy'}
                                                label={'copy'}
                                                padding={'4px 10px 4px 5px'}
                                                onClick={() =>
                                                    this.processEvent(
                                                        'copyLink',
                                                        {
                                                            url: links!.collab,
                                                        },
                                                    )
                                                }
                                            />
                                        </LinkBox>
                                    </LinksContainer>
                                ) : (
                                    <LoadingBox>
                                        <LoadingIndicator size={20} />
                                    </LoadingBox>
                                )}
                            </>
                        )}
                    </TooltipBox>
                </PopoutBox>
            )
        }
    }

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
                        <LeftSideTopBar>
                            <Logo src={memexLogo} />
                            <BreadCrumbBox>
                                {this.state.listData &&
                                    this.state.listData?.list.type !==
                                        'page-link' && (
                                        <PrimaryAction
                                            icon="arrowLeft"
                                            type="tertiary"
                                            size="medium"
                                            label={this.state.listData?.title}
                                            onClick={() =>
                                                window.open(
                                                    this.state.listData?.url,
                                                    '_self',
                                                )
                                            }
                                            padding="5px 10px 5px 5px"
                                        />
                                    )}
                            </BreadCrumbBox>
                        </LeftSideTopBar>
                        <RightSideTopBar>
                            {this.renderInstallTooltip()}
                            {this.renderShareTooltip()}
                            <PrimaryAction
                                icon={
                                    this.state.reportURLSuccess
                                        ? 'check'
                                        : 'warning'
                                }
                                type="tertiary"
                                label={'Report URL'}
                                size="medium"
                                innerRef={this.reportButtonRef}
                                onClick={() =>
                                    this.processEvent('reportUrl', {
                                        url: this.state.listData!.entry
                                            .originalUrl,
                                    })
                                }
                                padding="5px 10px 5px 5px"
                            />
                            {this.state.collaborationKeyLoadState ===
                                'success' && (
                                <PrimaryAction
                                    icon={'invite'}
                                    type="tertiary"
                                    label={'Share Page'}
                                    size="medium"
                                    innerRef={this.sharePageButton}
                                    onClick={() =>
                                        this.processEvent(
                                            'showSharePageMenu',
                                            null,
                                        )
                                    }
                                    padding="5px 10px 5px 5px"
                                />
                            )}
                            <PrimaryAction
                                icon="plus"
                                type="primary"
                                label={'New'}
                                size="medium"
                                onClick={() =>
                                    window.open(
                                        'https://memex.garden/discuss',
                                        '_blank',
                                    )
                                }
                                padding="5px 10px 5px 5px"
                            />
                        </RightSideTopBar>
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
                    <SidebarTopBar>
                        <AuthHeader
                            services={this.props.services}
                            storage={this.props.storage}
                        />
                    </SidebarTopBar>
                    <Sidebar
                        ref={this.sidebarContainer}
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

const LoadingBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50px;
    width: 100%;
`

const LinksContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: fill-available;
`

const LinkTitle = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 300;
    margin-bottom: 5px;
    margin-top: 15px;
    text-align: center;
`

const LinkBox = styled.div`
    display: flex;
    grid-gap: 5px;
    width: -webkit-fill-available;
`

const LinkField = styled.div`
    display: flex;
    background: ${(props) => props.theme.colors.greyScale2};
    color: ${(props) => props.theme.colors.greyScale4};
    border-radius: 5px;
    align-items: center;
    overflow: scroll;
    text-overflow: ellipsis;
    padding: 0 10px;
    font-size: 12px;
    white-space: nowrap;
`

const TooltipBox = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    padding: 20px;
    width: 350px;
    align-items: center;
`

const Title = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.white};
    font-size: 16px;
    font-weight: 600;
`

const Description = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 300;
    margin-bottom: 5px;
    text-align: center;
`

const LeftSideTopBar = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
`
const RightSideTopBar = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
`

const Logo = styled.img`
    height: 24px;
    width: 150px;
`

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

const BreadCrumbBox = styled.div`
    display: flex;
`

const YoutubeVideoContainer = styled.div``

const SidebarTopBar = styled.div`
    height: ${TopBarHeight}px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    display: flex;
    align-items: center;
    padding: 0 10px;
    justify-content: flex-end;
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
    justify-content: space-between;
    z-index: 10;
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
