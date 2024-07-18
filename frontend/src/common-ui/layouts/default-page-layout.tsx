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
    headerTitle?: string | JSX.Element
    headerSubtitle?: JSX.Element | string
    followBtn?: JSX.Element
    permissionKeyOverlay?: JSX.Element | null
    renderHeaderActionArea?: JSX.Element | null
    webMonetizationIcon?: JSX.Element
    hideActivityIndicator?: boolean
    isSidebarShown?: boolean
    // listsSidebarProps?: Omit<
    //     ListsSidebarProps,
    //     'services' | 'storage' | 'viewportBreakpoint'
    // >
    renderSubtitle?: (props: { children: React.ReactNode }) => React.ReactNode
    viewportBreakpoint: ViewportBreakpoint
    children: React.ReactNode
    scrollTop?: number
    breadCrumbs?: JSX.Element
    renderDescription?: JSX.Element
    isPageView?: string | undefined
    context?: string
    getRootElement: () => HTMLElement
}) {
    const { viewportBreakpoint: viewportWidth } = props
    const renderSubtitle = props.renderSubtitle ?? ((props) => props.children)
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
                <PrimaryAction
                    label="Notifications"
                    icon="feed"
                    size="medium"
                    type="tertiary"
                    onClick={() => props.services.router.goTo('homeFeed', {})}
                />
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
            <MainColumn>
                {!isIframe() && (
                    <HeaderImage
                        // src={headerBackground}
                        isIframe={isIframe() === true}
                        hideActivityIndicator={props.hideActivityIndicator}
                        id={'StyledHeader'}
                        viewportWidth={viewportWidth}
                        isPageView={props.isPageView}
                    />
                )}
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
                                {/* )} */}
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
                    {props.isPageView ? (
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
                                {/* <SpaceActionBar>
                                {props.webMonetizationIcon}
                                {props.followBtn}
                            </SpaceActionBar> */}
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
                                <PageMidleAreaTitles
                                    context={props.context}
                                    scrollTop={props.scrollTop}
                                    viewportWidth={viewportWidth}
                                >
                                    {props.headerTitle && (
                                        <HeaderTitle
                                            viewportWidth={viewportWidth}
                                            scrollTop={props.scrollTop}
                                            isIframe={isIframe()}
                                            onClick={
                                                isIframe()
                                                    ? () =>
                                                          window.open(
                                                              window.location
                                                                  .href,
                                                              '_blank',
                                                          )
                                                    : undefined
                                            }
                                        >
                                            {props.headerTitle}
                                        </HeaderTitle>
                                    )}
                                    {props.headerTitle &&
                                        props.headerSubtitle &&
                                        renderSubtitle({
                                            children: props.headerSubtitle,
                                        })}
                                </PageMidleAreaTitles>
                                {props.renderDescription &&
                                    props.renderDescription}
                                {/* <LeftRightBlock /> */}
                            </HeaderMiddleArea>
                        </StyledHeaderContainer>
                    )}
                </StyledHeader>
                {/* {renderListsSidebar()} */}

                {props.children}
            </MainColumn>
            {!isIframe() && (
                <SupportChatBox>
                    <PrimaryAction
                        onClick={() => {
                            setShowChatBox(true)
                        }}
                        type="tertiary"
                        iconColor="prime1"
                        icon="chatWithUs"
                        innerRef={chatBoxRef}
                        size="medium"
                        label="Support Chat"
                    />
                </SupportChatBox>
            )}
            {showChatBox && (
                <PopoutBox
                    targetElementRef={chatBoxRef.current ?? undefined}
                    closeComponent={() => setShowChatBox(false)}
                    placement="top"
                    offsetX={20}
                    getPortalRoot={() => props.getRootElement()}
                >
                    <ChatBox>
                        <LoadingIndicator size={30} />
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
        </MainContainer>
    )
}

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

const MainContainer = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    sidebarShown?: boolean
}>`
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: flex-start;
    overflow: hidden;
    position: relative;

    height: 100vh;
    width: 100%;

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

const HeaderImage = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    hideActivityIndicator: boolean | undefined
    isIframe: boolean
    isPageView: string | undefined
}>`
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
    background-image: url(${headerBackground});
    position: absolute;
    left: 0px;
    top: 0px;
    width: fill-available;
    height: fit-content;
    opacity: 0.5;
    max-height: 600px;
    z-index: 0;
    min-height: 400px;

    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            flex-direction: column;
            align-items: flex-start;
            top: 0;
        `}
`

