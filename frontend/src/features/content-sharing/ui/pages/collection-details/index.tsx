import React from 'react'
import { Waypoint } from 'react-waypoint'
import styled, { css } from 'styled-components'
import { Margin } from 'styled-components-spacing'
import { UIElement } from '../../../../../main-ui/classes'
import Logic from './logic'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import ImagePreviewModal from '@worldbrain/memex-common/lib/common-ui/image-preview-modal'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import {
    CollectionDetailsEvent,
    CollectionDetailsDependencies,
    CollectionDetailsState,
    CollectionDetailsListEntry,
} from './types'
import {
    SharedAnnotationListEntry,
    SharedAnnotationReference,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import DocumentTitle from '../../../../../main-ui/components/document-title'
import DefaultPageLayout from '../../../../../common-ui/layouts/default-page-layout'
import ProfilePopupContainer from '../../../../user-management/ui/containers/profile-popup-container'
import { ViewportBreakpoint } from '../../../../../main-ui/styles/types'
import { getViewportBreakpoint } from '../../../../../main-ui/styles/utils'
import AnnotationsInPage from '../../../../annotations/ui/components/annotations-in-page'
import ErrorWithAction from '../../../../../common-ui/components/error-with-action'
import FollowBtn from '../../../../activity-follows/ui/components/follow-btn'
import WebMonetizationIcon from '../../../../web-monetization/ui/components/web-monetization-icon'
import InstallExtOverlay from '../../../../ext-detection/ui/components/install-ext-overlay'
import { mergeTaskStates } from '../../../../../main-ui/classes/logic'
import { UserReference } from '../../../../user-management/types'
import ListShareModal from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal'
// import type { Props as ListsSidebarProps } from '../../../../lists-sidebar/ui/components/lists-sidebar'
import { isMemexPageAPdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import BlockContent, {
    getBlockContentYoutubePlayerId,
} from '@worldbrain/memex-common/lib/common-ui/components/block-content'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom, {
    ItemBoxBottomAction,
} from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'
import SearchTypeSwitch from '@worldbrain/memex-common/lib/common-ui/components/search-type-switch'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { EVENT_PROVIDER_URLS } from '@worldbrain/memex-common/lib/constants'
import moment from 'moment'
import RouteLink from '../../../../../common-ui/components/route-link'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import type { AnnotationsInPageProps } from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotations-in-page'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import TextArea from '@worldbrain/memex-common/lib/common-ui/components/text-area'
import DateTimePicker from 'react-datepicker'
import debounce from 'lodash/debounce'
import { LoggedInAccessBox } from './space-access-box'
import { hasUnsavedAnnotationEdits } from '../../../../annotations/ui/logic'
import { hasUnsavedConversationEdits } from '@worldbrain/memex-common/lib/content-conversations/ui/logic'
import CreationInfo from '../../../../../common-ui/components/creation-info'
import MemexEditor from '@worldbrain/memex-common/lib/editor'

const commentImage = require('../../../../../assets/img/comment.svg')
const commentEmptyImage = require('../../../../../assets/img/comment-empty.svg')

const middleMaxWidth = '800px'

type TimestampRange = { fromTimestamp: number; toTimestamp: number }
export default class CollectionDetailsPage extends UIElement<
    CollectionDetailsDependencies,
    CollectionDetailsState,
    CollectionDetailsEvent
> {
    constructor(props: CollectionDetailsDependencies) {
        super(props, { logic: new Logic({ ...props }) })

        const { query } = props
        this.itemRanges = {
            listEntry: parseRange(query.fromListEntry, query.toListEntry),
            annotEntry: parseRange(query.fromAnnotEntry, query.toAnnotEntry),
            reply: parseRange(query.fromReply, query.toReply),
        }
    }

    private handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (
            hasUnsavedAnnotationEdits(this.state) ||
            hasUnsavedConversationEdits(this.state)
        ) {
            e.preventDefault()
        }
    }

    async componentDidMount() {
        window.addEventListener('beforeunload', this.handleBeforeUnload)
        await super.componentDidMount()
    }

    async componentWillUnmount() {
        window.removeEventListener('beforeunload', this.handleBeforeUnload)
        await super.componentWillUnmount()
    }

    showMoreCollaboratorsRef = React.createRef<HTMLElement>()
    embedButtonRef = React.createRef<HTMLDivElement>()
    dateFilterButtonRef = React.createRef<HTMLDivElement>()

    itemRanges: {
        [Key in 'listEntry' | 'annotEntry' | 'reply']:
            | TimestampRange
            | undefined
    }
    scrollableRef?: { element: HTMLElement; timestammp: number }
    scrollTimeout?: ReturnType<typeof setTimeout>

    onListEntryRef = (event: {
        element: HTMLElement
        entry: CollectionDetailsListEntry
    }) => {
        this.handleScrollableRef(
            event.entry.createdWhen,
            event.element,
            this.itemRanges.listEntry,
        )
    }

    onAnnotEntryRef: AnnotationsInPageProps['onAnnotationBoxRootRef'] = (
        event,
    ) => {
        this.handleScrollableRef(
            event.annotation.createdWhen,
            event.element,
            this.itemRanges.annotEntry,
        )
    }

    onReplyRef: AnnotationsInPageProps['onReplyRootRef'] = (event) => {
        this.handleScrollableRef(
            event.reply.reply.createdWhen,
            event.element,
            this.itemRanges.reply,
        )
    }

    handleScrollableRef = (
        timestammp: number,
        element: HTMLElement,
        range: TimestampRange | undefined,
    ) => {
        if (!range || !element) {
            return
        }
        if (this.scrollableRef && this.scrollableRef.timestammp < timestammp) {
            return
        }
        if (
            timestammp >= range.fromTimestamp &&
            timestammp <= range.toTimestamp
        ) {
            this.scrollableRef = { element, timestammp }
            this.scheduleScrollToItems()
        }
    }

    scheduleScrollToItems() {
        if (!this.scrollTimeout) {
            this.scrollTimeout = setTimeout(this.scrollToItems, 1000)
        }
    }

    scrollToItems = () => {
        if (!this.scrollableRef) {
            return
        }
        this.scrollableRef.element.scrollTo({
            behavior: 'smooth',
        })
    }

    isIframe = () => {
        try {
            return window.self !== window.top
        } catch (e) {
            return true
        }
    }

    get isListContributor(): boolean {
        return (
            this.state.permissionKeyResult === 'success' ||
            !!this.state.listRoleID
        )
    }

    get viewportBreakpoint(): ViewportBreakpoint {
        return getViewportBreakpoint(this.getViewportWidth())
    }

    private get sharedListReference(): SharedListReference {
        return {
            type: 'shared-list-reference',
            id: this.props.listID,
        }
    }

    async componentDidUpdate(
        prevProps: CollectionDetailsDependencies,
        previousState: CollectionDetailsState,
    ) {
        if (this.props.listID !== prevProps.listID) {
            await this.processEvent('load', {
                isUpdate: true,
                listID: this.props.listID,
            })
        }

        await this.processEvent('updateScrollState', {
            previousScrollTop: previousState.scrollTop!,
        })
    }

    private renderWebMonetizationIcon() {
        const creatorReference = this.state.listData?.creatorReference

        if (!creatorReference) {
            return
        }

        if (this.state.isListOwner) {
            return (
                <PrimaryAction
                    type={'tertiary'}
                    icon={'addPeople'}
                    iconColor={'prime1'}
                    size={
                        this.viewportBreakpoint === 'mobile'
                            ? 'small'
                            : 'medium'
                    }
                    onClick={() =>
                        this.processEvent('toggleListShareModal', {})
                    }
                    label={'Invite Contributors'}
                />
            )
        }

        if (this.isListContributor) {
            return
        }

        return (
            <WebMonetizationIcon
                services={this.props.services}
                curatorUserRef={creatorReference}
                isFollowedSpace={this.state.isCollectionFollowed}
                getRootElement={this.props.getRootElement}
            />
        )
    }

    getPageEntryActions(
        entry: CollectionDetailsListEntry,
        entryIndex: number,
    ): Array<ItemBoxBottomAction> | undefined {
        const { state } = this
        const annotationEntries = this.state.annotationEntryData
        if (
            state.annotationEntriesLoadState === 'pristine' ||
            state.annotationEntriesLoadState === 'running'
        ) {
            return [
                {
                    node: (
                        <ActionLoaderBox>
                            <LoadingIndicator size={16} key="loading" />{' '}
                        </ActionLoaderBox>
                    ),
                    key: 'loader',
                },
            ]
        }

        const toggleAnnotationsIcon =
            annotationEntries &&
            annotationEntries[entry.normalizedUrl] &&
            annotationEntries[entry.normalizedUrl].length
                ? commentImage
                : this.isListContributor || state.isListOwner
                ? commentEmptyImage
                : null

        const count =
            annotationEntries &&
            annotationEntries[entry.normalizedUrl] &&
            annotationEntries[entry.normalizedUrl].length
                ? annotationEntries[entry.normalizedUrl].length
                : 0

        const currentBaseURL = new URL(window.location.href).origin

        const copyButton: ItemBoxBottomAction = {
            key: 'copy-link-btn',
            image: this.state.copiedLink ? 'check' : 'link',
            imageColor: this.state.copiedLink ? 'prime1' : 'greyScale5',
            ButtonText: this.state.copiedLink ? 'Copied' : 'Copy Link',
            tooltipText: 'Copy link to annotated page',
            onClick: () => {
                navigator.clipboard.writeText(
                    currentBaseURL +
                        '/c/' +
                        this.props.listID +
                        '/p/' +
                        entry.reference?.id,
                )
                this.processEvent('copiedLinkButton', null)
            },
        }

        const commentButton: ItemBoxBottomAction = {
            key: 'expand-notes-btn',
            image: count > 0 ? 'commentFull' : 'commentAdd',
            ButtonText: 'Notes',
            imageColor: 'prime1',
            onClick: () =>
                this.processEvent('togglePageAnnotations', {
                    normalizedUrl: entry.normalizedUrl,
                }),
            rightSideItem:
                count > 0 ? <NoteCounter>{count}</NoteCounter> : undefined,
        }

        const openPageButton: ItemBoxBottomAction = {
            key: 'annotate-page-btn',
            image: 'highlight',
            ButtonText: 'Annotate',
            onClick: (e) => {
                this.processEvent('clickPageResult', {
                    urlToOpen: entry.sourceUrl,
                    preventOpening: () => e.preventDefault(),
                    isFollowedSpace:
                        this.state.isCollectionFollowed ||
                        this.state.isListOwner,
                    notifAlreadyShown: this.state.notifAlreadyShown,
                    sharedListReference: this.sharedListReference,
                    listID: this.props.listID,
                    listEntryID: entry.reference?.id!,
                })
                e.preventDefault()
                e.stopPropagation()
            },
        }
        const summaryButton: ItemBoxBottomAction = {
            key: 'generate-summary-btn',
            image:
                this.state.summarizeArticleLoadState[entry.normalizedUrl] ===
                    'success' ||
                this.state.summarizeArticleLoadState[entry.normalizedUrl] ===
                    'error'
                    ? 'compress'
                    : 'feed',
            ButtonText:
                this.state.summarizeArticleLoadState[entry.normalizedUrl] ===
                    'success' ||
                this.state.summarizeArticleLoadState[entry.normalizedUrl] ===
                    'error'
                    ? 'Hide Summary'
                    : 'Summarize',
            onClick: () => {
                if (
                    this.state.summarizeArticleLoadState[
                        entry.normalizedUrl
                    ] === 'success' ||
                    this.state.summarizeArticleLoadState[
                        entry.normalizedUrl
                    ] === 'error'
                ) {
                    this.processEvent('hideSummary', {
                        entry: entry,
                    })
                } else {
                    this.processEvent('summarizeArticle', {
                        entry: entry,
                    })
                }
            },
        }

        if (
            state.annotationEntriesLoadState === 'success' &&
            toggleAnnotationsIcon !== null
        ) {
            if (
                this.state.listData?.listEntries[entryIndex].hoverState &&
                !this.isIframe()
            ) {
                return [
                    copyButton,
                    summaryButton,
                    openPageButton,
                    commentButton,
                ]
            }

            return [copyButton, summaryButton, openPageButton, commentButton]
        } else if (toggleAnnotationsIcon === null) {
            if (
                this.state.listData?.listEntries[entryIndex].hoverState &&
                !this.isIframe()
            ) {
                return [
                    copyButton,
                    summaryButton,
                    openPageButton,
                    commentButton,
                ]
            }

            return [copyButton, summaryButton, openPageButton, commentButton]
        }
    }

    renderFollowBtn = (pageToOpenPostFollow?: string) => () => {
        return (
            <FollowBtn
                onClick={() => {
                    this.processEvent('clickFollowBtn', {
                        pageToOpenPostFollow,
                    })
                    this.processEvent('clickFollowButtonForNotif', {
                        spaceToFollow: this.props.listID && this.props.listID,
                        sharedListReference: this.sharedListReference,
                        urlToSpace: window.location.href,
                    })
                }}
                isFollowed={this.state.isCollectionFollowed}
                isOwner={this.state.isListOwner}
                isContributor={this.isListContributor}
                loadState={mergeTaskStates([
                    this.state.followLoadState,
                    // this.state.listRolesLoadState,
                    // this.state.permissionKeyState,
                ])}
                viewPortWidth={this.viewportBreakpoint}
            />
        )
    }

    renderPageAnnotations(entry: CollectionDetailsListEntry) {
        const { state } = this

        const youtubeElementId = getBlockContentYoutubePlayerId(
            entry.normalizedUrl,
        )

        return (
            <AnnotationsInPage
                originalUrl={entry.originalUrl}
                contextLocation={'webUI'}
                imageSupport={this.props.imageSupport}
                variant={'dark-mode'}
                getYoutubePlayer={() =>
                    this.props.services.youtube.getPlayerByElementId(
                        youtubeElementId,
                    )
                }
                openImageInPreview={async (imageSource) => {
                    this.processEvent('openImageInPreview', { imageSource })
                }}
                newPageReply={
                    this.isListContributor || state.isListOwner
                        ? state.newPageReplies[entry.normalizedUrl]
                        : undefined
                }
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
                shouldHighlightAnnotation={(annotation) =>
                    isInRange(
                        annotation.createdWhen,
                        this.itemRanges.annotEntry,
                    )
                }
                shouldHighlightReply={(_, replyData) =>
                    isInRange(
                        replyData.reply.createdWhen,
                        this.itemRanges.reply,
                    )
                }
                getReplyEditProps={(replyReference, annotationReference) => ({
                    isDeleting: this.state.replyDeleteStates[replyReference.id]
                        ?.isDeleting,
                    isEditing: this.state.replyEditStates[replyReference.id]
                        ?.isEditing,
                    isHovering: this.state.replyHoverStates[replyReference.id]
                        ?.isHovering,
                    isOwner:
                        this.state.conversations[
                            annotationReference.id.toString()
                        ].replies.find(
                            (reply) => reply.reference.id === replyReference.id,
                        )?.userReference?.id ===
                        this.state.currentUserReference?.id,
                    comment:
                        this.state.replyEditStates[replyReference.id]?.text ??
                        '',
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
                    setAnnotationHovering: (isHovering) => (event) => {
                        this.processEvent('setReplyToAnnotationHovering', {
                            isHovering,
                            replyReference,
                        })
                    },
                    imageSupport: this.props.imageSupport,
                    onCommentChange: (comment) =>
                        this.processEvent('editReplyToAnnotation', {
                            replyText: comment,
                            replyReference,
                        }),
                    onDeleteConfim: () =>
                        this.processEvent('confirmDeleteReplyToAnnotation', {
                            replyReference,
                            annotationReference,
                            sharedListReference: this.sharedListReference,
                        }),
                    onEditConfirm: () => () =>
                        this.processEvent('confirmEditReplyToAnnotation', {
                            replyReference,
                            annotationReference,
                            sharedListReference: this.sharedListReference,
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
                    isEditing: this.state.annotationEditStates[annotationRef.id]
                        ?.isEditing,
                    isHovering: this.state.annotationHoverStates[
                        annotationRef.id
                    ]?.isHovering,
                    imageSupport: this.props.imageSupport,
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
                profilePopupProps={{ services: this.props.services }}
                onToggleReplies={(event) =>
                    this.processEvent('toggleAnnotationReplies', {
                        ...event,
                        sharedListReference: this.sharedListReference,
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
                            sharedListReference: this.sharedListReference,
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
                            sharedListReference: this.sharedListReference,
                        }),
                    onNewReplyCancel: (annotationReference) => () =>
                        this.processEvent('cancelNewReplyToAnnotation', {
                            annotationReference,
                            sharedListReference: this.sharedListReference,
                        }),
                    onNewReplyConfirm: (annotationReference) => () =>
                        this.processEvent('confirmNewReplyToAnnotation', {
                            annotationReference,
                            sharedListReference: this.sharedListReference,
                        }),
                    onNewReplyEdit: (annotationReference) => ({ content }) =>
                        this.processEvent('editNewReplyToAnnotation', {
                            annotationReference,
                            content,
                            sharedListReference: this.sharedListReference,
                        }),
                }}
                onAnnotationBoxRootRef={this.onAnnotEntryRef}
                onReplyRootRef={this.onReplyRef}
                getRootElement={this.props.getRootElement}
            />
        )
    }

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

    private renderBreadCrumbs() {
        const isPageView = this.props.entryID
        const title = this.state.listData!.list.title

        if (isPageView) {
            return (
                <BreadCrumbBox isPageView={isPageView}>
                    <RouteLink
                        route="collectionDetails"
                        services={this.props.services}
                        params={{
                            id: this.props.listID,
                        }}
                    >
                        <Icon
                            filePath="arrowLeft"
                            heightAndWidth="20px"
                            hoverOff
                        />
                        {title}
                    </RouteLink>
                </BreadCrumbBox>
            )
        }
    }

    private renderTitle() {
        const { listData } = this.state
        const title = listData!.list.title
        const isPageView = this.props.entryID

        if (isPageView) {
            return (
                <TitleClick
                    onClick={
                        !this.isIframe()
                            ? (e) => {
                                  this.processEvent('clickPageResult', {
                                      urlToOpen:
                                          listData?.listEntries[0].originalUrl,
                                      preventOpening: () => e.preventDefault(),
                                      isFollowedSpace:
                                          this.state.isCollectionFollowed ||
                                          this.state.isListOwner,
                                      notifAlreadyShown: this.state
                                          .notifAlreadyShown,
                                      sharedListReference: this
                                          .sharedListReference,
                                      listID: this.props.listID,
                                      listEntryID: this.props.entryID!,
                                  })
                                  e.preventDefault()
                                  e.stopPropagation()
                              }
                            : undefined
                    }
                >
                    {this.state.listData?.listEntries[0].entryTitle}
                </TitleClick>
            )
        }

        if (listData!.discordList != null || listData!.slackList != null) {
            return (
                <ChatChannelName viewportBreakpoint={this.viewportBreakpoint}>
                    #{title}
                </ChatChannelName>
            )
        }

        return title
    }

    renderSubtitle() {
        const isPageView = this.props.entryID
        const { state } = this
        const { listData: data } = state
        const users: Array<{ userReference: UserReference; user: User }> = []
        // if (
        //     (state.listRolesLoadState === 'running' ||
        //         state.listRolesLoadState === 'pristine') &&
        //     !users.length
        // ) {
        //     return (
        //         <SubtitleContainer
        //             loading
        //             viewportBreakpoint={this.viewportBreakpoint}
        //         >
        //             <LoadingIndicator size={16} />
        //         </SubtitleContainer>
        //     )
        // }

        if (!data) {
            return (
                <SubtitleContainer viewportBreakpoint={this.viewportBreakpoint}>
                    <LoadingIndicator size={16} />
                </SubtitleContainer>
            )
        }

        if (data.creatorReference && data.creator) {
            users.push({
                userReference: data.creatorReference,
                user: data.creator,
            })
        }

        for (const role of state.listRoles ?? []) {
            const user = state.users[role.user.id]
            if (user) {
                users.push({ userReference: role.user, user })
            }
        }

        const renderedPreview = users.map(({ userReference, user }, index) => {
            const isFirst = index === 0
            const isLast = index === users.length - 1
            return (
                <React.Fragment key={userReference.id}>
                    <SharedBy>
                        {!isFirst && !isLast && ', '}
                        {!isFirst && isLast && ' and '}
                    </SharedBy>
                    <ProfilePopupContainer
                        services={this.props.services}
                        userRef={userReference!}
                    >
                        <Creator>
                            {this.props.services.auth.getCurrentUser()?.id ===
                            user.id
                                ? 'You'
                                : user.displayName}
                        </Creator>
                    </ProfilePopupContainer>
                </React.Fragment>
            )
        })

        // Case: Discord/Slack List
        if (
            (data?.discordList != null || data?.slackList != null) &&
            !isPageView
        ) {
            const serverName =
                data.discordList != null
                    ? data.discordList.guildName
                    : data.slackList?.workspaceName
            const iconName = data.discordList != null ? 'discord' : 'slack'
            return (
                <SubtitleContainer viewportBreakpoint={this.viewportBreakpoint}>
                    <ChatServerName>
                        <Icon
                            height={
                                this.viewportBreakpoint === 'mobile'
                                    ? '20px'
                                    : '22px'
                            }
                            icon={iconName}
                            color="secondary"
                            hoverOff
                            originalImage
                        />
                        {serverName}
                    </ChatServerName>
                </SubtitleContainer>
            )
        }

        // Case: Page View
        if (isPageView) {
            const contributorName = users.map((creator) => {
                if (
                    creator.user.id ===
                    this.state.listData?.listEntries[0].creator.id
                )
                    return creator.user.displayName
            })
            const addedDate = this.state.listData?.listEntries[0].createdWhen
            const domain = this.state.listData?.listEntries[0].normalizedUrl.split(
                '/',
            )[0]

            return (
                <PageViewFooter>
                    <Domain>{domain}</Domain>
                    <PageViewSubtitleHelpText>
                        added by
                    </PageViewSubtitleHelpText>
                    <PageViewSubtitle>{contributorName}</PageViewSubtitle>
                    <PageViewSubtitleHelpText>on </PageViewSubtitleHelpText>
                    <PageViewSubtitle>
                        {moment(addedDate).format('lll')}
                    </PageViewSubtitle>
                </PageViewFooter>
            )
        }

        // Case Space View

        if (!isPageView) {
            if (
                // state.listRolesLoadState === 'success' &&
                users.length > 0
            ) {
                const showListRoleLimit = () => {
                    if (this.viewportBreakpoint === 'small') {
                        return 2
                    }

                    if (this.viewportBreakpoint === 'mobile') {
                        return 1
                    }

                    return 3
                }

                return (
                    <SubtitleContainer
                        viewportBreakpoint={this.viewportBreakpoint}
                    >
                        {renderedPreview && (
                            <>
                                <SharedBy>Space by</SharedBy>{' '}
                                {renderedPreview.slice(0, showListRoleLimit())}
                                {users.length - showListRoleLimit() > 0 && (
                                    <>
                                        <ShowMoreCollaborators
                                            onClick={(event) =>
                                                this.processEvent(
                                                    'toggleMoreCollaborators',
                                                    {
                                                        value: this.state
                                                            .showMoreCollaborators,
                                                    },
                                                )
                                            }
                                            ref={this.showMoreCollaboratorsRef}
                                        >
                                            {users.length -
                                                showListRoleLimit() && (
                                                <>
                                                    <SharedBy>and</SharedBy>{' '}
                                                    {renderedPreview.slice(
                                                        0,
                                                        showListRoleLimit(),
                                                    ) && (
                                                        <SharedBy>
                                                            {users.length -
                                                                showListRoleLimit()}{' '}
                                                            more{' '}
                                                        </SharedBy>
                                                    )}
                                                </>
                                            )}
                                            <Icon
                                                icon={'arrowDown'}
                                                heightAndWidth={'16px'}
                                            />
                                        </ShowMoreCollaborators>
                                        {this.state.showMoreCollaborators && (
                                            <PopoutBox
                                                targetElementRef={
                                                    this
                                                        .showMoreCollaboratorsRef
                                                        ?.current ?? undefined
                                                }
                                                placement="bottom"
                                                closeComponent={() =>
                                                    this.processEvent(
                                                        'toggleMoreCollaborators',
                                                        {
                                                            value: !this.state
                                                                .showMoreCollaborators,
                                                        },
                                                    )
                                                }
                                                offsetX={5}
                                                getPortalRoot={
                                                    this.props.getRootElement
                                                }
                                            >
                                                <ContributorContainer>
                                                    {users.map(
                                                        ({
                                                            userReference,
                                                            user,
                                                        }) => (
                                                            <ProfilePopupContainer
                                                                key={
                                                                    userReference.id
                                                                }
                                                                services={
                                                                    this.props
                                                                        .services
                                                                }
                                                                userRef={
                                                                    userReference!
                                                                }
                                                            >
                                                                <ListEntryBox>
                                                                    <ListEntry
                                                                        key={
                                                                            userReference.id
                                                                        }
                                                                    >
                                                                        {
                                                                            user.displayName
                                                                        }
                                                                    </ListEntry>
                                                                </ListEntryBox>
                                                            </ProfilePopupContainer>
                                                        ),
                                                    )}
                                                </ContributorContainer>
                                            </PopoutBox>
                                        )}
                                    </>
                                )}
                                {/* {rendered} */}
                            </>
                        )}
                    </SubtitleContainer>
                )
            }
        }
        // return (
        //     <SubtitleContainer viewportBreakpoint={this.viewportBreakpoint}>
        //         <SharedBy>by</SharedBy>
        //         {rendered.slice(0, state.listRoleLimit)} and{' '}
        //         <ShowMoreCollaborators
        //             onClick={() =>
        //                 this.processEvent('showMoreCollaborators', {})
        //             }
        //         >
        //             {users.length - state.listRoleLimit} more
        //         </ShowMoreCollaborators>
        //         <Date>
        //             <span>
        //                 on{' '}
        //                 {moment(state.listData?.list.createdWhen).format('LLL')}
        //             </span>
        //         </Date>
        //     </SubtitleContainer>
        // )
    }

    // renderPermissionKeyOverlay() {
    //     return !this.state.requestingAuth ? (
    //         <PermissionKeyOverlay
    //             services={this.props.services}
    //             viewportBreakpoint={this.viewportBreakpoint}
    //             permissionKeyState={this.state.permissionKeyState}
    //             permissionKeyResult={this.state.permissionKeyResult}
    //             onCloseRequested={() =>
    //                 this.processEvent('closePermissionOverlay', {})
    //             }
    //             isContributor={this.isListContributor}
    //             isOwner={this.state.isListOwner}
    //         />
    //     ) : null
    // }

    private renderSearchBox() {
        return (
            <SearchBar viewportWidth={this.viewportBreakpoint}>
                <TextField
                    icon={'searchIcon'}
                    placeholder="Search"
                    value={this.state.searchQuery}
                    onChange={(event) => {
                        this.processEvent('loadSearchResults', {
                            query: (event.target as HTMLInputElement).value,
                            sharedListIds: this.props.listID,
                            startDateFilterValue: this.state
                                .startDateFilterValue,
                            endDateFilterValue: this.state.endDateFilterValue,
                        })
                    }}
                    onKeyDown={(event) => {}}
                    background={'greyScale1'}
                    height="34px"
                    width="220px"
                />
                <TooltipBox
                    placement="bottom"
                    tooltipText='Use natural language, like "2 weeks ago"'
                    getPortalRoot={this.props.getRootElement}
                >
                    <TextField
                        icon={'calendar'}
                        placeholder="from when?"
                        // value={this.state.startDateFilterValue}
                        onChange={debounce((event) => {
                            this.processEvent('loadSearchResults', {
                                query: this.state.searchQuery,
                                sharedListIds: this.props.listID,
                                startDateFilterValue: (event.target as HTMLInputElement)
                                    .value,
                                endDateFilterValue: this.state
                                    .endDateFilterValue,
                            })
                        }, 200)}
                        onKeyDown={(event) => {}}
                        background={'greyScale1'}
                        height="34px"
                        width="180px"
                    />
                </TooltipBox>
                <TooltipBox
                    placement="bottom"
                    tooltipText='Use natural language, like "2 weeks ago"'
                    getPortalRoot={this.props.getRootElement}
                >
                    <TextField
                        icon={'calendar'}
                        placeholder="to when?"
                        // value={this.state.endDateFilterValue}
                        onChange={debounce((event) => {
                            this.processEvent('loadSearchResults', {
                                query: this.state.searchQuery,
                                sharedListIds: this.props.listID,
                                startDateFilterValue: this.state
                                    .startDateFilterValue,
                                endDateFilterValue: (event.target as HTMLInputElement)
                                    .value,
                            })
                        }, 200)}
                        onKeyDown={(event) => {}}
                        background={'greyScale1'}
                        height="34px"
                        width="180px"
                    />
                </TooltipBox>
            </SearchBar>
        )
    }

    private renderDatePicker = () => {
        if (!this.state.dateFilterVisible) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.dateFilterButtonRef.current ?? undefined}
                placement={'bottom-start'}
                offsetX={10}
                closeComponent={() =>
                    this.processEvent('toggleDateFilters', null)
                }
                getPortalRoot={this.props.getRootElement}
            >
                <DateTimePicker onChange={() => {}} />
            </PopoutBox>
        )
    }

    private renderAbovePagesBox() {
        const {
            annotationEntryData,
            allAnnotationExpanded,
            isListOwner,
        } = this.state

        return (
            <AbovePagesBox viewportWidth={this.viewportBreakpoint}>
                {this.state.listData &&
                    this.state.listData?.listEntries?.length > 0 && (
                        <SearchTypeSwitch
                            viewportWidth={this.viewportBreakpoint}
                            onPagesSearchSwitch={() =>
                                this.processEvent('setSearchType', 'pages')
                            }
                            onVideosSearchSwitch={() =>
                                this.processEvent('setSearchType', 'videos')
                            }
                            onTwitterSearchSwitch={() =>
                                this.processEvent('setSearchType', 'twitter')
                            }
                            onPDFSearchSwitch={() =>
                                this.processEvent('setSearchType', 'pdf')
                            }
                            onEventSearchSwitch={() =>
                                this.processEvent('setSearchType', 'events')
                            }
                            searchType={this.state.searchType}
                            toExclude={['notes']}
                        />
                    )}
                <ActionItems>
                    {/* {(this.isListContributor || isListOwner) && (
                        <AddPageBtn
                            onClick={() =>
                                this.processEvent('toggleInstallExtModal', {})
                            }
                        >
                            <Icon icon="plus" height="22px" color="prime1" />
                        </AddPageBtn>
                    )} */}
                    {annotationEntryData &&
                        Object.keys(annotationEntryData).length > 0 && (
                            <ToggleAllAnnotations
                                onClick={() =>
                                    this.processEvent(
                                        'toggleAllAnnotations',
                                        {},
                                    )
                                }
                            >
                                {allAnnotationExpanded ? (
                                    <TooltipBox
                                        tooltipText={'Hide all notes'}
                                        placement={'bottom'}
                                        getPortalRoot={
                                            this.props.getRootElement
                                        }
                                    >
                                        <Icon
                                            icon={'compress'}
                                            heightAndWidth="22px"
                                        />
                                    </TooltipBox>
                                ) : (
                                    <TooltipBox
                                        tooltipText={'Show all notes'}
                                        placement={'bottom'}
                                        getPortalRoot={
                                            this.props.getRootElement
                                        }
                                    >
                                        <Icon
                                            icon={'expand'}
                                            heightAndWidth="22px"
                                        />
                                    </TooltipBox>
                                )}
                            </ToggleAllAnnotations>
                        )}
                </ActionItems>
            </AbovePagesBox>
        )
    }

    private renderModals() {
        if (this.state.isInstallExtModalShown) {
            return (
                <InstallExtOverlay
                    services={this.props.services}
                    viewportBreakpoint={this.viewportBreakpoint}
                    onCloseRequested={() =>
                        this.processEvent('toggleInstallExtModal', {})
                    }
                    mode={
                        this.state.clickedPageUrl != null
                            ? 'click-page'
                            : 'add-page'
                    }
                    intent={'openLink'}
                    clickedPageUrl={this.state.clickedPageUrl!}
                    sharedListReference={this.sharedListReference}
                />
            )
        }

        if (this.state.showFollowModal) {
            return (
                <InstallExtOverlay
                    services={this.props.services}
                    viewportBreakpoint={this.viewportBreakpoint}
                    onCloseRequested={() =>
                        this.processEvent('toggleFollowSpaceOverlay', {})
                    }
                    mode={
                        this.state.clickedPageUrl != null
                            ? 'click-page'
                            : 'add-page'
                    }
                    intent={'follow'}
                />
            )
        }

        // if (this.state.isMissingPDFModalShown) {
        //     return (
        //         <MissingPdfOverlay
        //             services={this.props.services}
        //             viewportBreakpoint={this.viewportBreakpoint}
        //             onCloseRequested={() =>
        //                 this.processEvent('toggleMissingPdfModal', {})
        //             }
        //         />
        //     )
        // }

        return null
    }

    renderEmbedButton() {
        return (
            <TooltipBox
                tooltipText={
                    <span>
                        Share & Embed <br /> this Space
                    </span>
                }
                placement={'bottom'}
                getPortalRoot={this.props.getRootElement}
            >
                <Icon
                    icon="link"
                    heightAndWidth="24px"
                    onClick={() => this.processEvent('toggleEmbedModal', null)}
                    containerRef={this.embedButtonRef}
                    color={'white'}
                />
            </TooltipBox>
        )
    }
    renderEmbedModal() {
        const currentURL = window.location.href

        const embedCode = `<iframe src="${currentURL}" height="1500px" width="1200px"></iframe>`

        if (this.state.renderEmbedModal) {
            return (
                <PopoutBox
                    closeComponent={() =>
                        this.processEvent('toggleEmbedModal', null)
                    }
                    placement={'bottom'}
                    targetElementRef={this.embedButtonRef?.current ?? undefined}
                    offsetX={10}
                    getPortalRoot={this.props.getRootElement}
                >
                    <EmbedContainer>
                        <EmbedLinkContainer>
                            <TextField
                                textColor={'greyScale6'}
                                value={currentURL}
                            />
                            <PrimaryAction
                                icon={
                                    this.state
                                        .isEmbedShareModalCopyTextShown ===
                                    'copyLink'
                                        ? 'check'
                                        : 'copy'
                                }
                                size="large"
                                type="forth"
                                onClick={() => {
                                    navigator.clipboard.writeText(currentURL)
                                    this.processEvent(
                                        'toggleEmbedShareModalCopyText',
                                        { embedOrLink: 'copyLink' },
                                    )
                                }}
                                label={
                                    this.state
                                        .isEmbedShareModalCopyTextShown ===
                                    'copyLink'
                                        ? 'Copied'
                                        : 'Copy Link'
                                }
                            />
                        </EmbedLinkContainer>
                        <EmbedSectionContainer>
                            <TextArea
                                textColor={'greyScale6'}
                                disabled
                                notResizable
                                value={embedCode}
                            />
                        </EmbedSectionContainer>
                        <PrimaryActionContainer>
                            <PrimaryAction
                                icon={
                                    this.state
                                        .isEmbedShareModalCopyTextShown ===
                                    'copyEmbed'
                                        ? 'check'
                                        : 'copy'
                                }
                                size="medium"
                                type="forth"
                                onClick={() => {
                                    navigator.clipboard.writeText(embedCode)
                                    this.processEvent(
                                        'toggleEmbedShareModalCopyText',
                                        { embedOrLink: 'copyEmbed' },
                                    )
                                }}
                                label={
                                    this.state
                                        .isEmbedShareModalCopyTextShown ===
                                    'copyEmbed'
                                        ? 'Copied'
                                        : 'Copy Embed Code'
                                }
                            />
                        </PrimaryActionContainer>
                    </EmbedContainer>
                </PopoutBox>
            )
        }
    }

    renderHeaderActionArea() {
        const isPageView = this.props.entryID

        if (isPageView) {
            return
        }

        if (
            this.state.followLoadState === 'running' ||
            this.state.permissionKeyState === 'running'
        ) {
            return (
                <LoadingBoxHeaderActionArea>
                    <LoadingIndicator size={20} />
                </LoadingBoxHeaderActionArea>
            )
        } else {
            // Case: Get contributor invitation link
            if (
                this.state.listKeyPresent &&
                !this.state.listRoleID &&
                !this.state.isListOwner
            ) {
                return (
                    <InvitedNotification
                        viewportBreakpoint={this.viewportBreakpoint}
                        withFrame={true}
                    >
                        <InvitationTextContainer>
                            <Icon
                                filePath={'invite'}
                                color={'prime1'}
                                heightAndWidth={'22px'}
                            />
                            You've been invited to contribute to this Space and
                            can now add pages and annotations.
                        </InvitationTextContainer>
                        <PrimaryAction
                            label="Accept Invitation"
                            icon="check"
                            iconPosition="left"
                            type={'primary'}
                            size={'small'}
                            disabled={
                                this.state.permissionKeyState !== 'pristine'
                            }
                            onClick={() =>
                                this.processEvent('acceptInvitation', {})
                            }
                        />
                    </InvitedNotification>
                )
            }

            if (this.state.permissionKeyResult === 'success') {
                if (
                    // this.state.permissionKeyState === 'success' &&
                    this.isListContributor &&
                    !this.state.isListOwner
                ) {
                    return (
                        <>
                            <InvitedNotification
                                viewportBreakpoint={this.viewportBreakpoint}
                            >
                                <InvitationTextContainer>
                                    <Icon
                                        filePath={'invite'}
                                        color={'prime1'}
                                        heightAndWidth={'22px'}
                                        hoverOff
                                    />
                                    You can add highlights &amp; pages via the
                                    Memex extension or app.
                                </InvitationTextContainer>
                            </InvitedNotification>
                            {this.renderFollowBtn()()}
                        </>
                    )
                }
            } else {
                if (!isPageView) {
                    // only show buttons when its a Space View, not pageView
                    return (
                        <HeaderButtonRow>
                            {this.renderEmbedModal()}
                            {this.renderEmbedButton()}
                            {/* {this.renderWebMonetizationIcon()} */}
                            {this.renderFollowBtn()()}
                        </HeaderButtonRow>
                    )
                }
            }
        }
    }

    getFilePathforSearchType() {
        if (this.state.searchType === 'twitter') {
            return 'twitter'
        }
        if (this.state.searchType === 'videos') {
            return 'play'
        }
        if (this.state.searchType === 'pdf') {
            return 'filePDF'
        }
        if (this.state.searchType === 'pages') {
            return 'heartEmpty'
        }
        if (this.state.searchType === 'events') {
            return 'calendar'
        }

        return 'searchIcon'
    }

    getNoResultsTextforSearchType() {
        if (this.state.searchType === 'twitter') {
            return 'No Tweets saved in this Space'
        }
        if (this.state.searchType === 'videos') {
            return 'No videos saved in this Space'
        }
        if (this.state.searchType === 'pdf') {
            return 'No PDFs saved in this Space'
        }
        if (this.state.searchType === 'events') {
            return 'No Events posted in this Space'
        }
        if (this.state.searchType === 'pages') {
            return 'Nothing saved in this Space yet'
        }
    }

    renderNoResults() {
        return (
            <NoResultsContainer>
                <IconBox heightAndWidth="40px">
                    <Icon
                        heightAndWidth={'22px'}
                        filePath={this.getFilePathforSearchType()}
                        hoverOff
                        color="prime1"
                    />
                </IconBox>
                <EmptyListBox>
                    {this.getNoResultsTextforSearchType()}
                </EmptyListBox>
                {(this.state.isListOwner || this.isListContributor) && (
                    <PrimaryAction
                        label={'Add Links'}
                        onClick={() => {
                            this.processEvent(
                                'setActionBarSearchAndAddMode',
                                'AddLinks',
                            )
                        }}
                        type="primary"
                        size="medium"
                        icon="plus"
                    />
                )}
            </NoResultsContainer>
        )
    }

    getContentFilteredByType() {
        const data = this.state.listData

        const entries = data ? [...data.listEntries.entries()] : undefined

        if (this.state.searchType === 'twitter') {
            const newEntries = entries?.filter(([, entry]) => {
                return entry.normalizedUrl.startsWith('twitter.com')
            })
            return newEntries
        }
        if (this.state.searchType === 'videos') {
            const newEntries = entries?.filter(([, entry]) => {
                return (
                    entry.normalizedUrl.includes('youtube.com') ||
                    entry.normalizedUrl.includes('vimeo.com')
                )
            })
            return newEntries
        }
        if (this.state.searchType === 'events') {
            const newEntries = entries?.filter(([, entry]) => {
                return EVENT_PROVIDER_URLS.some((url) =>
                    entry.normalizedUrl.includes(url),
                )
            })

            return newEntries
        }

        if (this.state.searchType === 'pdf') {
            const newEntries = entries?.filter(([, entry]) => {
                return entry.normalizedUrl.endsWith('.pdf')
            })
            return newEntries
        }

        return entries
    }

    renderAddLinksField() {
        return (
            <ImportUrlsContainer
                shouldShowFrame={
                    this.state.actionBarSearchAndAddMode === 'AddLinks'
                }
            >
                <TopBar>
                    {this.state.actionBarSearchAndAddMode === null && (
                        <PrimaryAction
                            label={'Add Links'}
                            onClick={() => {
                                this.processEvent(
                                    'setActionBarSearchAndAddMode',
                                    'AddLinks',
                                )
                            }}
                            type="primary"
                            size="medium"
                            icon="plus"
                        />
                    )}
                    {this.state.actionBarSearchAndAddMode === 'AddLinks' && (
                        <PrimaryAction
                            label={'Back'}
                            onClick={() => {
                                this.processEvent(
                                    'setActionBarSearchAndAddMode',
                                    null,
                                )
                            }}
                            type="tertiary"
                            size="medium"
                            icon="arrowLeft"
                            iconPosition="left"
                        />
                    )}
                    {this.state.actionBarSearchAndAddMode === 'AddLinks' && (
                        <PrimaryAction
                            label={'Import Links'}
                            onClick={() => {
                                this.processEvent('addLinkToCollection', null)
                            }}
                            type="secondary"
                            size="medium"
                            icon="plus"
                            disabled={this.state.urlsToAddToSpace.length === 0}
                        />
                    )}
                </TopBar>
                {this.state.actionBarSearchAndAddMode === 'AddLinks' && (
                    <TextFieldContainer>
                        <TextArea
                            onChange={(event) => {
                                this.processEvent('updateAddLinkField', {
                                    textFieldValue: (event?.target as HTMLTextAreaElement)
                                        .value,
                                })
                            }}
                            placeholder="Paste any text, urls are filtered out"
                            defaultValue={this.state.textFieldValueState}
                            maxHeight={'300px'}
                            borderColor={'greyScale3'}
                            autoFocus
                            background="black0"
                            // minHeight={'40px'}
                        />
                    </TextFieldContainer>
                )}
                {this.state.actionBarSearchAndAddMode === 'AddLinks' &&
                    this.state.urlsToAddToSpace.length > 0 && (
                        <BottomBar>
                            <PrimaryAction
                                label={`${
                                    this.state.urlsToAddToSpace?.filter(
                                        (entry) => entry.status === 'queued',
                                    ).length
                                } Queue`}
                                onClick={() => {
                                    if (
                                        this.state.urlsToAddToSpace?.filter(
                                            (entry) =>
                                                entry.status === 'queued',
                                        ).length > 0
                                    ) {
                                        this.processEvent(
                                            'switchImportUrlDisplayMode',
                                            'queued',
                                        )
                                    }
                                }}
                                type="menuBar"
                                size="small"
                                active={
                                    this.state.importUrlDisplayMode === 'queued'
                                }
                                disabled={
                                    this.state.urlsToAddToSpace?.filter(
                                        (entry) =>
                                            entry.status === 'queued' ||
                                            entry.status === 'running',
                                    ).length === 0
                                }
                                fontColor={'greyScale5'}
                            />
                            <PrimaryAction
                                label={`${
                                    this.state.urlsToAddToSpace?.filter(
                                        (entry) => entry.status === 'success',
                                    ).length
                                } Imported`}
                                onClick={() => {
                                    if (
                                        this.state.urlsToAddToSpace?.filter(
                                            (entry) =>
                                                entry.status === 'success',
                                        ).length > 0
                                    ) {
                                        this.processEvent(
                                            'switchImportUrlDisplayMode',
                                            'success',
                                        )
                                    }
                                }}
                                type="menuBar"
                                size="small"
                                active={
                                    this.state.importUrlDisplayMode ===
                                    'success'
                                }
                                disabled={
                                    this.state.urlsToAddToSpace?.filter(
                                        (entry) => entry.status === 'success',
                                    ).length === 0
                                }
                                fontColor={'greyScale5'}
                            />
                            <PrimaryAction
                                label={`${
                                    this.state.urlsToAddToSpace?.filter(
                                        (entry) => entry.status === 'failed',
                                    ).length
                                } Failed`}
                                onClick={() => {
                                    if (
                                        this.state.urlsToAddToSpace?.filter(
                                            (entry) =>
                                                entry.status === 'failed',
                                        ).length > 0
                                    ) {
                                        this.processEvent(
                                            'switchImportUrlDisplayMode',
                                            'failed',
                                        )
                                    }
                                }}
                                disabled={
                                    this.state.urlsToAddToSpace?.filter(
                                        (entry) => entry.status === 'failed',
                                    ).length === 0
                                }
                                active={
                                    this.state.importUrlDisplayMode === 'failed'
                                }
                                type="menuBar"
                                size="small"
                                fontColor={'greyScale5'}
                            />
                        </BottomBar>
                    )}
                {this.state.actionBarSearchAndAddMode === 'AddLinks' &&
                    (this.state.importUrlDisplayMode === 'queued' ||
                        this.state.importUrlDisplayMode === 'running') && (
                        <LinkListContainer>
                            {this.state.urlsToAddToSpace
                                ?.filter(
                                    (entry) =>
                                        entry.status === 'running' ||
                                        entry.status === 'queued',
                                )
                                .map((link) => (
                                    <LinkListItem>
                                        {link.url}
                                        {this.state.importUrlDisplayMode ===
                                            'queued' && (
                                            <RemoveLinkIconBox>
                                                <Icon
                                                    icon={'removeX'}
                                                    onClick={() => {
                                                        this.processEvent(
                                                            'removeLinkFromImporterQueue',
                                                            link.url,
                                                        )
                                                    }}
                                                    heightAndWidth={'20px'}
                                                />
                                            </RemoveLinkIconBox>
                                        )}
                                        {link.status === 'running' && (
                                            <LoadingIndicatorRowBox>
                                                <LoadingIndicator size={18} />
                                            </LoadingIndicatorRowBox>
                                        )}
                                    </LinkListItem>
                                ))}
                        </LinkListContainer>
                    )}
                {this.state.actionBarSearchAndAddMode === 'AddLinks' &&
                    this.state.importUrlDisplayMode !== 'queued' &&
                    this.state.importUrlDisplayMode !== 'running' && (
                        <LinkListContainer>
                            {this.state.urlsToAddToSpace
                                ?.filter(
                                    (entry) =>
                                        entry.status ===
                                        this.state.importUrlDisplayMode,
                                )
                                .map((link) => (
                                    <LinkListItem>{link.url}</LinkListItem>
                                ))}
                        </LinkListContainer>
                    )}
            </ImportUrlsContainer>
        )
    }

    renderDescription() {
        const isPageView = this.props.entryID

        if (isPageView) {
            return
        }

        const { state } = this
        const data = state.listData

        if (data && !data.list.description) {
            return
        }

        const listdescription =
            data?.list.description || data?.listDescriptionTruncated || ''

        if (listdescription.length > 0) {
            return (
                <DescriptionContainer>
                    <MemexEditor
                        markdownContent={listdescription}
                        getRootElement={this.props.getRootElement}
                        editable={false}
                        onContentUpdate={() => null}
                        onKeyDown={() => null}
                        imageSupport={this.props.imageSupport}
                        setDebouncingSaveBlock={() => null}
                        readOnly={true}
                        openImageInPreview={(imageSource: string) =>
                            this.processEvent('openImageInPreview', {
                                imageSource,
                            })
                        }
                    />
                </DescriptionContainer>
            )
        }
    }

    render() {
        const { state } = this
        if (
            state.listLoadState === 'pristine' ||
            state.listLoadState === 'running' ||
            (state.permissionDenied && state.permissionKeyState === 'running')
        ) {
            return (
                <DocumentView id="DocumentView">
                    <DocumentTitle
                        documentTitle={this.props.services.documentTitle}
                        subTitle="Loading list..."
                    />
                    <LoadingScreen>
                        <LoadingIndicator />
                    </LoadingScreen>
                </DocumentView>
            )
        }

        if (state.listLoadState === 'error') {
            return (
                <DocumentView>
                    <DefaultPageLayout
                        services={this.props.services}
                        storage={this.props.storage}
                        viewportBreakpoint={this.viewportBreakpoint}
                        // listsSidebarProps={this.listsSidebarProps}
                        scrollTop={this.state.scrollTop}
                        getRootElement={this.props.getRootElement}
                    >
                        <ErrorWithAction errorType="internal-error">
                            Error loading this collection. <br /> Reload page to
                            retry.
                        </ErrorWithAction>
                    </DefaultPageLayout>
                </DocumentView>
            )
        }

        if (state.permissionDenied) {
            return (
                <DocumentView>
                    <DefaultPageLayout
                        services={this.props.services}
                        storage={this.props.storage}
                        viewportBreakpoint={this.viewportBreakpoint}
                        // listsSidebarProps={this.listsSidebarProps}
                        scrollTop={this.state.scrollTop}
                        getRootElement={this.props.getRootElement}
                    >
                        <LoggedInAccessBox
                            {...state}
                            onInvitationAccept={() =>
                                this.processEvent('acceptInvitation', {})
                            }
                            showDeniedNote={this.state.showDeniedNote}
                        />
                    </DefaultPageLayout>
                </DocumentView>
            )
        }

        const data = state.listData
        if (!data) {
            return (
                <DefaultPageLayout
                    services={this.props.services}
                    storage={this.props.storage}
                    viewportBreakpoint={this.viewportBreakpoint}
                    getRootElement={this.props.getRootElement}
                    // listsSidebarProps={this.listsSidebarProps}
                >
                    <ErrorWithAction
                        errorType="not-found"
                        action={{
                            label: 'Create your first collection',
                            url: 'https://getmemex.com',
                        }}
                    >
                        You're trying to access a collection that does not exist
                        (yet).
                    </ErrorWithAction>
                </DefaultPageLayout>
            )
        }
        const isPageView = this.props.entryID
        // const isPageLink = data.list.type === 'page-link'

        const resultsFilteredByType = this.getContentFilteredByType()

        const currentBaseURL = new URL(window.location.href).origin

        return (
            <DocumentContainer id="DocumentContainer">
                <DocumentTitle
                    documentTitle={this.props.services.documentTitle}
                    subTitle={data.list.title}
                />
                {/* {this.renderPermissionKeyOverlay()} */}
                {this.renderModals()}
                <DefaultPageLayout
                    services={this.props.services}
                    getRootElement={this.props.getRootElement}
                    storage={this.props.storage}
                    viewportBreakpoint={this.viewportBreakpoint}
                    headerTitle={this.renderTitle()}
                    headerSubtitle={this.renderSubtitle()}
                    followBtn={this.renderFollowBtn()()}
                    renderHeaderActionArea={this.renderHeaderActionArea()}
                    webMonetizationIcon={this.renderWebMonetizationIcon()}
                    // listsSidebarProps={this.listsSidebarProps}
                    // isSidebarShown={this.listsSidebarProps.isShown}
                    // permissionKeyOverlay={this.renderPermissionKeyOverlay()}
                    scrollTop={this.state.scrollTop}
                    breadCrumbs={this.renderBreadCrumbs()}
                    renderDescription={this.renderDescription()}
                    isPageView={this.props.entryID}
                >
                    {this.state.imageSourceForPreview &&
                    this.state.imageSourceForPreview?.length > 0 ? (
                        <ImagePreviewModal
                            imageSource={this.state.imageSourceForPreview}
                            closeModal={() =>
                                this.processEvent('openImageInPreview', {
                                    imageSource: undefined,
                                })
                            }
                            getRootElement={this.props.getRootElement}
                        />
                    ) : null}
                    <PageResultsArea
                        headerHeight={getHeaderHeight()}
                        viewportWidth={this.viewportBreakpoint}
                        isIframe={this.isIframe()}
                    >
                        {data.list.description?.length ? (
                            <ReferencesBox>References</ReferencesBox>
                        ) : null}
                        {((this.state.listData &&
                            this.state.listData?.listEntries?.length > 0) ||
                            this.state.actionBarSearchAndAddMode ===
                                'AddLinks') && (
                            <ActionBarSearchAndAdd
                                viewportWidth={this.viewportBreakpoint}
                            >
                                {(this.state.isListOwner ||
                                    this.isListContributor) &&
                                    this.renderAddLinksField()}
                                {this.state.actionBarSearchAndAddMode !==
                                    'AddLinks' && this.renderSearchBox()}
                            </ActionBarSearchAndAdd>
                        )}
                        {!isPageView && this.renderAbovePagesBox()}
                        {state.annotationEntriesLoadState === 'error' && (
                            <Margin bottom={'large'}>
                                <ErrorWithAction errorType="internal-error">
                                    Error loading page notes. Reload page to
                                    retry.
                                </ErrorWithAction>
                            </Margin>
                        )}
                        {(state.listData?.discordList != null ||
                            state.listData?.slackList != null) &&
                            state.listData?.isChatIntegrationSyncing && (
                                <ChatSyncNotif>
                                    <Icon
                                        filePath="redo"
                                        heightAndWidth="18px"
                                        hoverOff
                                        color="prime1"
                                    />{' '}
                                    This Space is still being synced. It may
                                    take a while for everything to show up.
                                </ChatSyncNotif>
                            )}
                        <ResultsList
                            isIframe={this.isIframe()}
                            viewportWidth={this.viewportBreakpoint}
                        >
                            {this.state.resultLoadingState === 'running' ? (
                                <LoadingBox>
                                    <LoadingIndicator size={34} />
                                </LoadingBox>
                            ) : resultsFilteredByType?.length ? (
                                resultsFilteredByType?.map(
                                    ([entryIndex, entry]) => (
                                        <Margin
                                            bottom="small"
                                            key={entry.normalizedUrl}
                                        >
                                            <ItemBox
                                                highlight={isInRange(
                                                    entry.createdWhen,
                                                    this.itemRanges.listEntry,
                                                )}
                                                onMouseEnter={(
                                                    event: React.MouseEventHandler,
                                                ) =>
                                                    this.processEvent(
                                                        'setPageHover',
                                                        { entryIndex },
                                                    )
                                                }
                                                onMouseOver={(
                                                    event: React.MouseEventHandler,
                                                ) => {
                                                    !this.state.listData
                                                        ?.listEntries[
                                                        entryIndex
                                                    ].hoverState &&
                                                        this.processEvent(
                                                            'setPageHover',
                                                            {
                                                                entryIndex,
                                                            },
                                                        )
                                                }}
                                                onMouseLeave={(
                                                    event: React.MouseEventHandler,
                                                ) =>
                                                    this.processEvent(
                                                        'setPageHover',
                                                        { entryIndex },
                                                    )
                                                }
                                                hoverState={
                                                    this.state.listData
                                                        ?.listEntries[
                                                        entryIndex
                                                    ].hoverState
                                                }
                                                // onRef={(event) => {
                                                //     this.onListEntryRef({
                                                //         element: event.currentTarget
                                                //         entry,
                                                //     })
                                                // }}
                                                background="black"
                                            >
                                                <BlockContent
                                                    // pageLink ={'https://memex.social/' + this.props.listID + '/' + entry.reference.id}
                                                    youtubeService={
                                                        this.props.services
                                                            .youtube
                                                    }
                                                    contextLocation={'webUI'}
                                                    type={
                                                        isMemexPageAPdf({
                                                            url:
                                                                entry.normalizedUrl,
                                                        })
                                                            ? 'pdf'
                                                            : 'page'
                                                    }
                                                    normalizedUrl={
                                                        entry.normalizedUrl
                                                    }
                                                    originalUrl={
                                                        entry.sourceUrl
                                                    }
                                                    fullTitle={
                                                        entry &&
                                                        entry.entryTitle
                                                    }
                                                    onClick={(e) => {
                                                        this.processEvent(
                                                            'clickPageResult',
                                                            {
                                                                urlToOpen:
                                                                    entry.sourceUrl,
                                                                preventOpening: () =>
                                                                    e.preventDefault(),
                                                                isFollowedSpace:
                                                                    this.state
                                                                        .isCollectionFollowed ||
                                                                    this.state
                                                                        .isListOwner,
                                                                notifAlreadyShown: this
                                                                    .state
                                                                    .notifAlreadyShown,
                                                                sharedListReference: this
                                                                    .sharedListReference,
                                                                listID: this
                                                                    .props
                                                                    .listID,
                                                                listEntryID: entry
                                                                    .reference
                                                                    ?.id!,
                                                                openInWeb: true,
                                                            },
                                                        )
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                    }}
                                                    viewportBreakpoint={
                                                        this.viewportBreakpoint
                                                    }
                                                    mainContentHover={
                                                        this.state.listData
                                                            ?.listEntries[
                                                            entryIndex
                                                        ].hoverState
                                                            ? 'main-content'
                                                            : undefined
                                                    }
                                                    getRootElement={
                                                        this.props
                                                            .getRootElement
                                                    }
                                                    renderCreationInfo={() => {
                                                        return entry.createdWhen ? (
                                                            <CreationInfo
                                                                createdWhen={
                                                                    entry.createdWhen
                                                                }
                                                            />
                                                        ) : (
                                                            <></>
                                                        )
                                                    }}
                                                />
                                                {this.state
                                                    .summarizeArticleLoadState[
                                                    entry.normalizedUrl
                                                ] ? (
                                                    <SummarySection>
                                                        {this.state
                                                            .summarizeArticleLoadState[
                                                            entry.normalizedUrl
                                                        ] === 'running' && (
                                                            <LoadingBox>
                                                                <LoadingIndicator
                                                                    size={24}
                                                                />
                                                            </LoadingBox>
                                                        )}
                                                        {this.state
                                                            .summarizeArticleLoadState[
                                                            entry.normalizedUrl
                                                        ] === 'success' && (
                                                            <SummaryContainer>
                                                                <SummaryText>
                                                                    {this.state
                                                                        .articleSummary[
                                                                        entry
                                                                            .normalizedUrl
                                                                    ] ??
                                                                        undefined}
                                                                </SummaryText>
                                                            </SummaryContainer>
                                                        )}
                                                        {this.state
                                                            .summarizeArticleLoadState[
                                                            entry.normalizedUrl
                                                        ] === 'error' && (
                                                            <ErrorContainer>
                                                                <Icon
                                                                    icon="warning"
                                                                    color="warning"
                                                                    heightAndWidth="22px"
                                                                    hoverOff
                                                                />
                                                                Page could not
                                                                be summarised.
                                                                This may be
                                                                because it is
                                                                behind a
                                                                paywall. <br />{' '}
                                                                Youtube videos
                                                                and PDFs are not
                                                                supported yet.
                                                            </ErrorContainer>
                                                        )}
                                                    </SummarySection>
                                                ) : undefined}
                                                <ItemBoxBottom
                                                    creationInfo={{
                                                        creator: this.state
                                                            .users[
                                                            entry.creator.id
                                                        ],
                                                        createdWhen:
                                                            entry.createdWhen,
                                                    }}
                                                    actions={this.getPageEntryActions(
                                                        entry,
                                                        entryIndex,
                                                    )}
                                                    getRootElement={
                                                        this.props
                                                            .getRootElement
                                                    }
                                                />
                                            </ItemBox>
                                            {state.pageAnnotationsExpanded[
                                                entry.normalizedUrl
                                            ] && (
                                                <>
                                                    {this.renderPageAnnotations(
                                                        entry,
                                                    )}
                                                </>
                                            )}
                                            {entryIndex > 0 &&
                                                (entryIndex + 1) %
                                                    data.pageSize ===
                                                    0 && (
                                                    <Waypoint
                                                        onEnter={() => {
                                                            this.processEvent(
                                                                'pageBreakpointHit',
                                                                {
                                                                    entryIndex,
                                                                },
                                                            )
                                                        }}
                                                    />
                                                )}
                                        </Margin>
                                    ),
                                )
                            ) : (
                                this.renderNoResults()
                            )}
                            {this.state.paginateLoading === 'running' && (
                                <LoadingBox>
                                    <LoadingIndicator size={34} />
                                </LoadingBox>
                            )}
                        </ResultsList>
                    </PageResultsArea>
                </DefaultPageLayout>
                {this.state.isListShareModalShown && (
                    <ListShareModal
                        listId={this.props.listID}
                        services={this.props.services}
                        onCloseRequested={() =>
                            this.processEvent('toggleListShareModal', {})
                        }
                    />
                )}
            </DocumentContainer>
        )
    }
}

const getHeaderHeight = () => {
    const headerHeight = document.getElementById('StyledHeader')?.clientHeight

    return headerHeight
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

const RightSideButtons = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 10px;
`

const BetaButton = styled.div`
    display: flex;
    background: linear-gradient(
        90deg,
        #d9d9d9 0%,
        #2e73f8 0.01%,
        #0a4bca 78.86%,
        #0041be 100%
    );
    border-radius: 50px;
    height: 24px;
    width: 50px;
    align-items: center;
    justify-content: center;
`

const BetaButtonInner = styled.div`
    display: flex;
    background: ${(props) => props.theme.colors.greyScale1};
    color: #0a4bca;
    font-size: 12px;
    letter-spacing: 1px;
    height: 20px;
    width: 46px;
    align-items: center;
    justify-content: center;
    border-radius: 50px;
`

const ErrorContainer = styled.div`
    display: flex;
    padding: 15px;
    margin: 0 10px;
    grid-gap: 10px;
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 16px;
    width: 100%;
    align-items: flex-start;
`

const SummaryContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: space-between;
    grid-gap: 10px;
    align-items: flex-start;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
    margin-top: 10px;
`

const SummaryFooter = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    grid-gap: 10px;
    padding: 10px 20px 10px 20px;
`

const PoweredBy = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 5px;
    color: ${(props) => props.theme.colors.greyScale4};
    font-size: 12px;
    height: 26px;
`

const SummarySection = styled.div`
    display: flex;
    width: 100%;
    min-height: 60px;
    justify-content: center;
    align-items: flex-start;
    margin-bottom: 10px;
`

const SummaryText = styled.div`
    padding: 10px 20px 10px 20px;
    color: ${(props) => props.theme.colors.greyScale7};
    font-size: 16px;
    line-height: 24px;
    white-space: break-spaces;
`

const LoadingBox = styled.div`
    display: flex;
    width: 100%;
    height: 150px;
    justify-content: center;
    align-items: center;
`

const SearchBar = styled.div<{ viewportWidth: ViewportBreakpoint }>`
    display: flex;
    grid-gap: 10px;
    justify-content: flex-start;
    width: fit-content;
    z-index: 40;
`

const PrimaryActionContainer = styled.div`
    display: flex;
    position: absolute;
    right: 25px;
    bottom: 25px;
`

const EmbedContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 15px;
    height: fit-content;
    width: 400px;
    padding: 20px;
    position: relative;
`

const EmbedLinkContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    grid-gap: 10px;
    width: 100%;
`

const EmbedSectionContainer = styled.div`
    width: fill-available;
    position: relative;

    & > div {
        height: 120px;
    }

    & textarea {
        &::-webkit-scrollbar {
            display: none;
        }

        height: 120px;

        scrollbar-width: none;
    }
`

const ChatSyncNotif = styled.div`
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    padding: 10px 20px;
    border-radius: 8px;
    color: ${(props) => props.theme.colors.greyScale5};
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    grid-gap: 10px;
`

const TitleClick = styled.div`
    cursor: pointer;
    &:hover {
        text-decoration: underline;
    }
`

const Domain = styled.div`
    color: ${(props) => props.theme.colors.white};
    margin-right: 20px;
`
const PageViewSubtitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
`
const PageViewSubtitleHelpText = styled.div`
    color: ${(props) => props.theme.colors.greyScale4};
`

const PageViewFooter = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 5px;
`

const ResultsList = styled.div<{
    viewportWidth: ViewportBreakpoint
    loading?: boolean
    isIframe?: boolean
}>`
    display: flex;
    flex-direction: column;
    width: 100%;
    z-index: 20;
    padding-bottom: 200px;
    padding-top: 2px;

    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            padding: 2px 15px 0px 15px;
        `}
    ${(props) =>
        props.viewportWidth === 'small' &&
        css`
            padding: 2px 15px 0px 15px;
        `} /* ${(props) =>
        props.isIframe &&
        css`
            padding: 10px;
        `}; */
`

const PageStickyBox = styled.div<{ beSticky: boolean }>`
    z-index: 20;
    ${(props) =>
        props.beSticky &&
        css`
            position: sticky;
            top: 62px;
            bottom: 0px;
        `}
`

const DocumentView = styled.div`
    height: 100%;
    width: 100%;
`

const DocumentContainer = styled.div`
    height: 100%;
`

// const CollectionDescriptionBox = styled.div<{
//     viewportWidth: ViewportBreakpoint
// }>`
//     font-family: ${(props) => props.theme.fonts.primary};
//     font-size: 14px;
//     display: flex;
//     flex-direction: column;
//     align-items: flex-start;
//     margin: ${(props) =>
//         props.viewportWidth === 'small' || props.viewportWidth === 'mobile'
//             ? '20px 5px'
//             : '20px auto'};
// `
// const CollectionDescriptionText = styled.div<{
//     viewportWidth: ViewportBreakpoint
// }>``
// const CollectionDescriptionToggle = styled.div<{
//     viewportWidth: ViewportBreakpoint
// }>`
//     cursor: pointer;
//     padding: 3px 5px;
//     margin-left: -5px;
//     border-radius: ${(props) => props.theme.borderRadii.default};
//     color: ${(props) => props.theme.colors.subText};
//     &:hover {
//         background-color: ${(props) => props.theme.hoverBackgrounds.primary};
//     }
// `

const NoResultsContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: fill-available;
    padding: 50px 0px;
`

const HeaderButtonRow = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    flex-direction: row;
`

const InvitationTextContainer = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 5px;
    flex: 1;
`

const LoadingBoxHeaderActionArea = styled.div`
    height: fill-available;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-right: 20px;
    padding-top: 10px;
`

const InvitedNotification = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
    withFrame?: boolean
}>`
    margin: auto;
    width: 100%;
    max-width: 800px;
    min-height: 40px;
    padding: 0px 10px 0px 0px;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 300;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    font-family: ${(props) => props.theme.fonts.primary};
    grid-gap: 10px;
    margin-left: -7px;

    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            display: flex;
            width: 100%;
            padding: 10px 0px;
            font-size: 11px;
            flex-direction: column;
            grid-gap: 10px;
        `}

    ${(props) =>
        props.withFrame &&
        css`
            border: 1px solid ${(props) => props.theme.colors.prime1}40;
            border-radius: 8px;
            width: fill-available;
            padding: 5px 5px 5px 15px;
            height: 100%;
            justify-content: center;
            margin-left: 0px;
        `}
            ${(props) =>
        props.withFrame &&
        props.viewportBreakpoint === 'mobile' &&
        css`
            border: 1px solid ${(props) => props.theme.colors.prime1}40;
            border-radius: 8px;
            width: fill-available;
            padding: 15px 15px;
            font-size: 12px;
            height: 100%;
            justify-content: center;
        `}
`

const BreadCrumbBox = styled.div<{
    isPageView: string
}>`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    margin-left: -8px;
    margin-top: 15px;
    color: ${(props) => props.theme.colors.white};
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    & * {
        cursor: pointer;
    }

    ${(props) =>
        props.isPageView &&
        css`
            margin-top: 0px;
            max-width: 800px;
            width: 100%;
        `}
`

const AbovePagesBox = styled.div<{
    viewportWidth: ViewportBreakpoint
}>`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    width: calc(100% + 40px);
    position: relative;
    z-index: 30;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    justify-content: space-between;
    padding-bottom: 10px;
    border-radius: 3px 3px 0 0;
    position: sticky;
    top: 0px;
    margin-left: -20px;
    padding: 10px 20px 10px 20px;
    background-color: ${(props) => props.theme.colors.black}40;
    backdrop-filter: blur(10px);

    ${(props) =>
        (props.viewportWidth === 'mobile' || props.viewportWidth === 'small') &&
        css`
            padding: 10px 15px 10px 15px;
            margin-left: 0px;
            width: calc(100%);
        `}
`

const DescriptionActions = styled(Margin)`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`

const ActionItems = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    grid-gap: 10px;
`

const AddPageBtn = styled.div`
    display: flex;
    align-items: center;
    left: 0;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.greyScale5};
    font-weight: 400;
    cursor: pointer;
    border-radius: 3px;
`

const ToggleAllAnnotations = styled.div`
    text-align: right;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.prime1};
    font-weight: bold;
    cursor: pointer;
    font-size: 12px;
    width: fit-content;
    border-radius: 5px;
`

const SectionTitle = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.greyScale5};
    font-weight: 300;
    font-size: 16px;
    letter-spacing: 1px;
`

const PageInfoList = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    width: 100%;

    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            padding: 0 0px 20px 0px;
        `}
`

const EmptyListBox = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    width: 100%;
    padding: 20px 20px;
    color: ${(props) => props.theme.colors.greyScale5};
    display: flex;
    font-size: 16px;
    font-weight: normal;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-align: center;
    grid-gap: 10px;
`

const ShowMoreCollaborators = styled.span`
    cursor: pointer;
    color: ${(props) => props.theme.colors.greyScale2};
    align-items: center;
    grid-gap: 5px;
    display: inline-box;
`

const LoadingScreen = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`

const ActionLoaderBox = styled.div`
    margin-right: 10px;
`

const SubtitleContainer = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
    loading?: boolean
}>`
    display: flex;
    align-items: center;
    /* grid-gap: 10px; */
    font-size: 14px;
    height: 24px;
    white-space: nowrap;

    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            align-items: center;
        `}

    ${(props) =>
        props.loading &&
        css`
            margin-top: 5px;
            margin-bottom: -5px;
            padding-left: 10px;
        `}
