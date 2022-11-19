import React, { useEffect, useState } from 'react'
import styled, { css } from 'styled-components'
import { ViewportBreakpoint } from '../../main-ui/styles/types'
import { UIElementServices } from '../../services/types'
import AuthHeader from '../../features/user-management/ui/containers/auth-header'
import { StorageModules } from '../../storage/types'
import { Margin } from 'styled-components-spacing'
import RouteLink from '../components/route-link'
import UnseenActivityIndicator from '../../features/activity-streams/ui/containers/unseen-activity-indicator'
import ListsSidebar, {
    Props as ListsSidebarProps,
} from '../../features/lists-sidebar/ui/components/lists-sidebar'

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
    storage: Pick<StorageModules, 'users' | 'activityStreams'>
    headerTitle?: string | JSX.Element
    headerSubtitle?: JSX.Element
    followBtn?: JSX.Element
    permissionKeyOverlay?: JSX.Element | null
    webMonetizationIcon?: JSX.Element
    hideActivityIndicator?: boolean
    isSidebarShown?: boolean
    listsSidebarProps?: Omit<
        ListsSidebarProps,
        'services' | 'storage' | 'viewportBreakpoint'
    >
    renderSubtitle?: (props: { children: React.ReactNode }) => React.ReactNode
    viewportBreakpoint: ViewportBreakpoint
    children: React.ReactNode
    scrollTop?: number
}) {
    const { viewportBreakpoint: viewportWidth } = props
    const renderSubtitle = props.renderSubtitle ?? ((props) => props.children)

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
            <FeedArea>
                <FeedLink
                    services={props.services}
                    route="homeFeed"
                    params={{}}
                >
                    {!props.hideActivityIndicator && (
                        <Margin left="small">
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
                        </Margin>
                    )}
                </FeedLink>
            </FeedArea>
        )
    }

    const renderListsSidebar = () => {
        if (props.listsSidebarProps == null) {
            return null
        }

        return (
            <ListsSidebar
                {...props.listsSidebarProps}
                storage={props.storage}
                services={props.services}
                viewportBreakpoint={props.viewportBreakpoint}
            />
        )
    }

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
            <LogoAndFeed
                isIframe={isIframe() === true}
                viewportWidth={viewportWidth}
            >
                <MemexLogo
                    src={logoImage}
                    onClick={() => window.open('https://memex.garden')}
                    viewportWidth={viewportWidth}
                />
                {/* )} */}
            </LogoAndFeed>
            <HeaderAuthArea
                isIframe={isIframe() === true}
                viewportWidth={viewportWidth}
            >
                <AuthHeader services={props.services} storage={props.storage} />
            </HeaderAuthArea>
            {props.permissionKeyOverlay}
            <MainColumn>
                <StyledHeader
                    isIframe={isIframe() === true}
                    hideActivityIndicator={props.hideActivityIndicator}
                    id={'StyledHeader'}
                    viewportWidth={viewportWidth}
                >
                    <StyledHeaderContainer viewportWidth={viewportWidth}>
                        <HeaderMiddleArea
                            viewportWidth={viewportWidth}
                            id={'HeaderMiddleArea'}
                        >
                            <PageMidleAreaTitles
                                scrollTop={props.scrollTop}
                                viewportWidth={viewportWidth}
                            >
                                {props.headerTitle && (
                                    <HeaderTitle
                                        viewportWidth={viewportWidth}
                                        scrollTop={props.scrollTop}
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
                            <PageMidleAreaAction
                                scrollTop={props.scrollTop}
                                viewportWidth={viewportWidth}
                            >
                                {props.webMonetizationIcon &&
                                    props.webMonetizationIcon}
                                {props.followBtn && props.followBtn}
                            </PageMidleAreaAction>
                            {/* <LeftRightBlock /> */}
                        </HeaderMiddleArea>
                    </StyledHeaderContainer>
                </StyledHeader>
                <PageMiddleArea
                    viewportWidth={viewportWidth}
                    isSidebarShown={props.isSidebarShown === true}
                    id="pageMiddleArea"
                >
                    {/* {renderListsSidebar()} */}
                    <PageResultsArea
                        headerHeight={getHeaderHeight()}
                        viewportWidth={viewportWidth}
                    >
                        {props.children}
                    </PageResultsArea>
                </PageMiddleArea>
            </MainColumn>
        </MainContainer>
    )
}

