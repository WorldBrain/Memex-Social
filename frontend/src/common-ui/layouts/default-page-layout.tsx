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
import ListsSidebarToggle from '../../main-ui/components/sidebar-toggle/'

const middleMaxWidth = '800px'
const logoImage = require('../../assets/img/memex-logo.svg')

const MainContainer = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    sidebarShown: boolean
}>`
    background: #f6f8fb;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: flex-start;
    min-height: 50vh;
    height: fit-content;

    ${(props) =>
        props.viewportWidth === 'mobile' &&
        props.sidebarShown &&
        css`
            min-height: 100vh;
            overflow: scroll;
        `}
`

const StyledHeader = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    font-family: ${(props) => props.theme.fonts.primary};
    width: 100%;
    display: flex;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    justify-content: space-between;
    padding: 10px 20px;
    position: sticky;

    top: calc(-65px);
    background-color: #fff;
    z-index: 2000;
    align-items: flex-start;
    //box-shadow: #101e7308 0 4px 16px;

    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            flex-direction: column;
            align-items: flex-start;
            top: 0;
        `}
`

const LogoAndFeed = styled(Margin)<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    display: flex;
    flex: 1;
    align-items: center;
    position: sticky;
    top: 20px;
    z-index: 3001;
    height: 20px;

    ${(props) =>
        (props.viewportWidth === 'small' || props.viewportWidth === 'mobile') &&
        css`
            padding-right: 10px;
            display: flex;
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
    width: 100%;
    max-width: ${middleMaxWidth};
    display: flex;
    padding-right: 0px;
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
    padding-top: 70px;

    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            padding-top: 70px;
            display: flex;
        `}
`
const HeaderTitle = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-x: hidden;
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 26px;
    overflow-wrap: break-word;
    max-width: ${(props) =>
        props.viewportWidth === 'small' || props.viewportWidth === 'mobile'
            ? '100%'
            : '95%'};
    color: ${(props) => props.theme.colors.primary}
        ${(props) =>
            props.viewportWidth === 'small' &&
            css`
                font-size: 14px;
            `}
        ${(props) =>
            props.viewportWidth === 'mobile' &&
            css`
                font-size: 14px;
            `};
`
const HeaderSubtitle = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    font-weight: 500;
    margin-top: 1px;
    font-size: 16px;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.subText};
`
const HeaderAuthArea = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    white-space: nowrap;
    position: sticky;
    top: 20px;
    right: 20px;
`

const PageMiddleArea = styled.div<{}>`
    width: 100%;
    display: flex;
    height: 100%;
    position: absolute;
    //overflow: scroll;
`

const PageResultsArea = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
    headerHeight: number | undefined
}>`
    max-width: ${middleMaxWidth};
    position: relative;
    padding-bottom: 100px;
    margin: 0px auto 0;
    top: ${(props) => props.headerHeight}px;
`

const PageMidleAreaTitles = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
    flex: 1;
    width: 100%;
`

const PageMidleAreaAction = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-direction: row;
    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            display: none;
        `}
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
}>`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 10px;
    width: 100%;
    //margin-top: ${(props) => props.theme.spacing.medium};
    flex-direction: ${(props) =>
        props.viewportWidth === 'mobile' ? 'column' : 'row'};
`

const BetaFlag = styled.div`
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
`

const LeftRightBlock = styled.div`
    width: 10px;
`

const MemexLogo = styled.img<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    height: 24px;
    z-index: 3005;
`

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
    headerTitle?: string
    headerSubtitle?: React.ReactNode
    followBtn?: JSX.Element
    permissionKeyOverlay?: JSX.Element | null
    webMonetizationIcon?: JSX.Element
    hideActivityIndicator?: boolean
    isSidebarShown?: boolean
    listsSidebarProps?: Omit<ListsSidebarProps, 'services'> & {
        onSidebarToggle: React.MouseEventHandler
    }
    renderSubtitle?: (props: { children: React.ReactNode }) => React.ReactNode
    viewportBreakpoint: ViewportBreakpoint
    children: React.ReactNode
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

        console.log(headerHeight)
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
                                    if (feedState !== 'has-unseen') {
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
                services={props.services}
                viewportBreakpoint={props.viewportBreakpoint}
                onToggle={props.listsSidebarProps.onSidebarToggle}
            />
        )
    }

    return (
        <MainContainer
            viewportWidth={viewportWidth}
            sidebarShown={props.isSidebarShown}
        >
            <BetaFlag
                onClick={() => window.open('https://worldbrain.io/feedback')}
            >
                Beta | Feedback
            </BetaFlag>
            <StyledHeader id={'StyledHeader'} viewportWidth={viewportWidth}>
                {props.permissionKeyOverlay}
                <LogoAndFeed viewportWidth={viewportWidth}>
                    {props.listsSidebarProps && isAuthenticated && (
                        <>
                            <ListsSidebarToggle
                                viewportWidth={viewportWidth}
                                onToggle={
                                    props.listsSidebarProps.onSidebarToggle
                                }
                                isShown={props.listsSidebarProps.isShown}
                            />
                            <LeftRightBlock>{renderFeedArea()}</LeftRightBlock>
                        </>
                    )}
                    {!isAuthenticated && (
                        <MemexLogo
                            src={logoImage}
                            onClick={() => window.open('https://getmemex.com')}
                            viewportWidth={viewportWidth}
                        />
                    )}
                </LogoAndFeed>
                <PageMidleAreaActionMobile viewportWidth={viewportWidth}>
                    {props.webMonetizationIcon && props.webMonetizationIcon}
                    {props.followBtn && props.followBtn}
                </PageMidleAreaActionMobile>
                <HeaderMiddleArea
                    viewportWidth={viewportWidth}
                    id={'HeaderMiddleArea'}
                >
                    <PageMiddleAreaTopBox viewportWidth={viewportWidth}>
                        <PageMidleAreaTitles>
                            {props.headerTitle && (
                                <HeaderTitle
                                    title={props.headerTitle}
                                    viewportWidth={viewportWidth}
                                >
                                    {props.headerTitle}
                                </HeaderTitle>
                            )}
                            {props.headerTitle &&
                                props.headerSubtitle &&
                                renderSubtitle({
                                    children: (
                                        <HeaderSubtitle
                                            viewportWidth={viewportWidth}
                                        >
                                            {props.headerSubtitle}
                                        </HeaderSubtitle>
                                    ),
                                })}
                        </PageMidleAreaTitles>
                        <PageMidleAreaAction viewportWidth={viewportWidth}>
                            {props.webMonetizationIcon &&
                                props.webMonetizationIcon}
                            {props.followBtn && props.followBtn}
                        </PageMidleAreaAction>
                    </PageMiddleAreaTopBox>
                    {/* <LeftRightBlock /> */}
                </HeaderMiddleArea>
                {viewportWidth !== 'small' && viewportWidth !== 'mobile' && (
                    <HeaderAuthArea viewportWidth={viewportWidth}>
                        <AuthHeader
                            services={props.services}
                            storage={props.storage}
                        />
                    </HeaderAuthArea>
                )}
            </StyledHeader>
            <PageMiddleArea>
                {renderListsSidebar()}
                <PageResultsArea
                    headerHeight={getHeaderHeight()}
                    viewportWidth={viewportWidth}
                >
                    {props.children}
                </PageResultsArea>
            </PageMiddleArea>
        </MainContainer>
    )
}
