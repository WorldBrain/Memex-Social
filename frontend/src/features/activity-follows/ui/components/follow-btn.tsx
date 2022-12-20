import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'
import { UITaskState } from '../../../../main-ui/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const Container = styled.div<{
    isOwner?: boolean
    isContributor?: boolean
    isFollowed?: boolean
}>`
    font-family: ${(props) => props.theme.fonts.primary};
    border-radius: 5px;
    border-width: 1px;
    font-weight: bold;
    width: 160px;
    background-color: ${(props) => props.theme.colors.normalText};
    color: ${(props) => props.theme.colors.black};
    ${(props) =>
        (props.isContributor || props.isFollowed || props.isOwner) &&
        css`
            cursor: default;
            background-color: transparent;
            border: 1px solid ${(props) => props.theme.colors.normalText};
            color: ${(props) => props.theme.colors.normalText};
            & div {
                cursor: default;
            }
        `}
    ${(props) =>
        props.isFollowed &&
        !props.isOwner &&
        !props.isContributor &&
        css`
            background-color: transparent;
            cursor: pointer;
        `}
    ${(props) =>
        !props.isFollowed &&
        css`
            cursor: pointer;
        `}
    padding: 5px 15px;
    height: 34px;
    outline: none;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    display: flex;
    white-space: nowrap;

    & * {
        cursor: pointer;
    }
`

const PlusIcon = styled.span``

const ButtonBox = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;
    min-width: 100px;
    grid-gap: 5px;
    justify-content: center;

    & * {
        cursor: pointer;
    }
`

const BtnText = styled.span`
    font-weight: 500;
`

export interface Props {
    onClick: React.MouseEventHandler<HTMLDivElement>
    loadState: UITaskState
    isOwner?: boolean
    isFollowed?: boolean
    isContributor?: boolean
}

export default class FollowBtn extends PureComponent<Props> {
    state = {
        hoverButton: false,
    }

    handleMouseEnter() {
        this.setState({
            hoverButton: true,
        })
    }

    handleMouseLeave() {
        this.setState({
            hoverButton: false,
        })
    }

    getText() {
        if (this.props.isOwner) {
            return 'Owner'
        } else if (this.props.isContributor) {
            return 'Contributor'
        } else if (this.props.isFollowed) {
            if (this.state.hoverButton) {
                return 'Unfollow'
            } else {
                return 'Following'
            }
        } else {
            return 'Follow Updates'
        }
    }

    followStateIcon() {
        const { props } = this
        if (props.isOwner) {
            return 'check'
        } else if (props.isContributor) {
            return 'peopleFine'
        } else if (!props.isOwner && !props.isContributor && props.isFollowed) {
            if (this.state.hoverButton) {
                return 'close'
            } else {
                return 'check'
            }
        } else {
            return 'bell'
        }
    }

    followStateIconColor() {
        const { props } = this
        if (props.isContributor) {
            return 'normalText'
        }
        if (props.isOwner) {
            return 'normalText'
        }
        if (!props.isOwner && !props.isContributor && props.isFollowed) {
            return 'normalText'
        } else {
            return 'black'
        }
    }

    private renderBody() {
        const { props } = this

        if (props.loadState === 'running') {
            return <LoadingIndicator size={16} />
        }

        const icon = (
            <Icon
                height="16px"
                icon={this.followStateIcon()}
                color={this.followStateIconColor()}
                hoverOff
            />
        )

        return (
            <ButtonBox>
                {icon && <PlusIcon>{icon}</PlusIcon>}
                <BtnText>{this.getText()}</BtnText>
            </ButtonBox>
        )
    }

    render() {
        const { props } = this
        return props.isContributor ? (
            <Container
                onMouseEnter={() => this.handleMouseEnter()}
                onMouseLeave={() => this.handleMouseLeave()}
                onClick={props.onClick}
                isContributor={props.isContributor}
                isFollowed={
                    props.isFollowed || props.isOwner || props.isContributor
                }
                isOwner={props.isOwner}
            >
                {this.renderBody()}
            </Container>
        ) : (
            <Container
                onMouseEnter={() => this.handleMouseEnter()}
                onMouseLeave={() => this.handleMouseLeave()}
                onClick={props.onClick}
                isContributor={props.isContributor}
                isFollowed={
                    props.isFollowed || props.isOwner || props.isContributor
                }
                isOwner={props.isOwner}
            >
                {this.renderBody()}
            </Container>
        )
    }
}
