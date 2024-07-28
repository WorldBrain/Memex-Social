import React, { useEffect, useState } from 'react'
import styled, { css } from 'styled-components'
import { ViewportBreakpoint } from '../../main-ui/styles/types'
import { UIElementServices } from '../../services/types'
import AuthHeader from '../../features/user-management/ui/containers/auth-header'
import { StorageModules } from '../../storage/types'
import { Margin } from 'styled-components-spacing'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
// import RouteLink from '../components/route-link'
import UnseenActivityIndicator from '../../features/activity-streams/ui/containers/unseen-activity-indicator'
import RouteLink from '../components/route-link'
import { Rnd } from 'react-rnd'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
// import ListsSidebar, {
//     Props as ListsSidebarProps,
// } from '../../features/lists-sidebar/ui/components/lists-sidebar'

const middleMaxWidth = '800px'
const logoImage = require('../../assets/img/memex-logo.svg')
const headerBackground = require('../../assets/img/headerBackground.svg')

export default function DefaultPageLayout(props: {
    services: UIElementServices<
        | 'auth'
        | 'overlay'
        | 'router'
        | 'activityStreams'
        | 'userManagement'
        | 'webMonetization'
    >
    storage: Pick<StorageModules, 'activityStreams'>
    followBtn?: JSX.Element
    permissionKeyOverlay?: JSX.Element | null
    hideActivityIndicator?: boolean
    isSidebarShown?: boolean
    // listsSidebarProps?: Omit<
    //     ListsSidebarProps,
    //     'services' | 'storage' | 'viewportBreakpoint'
    // >
    viewportBreakpoint: ViewportBreakpoint
    children: React.ReactNode
    scrollTop?: number
    breadCrumbs?: JSX.Element
    isPageView?: string | undefined
    context?: string
    getRootElement: () => HTMLElement
    renderRightColumnContent: () => JSX.Element
    renderLeftColumnContent: () => JSX.Element
}) {
    const { viewportBreakpoint: viewportWidth } = props
    const [showChatBox, setShowChatBox] = React.useState(false)
    const chatBoxRef = React.useRef<HTMLDivElement>(null)

    const [isAuthenticated, setAuthenticated] = useState(
        !!props.services.auth.getCurrentUser(),
    )
    useEffect(() => {
        const handler = () => {
            setAuthenticated(!!props.services.auth.getCurrentUser())
        }
        props.services.auth.events.addListener('changed', handler)
        return () => {
            props.services.auth.events.removeListener('changed', handler)
        }
    })

    const getHeaderHeight = () => {
        const headerHeight = document.getElementById('StyledHeader')
            ?.clientHeight

        return headerHeight
    }

    const renderFeedArea = () => {
        if (!isAuthenticated) {
            return null
        }

        return (
            <FeedArea right="large">
                <TooltipBox tooltipText="Notifications" placement="bottom">
                    <Icon
                        icon="feed"
                        heightAndWidth="20px"
                        onClick={() =>
                            props.services.router.goTo('homeFeed', {})
                        }
                    />
                </TooltipBox>
                <ActivityIndicatorBox>
                    <UnseenActivityIndicator
                        services={props.services}
                        storage={props.storage}
                        renderContent={(feedState) => {
                            if (feedState === 'has-unseen') {
                                return <UnseenActivityDot />
                            }
                            return null
                        }}
                    />
                </ActivityIndicatorBox>
            </FeedArea>
        )
    }

    // const renderListsSidebar = () => {
    //     if (props.listsSidebarProps == null) {
    //         return null
    //     }

    //     return (
    //         <ListsSidebar
    //             {...props.listsSidebarProps}
    //             storage={props.storage}
    //             services={props.services}
    //             viewportBreakpoint={props.viewportBreakpoint}
    //         />
    //     )
    // }

    const isIframe = () => {
        try {
            return window.self !== window.top
        } catch (e) {
            return true
        }
    }

    return (
        <MainContainer
            viewportWidth={viewportWidth}
            sidebarShown={props.isSidebarShown}
            id={'MainContainer'}
        >
            <LeftColumn>
                <StyledHeader
                    isIframe={isIframe() === true}
                    hideActivityIndicator={props.hideActivityIndicator}
                    id={'StyledHeader'}
                    viewportWidth={viewportWidth}
                    isPageView={props.isPageView}
                >
                    {isIframe() ? undefined : (
                        <>
                            <LogoAndFeed
                                isIframe={isIframe() === true}
                                viewportWidth={viewportWidth}
                            >
                                <MemexLogo
                                    src={logoImage}
                                    onClick={() =>
                                        window.open('https://memex.garden')
                                    }
                                    viewportWidth={viewportWidth}
                                />
                            </LogoAndFeed>
                            <HeaderAuthArea
                                isIframe={isIframe() === true}
                                viewportWidth={viewportWidth}
                            >
                                {renderFeedArea()}
                                <AuthHeader
                                    services={props.services}
                                    getRootElement={props.getRootElement}
                                />
                            </HeaderAuthArea>
                        </>
                    )}
                </StyledHeader>
                {props.renderLeftColumnContent()}
                {/* {renderListsSidebar()} */}
                {/* {props.children} */}
            </LeftColumn>
            <RightColumn
                style={{
                    right: 0,
                    position: 'relative',
                }}
                default={{
                    right: 0,
                    width: 500,
                    height: '100vh',
                    position: 'relative',
                }}
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
                disableDragging={true}
                bounds="parent"
            >
                {props.renderRightColumnContent()}
            </RightColumn>
        </MainContainer>
    )
}

