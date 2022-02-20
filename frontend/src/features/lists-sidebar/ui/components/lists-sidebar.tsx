import React, { PureComponent } from 'react'

import styled, { css } from 'styled-components'
import { UITaskState } from '../../../../main-ui/types'
import LoadingIndicator from '../../../../common-ui/components/loading-indicator'
import RouteLink from '../../../../common-ui/components/route-link'
import { Services } from '../../../../services/types'
import { ListsSidebarState } from '../types'
import { ViewportBreakpoint } from '../../../../main-ui/styles/types'
import ListsSidebarToggle from '../../../../main-ui/components/sidebar-toggle/'
import UnseenActivityIndicator from '../../../../features/activity-streams/ui/containers/unseen-activity-indicator'
import { Margin } from 'styled-components-spacing'
import { StorageModules } from '../../../../storage/types'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { theme } from '../../../../main-ui/styles/theme'

const icons = theme.icons

const UnseenActivityDot = styled.div`
    background: #5cd9a6;
    width: 14px;
    height: 14px;
    border-radius: 10px;
`

const FeedArea = styled(Margin)`
    display: flex;
    align-items: center;
`

const FeedLink = styled(RouteLink)`
    align-items: center;
    color: ${(props) => props.theme.colors.primary};
    display: grid;
    justify-content: flex-start;
    grid-gap: 10px;
    grid-auto-flow: column;
    margin-bottom: 10px;
    cursor: pointer;

    & > div {
        margin-top: 0px;
    }
`

const Container = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    position: fixed;
    top: 0px;
    left: 0px;
    min-height: fill-available;
    height: 100%;
    font-family: ${(props) => props.theme.fonts.primary};
    background: ${(props) => props.theme.colors.grey};
    padding: 5px;
    width: 250px;
    overflow-y: hidden;
    z-index: 5000;
    background: #fff;
    //box-shadow: #101e7308 4px 0 16px;
    border-right: 1px solid #f0f0f0;
    height: 100%;
    position: fixed;
    z-index: 3000;

    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            top: 0px;
            width: 100vw;
            height: 100vh;
            position: fixed;
            left: 0px;
            z-index: 3000;
            overflow: hidden;
            border-right: unset;
        `}
`

const ListContent = styled.div`
    display: flex;
    flex-direction: column;
    padding-bottom: 100px;

    overflow: scroll;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const SectionTitle = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    font-size: 14px;
    font-weight: 600;
    padding: 5px 0px 5px 5px;
    color: ${(props) => props.theme.colors.darkerBlue};
    margin-top: 15px;
    letter-spacing: 0.5px;
    display: grid;
    justify-content: flex-start;
    grid-auto-flow: column;
    align-items: center;

    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            font-size: 18px;
        `}
`

const ListNameLink = styled(RouteLink)`
    width: 100%;
    font-size: 14px;
    line-break: auto;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: ${(props) => props.theme.colors.darkgrey};
    padding: 5px;
    border-radius: 3px;
    font-weight: 500;

    &:hover {
        background: ${(props) => props.theme.colors.lightgrey};
    }
`

const ListsContainer = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    top: 100px;
    width: 90%;
    height: 80%;
    position: relative;
    left: 10px;
`

const EmptyMsg = styled.span`
    font-size: 12px;
    padding-left: 5px;
`

const ErrorMsg = styled.span`
    font-size: 12px;
    color: ${(props) => props.theme.colors.warning};
    padding-left: 5px;
`

const NoCollectionsMessage = styled.div`
    font-family: 'Inter', sans-serif;
    display: grid;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
    cursor: pointer;
    padding: 0px 15px;
    margin: 5px 10px;
    width: fill-available;
    margin-top: 5px;
    height: 40px;
    justify-content: flex-start;
    border-radius: 5px;

    & * {
        cursor: pointer;
    }

    &: hover {
        background-color: ${(props) =>
            props.theme.colors.backgroundColorDarker};
    }
`
const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 24px;
    width: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 14px;
    font-weight: 300;
    font-family: 'Inter', sans-serif;
`

const Link = styled.span`
    color: ${(props) => props.theme.colors.purple};
    padding-left: 3px;
`

export interface Props
    extends Pick<ListsSidebarState, 'followedLists' | 'collaborativeLists'> {
    services: Pick<
        Services,
        'router' | 'auth' | 'activityStreams' | 'device' | 'logicRegistry'
    >
    loadState: UITaskState
    isShown: boolean
    viewportBreakpoint: ViewportBreakpoint
    onToggle: React.MouseEventHandler<Element>
    hideActivityIndicator?: boolean
    storage: Pick<StorageModules, 'users' | 'activityStreams'>
}

export default class ListsSidebar extends PureComponent<Props> {
    private renderListNames(lists: ListsSidebarState['followedLists']) {
        if (!lists.length) {
            return (
                <NoCollectionsMessage
                    onClick={() =>
                        window.open(
                            'https://links.memex.garden/follow-first-space',
                        )
                    }
                >
                    <SectionCircle>
                        <Icon
                            filePath={'heartEmpty'}
                            heightAndWidth="14px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <InfoText>
                        Follow your
                        <Link>first Space</Link>
                    </InfoText>
                </NoCollectionsMessage>
            )
        }

        return lists.map(({ title, reference }) => (
            <ListNameLink
                key={reference.id}
                route="collectionDetails"
                services={this.props.services}
                params={{ id: reference.id as string }}
                title={title}
            >
                {title}
            </ListNameLink>
        ))
    }

    private renderFeedsArea() {
        return (
            <FeedArea>
                <FeedLink
                    services={this.props.services}
                    route="homeFeed"
                    params={{}}
                >
                    <SectionTitle
                        viewportBreakpoint={this.props.viewportBreakpoint}
                    >
                        Feed Updates
                    </SectionTitle>
                    {!this.props.hideActivityIndicator && (
                        <Margin left="small">
                            <UnseenActivityIndicator
                                services={this.props.services}
                                storage={this.props.storage}
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

    private renderListContent() {
        if (this.props.loadState === 'running') {
            return <LoadingIndicator />
        }

        if (this.props.loadState === 'error') {
            return (
                <>
                    <ErrorMsg>
                        There was a problem loading your followed collections.
                    </ErrorMsg>
                    <ErrorMsg>Reload the page</ErrorMsg>
                    <ErrorMsg>
                        If the problem persists, contact support.
                    </ErrorMsg>
                </>
            )
        }

        return (
            <>
                {this.renderListNames(this.props.followedLists)}
                {this.props.collaborativeLists.length > 0 && (
                    <>
                        <SectionTitle
                            viewportBreakpoint={this.props.viewportBreakpoint}
                        >
                            Collaborative Collections
                        </SectionTitle>
                        <ListContent>
                            {this.renderListNames(
                                this.props.collaborativeLists,
                            )}
                        </ListContent>
                    </>
                )}
            </>
        )
    }

    render() {
        if (!this.props.isShown) {
            return null
        }

        return (
            <Container viewportBreakpoint={this.props.viewportBreakpoint}>
                <ListsSidebarToggle
                    viewportWidth={this.props.viewportBreakpoint}
                    onToggle={this.props.onToggle}
                    isShown={this.props.isShown}
                />
                <ListsContainer
                    viewportBreakpoint={this.props.viewportBreakpoint}
                >
                    {this.renderFeedsArea()}
                    <SectionTitle
                        viewportBreakpoint={this.props.viewportBreakpoint}
                    >
                        Followed Collections
                    </SectionTitle>
                    <ListContent>{this.renderListContent()}</ListContent>
                </ListsContainer>
            </Container>
        )
    }
}