const StyledHeader = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    hideActivityIndicator: boolean | undefined
    isIframe: boolean
    isPageView: string | undefined
}>`
    font-family: ${(props) => props.theme.fonts.primary};
    width: fill-available;
    position: relative;
    display: flex;
    top: 0px;
    justify-content: center;
    flex-direction: row;
    z-index: 2000;
    align-items: flex-start;
    //box-shadow: #101e7308 0 4px 16px;
    border-radius: 10px 10px 0px 0px;
    padding: 15px 30px 30px 30px;
    grid-gap: 25px;
    z-index: 2;

    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            flex-direction: column;
            align-items: flex-start;
            top: 0;
            width: 100%;
            padding: 60px 15px 0px 15px;
        `}

    ${(props) =>
        props.viewportWidth === 'small' &&
        css`
            flex-direction: row;
            align-items: flex-start;
            top: 0;
            padding: 80px 15px 30px 15px;
        `}

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
            margin-bottom: 10px;
        `}
`

const FeedArea = styled(Margin)`
    display: flex;
    align-items: center;
    position: relative;
`

const FeedLink = styled(RouteLink)`
    display: flex;
    align-items: center;
    position: relative;
    color: ${(props) => props.theme.colors.greyScale5};
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

const SpaceActionBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: fill-available;
    grid-gap: 5px;
`

const HeaderMiddleArea = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    isIframe: Boolean
}>`
    width: fill-available;
    max-width: ${middleMaxWidth};
    display: flex;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 20px;
    flex-direction: column;
    flex: 30;
    border-radius: 20px;
    flex-direction: column;
    max-width: 800px;
    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            grid-gap: 0px;
        `}
    ${(props) =>
        props.isIframe &&
        css`
            grid-gap: 0px;
        `}
`
const HeaderTitle = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    scrollTop?: number
    isIframe?: boolean
    isPageView?: boolean
}>`
    font-weight: 800;
    width: fill-available;
    letter-spacing: 2px;
    text-overflow: ${(props) => props.scrollTop! >= 100 && 'ellipsis'};
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 26px;
    line-height: 39px;
    letter-spacing: 0.7px;
    overflow-wrap: break-word;
    color: ${(props) => props.theme.colors.white};
    ${(props) =>
        props.viewportWidth === 'small' &&
        css`
            font-size: 24px;
            line-height: 36px;
        `}
    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            font-size: 20px;
            line-height: 30px;
        `};
    ${(props) =>
        props.isIframe &&
        css`
            cursor: pointer;
        `}
`

const HeaderAuthArea = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    isIframe: boolean
}>`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    white-space: nowrap;
    right: 15px;
    position: absolute;
    top: 15px;
    z-index: 3001;
`

const LogoAndFeed = styled(Margin)<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    isIframe: boolean
}>`
    display: flex;
    flex: 1;
    align-items: center;
    z-index: 3001;
    cursor: pointer;
    position: absolute;
    top: 20px;
    left: 20px;

    ${(props) =>
        (props.viewportWidth === 'small' || props.viewportWidth === 'mobile') &&
        css`
            padding-right: 10px;
            display: flex;
        `}
`

const PageMidleAreaTitles = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    scrollTop?: number
    context?: string
}>`
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
    flex: 1;
    width: 100%;
    grid-gap: 5px;
    margin-top: ${(props) => props.context === 'feed' && '20px'};
`

const PageMidleAreaAction = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    scrollTop?: number
    isIframe?: boolean
}>`
    display: flex;
    justify-content: flex-end;
    align-self: flex-start;
    align-items: center;
    flex-direction: row;
    grid-gap: 10px;
    min-height: 50px;
    width: fill-available;
    height: fit-content;

    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            display: flex;
            flex-direction: column-reverse;
            align-items: flex-end;
        `}
`

const MainColumn = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
    overflow: scroll;
    position: relative;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const StyledHeaderContainer = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    isIframe: boolean
}>`
    display: flex;
    justify-content: center;
    width: fill-available;
    align-items: flex-start;
    min-height: 34px;
    max-width: 820px;
    margin-top: 50px;

    ${(props) =>
        props.isIframe &&
        css`
            padding: 0px 20px;
            margin-top: 0px;
        `}
    ${(props) =>
        props.isIframe &&
        props.viewportWidth === 'mobile' &&
        css`
            padding: 0px 5px;
            margin-top: 0px;
        `}

    flex-direction: ${(props) =>
        props.viewportWidth === 'mobile' ? 'column' : 'row'};

    ${(props) =>
        (props.viewportWidth === 'mobile' || props.viewportWidth === 'small') &&
        css`
            margin-top: 0px;
        `}
`

// const MenuBar = styled.div<{ isIframe: boolean }>`
//     top: 0px;
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     width: 100%;
//     padding: 20px 30px 10px 30px;
//     z-index: 10000;

//     ${(props) =>
//         props.isIframe &&
//         css`
//             display: none;
//         `};
// `

const MemexLogo = styled.img<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    height: 24px;
    z-index: 3005;
`