`

const ChatChannelName = styled.span<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    display: flex;
    flex-direction: row;
    align-items: center;
    grid-gap: 10px;
    letter-spacing: 1px;
    color: ${(props) => props.theme.colors.prime2};
    font-size: 34px;
    font-weight: 900;
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            font-size: 22px;
        `}
`
const ChatServerName = styled.span`
    color: ${(props) => props.theme.colors.greyScale6};
    font-weight: 600;
    display: flex;
    align-items: center;
    grid-gap: 5px;
`

// const DomainName = styled.div`
//     color: ${(props) => props.theme.colors.white};
// `

// const RearBox = styled.div<{
//     viewportBreakpoint: ViewportBreakpoint
// }>`
//     display: inline-block;
//     align-items: center;
//     grid-gap: 5px;
//     color: ${(props) => props.theme.colors.greyScale5};

//     /* ${(props) =>
//         props.viewportBreakpoint === 'mobile' &&
//         css`
//             grid-gap: 3px;
//             flex-direction: column;
//             align-items: flex-start;
//         `} */
// `

const Creator = styled.span`
    color: ${(props) => props.theme.colors.prime1};
    padding: 0 4px;
    cursor: pointer;
`

const SharedBy = styled.span`
    color: ${(props) => props.theme.colors.greyScale5};
    display: contents;
`

