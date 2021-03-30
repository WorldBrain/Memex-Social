import React, { useEffect, useState } from 'react'
import styled, { css } from 'styled-components'
import { ViewportBreakpoint } from '../../main-ui/styles/types'
import { UIElementServices } from '../../main-ui/classes'
import AuthHeader from '../../features/user-management/ui/containers/auth-header'
import { StorageModules } from '../../storage/types'
import { Margin } from 'styled-components-spacing'
import RouteLink from '../components/route-link'
import UnseenActivityIndicator from '../../features/activity-streams/ui/containers/unseen-activity-indicator'
import ListsSidebar, {
    Props as ListsSidebarProps,
} from '../../main-ui/components/list-sidebar/lists-sidebar'
import ListsSidebarToggle from '../../main-ui/components/sidebar-toggle/'

const middleMaxWidth = '800px'
const logoImage = require('../../assets/img/memex-logo.svg')

const MainContainer = styled.div`
    background: #f6f8fb;
    height: 100%;
`

const StyledHeader = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    font-family: ${(props) => props.theme.fonts.primary};
    width: 100%;
    height: 50px;
    display: flex;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    justify-content: space-between;
    padding: 0 20px;
    position: sticky;
    top: 0;
    background-color: #fff;
    margin-top: -20px;
    z-index: 2000;
    align-items: center;
    height: 50px;
    box-shadow: #101e7308 0 4px 16px;
`

const LogoAndFeed = styled(Margin)<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    display: flex;
    flex: 1;
    align-items: center;

    ${(props) =>
        (props.viewportWidth === 'small' || props.viewportWidth === 'mobile') &&
        css`
            padding-right: 10px;
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

const FeedLabel = styled.div`
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
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
    width: ${(props) =>
        props.viewportWidth === 'small' || props.viewportWidth === 'mobile'
            ? '95%'
            : '80%'};
    max-width: ${middleMaxWidth};
    display: flex;
    padding-right: 20px;
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
`
const HeaderTitle = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    font-weight: 600;
    text-overflow: ellipsis;
    overflow-x: hidden;
    font-family: ${(props) => props.theme.fonts.primary};
    font-size: 16px;
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
    font-size: 14px;
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
`

const PageMiddleArea = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    max-width: ${middleMaxWidth};
    top: 10px;
    position: relative;
    padding-bottom: 100px;
    margin: 0px auto 0;

    ${(props) =>
        props.viewportWidth === 'small' &&
        css`
            width: 95%;
            top: 10px;
            margin: 20px auto 0;
        `}
    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            width: 95%;
            top: 10px;
            margin: 20px auto 0;
        `}
`

const PageMidleAreaTitles = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
    flex: 1;
`

const PageMidleAreaAction = styled.div<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    flex-direction: row;
    ${(props) =>
        props.viewportWidth === 'mobile' &&
        css`
            flex-direction: row-reverse;
            margin-top: ${(props) => props.theme.spacing.medium};
        `}
`

const PageMiddleAreaTopBox = styled(Margin)<{
    viewportWidth: 'mobile' | 'small' | 'normal' | 'big'
}>`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
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

const MemexLogo = styled.img`
    height: 20px;
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
    webMonetizationIcon?: JSX.Element
    hideActivityIndicator?: boolean
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

    const renderFeedArea = () => {
        if (!isAuthenticated) {
            return (
                <FeedArea>
                    <FeedLabel
                        onClick={async () => {
                            const {
                                result,
                            } = await props.services.auth.requestAuth()
                            if (
                                result.status === 'authenticated' ||
                                result.status === 'registered-and-authenticated'
                            ) {
                                props.services.router.goTo('homeFeed')
                            }
                        }}
                    >
                        Feed
                    </FeedLabel>
                </FeedArea>
            )
        }

        return (
            <FeedArea>
                <FeedLink
                    services={props.services}
                    route="homeFeed"
                    params={{}}
                >
                    <FeedLabel>Feed</FeedLabel>
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
                services={props.services}
            />
        )
    }

    return (
        <MainContainer>
            <BetaFlag
                onClick={() => window.open('https://worldbrain.io/feedback')}
            >
                Beta | Feedback
            </BetaFlag>
            {renderListsSidebar()}
            <StyledHeader viewportWidth={viewportWidth}>
                <LogoAndFeed viewportWidth={viewportWidth}>
                    {props.listsSidebarProps && isAuthenticated && (
                        <ListsSidebarToggle
                            viewportWidth={viewportWidth}
                            onToggle={props.listsSidebarProps.onSidebarToggle}
                            isShown={props.listsSidebarProps.isShown}
                        />
                    )}
                </LogoAndFeed>
                <HeaderMiddleArea viewportWidth={viewportWidth}>
                    <LeftRightBlock>{renderFeedArea()}</LeftRightBlock>
                    <MemexLogo
                        src={logoImage}
                        onClick={() => window.open('https://getmemex.com')}
                    />
                    <LeftRightBlock />
                </HeaderMiddleArea>
                <HeaderAuthArea viewportWidth={viewportWidth}>
                    <AuthHeader
                        services={props.services}
                        storage={props.storage}
                    />
                </HeaderAuthArea>
            </StyledHeader>
            <PageMiddleArea viewportWidth={viewportWidth}>
                <PageMiddleAreaTopBox
                    top="large"
                    bottom="medium"
                    viewportWidth={viewportWidth}
                >
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
                        {props.webMonetizationIcon && props.webMonetizationIcon}
                        {props.followBtn && props.followBtn}
                    </PageMidleAreaAction>
                </PageMiddleAreaTopBox>
                {props.children}
            </PageMiddleArea>
        </MainContainer>
    )
}