const MainContainer = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    sidebarShown?: boolean
}>`
    background: ${(props) => props.theme.colors.backgroundColor};
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: flex-start;
    overflow: scroll;

    height: 100%;
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

const StyledHeader = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    hideActivityIndicator: boolean | undefined
    isIframe: boolean
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
    background: url(${headerBackground});
    background-position: center top;
    background-repeat: no-repeat;
    background-size: cover;
    border-radius: 10px 10px 0px 0px;
    padding: 30px;
    grid-gap: 25px;
    border-bottom: 1px solid ${(props) => props.theme.colors.brand3};

    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            flex-direction: column;
            align-items: flex-start;
            top: 0;
            width: 100%;
            padding: 80px 15px 30px 15px;
        `}

    ${(props) =>
        props.viewportWidth === 'small' &&
        css`
            flex-direction: row;
            align-items: flex-start;
            top: 0;
            padding: 80px 20px 30px 20px;
        `}

    ${(props) =>
        props.hideActivityIndicator &&
        props.isIframe &&
        css`
            display: none;
        `}
`

const FeedArea = styled(Margin)`
    display: flex;
    align-items: center;
`

const FeedLink = styled(RouteLink)`
    display: flex;
    align-items: center;
    color: ${(props) => props.theme.colors.primary};
`

const UnseenActivityDot = styled.div`
    background: #5cd9a6;
    width: 14px;
    height: 14px;
    border-radius: 10px;
`

const HeaderMiddleArea = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
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
`
const HeaderTitle = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    scrollTop?: number
}>`
    font-weight: 600;
    width: fill-available;
    letter-spacing: 1px;
    text-overflow: ${(props) => props.scrollTop! >= 100 && 'ellipsis'};
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 25px;
    overflow-wrap: break-word;
    color: ${(props) => props.theme.colors.normalText};
    ${(props) =>
        props.viewportWidth === 'small' &&
        css`
            font-size: 20px;
        `}
    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            font-size: 18px;
            line-height: 27px;
        `};
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
    top: 15px;
    left: 15px;

    ${(props) =>
        (props.viewportWidth === 'small' || props.viewportWidth === 'mobile') &&
        css`
            padding-right: 10px;
            display: flex;
        `}
`

const PageMiddleArea = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    isSidebarShown: boolean
}>`
    width: 100%;
    display: flex;
    height: 100%;
    position: relative;

    ${(props) =>
        props.viewportWidth === 'mobile' &&
        props.isSidebarShown &&
        css`
            overflow: hidden;
            padding: 0 20px;
        `}

    ${(props) =>
        props.viewportWidth === 'small' &&
        props.isSidebarShown &&
        css`
            overflow: hidden;
            padding: 0 20px;
        `}
`

const PageResultsArea = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    headerHeight: number | undefined
}>`
    max-width: ${middleMaxWidth};
    position: relative;
    padding-bottom: 100px;
    margin: 0px auto 0;
    width: 100%;
    min-height: 300px;

    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            padding: 0px 15px 100px 15px;
        `}
    ${(props) =>
        props.viewportWidth === 'small' &&
        css`
            padding: 0px 20px 100px 20px;
        `}
`

const PageMidleAreaTitles = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    scrollTop?: number
}>`
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
    flex: 1;
    width: 100%;
    grid-gap: 5px;
    margin-top: 10px;
`

const PageMidleAreaAction = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    scrollTop?: number
}>`
    display: flex;
    justify-content: flex-end;
    align-self: flex-start;
    align-items: center;
    flex-direction: row-reverse;
    grid-gap: 10px;
`

const PageMidleAreaActionMobile = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    display: none;

    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            display: flex;
            flex-direction: row;
            position: absolute;
            top: 20px;
            right: 20px;
            justify-content: flex-end;
            align-items: center;
            flex-direction: row;
        `}
`

const PageMiddleAreaTopBox = styled(Margin)<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    scrollTop?: number
}>`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    flex-direction: ${(props) =>
        props.viewportWidth === 'mobile' ? 'column' : 'row'};
`

const BetaFlag = styled.div<{ isIframe: boolean }>`
    color: #757575;
    background-color: #fff;
    font-size: 14px;
    font-family: ${(props) => props.theme.fonts.primary};
    border-radius: 3px;
    padding: 0 8px;
    height: 24px;
    display: flex;
    position: fixed;
    bottom: 5px;
    right: 5px;
    cursor: pointer;
    justify-content: center;
    align-items: center;
    font-weight: 600;

    ${(props) =>
        props.isIframe &&
        css`
            display: none;
        `}
`

const MainColumn = styled.div`
    //background: ${(props) => props.theme.darkModeColors.backgroundColor};
    border-radius: 20px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
`

const StyledHeaderContainer = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    display: flex;
    justify-content: center;
    width: fill-available;
    align-items: flex-start;
    min-height: 34px;
    max-width: 820px;

    flex-direction: ${(props) =>
        props.viewportWidth === 'mobile' ? 'column' : 'row'};
`

const MenuBar = styled.div<{ isIframe: boolean }>`
    top: 0px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 20px 30px 10px 30px;
    z-index: 10000;

    ${(props) =>
        props.isIframe &&
        css`
            display: none;
        `};
`

const MemexLogo = styled.img<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    height: 24px;
    z-index: 3005;
`
