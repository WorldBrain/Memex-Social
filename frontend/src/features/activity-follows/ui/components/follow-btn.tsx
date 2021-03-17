import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { UITaskState } from '../../../../main-ui/types'
import LoadingIndicator from '../../../../common-ui/components/loading-indicator'

const Container = styled.button<{
    isActive: boolean
}>`
    font-family: ${(props) => props.theme.fonts.primary};
    border-radius: 5px;
    border-width: 1px;
    font-weight: bold;
    margin-left: auto;
    color: ${(props) =>
        !props.isActive ? props.theme.colors.purple : 'white'};
    border: 1px solid ${(props) => props.theme.colors.purple};
    padding: 5px 20px;
    background: ${(props) =>
        props.isActive ? props.theme.colors.purple : 'white'};
    min-width: 100px;
    height: 34px;
    cursor: pointer;
    outline: none;
    justify-content: center;
    align-items: center;
    display: flex;
`


const PlusIcon = styled.span`
    padding-right: 5px;
`

const BtnText = styled.span``

export interface Props {
    onClick: React.MouseEventHandler
    loadState: UITaskState
    isFollowed?: boolean
    isContributor?: boolean
}

export default class FollowBtn extends PureComponent<Props> {
    getText() {
        if (this.props.isContributor) {
            return 'Contributor'
        } else if (this.props.isFollowed) {
            return 'Unfollow'
        } else {
            return 'Follow Updates'
        }
    }

    private renderBody() {
        const { props } = this

        if (props.loadState === 'running') {
            return <LoadingIndicator />
        }

        const isActive = props.isFollowed || props.isContributor
        const icon = !isActive && '+'

        return (
            <>
                {icon && <PlusIcon>{icon}</PlusIcon>}
                <BtnText>{this.getText()}</BtnText>
            </>
        )
    }

    render() {
        const { props } = this
        const isActive = (props.isFollowed || props.isContributor) ?? false
        return (
            <Container isActive={isActive} onClick={this.props.onClick}>
                {this.renderBody()}
            </Container>
        )
    }
}
