import React from 'react'
import { Waypoint } from 'react-waypoint'
import styled, { css } from 'styled-components'
import { Margin } from 'styled-components-spacing'
import { UIElement } from '../../../../../main-ui/classes'
import Logic from './logic'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import {
    CollectionDetailsEvent,
    CollectionDetailsDependencies,
    CollectionDetailsState,
} from './types'
import {
    SharedListEntry,
    SharedAnnotationListEntry,
    SharedAnnotationReference,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { PAGE_SIZE } from './constants'
import DocumentTitle from '../../../../../main-ui/components/document-title'
import DefaultPageLayout from '../../../../../common-ui/layouts/default-page-layout'
import ProfilePopupContainer from '../../../../user-management/ui/containers/profile-popup-container'
import { ViewportBreakpoint } from '../../../../../main-ui/styles/types'
import { getViewportBreakpoint } from '../../../../../main-ui/styles/utils'
import AnnotationsInPage from '../../../../annotations/ui/components/annotations-in-page'
import ErrorWithAction from '../../../../../common-ui/components/error-with-action'
import FollowBtn from '../../../../activity-follows/ui/components/follow-btn'
import WebMonetizationIcon from '../../../../web-monetization/ui/components/web-monetization-icon'
import PermissionKeyOverlay from './permission-key-overlay'
import InstallExtOverlay from '../../../../ext-detection/ui/components/install-ext-overlay'
import { mergeTaskStates } from '../../../../../main-ui/classes/logic'
import { UserReference } from '../../../../user-management/types'
import ListShareModal from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal'
// import type { Props as ListsSidebarProps } from '../../../../lists-sidebar/ui/components/lists-sidebar'
import { isPagePdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import MissingPdfOverlay from '../../../../ext-detection/ui/components/missing-pdf-overlay'
import Markdown from '@worldbrain/memex-common/lib/common-ui/components/markdown'
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
import { eventProviderUrls } from '@worldbrain/memex-common/lib/constants'
import moment from 'moment'
import RouteLink from '../../../../../common-ui/components/route-link'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'

const commentImage = require('../../../../../assets/img/comment.svg')
const commentEmptyImage = require('../../../../../assets/img/comment-empty.svg')

export default class CollectionDetailsPage extends UIElement<
    CollectionDetailsDependencies,
    CollectionDetailsState,
    CollectionDetailsEvent
> {
    constructor(props: CollectionDetailsDependencies) {
        super(props, { logic: new Logic({ ...props }) })
    }

    showMoreCollaboratorsRef = React.createRef<HTMLElement>()

    // get listsSidebarProps(): Omit<
    //     ListsSidebarProps,
    //     'services' | 'storage' | 'viewportBreakpoint'
    // > {
    //     return {
    //         collaborativeLists: this.state.collaborativeLists,
    //         followedLists: this.state.followedLists,
    //         isShown: this.state.isListSidebarShown,
    //         loadState: this.state.listSidebarLoadState,
    //         onToggle: () => this.processEvent('toggleListSidebar', undefined),
    //     }
    // }

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
                storage={this.props.storage}
                curatorUserRef={creatorReference}
                isFollowedSpace={this.state.isCollectionFollowed}
            />
        )
    }

    getPageEntryActions(
        entry: SharedListEntry,
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

        if (
            state.annotationEntriesLoadState === 'success' &&
            toggleAnnotationsIcon !== null
        ) {
            if (
                this.state.listData?.listEntries[entryIndex].hoverState &&
                !this.isIframe()
            ) {
                return [
                    {
                        key: 'copy-link-btn',
                        image: this.state.copiedLink ? 'check' : 'link',
                        imageColor: this.state.copiedLink
                            ? 'prime1'
                            : 'greyScale5',
                        ButtonText: this.state.copiedLink
                            ? 'Copied'
                            : 'Copy Link',
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
                    },
                    {
                        key: 'expand-notes-btn',
                        image: count > 0 ? 'commentFull' : 'commentAdd',
                        ButtonText: count > 0 ? count : '',
                        imageColor: 'prime1',
                        onClick: () =>
                            this.processEvent('togglePageAnnotations', {
                                normalizedUrl: entry.normalizedUrl,
                            }),
                    },
                ]
            }

            return [
                {
                    key: 'expand-notes-btn',
                    image: count > 0 ? 'commentFull' : 'commentAdd',
                    ButtonText: count > 0 ? count : '',
                    imageColor: 'prime1',
                    onClick: () =>
                        this.processEvent('togglePageAnnotations', {
                            normalizedUrl: entry.normalizedUrl,
                        }),
                },
                // {
                //     node: (
                //         <CommentIconBox
                //             onClick={() =>
                //                 this.processEvent('togglePageAnnotations', {
                //                     normalizedUrl: entry.normalizedUrl,
                //                 })
                //             }
                //         >
                //             {count > 0 && <Counter>{count}</Counter>}
                //             <Icon
                //                 icon={toggleAnnotationsIcon}
                //                 heightAndWidth={'16px'}
                //                 hoverOff
                //             />
                //         </CommentIconBox>
                //     ),
                // },
            ]
        } else if (
            this.state.listData?.listEntries[entryIndex].hoverState &&
            !this.isIframe()
        ) {
            return [
                {
                    key: 'expand-notes-btn',
                    image: 'link',
                    imageColor: 'greyScale5',
                    ButtonText: 'Copy Link',
                    onClick: () => {
                        navigator.clipboard.writeText(
                            'https://memex.social/' +
                                this.props.listID +
                                '/' +
                                entry.reference?.id,
                        )
                    },
                },
            ]
        }
    }

    renderFollowBtn = (pageToOpenPostFollow?: string) => () => {
        return (
            <FollowBtn
                onClick={() => {
                    this.processEvent('clickFollowBtn', {
                        pageToOpenPostFollow,
                    })
                }}
                isFollowed={this.state.isCollectionFollowed}
                isOwner={this.state.isListOwner}
                isContributor={this.isListContributor}
                loadState={mergeTaskStates([
                    this.state.followLoadState,
                    this.state.listRolesLoadState,
                    this.state.permissionKeyState,
                ])}
                viewPortWidth={this.viewportBreakpoint}
            />
        )
    }

    renderPageAnnotations(entry: SharedListEntry & { creator: UserReference }) {
        const { state } = this

        const youtubeElementId = getBlockContentYoutubePlayerId(
            entry.normalizedUrl,
        )

        return (
            <AnnotationsInPage
                contextLocation={'webUI'}
                variant={'dark-mode'}
                getYoutubePlayer={() =>
                    this.props.services.youtube.getPlayerByElementId(
                        youtubeElementId,
                    )
                }
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
                profilePopupProps={{
                    storage: this.props.storage,
                    services: this.props.services,
                }}
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

        if (listData!.discordList == null) {
            return title
        }

        return (
            <DiscordChannelName>
                <Icon height="35px" icon="discord" color="secondary" hoverOff />
                #{title}
            </DiscordChannelName>
        )
    }

    renderSubtitle() {
        const isPageView = this.props.entryID
        const { state } = this
        const { listData: data } = state
        const users: Array<{ userReference: UserReference; user: User }> = []
        if (
            (state.listRolesLoadState === 'running' ||
                state.listRolesLoadState === 'pristine') &&
            !users.length
        ) {
            return (
                <SubtitleContainer
                    loading
                    viewportBreakpoint={this.viewportBreakpoint}
                >
                    <LoadingIndicator size={16} />
                </SubtitleContainer>
            )
        }

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
                        storage={this.props.storage}
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

        // Case: Discord List

        if (data?.discordList != null && !isPageView) {
            return (
                <SubtitleContainer viewportBreakpoint={this.viewportBreakpoint}>
                    <DiscordGuildName>
                        {data.discordList.guildName}
                    </DiscordGuildName>
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
            if (state.listRolesLoadState === 'success' && users.length > 0) {
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
                                                                storage={
                                                                    this.props
                                                                        .storage
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

    renderPermissionKeyOverlay() {
        return !this.state.requestingAuth ? (
            <PermissionKeyOverlay
                services={this.props.services}
                viewportBreakpoint={this.viewportBreakpoint}
                permissionKeyState={this.state.permissionKeyState}
                permissionKeyResult={this.state.permissionKeyResult}
                onCloseRequested={() =>
                    this.processEvent('closePermissionOverlay', {})
                }
                isContributor={this.isListContributor}
                isOwner={this.state.isListOwner}
            />
        ) : null
    }

    private renderAbovePagesBox() {
        const {
            annotationEntryData,
            allAnnotationExpanded,
            isListOwner,
        } = this.state

        return (
            <AbovePagesBox viewportWidth={this.viewportBreakpoint}>
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
                <ActionItems>
                    {(this.isListContributor || isListOwner) && (
                        <AddPageBtn
                            onClick={() =>
                                this.processEvent('toggleInstallExtModal', {})
                            }
                        >
                            <Icon icon="plus" height="22px" color="prime1" />
                        </AddPageBtn>
                    )}
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

        if (this.state.isMissingPDFModalShown) {
            return (
                <MissingPdfOverlay
                    services={this.props.services}
                    viewportBreakpoint={this.viewportBreakpoint}
                    onCloseRequested={() =>
                        this.processEvent('toggleMissingPdfModal', {})
                    }
                />
            )
        }

        return null
    }

    renderHeaderActionArea() {
        const isPageView = this.props.entryID

        if (isPageView) {
            return
        }

        if (
            // this.state.followLoadState === 'running' ||
            this.state.listRolesLoadState === 'running' ||
            this.state.permissionKeyState === 'running'
        ) {
            return (
                <LoadingBoxHeaderActionArea>
                    <LoadingIndicator size={24} />
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
                            onClick={() =>
                                this.processEvent('acceptInvitation', {})
                            }
                        />
                    </InvitedNotification>
                )
            }

            if (this.state.permissionKeyResult === 'success') {
                if (
                    this.state.permissionKeyState === 'success' &&
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
                            {this.renderWebMonetizationIcon()}
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
            </NoResultsContainer>
        )
    }

    getContentFilteredByType() {
        const data = this.state.listData

        const entries = data ? [...data.listEntries.entries()] : undefined

        if (this.state.searchType === 'twitter') {
            const newEntries = entries?.filter((entry) => {
                return entry[1].normalizedUrl.startsWith('twitter.com')
            })
            return newEntries
        }
        if (this.state.searchType === 'videos') {
            const newEntries = entries?.filter((entry) => {
                return (
                    entry[1].normalizedUrl.includes('youtube.com') ||
                    entry[1].normalizedUrl.includes('vimeo.com')
                )
            })
            return newEntries
        }
        if (this.state.searchType === 'events') {
            const newEntries = entries?.filter((entry) => {
                return eventProviderUrls.some((url) =>
                    entry[1].normalizedUrl.includes(url),
                )
            })

            return newEntries
        }

        if (this.state.searchType === 'pdf') {
            const newEntries = entries?.filter((entry) => {
                return entry[1].normalizedUrl.endsWith('.pdf')
            })
            return newEntries
        }

        return entries
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

        return (
            <CollectionDescriptionText
                viewportBreakpoint={this.viewportBreakpoint}
            >
                {data?.listDescriptionState === 'collapsed'
                    ? data?.listDescriptionTruncated
                    : data?.list.description}
            </CollectionDescriptionText>

            // <CollectionDescriptionBox
            //     viewportBreakpoint={this.viewportBreakpoint}
            // >
            //     <DescriptionActions bottom={'small'}>
            //         {data?.listDescriptionState !== 'fits' && (
            //             <CollectionDescriptionToggle
            //                 onClick={() =>
            //                     this.processEvent(
            //                         'toggleDescriptionTruncation',
            //                         {},
            //                     )
            //                 }
            //                 viewportBreakpoint={this.viewportBreakpoint}
            //             >
            //                 {data?.listDescriptionState === 'collapsed' ? (
            //                     <TooltipBox
            //                         tooltipText={'Show full description'}
            //                         placement={'bottom'}
            //                     >
            //                         <Icon
            //                             icon={'expand'}
            //                             heightAndWidth="22px"
            //                         />
            //                     </TooltipBox>
            //                 ) : (
            //                     <TooltipBox
            //                         tooltipText={'Hide description'}
            //                         placement={'bottom'}
            //                     >
            //                         <Icon
            //                             icon={'compress'}
            //                             heightAndWidth="22px"
            //                         />
            //                     </TooltipBox>
            //                 )}
            //             </CollectionDescriptionToggle>
            //         )}
            //     </DescriptionActions>
            //     <CollectionDescriptionText
            //         viewportBreakpoint={this.viewportBreakpoint}
            //     >
            //         {data?.listDescriptionState === 'collapsed'
            //             ? data?.listDescriptionTruncated
            //             : data?.list.description}
            //     </CollectionDescriptionText>
            // </CollectionDescriptionBox>
        )
    }

    render() {
        const { state } = this
        if (
            state.listLoadState === 'pristine' ||
            state.listLoadState === 'running'
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
                    >
                        <ErrorWithAction errorType="internal-error">
                            Error loading this collection. <br /> Reload page to
                            retry.
                        </ErrorWithAction>
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
                    storage={this.props.storage}
                    viewportBreakpoint={this.viewportBreakpoint}
                    headerTitle={this.renderTitle()}
                    headerSubtitle={this.renderSubtitle()}
                    followBtn={this.renderFollowBtn()()}
                    renderHeaderActionArea={this.renderHeaderActionArea()}
                    webMonetizationIcon={this.renderWebMonetizationIcon()}
                    // listsSidebarProps={this.listsSidebarProps}
                    // isSidebarShown={this.listsSidebarProps.isShown}
                    permissionKeyOverlay={this.renderPermissionKeyOverlay()}
                    scrollTop={this.state.scrollTop}
                    breadCrumbs={this.renderBreadCrumbs()}
                    renderDescription={this.renderDescription()}
                    isPageView={this.props.entryID}
                >
                    {data.listEntries.length > 0 &&
                        !isPageView &&
                        this.renderAbovePagesBox()}
                    {state.annotationEntriesLoadState === 'error' && (
                        <Margin bottom={'large'}>
                            <ErrorWithAction errorType="internal-error">
                                Error loading page notes. Reload page to retry.
                            </ErrorWithAction>
                        </Margin>
                    )}
                    {state.listData.discordList != null && (
                        <DiscordSyncNotif>
                            <Icon
                                filePath="redo"
                                heightAndWidth="22px"
                                hoverOff
                                color="prime1"
                            />{' '}
                            This channels is still being synced. It may take a
                            while for everything to show up.
                        </DiscordSyncNotif>
                    )}
                    <ResultsList>
                        {resultsFilteredByType?.length
                            ? resultsFilteredByType?.map(
                                  ([entryIndex, entry]) => (
                                      <Margin
                                          bottom="small"
                                          key={entry.normalizedUrl}
                                      >
                                          <ItemBox
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
                                                      ?.listEntries[entryIndex]
                                                      .hoverState &&
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
                                                      ?.listEntries[entryIndex]
                                                      .hoverState
                                              }
                                          >
                                              <BlockContent
                                                  // pageLink ={'https://memex.social/' + this.props.listID + '/' + entry.reference.id}
                                                  youtubeService={
                                                      this.props.services
                                                          .youtube
                                                  }
                                                  type={
                                                      isPagePdf({
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
                                                      entry.originalUrl
                                                  }
                                                  fullTitle={
                                                      entry && entry.entryTitle
                                                  }
                                                  onClick={(e) => {
                                                      this.processEvent(
                                                          'clickPageResult',
                                                          {
                                                              urlToOpen:
                                                                  entry.originalUrl,
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
                                              />
                                              <ItemBoxBottom
                                                  creationInfo={{
                                                      creator: this.state.users[
                                                          entry.creator.id
                                                      ],
                                                      createdWhen:
                                                          entry.createdWhen,
                                                  }}
                                                  actions={this.getPageEntryActions(
                                                      entry,
                                                      entryIndex,
                                                  )}
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
                                          {state.allAnnotationExpanded &&
                                              state.annotationEntriesLoadState ===
                                                  'success' &&
                                              entryIndex > 0 &&
                                              entryIndex % PAGE_SIZE === 0 && (
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
                            : this.renderNoResults()}
                    </ResultsList>
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

const DiscordSyncNotif = styled.div`
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    padding: 10px 20px;
    border-radius: 8px;
    color: ${(props) => props.theme.colors.greyScale5};
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
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

const ResultsList = styled.div`
    display: flex;
    flex-direction: column;
    z-index: 20;
    padding-bottom: 200px;
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
    padding-left: 10px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
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
    width: 100%;
    position: relative;
    z-index: 30;
    border-radius: 5px;
    justify-content: space-between;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale1};
    padding-bottom: 10px;
    border-radius: 3px 3px 0 0;
    background: ${(props) => props.theme.colors.black};
    position: sticky;
    top: 0px;
    padding-top: 10px;
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

const DiscordChannelName = styled.span`
    display: flex;
    flex-direction: row;
    align-items: center;
`
const DiscordGuildName = styled.span`
    color: ${(props) => props.theme.colors.secondary};
    font-weight: 600;
`

const CollectionDescriptionBox = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    margin: 20px 0 15px 0;
    display: flex;
    align-items: flex-start;
    flex-direction: column;

    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            padding: 20px 0px;
        `}
`
const CollectionDescriptionText = styled(Markdown)<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    font-size: 16px;
    color: ${(props) => props.theme.colors.white};
    font-weight: 200;
    font-family: ${(props) => props.theme.fonts.primary};
    border-radius: 10px;
`
const CollectionDescriptionToggle = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    display: flex;
    justify-content: center;
    align-items: center;
    justify-self: flex-start;
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 12px;
    cursor: pointer;
    color: ${(props) => props.theme.colors.greyScale5};

    & * {
        cursor: pointer;
    }
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