const MainContainer = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    sidebarShown?: boolean
}>`
    display: flex;
    align-items: flex-start;
    flex-direction: row;
    justify-content: space-between;
    overflow: hidden;
    position: relative;

    height: 100vh;
    width: 100%;
    overflow: hidden;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    ${(props) =>
        props.viewportWidth === 'mobile' &&
        props.sidebarShown &&
        css`
            overflow: scroll;
        `}
`

const LeftColumn = styled.div`
    width: 10%;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
    overflow: scroll;
    position: relative;
    padding: 15px;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`
const RightColumn = styled(Rnd)``

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

const SupportChatBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 10px;
    color: ${(props) => props.theme.colors.white};
    position: fixed;
    bottom: 20px;
    right: 30px;
    z-index: 100;
    cursor: pointer;

    & * {
        cursor: pointer;
    }
`

const StyledHeader = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    hideActivityIndicator: boolean | undefined
    isIframe: boolean
    isPageView: string | undefined
}>`
    font-family: ${(props) => props.theme.fonts.primary};

    position: fixed;
    display: flex;
    top: 0px;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
    z-index: 0;
    //box-shadow: #101e7308 0 4px 16px;
    padding: 10px 30px 10px 30px;
    grid-gap: 25px;
    z-index: 2;
    width: fill-available;
    width: moz-available;
    background: ${(props) => props.theme.colors.black}90;
    backdrop-filter: blur(10px);

    ${(props) =>
        props.hideActivityIndicator &&
        props.isIframe &&
        css`
            display: none;
        `}
    ${(props) =>
        props.isIframe &&
        css`
            padding: 20px 20px 20px 20px;
        `}
       ${(props) =>
        props.isPageView &&
        css`
            padding: 20px 20px 20px 20px;
        `}
`

const FeedArea = styled(Margin)`
    display: flex;
    align-items: center;
    position: relative;
`

const UnseenActivityDot = styled.div`
    background: ${(props) => props.theme.colors.prime1};
    width: 14px;
    height: 14px;
    border-radius: 10px;
`
const ActivityIndicatorBox = styled.div`
    position: absolute;
    right: -5px;
    top: -0px;
`

const HeaderAuthArea = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    isIframe: boolean
}>`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    white-space: nowrap;
    z-index: 1;
`

const LogoAndFeed = styled(Margin)<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    isIframe: boolean
}>`
    display: flex;
    align-items: center;
    z-index: 3001;
    cursor: pointer;

    ${(props) =>
        (props.viewportWidth === 'small' || props.viewportWidth === 'mobile') &&
        css`
            padding-right: 10px;
            display: flex;
        `}
`

const MemexLogo = styled.img<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    height: 24px;
    z-index: 3005;
`

// {!isIframe() && (
//     <SupportChatBox>
//         <PrimaryAction
//             onClick={() => {
//                 setShowChatBox(true)
//             }}
//             type="tertiary"
//             iconColor="prime1"
//             icon="chatWithUs"
//             innerRef={chatBoxRef}
//             size="medium"
//             label="Support Chat"
//         />
//     </SupportChatBox>
// )}
// {showChatBox && (
//     <PopoutBox
//         targetElementRef={chatBoxRef.current ?? undefined}
//         closeComponent={() => setShowChatBox(false)}
//         placement="top"
//         offsetX={20}
//         getPortalRoot={() => props.getRootElement()}
//     >
//         <ChatBox>
//             <LoadingIndicator size={30} />
//             <ChatFrame
//                 src={
//                     'https://go.crisp.chat/chat/embed/?website_id=05013744-c145-49c2-9c84-bfb682316599'
//                 }
//                 height={600}
//                 width={500}
//             />
//         </ChatBox>
//         <ChatFrame
//             src={
//                 'https://go.crisp.chat/chat/embed/?website_id=05013744-c145-49c2-9c84-bfb682316599'
//             }
//             height={600}
//             width={500}
//         />
//     </PopoutBox>
// )}

{
    /* {props.isPageView ? (
                        props.breadCrumbs && props.breadCrumbs
                    ) : (
                        <StyledHeaderContainer
                            isIframe={isIframe() === true}
                            viewportWidth={viewportWidth}
                        >
                            <HeaderMiddleArea
                                viewportWidth={viewportWidth}
                                id={'HeaderMiddleArea'}
                                isIframe={isIframe() === true}
                            >
                                {isIframe() ? (
                                    <PageMidleAreaAction
                                        scrollTop={props.scrollTop}
                                        viewportWidth={viewportWidth}
                                    >
                                        <PrimaryAction
                                            label="Go to Space"
                                            icon="goTo"
                                            onClick={() =>
                                                window.open(
                                                    window.location.href,
                                                    '_blank',
                                                )
                                            }
                                            size="medium"
                                            type="forth"
                                        />
                                    </PageMidleAreaAction>
                                ) : (
                                    props.renderHeaderActionArea != null && (
                                        <PageMidleAreaAction
                                            scrollTop={props.scrollTop}
                                            viewportWidth={viewportWidth}
                                        >
                                            {props.renderHeaderActionArea}
                                        </PageMidleAreaAction>
                                    )
                                )}
                            </HeaderMiddleArea>
                        </StyledHeaderContainer>
                    )} */
}
