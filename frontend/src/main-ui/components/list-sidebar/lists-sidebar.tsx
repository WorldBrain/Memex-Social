import React, { PureComponent } from 'react'
import styled from 'styled-components'
import {
    SharedList,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { UITaskState } from '../../types'
import LoadingIndicator from '../../../common-ui/components/loading-indicator'
import RouteLink from '../../../common-ui/components/route-link'
import { Services } from '../../../services/types'

const Container = styled.div`
    position: fixed;
    top: 50px;
    min-height: fill-available;
    height: 100%;
    font-family: ${(props) => props.theme.fonts.primary};
    background: ${(props) => props.theme.colors.grey};
    padding: 10px;
    width: 200px;
    overflow-y: scroll;
    z-index: 5000;
    background: #fff;
    box-shadow: #101e7308 4px 0 16px;
`

const ListContent = styled.div`
    display: flex;
    flex-direction: column;
    padding-bottom: 100px;
`

const SectionTitle = styled.div`
    font-size: 14px;
    font-weight: 300;
    padding: 5px 0px 5px 5px;
    color: ${(props) => props.theme.colors.darkgrey};
    opacity: 0.7;
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
    border-radius: 5px;
    font-weight: 500;

    &:hover {
        background: ${(props) => props.theme.colors.grey};
    }
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

export interface Props {
    services: Pick<Services, 'router'>
    followedLists: Array<SharedList & { reference: SharedListReference }>
    loadState: UITaskState
    isShown: boolean
}

export default class ListsSidebar extends PureComponent<Props> {
    private renderSharedListNames() {
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

        if (!this.props.followedLists.length) {
            return <EmptyMsg>You don't follow any collections yet</EmptyMsg>
        }

        return this.props.followedLists.map(({ title, reference }) => (
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

    render() {
        if (!this.props.isShown) {
            return null
        }

        return (
            <Container>
                <SectionTitle>Followed Collections</SectionTitle>
                <ListContent>{this.renderSharedListNames()}</ListContent>
            </Container>
        )
    }
}
