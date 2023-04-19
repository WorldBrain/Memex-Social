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
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'

const TopBarHeight = 60
const memexLogo = require('../../../assets/img/memex-logo-very-beta.svg')

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

        if (this.state.permissionsLoadState !== 'success') {
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

        const loadState = state.annotationLoadStates[entry.normalizedUrl]

        if (
            loadState &&
            loadState === 'success' &&
            Object.keys(state.annotationEntryData).length === 0
        ) {
            return (
                <EmptyMessageContainer>
                    <IconBox heightAndWidth="40px">
                        <Icon
                            filePath={'commentAdd'}
                            heightAndWidth="20px"
                            color="prime1"
                            hoverOff
                        />
                    </IconBox>
                    <InfoText>
                        Add a note or highlight sections of the page
                    </InfoText>
                </EmptyMessageContainer>
            )
        } else {
            return (
                <AnnotationsInPage
                    hideThreadBar={true}
                    originalUrl={entry.originalUrl}
                    contextLocation={'webUI'}
                    variant={'dark-mode'}
                    // newPageReply={
                    //     this.isListContributor || state.isListOwner
                    //         ? state.newPageReplies[entry.normalizedUrl]
                    //         : undefined
                    // }
                    getAnnotationEditProps={(annotationRef) => ({
                        isEditing: this.state.annotationEditStates[
                            annotationRef.id
                        ]?.isEditing,
                        isHovering: this.state.annotationHoverStates[
                            annotationRef.id
                        ]?.isHovering,
                        comment:
                            this.state.annotationEditStates[annotationRef.id]
                                ?.comment ?? '',
                        setAnnotationEditing: (isEditing) => (event) =>
                            this.processEvent('setAnnotationEditing', {
                                isEditing,
                                annotationId: annotationRef.id,
                            }),
                        setAnnotationHovering: (isHovering) => (event) => {
                            this.processEvent('setAnnotationHovering', {
                                isHovering,
                                annotationId: annotationRef.id,
                            })
                        },
                        onCommentChange: (comment) =>
                            this.processEvent('changeAnnotationEditComment', {
                                comment,
                                annotationId: annotationRef.id,
                            }),
                        onEditConfirm: () => () =>
                            this.processEvent('confirmAnnotationEdit', {
                                annotationId: annotationRef.id,
                            }),
                        onEditCancel: () =>
                            this.processEvent('cancelAnnotationEdit', {
                                annotationId: annotationRef.id,
                            }),
                    })}
                    onAnnotationClick={(annotation) => (event) =>
                        this.processEvent('clickAnnotationInSidebar', {
                            annotationId: annotation.id,
                        })}
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
                    shouldHighlightAnnotation={(annotation) =>
                        this.state.activeAnnotationId ===
                        annotation.reference.id
                    }
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
                    getYoutubePlayer={() =>
                        this.props.services.youtube.getPlayerByElementId(
                            getReaderYoutubePlayerId(entry.originalUrl),
                        )
                    }
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
                                sharedListReference: this.state.listData!
                                    .reference,
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
                                sharedListReference: this.state.listData!
                                    .reference,
                            }),
                        onNewReplyCancel: (annotationReference) => () =>
                            this.processEvent('cancelNewReplyToAnnotation', {
                                annotationReference,
                                sharedListReference: this.state.listData!
                                    .reference,
                            }),
                        onNewReplyConfirm: (annotationReference) => () =>
                            this.processEvent('confirmNewReplyToAnnotation', {
                                annotationReference,
                                sharedListReference: this.state.listData!
                                    .reference,
                            }),
                        onNewReplyEdit: (annotationReference) => ({
                            content,
                        }) =>
                            this.processEvent('editNewReplyToAnnotation', {
                                annotationReference,
                                content,
                                sharedListReference: this.state.listData!
                                    .reference,
                            }),
                    }}
                    // onAnnotationBoxRootRef={this.onAnnotEntryRef}
                    // onReplyRootRef={this.onReplyRef}
                />
            )
        }
    }

    renderYoutubePlayer = () => {
        const { youtube } = this.props.services
        const { originalUrl: url } = this.state.listData?.entry ?? {}
        if (!url) {
            return
        }

        const getYoutubeId = () => {
            let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
            let match = url.match(regExp)

            if (match && match[2].length == 11) {
                return match[2]
            } else {
                return 'error'
            }
        }

        const playerId = getReaderYoutubePlayerId(url)

        return (
            <YoutubeIframe
                id={playerId}
                ref={(ref) => {
                    if (ref) {
                        youtube.createYoutubePlayer(playerId, {
                            width: 'fill-available', // yes, these are meant to be strings
                            height: 'fill-available',
                            videoId: getYoutubeId(),
                        })
                    }
                }}
            />
        )
    }

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
                                {links != null &&
                                this.state.permissionsLoadState ===
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
                                        {links.collab != null && (
                                            <>
                                                <LinkTitle>
                                                    Annotate & Reply
                                                </LinkTitle>
                                                <LinkBox>
                                                    <LinkField>
                                                        {links!.collab}
                                                    </LinkField>
                                                    <PrimaryAction
                                                        type="secondary"
                                                        size="small"
                                                        icon={'copy'}
                                                        label={'copy'}
                                                        padding={
                                                            '4px 10px 4px 5px'
                                                        }
                                                        onClick={() =>
                                                            this.processEvent(
                                                                'copyLink',
                                                                {
                                                                    url: links!
                                                                        .collab,
                                                                },
                                                            )
                                                        }
                                                    />
                                                </LinkBox>
                                            </>
                                        )}
                                    </LinksContainer>
                                ) : (
                                    <LoadingBox height={'50px'}>
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

    private renderMainContent() {
        if (this.state.isYoutubeVideo) {
            return (
                <YoutubeVideoContainer>
                    <YoutubeVideoBox>
                        {this.renderYoutubePlayer()}
                    </YoutubeVideoBox>
                </YoutubeVideoContainer>
            )
        }
        return (
            <InjectedContent
                ref={(ref) =>
                    this.processEvent('setReaderContainerRef', {
                        ref,
                    })
                }
            >
                {this.state.iframeLoadState === 'error' ? (
                    <div>
                        The reader didn't load properly. Please try refreshing
                        the page.
                    </div>
                ) : (
                    this.state.iframeLoadState !== 'success' && (
                        <LoadingBox height={'400px'}>
                            <LoadingIndicator size={34} />
                        </LoadingBox>
                    )
                )}
            </InjectedContent>
        )
    }

    render() {
        const style = {
            position: 'relative',
            right: '0px',
            top: '0px',
            zIndex: 3,
            height: 'fill-available',
            display: 'flex',
            flexDirection: 'column',
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
                            {this.state.permissionsLoadState === 'success' && (
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
                    {this.state.permissionsLoadState === 'success' &&
                        this.renderMainContent()}
                </LeftSide>
                <ContainerStyled
                    width={this.state.sidebarWidth}
                    id={'annotationSidebarContainer'}
                >
                    <Sidebar
                        ref={(ref: Rnd) =>
                            this.processEvent('setSidebarRef', {
                                ref: ref?.getSelfElement() ?? null,
                            })
                        }
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
                        <SidebarTopBar>
                            <AuthHeader
                                services={this.props.services}
                                storage={this.props.storage}
                            />
                        </SidebarTopBar>
                        <SidebarAnnotationContainer>
                            {this.state.listData &&
                                this.renderPageAnnotations(
                                    this.state.listData.entry,
                                )}
                        </SidebarAnnotationContainer>
                    </Sidebar>
                </ContainerStyled>
            </MainContainer>
        )
    }
}

export function getReaderYoutubePlayerId(normalizedPageUrl: string) {
    return `reader_youtube_player_${normalizedPageUrl}`
}

const EmptyMessageContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 40px 5px;
    grid-gap: 10px;
    justify-content: center;
    align-items: center;
    width: fill-available;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 400;
    text-align: center;
`

const LoadingBox = styled.div<{ height: string }>`
    display: flex;
    justify-content: center;
    align-items: center;
    height: ${(props) => (props.height ? props.height : 'fill-available')};
    width: 100%;
    flex: 1;
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

const SidebarAnnotationContainer = styled.div`
    overflow: scroll;
    &::-webkit-scrollbar {
        display: none;
    }
    min-height: 300px;
    flex: 1;
    scrollbar-width: none;
    display: flex;
    flex-direction: column;
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

    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
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
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
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

const YoutubeVideoContainer = styled.div`
    display: flex;
    width: 100%;
    height: fill-available;
    justify-content: center;
    padding-top: 20px;
`

const YoutubeVideoBox = styled.div`
    display: flex;
    padding-bottom: 56.25%;
    position: relative;
    height: 0;
    width: 90%;
    max-width: 1000px;
`

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
    flex: 1;
    display: flex;
    flex-direction: column;

    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
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
