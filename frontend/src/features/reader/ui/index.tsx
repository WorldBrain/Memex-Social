import React from 'react'
import styled, { css, keyframes } from 'styled-components'
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
import {
    getPageLinkPath,
    getWebUIBaseUrl,
} from '@worldbrain/memex-common/lib/content-sharing/utils'
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
import ImagePreviewModal from '@worldbrain/memex-common/lib/common-ui/image-preview-modal'

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

const slideUp = keyframes`
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
`

const slideDown = keyframes`
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
`

export class ReaderPageView extends UIElement<
    ReaderPageViewDependencies,
    ReaderPageViewState,
    ReaderPageViewEvent
> {
    constructor(props: ReaderPageViewDependencies) {
        super(props, { logic: new ReaderPageViewLogic({ ...props }) })
        ;(window as any)['_state'] = () => ({ ...this.state })

        const { query } = props

        // this.itemRanges = {
        //     listEntry: parseRange(query.fromListEntry, query.toListEntry),
        //     annotEntry: parseRange(query.fromAnnotEntry, query.toAnnotEntry),
        //     reply: parseRange(query.fromReply, query.toReply),
        // }
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
        // @ts-ignore
        window['_state'] = () => ({ ...this.state })
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
        let baseUrl = getWebUIBaseUrl(
            process.env.NODE_ENV === 'development' ? 'staging' : 'production',
        )
        const pageLinkIds = {
            remoteListEntryId: this.props.entryID,
            remoteListId: this.props.listID,
        }

        if (this.state.permissionsLoadState !== 'success') {
            return null // Still loading
        }

        return {
            reader: `${baseUrl}${getPageLinkPath(pageLinkIds)}`,
            collab: this.state.collaborationKey
                ? `${baseUrl}${getPageLinkPath({
                      ...pageLinkIds,
                      collaborationKey: this.state.collaborationKey,
                  })}`
                : null,
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
                    ref={(ref: HTMLIFrameElement | null) => {
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

    // private renderOptionsMenu = () => {
    //     if (this.state.showOptionsMenu) {
    //         return (
    //             <PopoutBox
    //                 targetElementRef={
    //                     this.optionsMenuButtonRef.current ?? undefined
    //                 }
    //                 placement="bottom"
    //                 closeComponent={() =>
    //                     this.processEvent('toggleOptionsMenu', null)
    //                 }
    //                 offsetX={10}
    //                 getPortalRoot={() => this.props.getRootElement()}
    //             >
    //                 <OptionsMenuBox>
    //                     <AuthHeader
    //                         services={this.props.services}
    //                         getRootElement={this.props.getRootElement}
    //                     />
    //                     {this.state.listLoadState === 'success' && (
    //                         <PrimaryAction
    //                             icon={'goTo'}
    //                             type="tertiary"
    //                             label={'Open Original'}
    //                             size="medium"
    //                             onClick={() =>
    //                                 window.open(
    //                                     this.state.listData!.entry.originalUrl,
    //                                     '_blank',
    //                                 )
    //                             }
    //                             padding="5px 10px 5px 5px"
    //                         />
    //                     )}
    //                 </OptionsMenuBox>
    //             </PopoutBox>
    //         )
    //     }
    // }

    // private renderShareTooltip = () => {
    //     const links = this.pageLinks

    //     if (this.state.showShareMenu) {
    //         return (
    //             <PopoutBox
    //                 targetElementRef={this.sharePageButton.current ?? undefined}
    //                 placement="bottom"
    //                 closeComponent={() =>
    //                     this.processEvent('showSharePageMenu', null)
    //                 }
    //                 offsetX={10}
    //                 getPortalRoot={() => this.props.getRootElement()}
    //             >
    //                 <TooltipContainer>
    //                     {this.state.linkCopiedToClipBoard ? (
    //                         <NotifBox>
    //                             <Icon
    //                                 filePath="checkRound"
    //                                 heightAndWidth="30px"
    //                                 hoverOff
    //                             />
    //                             <Title>Copied to Clipboard</Title>
    //                         </NotifBox>
    //                     ) : (
    //                         <NotifBox>
    //                             <Title>Invite Links</Title>
    //                             {links != null &&
    //                             this.state.permissionsLoadState ===
    //                                 'success' ? (
    //                                 <LinksContainer>
    //                                     <LinkTitle>
    //                                         Read & Reply Access
    //                                     </LinkTitle>
    //                                     <LinkBox>
    //                                         <LinkField>
    //                                             {links!.reader}
    //                                         </LinkField>
    //                                         <PrimaryAction
    //                                             type="secondary"
    //                                             size="small"
    //                                             icon={'copy'}
    //                                             label={'copy'}
    //                                             padding={'4px 10px 4px 5px'}
    //                                             onClick={() =>
    //                                                 this.processEvent(
    //                                                     'copyLink',
    //                                                     {
    //                                                         url: links!.reader,
    //                                                     },
    //                                                 )
    //                                             }
    //                                         />
    //                                     </LinkBox>
    //                                     {links.collab != null && (
    //                                         <>
    //                                             <LinkTitle>
    //                                                 Contribute Access
    //                                             </LinkTitle>
    //                                             <LinkBox>
    //                                                 <LinkField>
    //                                                     {links!.collab}
    //                                                 </LinkField>
    //                                                 <PrimaryAction
    //                                                     type="secondary"
    //                                                     size="small"
    //                                                     icon={'copy'}
    //                                                     label={'copy'}
    //                                                     padding={
    //                                                         '4px 10px 4px 5px'
    //                                                     }
    //                                                     onClick={() =>
    //                                                         this.processEvent(
    //                                                             'copyLink',
    //                                                             {
    //                                                                 url: links!
    //                                                                     .collab,
    //                                                             },
    //                                                         )
    //                                                     }
    //                                                 />
    //                                             </LinkBox>
    //                                         </>
    //                                     )}
    //                                 </LinksContainer>
    //                             ) : (
    //                                 <LoadingBox height={'50px'}>
    //                                     <LoadingIndicator size={20} />
    //                                 </LoadingBox>
    //                             )}
    //                         </NotifBox>
    //                     )}
    //                 </TooltipContainer>
    //             </PopoutBox>
    //         )
    //     }
    // }

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
                    ref={(ref: HTMLIFrameElement | null) =>
                        this.processEvent('setReaderContainerRef', {
                            ref,
                        })
                    }
                >
                    {this.state.preventInteractionsInIframe && <ClickBlocker />}
                    {/* {this.state.showDropPDFNotice && (
                        <PDFDropNoticeContainer
                            onDragOver={(
                                event: React.DragEvent<HTMLDivElement>,
                            ) => {
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
                    )} */}
                    {this.state.iframeLoadState === 'error' ? (
                        <div>
                            The reader didn't load properly. Please try
                            refreshing the page.
                        </div>
                    ) : (
                        this.state.iframeLoadState !== 'success' && (
                            <LoadingBoxBlurred>
                                <LoadingIndicator size={34} />
                            </LoadingBoxBlurred>
                        )
                    )}
                </InjectedContent>
            </>
        )
    }

    render() {
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
                {/* {OverlayModal({
                    type: this.state.overlayModalState,
                    closeModal: () => this.processEvent('setModalState', null),
                })} */}
                <LeftSide isYoutubeMobile={isYoutubeMobile}>
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
                {/* {this.state.imageSourceForPreview &&
                this.state.imageSourceForPreview?.length > 0 ? (
                    <ImagePreviewModal
                        imageSource={this.state.imageSourceForPreview}
                        closeModal={() =>
                            this.processEvent('openImageInPreview', {
                                imageSource: null,
                            })
                        }
                        getRootElement={this.props.getRootElement}
                    />
                ) : null} */}
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
const LoadingBoxBlurred = styled.div<{ height?: string; width?: string }>`
    display: flex;
    justify-content: center;
    align-items: center;
    height: ${(props) => (props.height ? props.height : 'fill-available')};
    width: ${(props) => (props.width ? props.width : '100%')};
    flex: 1;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background: #ffffff60;
    backdrop-filter: blur(5px);
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
    padding: 0 10px;
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
    width: number | null
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
    width: ${(props) => (props.width ? props.width + 'px' : '100%')};
    min-width: ${(props) => (props.width ? props.width + 'px' : '100%')};
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

const BottomModal = styled.div<{ visible: boolean }>`
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: calc(100% - ${TopBarHeight}px);
    background: #ffffff70;
    backdrop-filter: blur(10px);
    display: ${(props) => (props.visible ? 'flex' : 'none')};
    padding-top: ${TopBarHeight + 10}px;
`

const BottomModalContent = styled.div<{ isClosing?: boolean }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
    border-radius: 10px 10px 0 0;
    background: ${(props) => props.theme.colors.white};
    animation: ${(props) => (props.isClosing ? slideDown : slideUp)} 0.3s
        ease-in-out forwards;
`
