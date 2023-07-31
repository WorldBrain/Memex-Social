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
import AnnotationCreate from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotation-create'
import AuthHeader from '../../user-management/ui/containers/auth-header'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { getSinglePageShareUrl } from '@worldbrain/memex-common/lib/content-sharing/utils'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import { getReaderYoutubePlayerId } from '../utils/utils'
import { ViewportBreakpoint } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { getViewportBreakpoint } from '@worldbrain/memex-common/lib/common-ui/styles/utils'
import Overlay from '@worldbrain/memex-common/lib/main-ui/containers/overlay'
import Tweet from './components/TweetEmbed'

const TopBarHeight = 60
const memexLogo = require('../../../assets/img/memex-logo-beta.svg')
const memexIcon = require('../../../assets/img/memex-icon.svg')

export class ReaderPageView extends UIElement<
    ReaderPageViewDependencies,
    ReaderPageViewState,
    ReaderPageViewEvent
> {
    constructor(props: ReaderPageViewDependencies) {
        super(props, { logic: new ReaderPageViewLogic({ ...props }) })
        ;(window as any)['_state'] = () => ({ ...this.state })

        const { query } = props

        this.itemRanges = {
            listEntry: parseRange(query.fromListEntry, query.toListEntry),
            annotEntry: parseRange(query.fromAnnotEntry, query.toAnnotEntry),
            reply: parseRange(query.fromReply, query.toReply),
        }
    }

    itemRanges: {
        [Key in 'listEntry' | 'annotEntry' | 'reply']:
            | TimestampRange
            | undefined
    }

    get viewportBreakpoint(): ViewportBreakpoint {
        return getViewportBreakpoint(this.getViewportWidth())
    }

    async componentDidMount() {
        await super.componentDidMount()

        const screenSmall =
            this.viewportBreakpoint === 'mobile' ||
            this.viewportBreakpoint === 'small'

        if (screenSmall) {
            this.processEvent('toggleSidebar', false)

            if (this.viewportBreakpoint === 'mobile') {
                this.processEvent('setSidebarWidth', {
                    width: window.innerWidth,
                })
            }
        }
    }

    // itemRanges: {
    //     [Key in 'listEntry' | 'annotEntry' | 'reply']:
    //         | TimestampRange
    //         | undefined
    // }
    private reportButtonRef = React.createRef<HTMLDivElement>()
    private sharePageButton = React.createRef<HTMLDivElement>()
    private optionsMenuButtonRef = React.createRef<HTMLDivElement>()

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

    private renderOverlay() {
        return (
            <OverlayAnnotationInstructionContainer
                onClick={() =>
                    this.processEvent('hideAnnotationInstruct', null)
                }
            >
                <OverlayAnnotationInstructionInnerBox>
                    <IconBox heightAndWidth="50px">
                        <Icon
                            heightAndWidth="30px"
                            icon="invite"
                            color="prime1"
                        />
                    </IconBox>
                    <Spacer height="5px" />
                    <Title>
                        You've been invited to collaborate on this document
                    </Title>
                    <Description>
                        This means you can also add your own annotations.
                        <br />
                        Just select some text to get started.
                    </Description>
                </OverlayAnnotationInstructionInnerBox>
            </OverlayAnnotationInstructionContainer>
        )
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
                    shouldHighlightAnnotation={(annotation) =>
                        isInRange(
                            annotation.createdWhen,
                            this.itemRanges.annotEntry,
                        ) ||
                        this.state.activeAnnotationId ===
                            annotation.reference.id
                    }
                    shouldHighlightReply={(_, replyData) =>
                        isInRange(
                            replyData.reply.createdWhen,
                            this.itemRanges.reply,
                        )
                    }
                    getAnnotationEditProps={(annotationRef) => ({
                        isEditing: this.state.annotationEditStates[
                            annotationRef.id
                        ]?.isEditing,
                        isHovering: this.state.annotationHoverStates[
                            annotationRef.id
                        ]?.isHovering,
                        isOwner:
                            this.state.annotations[annotationRef.id.toString()]
                                ?.creator.id ===
                            this.state.currentUserReference?.id,
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
                            getReaderYoutubePlayerId(entry.normalizedUrl),
                        )
                    }
                    onToggleReplies={(event) => {
                        this.processEvent('toggleAnnotationReplies', {
                            ...event,
                            sharedListReference: this.state.listData!.reference,
                        })
                        setTimeout(() => {
                            const highlight = document.getElementById(
                                event.annotationReference.id.toString(),
                            )

                            highlight?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                            })
                        }, 50)
                    }}
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
        const { entry } = this.state.listData ?? {}
        if (!entry) {
            return
        }
        const { originalUrl, normalizedUrl } = entry

        const getYoutubeId = () => {
            let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
            let match = originalUrl.match(regExp)

            if (match && match[2].length == 11) {
                return match[2]
            } else {
                return 'error'
            }
        }

        const playerId = getReaderYoutubePlayerId(normalizedUrl)

        return (
            <div>
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
            </div>
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

    private renderOptionsMenu = () => {
        if (this.state.showOptionsMenu) {
            return (
                <PopoutBox
                    targetElementRef={
                        this.optionsMenuButtonRef.current ?? undefined
                    }
                    placement="bottom"
                    closeComponent={() =>
                        this.processEvent('toggleOptionsMenu', null)
                    }
                    offsetX={10}
                >
                    {this.renderInstallTooltip()}
                    {this.renderShareTooltip()}
                    <OptionsMenuBox>
                        <AuthHeader
                            services={this.props.services}
                            storage={this.props.storage}
                        />
                        {this.state.listLoadState === 'success' && (
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
                        )}
                        {this.state.listLoadState === 'success' && (
                            <PrimaryAction
                                icon={'goTo'}
                                type="tertiary"
                                label={'Open Original'}
                                size="medium"
                                onClick={() =>
                                    window.open(
                                        this.state.listData!.entry.originalUrl,
                                        '_blank',
                                    )
                                }
                                padding="5px 10px 5px 5px"
                            />
                        )}
                        <PrimaryAction
                            icon="plus"
                            type="tertiary"
                            label={'New Page'}
                            size="medium"
                            onClick={() =>
                                window.open('https://memex.garden', '_blank')
                            }
                            padding="5px 10px 5px 5px"
                        />
                        {this.state.permissionsLoadState === 'success' && (
                            <PrimaryAction
                                icon={'invite'}
                                type="primary"
                                label={'Invite People'}
                                size="medium"
                                innerRef={this.sharePageButton}
                                onClick={() =>
                                    this.processEvent('showSharePageMenu', null)
                                }
                                padding="5px 10px 5px 5px"
                            />
                        )}
                    </OptionsMenuBox>
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
                            <NotifBox>
                                <Icon
                                    filePath="checkRound"
                                    heightAndWidth="30px"
                                    hoverOff
                                />
                                <Title>Copied to Clipboard</Title>
                            </NotifBox>
                        ) : (
                            <NotifBox>
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
                            </NotifBox>
                        )}
                    </TooltipBox>
                </PopoutBox>
            )
        }
    }

    private renderMainContent() {
        if (this.state.isYoutubeVideo) {
            return (
                <YoutubeArea>
                    <YoutubeVideoContainer>
                        {this.state.permissions === 'contributor' ||
                            (this.state.permissions === 'owner' && (
                                <PrimaryAction
                                    label="Add timestamped note"
                                    icon="clock"
                                    type="forth"
                                    size="medium"
                                    onClick={() =>
                                        this.processEvent(
                                            'createYoutubeNote',
                                            {},
                                        )
                                    }
                                />
                            ))}
                        <YoutubeVideoBox>
                            {this.renderYoutubePlayer()}
                        </YoutubeVideoBox>
                    </YoutubeVideoContainer>
                </YoutubeArea>
            )
        }
        if (this.state.isTweet && this.state.sourceUrl) {
            return <Tweet url={this.state.sourceUrl} />
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

        const normalizedURL = this.state.listData?.entry.normalizedUrl
        let loadState = undefined

        if (normalizedURL) {
            loadState =
                this.state.annotationLoadStates[
                    normalizedURL ? normalizedURL : ''
                ] === 'success'
        }

        const annotationCounter = Object.keys(this.state.annotations).length

        const screenSmall =
            this.viewportBreakpoint === 'mobile' ||
            this.viewportBreakpoint === 'small'

        return (
            <MainContainer>
                {this.state.renderAnnotationInstructOverlay &&
                    this.renderOverlay()}
                <LeftSide>
                    <TopBar>
                        <LeftSideTopBar>
                            <Logo src={screenSmall ? memexIcon : memexLogo} />
                            <BreadCrumbBox>
                                {this.state.listData &&
                                    this.state.listData?.list.type !==
                                        'page-link' && (
                                        <>
                                            {/* {screenSmall ? (
                                                <Icon
                                                    icon="arrowLeft"
                                                    heightAndWidth="24px"
                                                    onClick={() =>
                                                        window.open(
                                                            this.state.listData
                                                                ?.url,
                                                            '_self',
                                                        )
                                                    }
                                                />
                                            ) : ( */}
                                            <BreadCrumbButton>
                                                <PrimaryAction
                                                    icon="arrowLeft"
                                                    type="tertiary"
                                                    size="medium"
                                                    label={
                                                        this.state.listData
                                                            ?.title
                                                    }
                                                    onClick={() =>
                                                        window.open(
                                                            this.state.listData
                                                                ?.url,
                                                            '_self',
                                                        )
                                                    }
                                                    padding="5px 10px 5px 5px"
                                                />
                                            </BreadCrumbButton>
                                        </>
                                    )}
                            </BreadCrumbBox>
                        </LeftSideTopBar>
                        <RightSideTopBar>
                            {screenSmall ? (
                                <>
                                    {this.renderOptionsMenu()}
                                    <Icon
                                        icon="dots"
                                        heightAndWidth="24px"
                                        onClick={() =>
                                            this.processEvent(
                                                'toggleOptionsMenu',
                                                null,
                                            )
                                        }
                                        containerRef={this.optionsMenuButtonRef}
                                    />
                                    {this.viewportBreakpoint === 'mobile' && (
                                        <>
                                            {loadState ? (
                                                <SidebarButtonBox
                                                    onClick={() =>
                                                        this.processEvent(
                                                            'toggleSidebar',
                                                            null,
                                                        )
                                                    }
                                                >
                                                    <Icon
                                                        icon="commentAdd"
                                                        heightAndWidth="24px"
                                                    />
                                                    {annotationCounter > 0 && (
                                                        <AnnotationCounter
                                                            onClick={() =>
                                                                this.processEvent(
                                                                    'toggleSidebar',
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            {
                                                                Object.keys(
                                                                    this.state
                                                                        .annotations,
                                                                ).length
                                                            }
                                                        </AnnotationCounter>
                                                    )}
                                                </SidebarButtonBox>
                                            ) : (
                                                <LoadingBox width={'30px'}>
                                                    <LoadingIndicator
                                                        size={20}
                                                    />
                                                </LoadingBox>
                                            )}
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    {this.renderInstallTooltip()}
                                    {this.renderShareTooltip()}
                                    {this.state.listLoadState === 'success' && (
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
                                                    url: this.state.listData!
                                                        .entry.originalUrl,
                                                })
                                            }
                                            padding="5px 10px 5px 5px"
                                        />
                                    )}
                                    {this.state.listLoadState === 'success' && (
                                        <PrimaryAction
                                            icon={'goTo'}
                                            type="tertiary"
                                            label={'Open Original'}
                                            size="medium"
                                            onClick={() =>
                                                this.processEvent(
                                                    'openOriginalLink',
                                                    null,
                                                )
                                            }
                                            padding="5px 10px 5px 5px"
                                        />
                                    )}
                                    <PrimaryAction
                                        icon="plus"
                                        type="tertiary"
                                        label={'New Page'}
                                        size="medium"
                                        onClick={() =>
                                            window.open(
                                                'https://memex.garden',
                                                '_blank',
                                            )
                                        }
                                        padding="5px 10px 5px 5px"
                                    />
                                    {this.state.permissionsLoadState ===
                                        'success' && (
                                        <PrimaryAction
                                            icon={'invite'}
                                            type="primary"
                                            label={'Invite People'}
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
                                </>
                            )}
                        </RightSideTopBar>
                    </TopBar>
                    {this.state.permissionsLoadState === 'success' ? (
                        <>{this.renderMainContent()}</>
                    ) : (
                        <LoadingBox height={'400px'}>
                            <LoadingIndicator size={34} />
                        </LoadingBox>
                    )}
                </LeftSide>
                <ContainerStyled
                    width={this.state.sidebarWidth}
                    id={'annotationSidebarContainer'}
                    viewportBreakpoint={this.viewportBreakpoint}
                    shouldShowSidebar={this.state.showSidebar}
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
                            width: screenSmall ? 'fill-available' : '400px',
                            height: '100px',
                        }}
                        resizeHandleWrapperClass={'sidebarResizeHandle'}
                        className="sidebar-draggable"
                        resizeGrid={[1, 0]}
                        dragAxis={'none'}
                        minWidth={screenSmall ? 'fill-available' : '400px'}
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
                        <SidebarTopBar
                            viewportBreakpoint={this.viewportBreakpoint}
                        >
                            {this.viewportBreakpoint === 'mobile' ? (
                                <Icon
                                    icon="removeX"
                                    heightAndWidth="24px"
                                    onClick={() =>
                                        this.processEvent('toggleSidebar', null)
                                    }
                                />
                            ) : (
                                <AuthHeader
                                    services={this.props.services}
                                    storage={this.props.storage}
                                />
                            )}
                        </SidebarTopBar>
                        <SidebarAnnotationContainer>
                            {this.state.permissions != null && (
                                <AnnotationCreateContainer>
                                    <AnnotationCreate
                                        comment={
                                            this.state.annotationCreateState
                                                .comment
                                        }
                                        isCreating={
                                            this.state.annotationCreateState
                                                .isCreating
                                        }
                                        onCancel={() =>
                                            this.processEvent(
                                                'cancelAnnotationCreate',
                                                null,
                                            )
                                        }
                                        onConfirm={() =>
                                            this.processEvent(
                                                'confirmAnnotationCreate',
                                                null,
                                            )
                                        }
                                        onChange={(comment) =>
                                            this.processEvent(
                                                'changeAnnotationCreateComment',
                                                { comment },
                                            )
                                        }
                                        getYoutubePlayer={() =>
                                            this.state.listLoadState ===
                                                'success' &&
                                            this.props.services.youtube.getPlayerByElementId(
                                                getReaderYoutubePlayerId(
                                                    this.state.listData!.entry
                                                        .normalizedUrl,
                                                ),
                                            )
                                        }
                                    />
                                </AnnotationCreateContainer>
                            )}
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

type TimestampRange = { fromTimestamp: number; toTimestamp: number }

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

const OverlayAnnotationInstructionContainer = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(4px);
    background-color: ${(props) => props.theme.colors.black}10;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
`
const Spacer = styled.div<{ height?: string }>`
    height: ${(props) => props.height && props.height};
`

const OverlayAnnotationInstructionInnerBox = styled.div`
    background-color: ${(props) => props.theme.colors.greyScale1};
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    border-radius: 8px;
    padding: 30px;
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    justify-content: center;
    align-items: center;
`

const BreadCrumbButton = styled.div`
    & > div {
        & > span {
            text-overflow: ellipsis;
            overflow: hidden;
            max-width: 120px;
            display: block;
        }
    }
`

const SidebarButtonBox = styled.div`
    position: relative;
`

const AnnotationCounter = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.black};
    position: absolute;
    bottom: -5px;
    right: -5px;
    background: ${(props) => props.theme.colors.prime1};
    border-radius: 50px;
    padding: 0px 5px;
    font-size: 12px;
`

const OptionsMenuBox = styled.div`
    display: flex;
    flex-direction: column;
    padding: 15px;
    grid-gap: 5px;
    justify-content: center;
    align-items: flex-start;
    & > div {
        width: 100%;
        justify-content: flex-start;

        &:last-child {
            justify-content: center;
            margin-top: 5px;
        }
    }
`

const NotifBox = styled.div`
    height: 170px;
    display: flex;
    width: fill-available;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`

const AnnotationCreateContainer = styled.div`
    display: flex;
    padding: 10px;
`

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

const LoadingBox = styled.div<{ height?: string; width?: string }>`
    display: flex;
    justify-content: center;
    align-items: center;
    height: ${(props) => (props.height ? props.height : 'fill-available')};
    width: ${(props) => (props.width ? props.width : '100%')};
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
    justify-content: flex-start;
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
    justify-content: flex-start;
`
const RightSideTopBar = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 15px;
`

const Logo = styled.img`
    height: 24px;
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
    position: relative;
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
    height: calc(100vh - ${TopBarHeight}px);
    left: 0;
    bottom: 0;
    border: 0px solid;
    background: white;
`

const BreadCrumbBox = styled.div`
    display: flex;
`

const YoutubeVideoContainer = styled.div`
    display: flex;
    width: 100%;
    height: fill-available;
    justify-content: flex-start;
    align-items: flex-start;
    grid-gap: 10px;
    flex-direction: column;
    max-width: 1000px;
    padding: 10px;
`
const YoutubeArea = styled.div`
    display: flex;
    width: 100%;
    height: fill-available;
    justify-content: center;
    padding-top: 00px;
    grid-gap: 10px;
    flex: 1;
`

const YoutubeVideoBox = styled.div`
    display: flex;
    padding-bottom: 56.25%;
    position: relative;
    height: 0;
    width: 100%;
    max-width: 1000px;
`

const SidebarTopBar = styled.div<{
    viewportBreakpoint: string
}>`
    height: ${TopBarHeight}px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    display: flex;
    align-items: center;
    padding: 0 10px;
    justify-content: flex-end;

    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            padding: 0px 20px;
            position: sticky;
        `}
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

const ContainerStyled = styled.div<{
    width: number
    viewportBreakpoint: string
    shouldShowSidebar: boolean
}>`
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

    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        props.shouldShowSidebar &&
        css`
            position: absolute;
            z-index: 1000;
        `}
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        !props.shouldShowSidebar &&
        css`
            display: none;
            z-index: 1000;
        `}
`
