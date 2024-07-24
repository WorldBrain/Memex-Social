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
import type {
    SharedListEntry,
    SharedAnnotation,
} from '@worldbrain/memex-common/lib/content-sharing/types'
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
import type { AutoPk } from '../../../types'
import { MemexEditorInstance } from '@worldbrain/memex-common/lib/editor'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { OverlayModal } from './components/OverlayModals'
import { hasUnsavedAnnotationEdits } from '../../annotations/ui/logic'
import { hasUnsavedConversationEdits } from '../../content-conversations/ui/logic'
import { sleepPromise } from '../../../utils/promises'

const TopBarHeight = 50
const memexLogo = require('../../../assets/img/memex-logo-beta.svg')
const memexIcon = require('../../../assets/img/memex-icon.svg')

const isIframe = () => {
    try {
        return window.self !== window.top
    } catch (e) {
        return true
    }
}

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

    private getRootElement = (): HTMLElement => {
        const iframe = (this.logic as ReaderPageViewLogic).iframe
        if (!iframe?.contentDocument) {
            console.warn(
                'Reader iframe has not yet been loaded into the DOM - using DOM body instead',
            )
            return document.body
        }
        return iframe.contentDocument.body
    }

    private editor: MemexEditorInstance | null = null

    itemRanges: {
        [Key in 'listEntry' | 'annotEntry' | 'reply']:
            | TimestampRange
            | undefined
    }

    get viewportBreakpoint(): ViewportBreakpoint {
        return getViewportBreakpoint(this.getViewportWidth())
    }

    private handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (
            hasUnsavedAnnotationEdits(this.state) ||
            hasUnsavedConversationEdits(this.state) ||
            this.state.annotationCreateState.isCreating ||
            this.state.annotationCreateState.loadState === 'running' ||
            this.state.highlightCreateState === 'running'
        ) {
            e.preventDefault()
        }
    }

    async componentDidMount() {
        window.addEventListener('beforeunload', this.handleBeforeUnload)
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

    async componentDidUpdate(
        prevProps: ReaderPageViewDependencies,
        prevState: ReaderPageViewState,
    ) {
        if (
            this.props.noteId != null &&
            prevState.readerLoadState !== 'success' &&
            this.state.readerLoadState === 'success'
        ) {
            await sleepPromise(2000)
            this.processEvent('clickAnnotationInSidebar', {
                annotationId: this.props.noteId,
            })
        }
    }

    async componentWillUnmount() {
        window.removeEventListener('beforeunload', this.handleBeforeUnload)
        await super.componentWillUnmount()
    }

    // itemRanges: {
    //     [Key in 'listEntry' | 'annotEntry' | 'reply']:
    //         | TimestampRange
    //         | undefined
    // }
    private reportButtonRef = React.createRef<HTMLDivElement>()
    private sharePageButton = React.createRef<HTMLDivElement>()
    private optionsMenuButtonRef = React.createRef<HTMLDivElement>()
    private chatBoxRef = React.createRef<HTMLDivElement>()

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
            let annotationsList: Array<SharedAnnotation & { id: AutoPk }> = []

            if (
                state.annotationEntryData &&
                state.annotationEntryData[entry.normalizedUrl] &&
                state.annotationEntryData &&
                state.annotations !== null
            ) {
                state.annotationEntryData[entry.normalizedUrl].map(
                    (annotationEntry) => {
                        if (
                            this.state.annotations[
                                annotationEntry.sharedAnnotation.id.toString()
                            ]
                        ) {
                            annotationsList.push({
                                ...this.state.annotations[
                                    annotationEntry.sharedAnnotation.id.toString()
                                ],
                                id: annotationEntry.sharedAnnotation.id,
                            })
                        }
                    },
                )
            }

            return (
                <AnnotationsInPage
                    getRootElement={this.props.getRootElement}
                    hideThreadBar={true}
                    currentSpaceId={this.props.listID}
                    currentNoteId={this.props.noteId}
                    originalUrl={entry.originalUrl}
                    contextLocation={'webUI'}
                    imageSupport={this.props.imageSupport}
                    variant={'dark-mode'}
                    pageEntry={entry}
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
                    getReplyEditProps={(
                        replyReference,
                        annotationReference,
                    ) => ({
                        isDeleting: this.state.replyDeleteStates[
                            replyReference.id
                        ]?.isDeleting,
                        isEditing: this.state.replyEditStates[replyReference.id]
                            ?.isEditing,
                        isHovering: this.state.replyHoverStates[
                            replyReference.id
                        ]?.isHovering,
                        imageSupport: this.props.imageSupport,
                        isOwner:
                            this.state.conversations[
                                annotationReference.id.toString()
                            ].replies.find(
                                (reply) =>
                                    reply.reference.id === replyReference.id,
                            )?.userReference?.id ===
                            this.state.currentUserReference?.id,
                        comment:
                            this.state.replyEditStates[replyReference.id]
                                ?.text ?? '',
                        setAnnotationDeleting: (isDeleting) => (event) =>
                            this.processEvent('setReplyToAnnotationDeleting', {
                                isDeleting,
                                replyReference,
                            }),
                        setAnnotationEditing: (isEditing) => {
                            this.processEvent('setReplyToAnnotationEditing', {
                                isEditing,
                                replyReference,
                            })
                        },
                        setAnnotationHovering: (isHovering) => () => {
                            this.processEvent('setReplyToAnnotationHovering', {
                                isHovering,
                                replyReference,
                            })
                        },
                        onCommentChange: (comment) =>
                            this.processEvent('editReplyToAnnotation', {
                                replyText: comment,
                                replyReference,
                            }),
                        onDeleteConfim: () =>
                            this.processEvent(
                                'confirmDeleteReplyToAnnotation',
                                {
                                    replyReference,
                                    annotationReference,
                                    sharedListReference: this.state.listData!
                                        .reference,
                                },
                            ),
                        onEditConfirm: () => () =>
                            this.processEvent('confirmEditReplyToAnnotation', {
                                replyReference,
                                annotationReference,
                                sharedListReference: this.state.listData!
                                    .reference,
                            }),
                        onEditCancel: () =>
                            this.processEvent('setReplyToAnnotationEditing', {
                                isEditing: false,
                                replyReference,
                            }),
                    })}
                    getAnnotationEditProps={(annotationRef) => ({
                        isDeleting: this.state.annotationDeleteStates[
                            annotationRef.id
                        ]?.isDeleting,
                        imageSupport: this.props.imageSupport,
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
                        setAnnotationDeleting: (isDeleting) => (event) =>
                            this.processEvent('setAnnotationDeleting', {
                                isDeleting,
                                annotationId: annotationRef.id,
                            }),
                        setAnnotationEditing: (isEditing) => {
                            this.processEvent('setAnnotationEditing', {
                                isEditing,
                                annotationId: annotationRef.id,
                            })
                        },
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
                        onDeleteConfim: () =>
                            this.processEvent('confirmAnnotationDelete', {
                                annotationId: annotationRef.id,
                            }),
                        onEditConfirm: () => () =>
                            this.processEvent('confirmAnnotationEdit', {
                                annotationId: annotationRef.id,
                            }),
                        onEditCancel: () =>
                            this.processEvent('setAnnotationEditing', {
                                annotationId: annotationRef.id,
                                isEditing: false,
                            }),
                    })}
                    onAnnotationClick={(annotation) => (event) =>
                        this.processEvent('clickAnnotationInSidebar', {
                            annotationId: annotation.id,
                        })}
                    loadState={state.annotationLoadStates[entry.normalizedUrl]}
                    annotations={
                        annotationsList?.map((annot) => ({
                            ...annot,
                            linkId: annot.id.toString(),
                            reference: {
                                type: 'shared-annotation-reference',
                                id: annot.id,
                            },
                        })) ?? null
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

    // private renderInstallTooltip = () => {
    //     if (this.state.showInstallTooltip) {
    //         return (
    //             <OverlayContainer>
    //                 <TooltipContainer>
    //                     <Title>Screens</Title>
    //                     <Description>
    //                         Try installing the Memex browser extension to view,
    //                         annotate and reply on the live page.
    //                         <br /> And it's just 2 clicks away.
    //                     </Description>
    //                     <PrimaryAction
    //                         label="Install Extension"
    //                         onClick={() =>
    //                             this.processEvent('installMemexClick', {
    //                                 urlToOpen: this.state.listData!.entry
    //                                     .originalUrl,
    //                                 sharedListReference: this.state.listData!
    //                                     .reference,
    //                             })
    //                         }
    //                         type="secondary"
    //                         size="medium"
    //                     />
    //                 </TooltipContainer>
    //             </OverlayContainer>
    //         )
    //     }
    // }

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
                    getPortalRoot={() => this.props.getRootElement()}
                >
                    <OptionsMenuBox>
                        <AuthHeader
                            services={this.props.services}
                            getRootElement={this.props.getRootElement}
                        />
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
                    getPortalRoot={() => this.props.getRootElement()}
                >
                    <TooltipContainer>
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
                                        <LinkTitle>
                                            Read & Reply Access
                                        </LinkTitle>
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
                                                    Contribute Access
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
                    </TooltipContainer>
                </PopoutBox>
            )
        }
    }

    async captureScreenshotFromHTMLVideo(screenshotTarget: any) {
        let canvas = document.createElement('canvas')
        let height = screenshotTarget.offsetHeight
        let width = screenshotTarget.offsetWidth

        canvas.width = width
        canvas.height = height

        let ctx = canvas.getContext('2d')

        ctx?.drawImage(screenshotTarget, 0, 0, canvas.width, canvas.height)

        let image = canvas.toDataURL('image/jpeg')

        return image
    }

    private renderMainContent(screenSmall: boolean, isYoutubeMobile: boolean) {
        if (this.state.isYoutubeVideo) {
            return (
                <YoutubeArea isYoutubeMobile={isYoutubeMobile}>
                    <YoutubeVideoContainer isYoutubeMobile={isYoutubeMobile}>
                        <YoutubeVideoBox id={'YoutubeVideoBox'}>
                            {this.renderYoutubePlayer()}
                        </YoutubeVideoBox>
                        {this.state.permissions === 'contributor' ||
                            (this.state.permissions === 'owner' && (
                                <VideoActionBar>
                                    <PrimaryAction
                                        label="Timestamp Note"
                                        icon="clock"
                                        type="glass"
                                        size="medium"
                                        fontColor="greyScale7"
                                        padding="5px 10px 5px 5px"
                                        onClick={() => {
                                            if (
                                                this.state.annotationCreateState
                                                    .comment.length > 0 ||
                                                this.state.annotationCreateState
                                                    .isCreating
                                            ) {
                                                this.editor?.addYoutubeTimestamp()
                                            } else {
                                                this.processEvent(
                                                    'createYoutubeNote',
                                                    {},
                                                )
                                            }
                                        }}
                                    />
                                    <TooltipBox
                                        tooltipText={
                                            <span>
                                                Create screenshot of current
                                                frame.
                                                <br /> Only possible via
                                                extension
                                            </span>
                                        }
                                        placement="bottom"
                                        offsetX={10}
                                        targetElementRef={
                                            this.reportButtonRef.current ??
                                            undefined
                                        }
                                        getPortalRoot={() =>
                                            this.props.getRootElement()
                                        }
                                    >
                                        <PrimaryAction
                                            label="Screenshot Note"
                                            icon="imageIcon"
                                            type="glass"
                                            size="medium"
                                            fontColor="greyScale7"
                                            padding="5px 10px 5px 5px"
                                            onClick={async () => {
                                                this.processEvent(
                                                    'setModalState',
                                                    'installMemexForVideo',
                                                )
                                                // if (
                                                //     this.state.annotationCreateState
                                                //         .comment.length > 0 ||
                                                //     this.state.annotationCreateState
                                                //         .isCreating
                                                // ) {
                                                // } else {
                                                //     this.processEvent(
                                                //         'createYoutubeScreenshot',
                                                //         {},
                                                //     )
                                                // }
                                            }}
                                        />
                                    </TooltipBox>
                                </VideoActionBar>
                            ))}
                    </YoutubeVideoContainer>
                </YoutubeArea>
            )
        }
        return (
            <>
                <InjectedContent
                    ref={(ref) =>
                        this.processEvent('setReaderContainerRef', {
                            ref,
                        })
                    }
                >
                    {this.state.preventInteractionsInIframe && <ClickBlocker />}
                    {this.state.showDropPDFNotice && (
                        <PDFDropNoticeContainer
                            onDragOver={(event) => {
                                event.preventDefault()
                                this.processEvent('hideDropZone', null)
                            }}
                        >
                            <Icon
                                heightAndWidth="30px"
                                icon="plus"
                                hoverOff
                                color="prime1"
                            />
                            <PDFDropTitle>
                                Drag & Drop the file: "
                                {this.state.listData?.entry.entryTitle}"
                            </PDFDropTitle>
                            <PDFDropSubTitle>
                                We don't support file uploads for sharing PDFs
                                yet. You must have the file on your computer and
                                drop it in here.
                            </PDFDropSubTitle>
                        </PDFDropNoticeContainer>
                    )}
                    {this.state.iframeLoadState === 'error' ? (
                        <div>
                            The reader didn't load properly. Please try
                            refreshing the page.
                        </div>
                    ) : (
                        this.state.iframeLoadState !== 'success' && (
                            <LoadingBox height={'400px'}>
                                <LoadingIndicator size={34} />
                            </LoadingBox>
                        )
                    )}
                </InjectedContent>
            </>
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

        let screenSmall = false

        if (
            this.viewportBreakpoint === 'mobile' ||
            this.viewportBreakpoint === 'small'
        ) {
            screenSmall = true
        }

        let isYoutubeMobile = false
        if (
            (screenSmall || window.innerWidth < 1000) &&
            this.state.sourceUrl?.includes('youtube.com')
        ) {
            isYoutubeMobile = true
        }

        return (
            <MainContainer isYoutubeMobile={isYoutubeMobile}>
                {OverlayModal({
                    type: this.state.overlayModalState,
                    closeModal: () => this.processEvent('setModalState', null),
                })}
                <LeftSide isYoutubeMobile={isYoutubeMobile}>
                    <TopBar>
                        <LeftSideTopBar>
                            <Logo
                                onClick={() => {
                                    this.props.services.router.goTo(
                                        'landingPage',
                                    )
                                }}
                                src={screenSmall ? memexIcon : memexLogo}
                                screenSmall={screenSmall}
                            />
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
                                                    onClick={() => {
                                                        console.log(
                                                            this.state.listData
                                                                ?.url,
                                                        )
                                                        window.open(
                                                            this.state.listData
                                                                ?.url,
                                                            '_self',
                                                        )
                                                    }}
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
                                    {this.state.permissionsLoadState ===
                                        'success' && (
                                        <ShareContainer>
                                            <PrimaryAction
                                                icon={'peopleFine'}
                                                type="primary"
                                                label={'Share & Invite'}
                                                size="small"
                                                fontSize="14px"
                                                iconSize="18px"
                                                innerRef={this.sharePageButton}
                                                onClick={() =>
                                                    this.processEvent(
                                                        'showSharePageMenu',
                                                        null,
                                                    )
                                                }
                                                padding="10px 10px 10px 5px"
                                            />
                                            {this.renderShareTooltip()}
                                        </ShareContainer>
                                    )}
                                    {this.viewportBreakpoint === 'mobile' &&
                                        !isYoutubeMobile && (
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
                                                        {annotationCounter >
                                                            0 && (
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
                                                                        this
                                                                            .state
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
                                    {this.state.listLoadState === 'success' && (
                                        <PrimaryAction
                                            type="tertiary"
                                            label={'Open Original'}
                                            size="medium"
                                            icon={
                                                this.state
                                                    .openOriginalStatus ===
                                                'running' ? (
                                                    <LoadingIndicator
                                                        size={16}
                                                    />
                                                ) : (
                                                    'goTo'
                                                )
                                            }
                                            onClick={() =>
                                                this.processEvent(
                                                    'openOriginalLink',
                                                    null,
                                                )
                                            }
                                            padding="5px 10px 5px 10px"
                                        />
                                    )}
                                    {!isIframe() && (
                                        <SupportChatBox>
                                            <PrimaryAction
                                                onClick={() => {
                                                    this.processEvent(
                                                        'toggleSupportChat',
                                                        null,
                                                    )
                                                }}
                                                type="tertiary"
                                                iconColor="prime1"
                                                icon="chatWithUs"
                                                innerRef={
                                                    this.chatBoxRef ?? undefined
                                                }
                                                size="medium"
                                                label="Support Chat"
                                            />
                                            {this.state.showSupportChat && (
                                                <PopoutBox
                                                    targetElementRef={
                                                        this.chatBoxRef
                                                            .current ??
                                                        undefined
                                                    }
                                                    closeComponent={() =>
                                                        this.processEvent(
                                                            'toggleSupportChat',
                                                            null,
                                                        )
                                                    }
                                                    placement="bottom"
                                                    offsetX={20}
                                                    getPortalRoot={() =>
                                                        this.props.getRootElement()
                                                    }
                                                >
                                                    <ChatBox>
                                                        <LoadingIndicator
                                                            size={30}
                                                        />
                                                        <ChatFrame
                                                            src={
                                                                'https://go.crisp.chat/chat/embed/?website_id=05013744-c145-49c2-9c84-bfb682316599'
                                                            }
                                                            height={600}
                                                            width={500}
                                                        />
                                                    </ChatBox>
                                                    <ChatFrame
                                                        src={
                                                            'https://go.crisp.chat/chat/embed/?website_id=05013744-c145-49c2-9c84-bfb682316599'
                                                        }
                                                        height={600}
                                                        width={500}
                                                    />
                                                </PopoutBox>
                                            )}
                                        </SupportChatBox>
                                    )}
                                    <AuthHeader
                                        services={this.props.services}
                                        getRootElement={
                                            this.props.getRootElement
                                        }
                                    />
                                </>
                            )}
                        </RightSideTopBar>
                    </TopBar>
                    {this.state.permissionsLoadState === 'success' ? (
                        <MainContentContainer isYoutubeMobile={isYoutubeMobile}>
                            {this.renderMainContent(
                                screenSmall,
                                isYoutubeMobile,
                            )}
                        </MainContentContainer>
                    ) : (
                        <LoadingBox height={'400px'}>
                            <LoadingIndicator size={34} />
                        </LoadingBox>
                    )}
                </LeftSide>
                {this.state.sourceUrl != null && (
                    <ContainerStyled
                        width={this.state.sidebarWidth}
                        id={'annotationSidebarContainer'}
                        viewportBreakpoint={this.viewportBreakpoint}
                        shouldShowSidebar={
                            this.state.showSidebar ||
                            (isYoutubeMobile && screenSmall)
                        }
                        isYoutubeMobile={isYoutubeMobile}
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
                                // width:
                                //     screenSmall || isYoutubeMobile
                                //         ? 'fill-available'
                                //         : '400px',
                                height: '100px',
                            }}
                            width={this.state.sidebarWidth}
                            minWidth={400}
                            resizeHandleWrapperClass={'sidebarResizeHandle'}
                            className="sidebar-draggable"
                            resizeGrid={[1, 0]}
                            dragAxis={'none'}
                            // minWidth={
                            //     screenSmall || isYoutubeMobile
                            //         ? 'fill-available'
                            //         : '400px'
                            // }
                            // maxWidth={
                            //     screenSmall || isYoutubeMobile
                            //         ? 'fill-available'
                            //         : '600px'
                            // }
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
                            onResizeStart={() =>
                                this.processEvent('toggleClickBlocker', null)
                            }
                            onResize={(
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
                            onResizeStop={(
                                e: any,
                                direction: any,
                                ref: any,
                                delta: any,
                                position: any,
                            ) => {
                                this.processEvent('toggleClickBlocker', null)
                            }}
                        >
                            {!isYoutubeMobile && (
                                <SidebarTopBar
                                    viewportBreakpoint={this.viewportBreakpoint}
                                >
                                    <RightSideTopBar>
                                        {this.state.permissionsLoadState ===
                                            'success' && (
                                            <ShareContainer>
                                                <PrimaryAction
                                                    icon={'peopleFine'}
                                                    type="primary"
                                                    label={'Share & Invite'}
                                                    size={
                                                        this
                                                            .viewportBreakpoint ===
                                                        'mobile'
                                                            ? 'small'
                                                            : 'medium'
                                                    }
                                                    fontSize="14px"
                                                    iconSize="18px"
                                                    innerRef={
                                                        this.sharePageButton
                                                    }
                                                    onClick={() =>
                                                        this.processEvent(
                                                            'showSharePageMenu',
                                                            null,
                                                        )
                                                    }
                                                    padding="12px 10px 12px 5px"
                                                />
                                                {this.renderShareTooltip()}
                                            </ShareContainer>
                                        )}
                                    </RightSideTopBar>
                                    {this.viewportBreakpoint === 'mobile' && (
                                        <Icon
                                            icon="removeX"
                                            heightAndWidth="24px"
                                            onClick={() =>
                                                this.processEvent(
                                                    'toggleSidebar',
                                                    null,
                                                )
                                            }
                                        />
                                    )}
                                </SidebarTopBar>
                            )}
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
                                            setAnnotationCreating={(value) =>
                                                this.processEvent(
                                                    'setAnnotationCreating',
                                                    { isCreating: value },
                                                )
                                            }
                                            setEditorInstanceRef={(ref) =>
                                                (this.editor = ref)
                                            }
                                            onChange={(comment) => {
                                                this.processEvent(
                                                    'changeAnnotationCreateComment',
                                                    {
                                                        comment,
                                                    },
                                                )
                                            }}
                                            getYoutubePlayer={() =>
                                                this.state.listLoadState ===
                                                'success'
                                                    ? this.props.services.youtube.getPlayerByElementId(
                                                          getReaderYoutubePlayerId(
                                                              this.state
                                                                  .listData!
                                                                  .entry
                                                                  .normalizedUrl,
                                                          ),
                                                      )
                                                    : null!
                                            }
                                            imageSupport={
                                                this.props.imageSupport
                                            }
                                            getRootElement={() =>
                                                this.props.getRootElement()
                                            }
                                        />
                                    </AnnotationCreateContainer>
                                )}
                                {this.state.listData && (
                                    <AnnotationsidebarContainer>
                                        {this.renderPageAnnotations(
                                            this.state.listData.entry,
                                        )}
                                    </AnnotationsidebarContainer>
                                )}
                            </SidebarAnnotationContainer>
                        </Sidebar>
                    </ContainerStyled>
                )}
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

const ShareContainer = styled.div``

const VideoActionBar = styled.div`
    display: flex;
    justify-content: flex-end;
    grid-gap: 10px;
`

const PDFDropNoticeContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    height: 100%;
    width: 100%;
    background: ${(props) => props.theme.colors.black};
    backdrop-filter: blur(10px);
    flex-direction: column;
    grid-gap: 10px;
`

const PDFDropTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 18px;
    font-weight: 500;
`
const PDFDropSubTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
    font-weight: 300;
    width: 500px;
    text-align: center;
`

const AnnotationsidebarContainer = styled.div`
    height: 100%;
    overflow: scroll;
    width: 100%;
    padding-bottom: 150px;
    z-index: 10;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const MainContentContainer = styled.div<{ isYoutubeMobile?: boolean }>`
    width: 100%;
    height: 100%;
    display: flex;
    flex: 1;

    ${(props) =>
        props.isYoutubeMobile &&
        css`
            flex: 0;
        `}
`

const ClickBlocker = styled.div`
    background: transparent;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 1000000000;
`

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

const SupportChatBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.white};
    z-index: 100;
    cursor: pointer;

    & * {
        cursor: pointer;
    }
`

const ChatBox = styled.div`
    position: relative;
    height: 600px;
    width: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
`
const ChatFrame = styled.iframe`
    border: none;
    border-radius: 12px;
    position: absolute;
    top: 0px;
    left: 0px;
`

const NotifBox = styled.div`
    height: fit-content;
    display: flex;
    width: fill-available;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
`

const AnnotationCreateContainer = styled.div`
    display: flex;
    padding: 10px;
    z-index: 100;
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
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 16px;
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
    color: ${(props) => props.theme.colors.greyScale5};
    border-radius: 5px;
    align-items: center;
    overflow: scroll;
    text-overflow: ellipsis;
    padding: 0 10px;
    font-size: 14px;
    white-space: nowrap;

    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
`

const TooltipContainer = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    padding: 20px;
    width: 350px;
    align-items: center;
`

const Title = styled.div`
    font-size: 20px;
    line-height: 25px;
    font-weight: 800;
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: left;
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
    grid-gap: 10px;
`

const Logo = styled.img<{
    screenSmall?: boolean
}>`
    height: 40px;
    cursor: pointer;
    padding: 5px;

    ${(props) =>
        props.screenSmall &&
        css`
            height: 30px;
        `}
`

const YoutubeIframe = styled.div<{}>`
    border-radius: 8px;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
`

const MainContainer = styled.div<{ isYoutubeMobile?: boolean }>`
    display: flex;
    height: fill-available;
    overflow: hidden;
    position: relative;
    flex-direction: row;

    ${(props) =>
        props.isYoutubeMobile &&
        css`
            flex-direction: column;
            align-items: space-between;
        `}
`
const LeftSide = styled.div<{ isYoutubeMobile?: boolean }>`
    display: flex;
    flex-direction: column;
    width: fill-available;
    height: fill-available;

    ${(props) =>
        props.isYoutubeMobile &&
        css`
            height: fit-content;
        `}
`

const InjectedContent = styled.div`
    max-width: 100%;
    width: fill-available;
    height: calc(100vh - ${TopBarHeight}px);
    left: 0;
    bottom: 0;
    border: 0px solid;
    background: white;
    position: relative;
`

const BreadCrumbBox = styled.div`
    display: flex;
`

const YoutubeVideoContainer = styled.div<{ isYoutubeMobile: boolean }>`
    display: flex;
    width: 100%;
    height: fill-available;
    justify-content: flex-start;
    align-items: flex-start;
    grid-gap: 10px;
    flex-direction: column;
    max-width: 1000px;
    padding: 10px;

    ${(props) =>
        props.isYoutubeMobile &&
        css`
            height: fit-content;
        `}
`
const YoutubeArea = styled.div<{
    isYoutubeMobile?: boolean
}>`
    display: flex;
    width: 100%;
    height: fill-available;
    justify-content: center;
    grid-gap: 10px;
    flex: 1;

    ${(props) =>
        props.isYoutubeMobile &&
        css`
            height: fit-content;
        `}
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
    grid-gap: 15px;
    z-index: 10000000;

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
    background: ${(props) => props.theme.colors.black0};
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    justify-content: space-between;
    z-index: 10;
`
const Sidebar = styled(Rnd)`
    top: 0;
    right: 0;
    height: fill-available;
    background: ${(props) => props.theme.colors.black0};
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
    shouldShowSidebar?: boolean
    isYoutubeMobile?: boolean
}>`
    height: fill-available;
    display: flex;
    flex-direction: column;
    overflow-x: visible;
    position: relative;
    top: 0px;
    right: 0px;
    width: ${(props) => props.width}px;
    min-width: ${(props) => props.width}px;
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
    ${(props) =>
        props.isYoutubeMobile &&
        css`
            position: relative;
            height: fill-available;
            flex: 1;
            display: flex;
            bottom: 0px;
            min-height: 50%;
            width: fill-available;
            width: -moz-available;
            border-left: none;
            height: 300px;
        `}
`
