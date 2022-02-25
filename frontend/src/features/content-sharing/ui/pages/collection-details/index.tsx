import React from 'react'
import moment from 'moment'
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
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { PAGE_SIZE } from './constants'
import DocumentTitle from '../../../../../main-ui/components/document-title'
import DefaultPageLayout from '../../../../../common-ui/layouts/default-page-layout'
import PageInfoBox, {
    PageInfoBoxAction,
} from '../../../../../common-ui/components/page-info-box'
import ProfilePopupContainer from '../../../../user-management/ui/containers/profile-popup-container'
import { ViewportBreakpoint } from '../../../../../main-ui/styles/types'
import { getViewportBreakpoint } from '../../../../../main-ui/styles/utils'
import AnnotationsInPage from '../../../../annotations/ui/components/annotations-in-page'
import ErrorWithAction from '../../../../../common-ui/components/error-with-action'
import ErrorBox from '../../../../../common-ui/components/error-box'
import FollowBtn from '../../../../activity-follows/ui/components/follow-btn'
import WebMonetizationIcon from '../../../../web-monetization/ui/components/web-monetization-icon'
import PermissionKeyOverlay from './permission-key-overlay'
import InstallExtOverlay from '../../../../ext-detection/ui/components/install-ext-overlay'
import FollowSpaceOverlay from '../../../../ext-detection/ui/components/follow-space-overlay'
import { mergeTaskStates } from '../../../../../main-ui/classes/logic'
import { UserReference } from '../../../../user-management/types'
import ListShareModal from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal'
import type { Props as ListsSidebarProps } from '../../../../lists-sidebar/ui/components/lists-sidebar'
import { isPagePdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import MissingPdfOverlay from '../../../../ext-detection/ui/components/missing-pdf-overlay'
import { HoverBox } from '../../../../../common-ui/components/hoverbox'

const commentImage = require('../../../../../assets/img/comment.svg')
const commentEmptyImage = require('../../../../../assets/img/comment-empty.svg')

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

const AbovePagesBox = styled.div<{
    viewportWidth: ViewportBreakpoint
}>`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 10px 0 10px;
  width: 100%;
  position: relative;
  z-index: 2;
  border-radius: 5px;
  justify-content: space-between;
}
`

const AddPageBtn = styled.div`
    display: flex;
    align-items: center;
    left: 0;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 12px;
    font-weight: 400;
    cursor: pointer;
    padding: 2px 6px;

    &: hover {
        background: ${(props) => props.theme.colors.backgroundColorDarker};
    }
`

const ToggleAllAnnotations = styled.div`
    text-align: right;
    font-weight: bold;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.primary};
    font-weight: bold;
    cursor: pointer;
    font-size: 12px;
    width: fit-content;
    padding: 0 5px;
    border-radius: 5px;
`

const PageInfoList = styled.div`
    width: 100%;
    padding-bottom: 200px;
`

const EmptyListBox = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    width: 100%;
    padding: 20px 20px;
    color: ${(props) => props.theme.colors.normalText};
    display: flex;
    margin-top: 30px;
    font-size: 16px;
    font-weight: normal;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-align: center;
`

const ShowMoreCollaborators = styled.span`
    cursor: pointer;
    color: ${(props) => props.theme.colors.darkerText};
    align-items: center;
    grid-gap: 5px;
    display: inline-box;
`

const Text = styled.span`
    padding-left: 5px;
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

const DomainName = styled.div`
    color: ${(props) => props.theme.colors.normalText};
`

const RearBox = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    display: inline-block;
    align-items: center;
    grid-gap: 5px;
    color: ${(props) => props.theme.colors.lighterText};

    /* ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            grid-gap: 3px;
            flex-direction: column;
            align-items: flex-start;
        `} */
`

const Creator = styled.span`
    color: ${(props) => props.theme.colors.purple};
    padding: 0 4px;
    cursor: pointer;
`

const SharedBy = styled.span`
    color: ${(props) => props.theme.colors.lighterText};
    display: contents;
`

const Date = styled.span`
    color: ${(props) => props.theme.colors.lighterText};
    display: inline-block;
`

const SectionCircle = styled.div<{ size: string }>`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: ${(props) => (props.size ? props.size : '60px')};
    width: ${(props) => (props.size ? props.size : '60px')};
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
`

const ContributorContainer = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 10px;
    background: white;
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
        background: ${(props) => props.theme.colors.backgroundColorDarker};
    }
`

const ListEntry = styled.div`
    display: block;
    align-items: center;

    font-weight: 400;
    width: fill-available;
    color: ${(props) => props.theme.colors.normalText};
    text-overflow: ellipsis;
    overflow: hidden;

    & * {
        white-space: pre-wrap;
        font-weight: initial;
    }
`

export default class CollectionDetailsPage extends UIElement<
    CollectionDetailsDependencies,
    CollectionDetailsState,
    CollectionDetailsEvent
> {
    constructor(props: CollectionDetailsDependencies) {
        super(props, { logic: new Logic({ ...props }) })
    }

    get listsSidebarProps(): Omit<
        ListsSidebarProps,
        'services' | 'storage' | 'viewportBreakpoint'
    > {
        return {
            collaborativeLists: this.state.collaborativeLists,
            followedLists: this.state.followedLists,
            isShown: this.state.isListSidebarShown,
            loadState: this.state.listSidebarLoadState,
            onToggle: () => this.processEvent('toggleListSidebar', undefined),
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

        this.processEvent('updateScrollState', {
            previousState: previousState.scrollTop,
        })
    }

    private renderWebMonetizationIcon() {
        const creatorReference = this.state.listData?.creatorReference

        if (!creatorReference) {
            return
        }

        if (this.state.isListOwner) {
            return (
                <Icon
                    height="20px"
                    icon="addPeople"
                    color="purple"
                    onClick={() =>
                        this.processEvent('toggleListShareModal', {})
                    }
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
    ): Array<PageInfoBoxAction> | undefined {
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

        if (
            state.annotationEntriesLoadState === 'success' &&
            toggleAnnotationsIcon !== null
        ) {
            return [
                {
                    image: toggleAnnotationsIcon,
                    onClick: () =>
                        this.processEvent('togglePageAnnotations', {
                            normalizedUrl: entry.normalizedUrl,
                        }),
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
            />
        )
    }

    renderPageAnnotations(entry: SharedListEntry & { creator: UserReference }) {
        const { state } = this
        return (
            <AnnotationsInPage
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
                    this.processEvent('toggleAnnotationReplies', event)
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
                            sharedListReference: {
                                id: this.props.listID,
                                type: 'shared-list-reference',
                            },
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
                        }),
                    onNewReplyCancel: (annotationReference) => () =>
                        this.processEvent('cancelNewReplyToAnnotation', {
                            annotationReference,
                        }),
                    onNewReplyConfirm: (annotationReference) => () =>
                        this.processEvent('confirmNewReplyToAnnotation', {
                            annotationReference,
                        }),
                    onNewReplyEdit: (annotationReference) => ({ content }) =>
                        this.processEvent('editNewReplyToAnnotation', {
                            annotationReference,
                            content,
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

    renderSubtitle() {
        const { state } = this
        const { listData: data } = state
        const users: Array<[UserReference, User]> = []
        if (
            (state.listRolesLoadState === 'running' ||
                state.listRolesLoadState === 'pristine') &&
            !users.length
        ) {
            return (
                <SubtitleContainer
                    loading={true}
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
            users.push([data.creatorReference, data.creator])
        }
        for (const role of state.listRoles ?? []) {
            const user = state.users[role.user.id]
            if (user) {
                users.push([role.user, user])
            }
        }
        const renderedPreview = users.map(([userReference, user], index) => {
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
                        <Creator>{user.displayName}</Creator>
                    </ProfilePopupContainer>
                </React.Fragment>
            )
        })

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
                <SubtitleContainer viewportBreakpoint={this.viewportBreakpoint}>
                    {renderedPreview && (
                        <>
                            <SharedBy>
                                {users.length && users.length > 1
                                    ? 'cocurated by'
                                    : 'shared by'}
                            </SharedBy>{' '}
                            {renderedPreview.slice(0, showListRoleLimit())}
                            {users.length - showListRoleLimit() > 0 && (
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
                                >
                                    {users.length - showListRoleLimit() && (
                                        <>
                                            <SharedBy>and</SharedBy>{' '}
                                            {renderedPreview.slice(
                                                0,
                                                showListRoleLimit(),
                                            ) && (
                                                <>
                                                    {users.length -
                                                        showListRoleLimit()}{' '}
                                                    more{' '}
                                                </>
                                            )}
                                        </>
                                    )}
                                    {this.state.showMoreCollaborators && (
                                        <HoverBox
                                            marginLeft={'-90px'}
                                            width={'unset'}
                                            marginTop={'5px'}
                                            padding={'0px'}
                                        >
                                            <ContributorContainer
                                                onMouseLeave={() =>
                                                    this.processEvent(
                                                        'toggleMoreCollaborators',
                                                        {},
                                                    )
                                                }
                                            >
                                                {users.map(
                                                    ([userReference, user]) => (
                                                        <ProfilePopupContainer
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
                                        </HoverBox>
                                    )}
                                    <Icon
                                        icon={'arrowDown'}
                                        heightAndWidth={'16px'}
                                    />
                                </ShowMoreCollaborators>
                            )}
                            {/* {rendered} */}
                        </>
                    )}
                </SubtitleContainer>
            )
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
                {(this.isListContributor || isListOwner) && (
                    <AddPageBtn
                        onClick={() =>
                            this.processEvent('toggleInstallExtModal', {})
                        }
                    >
                        <Icon
                            hoverOff
                            icon="plus"
                            height="14px"
                            color="purple"
                        />
                        <Text>Add Page</Text>
                    </AddPageBtn>
                )}
                <div></div>
                {annotationEntryData &&
                    Object.keys(annotationEntryData).length > 0 && (
                        <ToggleAllAnnotations
                            onClick={() =>
                                this.processEvent('toggleAllAnnotations', {})
                            }
                        >
                            {allAnnotationExpanded ? (
                                <Icon icon={'compress'} heightAndWidth="16px" />
                            ) : (
                                <Icon icon={'expand'} heightAndWidth="16px" />
                            )}
                        </ToggleAllAnnotations>
                    )}
            </AbovePagesBox>
        )
    }

    getHeaderSubtitle(): JSX.Element | undefined {
        const { creator, pageInfoLoadState, pageInfo } = this.state
        // return creator ? `${creator.displayName}` : undefined

        return (
            <>
                <SubtitleContainer viewportBreakpoint={this.viewportBreakpoint}>
                    <DomainName>
                        {pageInfo?.normalizedUrl.split('/')[0]}
                    </DomainName>
                    <RearBox viewportBreakpoint={this.viewportBreakpoint}>
                        shared{' '}
                        {creator?.displayName && (
                            <SharedBy>
                                by
                                <Creator>
                                    {creator?.displayName || undefined}
                                </Creator>
                            </SharedBy>
                        )}
                        <Date>
                            <span>
                                on {moment(pageInfo?.createdWhen).format('LLL')}
                            </span>
                        </Date>
                        {/* <Margin horizontal="smallest">
                        ·
                    </Margin>
                    <Date>
                        on {moment(pageInfo?.createdWhen).format('LLL')}`
                    </Date> */}
                    </RearBox>
                </SubtitleContainer>
            </>
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
                    clickedPageUrl={this.state.clickedPageUrl!}
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

        if (this.state.showFollowModal) {
            return (
                <FollowSpaceOverlay
                    services={this.props.services}
                    viewportBreakpoint={this.viewportBreakpoint}
                    onCloseRequested={() =>
                        this.processEvent('toggleFollowSpaceOverlay', {})
                    }
                    isSpaceFollowed={this.state.isCollectionFollowed}
                    currentUrl={this.state.clickedPageUrl!}
                    renderFollowBtn={this.renderFollowBtn(
                        this.state.clickedPageUrl!,
                    )}
                />
            )
        }

        return null
    }

    render() {
        ;(window as any)['blurt'] = () => console.log(this.state)
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
                    {this.renderPermissionKeyOverlay()}
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
                        listsSidebarProps={this.listsSidebarProps}
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
                    listsSidebarProps={this.listsSidebarProps}
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
                    headerTitle={data.list.title}
                    headerSubtitle={this.renderSubtitle()}
                    followBtn={this.renderFollowBtn()()}
                    webMonetizationIcon={this.renderWebMonetizationIcon()}
                    listsSidebarProps={this.listsSidebarProps}
                    isSidebarShown={this.listsSidebarProps.isShown}
                    permissionKeyOverlay={this.renderPermissionKeyOverlay()}
                    scrollTop={this.state.scrollTop}
                >
                    {/*{data.list.description && (
                    <CollectionDescriptionBox
                        viewportWidth={viewportBreakpoint}
                    >
                        <CollectionDescriptionText
                            viewportWidth={viewportBreakpoint}
                        >
                            {data.listDescriptionState === 'collapsed'
                                ? data.listDescriptionTruncated
                                : data.list.description}
                        </CollectionDescriptionText>
                        {data.listDescriptionState !== 'fits' && (
                            <CollectionDescriptionToggle
                                onClick={() =>
                                    this.processEvent(
                                        'toggleDescriptionTruncation',
                                        {},
                                    )
                                }
                                viewportWidth={viewportBreakpoint}
                            >
                                {data.listDescriptionState === 'collapsed'
                                    ? '▸ Show more'
                                    : '◂ Show less'}
                            </CollectionDescriptionToggle>
                        )}
                    </CollectionDescriptionBox>
                )}
            */}
                    {state.annotationEntriesLoadState === 'error' && (
                        <Margin bottom={'large'}>
                            <ErrorWithAction errorType="internal-error">
                                Error loading page notes. Reload page to retry.
                            </ErrorWithAction>
                        </Margin>
                    )}
                    {this.renderAbovePagesBox()}
                    <PageInfoList>
                        {data.listEntries.length === 0 && (
                            <EmptyListBox>
                                <SectionCircle size="50px">
                                    <Icon
                                        icon={'heartEmpty'}
                                        heightAndWidth="25px"
                                        color="purple"
                                    />
                                </SectionCircle>
                                This Space is empty (still).
                            </EmptyListBox>
                        )}
                        {[...data.listEntries.entries()].map(
                            ([entryIndex, entry]) => (
                                <Margin bottom={'small'}>
                                    <React.Fragment key={entry.normalizedUrl}>
                                        <PageInfoBox
                                            onClick={(e) =>
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
                                                    },
                                                )
                                            }
                                            type={
                                                isPagePdf({
                                                    url: entry.normalizedUrl,
                                                })
                                                    ? 'pdf'
                                                    : 'page'
                                            }
                                            profilePopup={{
                                                services: this.props.services,
                                                storage: this.props.storage,
                                                userRef: entry.creator,
                                            }}
                                            pageInfo={{
                                                ...entry,
                                                fullTitle: entry.entryTitle,
                                            }}
                                            creator={
                                                this.state.users[
                                                    entry.creator.id
                                                ]
                                            }
                                            actions={this.getPageEntryActions(
                                                entry,
                                            )}
                                        />
                                        {state.pageAnnotationsExpanded[
                                            entry.normalizedUrl
                                        ] && (
                                            <Margin>
                                                <Margin bottom={'smallest'}>
                                                    {this.renderPageAnnotations(
                                                        entry,
                                                    )}
                                                </Margin>
                                            </Margin>
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
                                    </React.Fragment>
                                </Margin>
                            ),
                        )}
                    </PageInfoList>
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