// const Date = styled.span`
//     color: ${(props) => props.theme.colors.greyScale5};
//     display: inline-block;
// `

const ContributorContainer = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 10px;
    width: 210px;
    max-width: 300px;
    border-radius: 12px;
`
const ListEntryBox = styled.div`
    display: flex;
    align-items: center;
    height: 40px;
    border-radius: 5px;
    padding: 0 15px;

    &:hover {
        background: ${(props) => props.theme.colors.greyScale1};
    }
`

const ListEntry = styled.div`
    display: block;
    align-items: center;

    font-weight: 400;
    width: fill-available;
    color: ${(props) => props.theme.colors.white};
    text-overflow: ellipsis;
    overflow: hidden;

    & * {
        white-space: pre-wrap;
        font-weight: initial;
    }
`

const NoteCounter = styled.span`
    color: ${(props) => props.theme.colors.black};
    font-weight: 400;
    font-size: 12px;
    margin-left: 5px;
    border-radius: 30px;
    padding: 2px 10px;
    background: ${(props) => props.theme.colors.headerGradient};
    text-align: center;
`

const ReferencesBox = styled.div`
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 18px;
    font-weight: 800;
    margin-top: 20px;
    margin-bottom: 10px;
`
const DescriptionContainer = styled.div`
    margin: 0 -10px;
    width: fill-available;
    width: -moz-available;
`

const TextFieldContainer = styled.div`
    margin-top: 10px;
`

const LinkListContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    width: 100%;
    grid-gap: 3px;
    max-height: 600px;
    overflow: scroll;
    margin-top: 10px;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const TopBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    grid-gap: 20px;
`
const BottomBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 10px;
`
const RemoveLinkIconBox = styled.div`
    display: none;
    position: absolute;
    right: 10px;
`
const LoadingIndicatorRowBox = styled.div`
    display: flex;
    position: absolute;
    right: 10px;
`

const LinkListItem = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    box-sizing: border-box;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    position: relative;

    &:hover {
        background: ${(props) => props.theme.colors.greyScale2};
    }
    &:hover ${RemoveLinkIconBox} {
        display: flex;
    }

    &:last-child {
        border-bottom: none;
    }
`

const ImportUrlsContainer = styled.div<{ shouldShowFrame: boolean }>`
    display: flex;
    flex-direction: column;
    width: 100%;

    ${(props) =>
        props.shouldShowFrame &&
        css`
            border: 1px solid ${(props) => props.theme.colors.greyScale3};
            border-radius: 10px;
            padding: 10px;
        `}
`

const ActionBarSearchAndAdd = styled.div<{ viewportWidth: ViewportBreakpoint }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    grid-gap: 20px;
    margin-bottom: 30px;
    width: 100%;

    ${(props) =>
        (props.viewportWidth === 'mobile' || props.viewportWidth === 'small') &&
        css`
            padding: 10px 15px 10px 15px;
            margin-left: 0px;
            width: calc(100%);
        `}
`

const PageResultsArea = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    headerHeight: number | undefined
    isIframe: boolean
}>`
    max-width: ${middleMaxWidth};
    position: relative;
    margin: 0px auto 0;
    width: 100%;
    height: fit-content;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    ${(props) =>
        props.isIframe &&
        css`
            padding: 0 10px;
        `}
`
