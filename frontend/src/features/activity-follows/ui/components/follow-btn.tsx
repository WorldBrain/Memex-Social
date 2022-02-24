import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'
import { UITaskState } from '../../../../main-ui/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import ButtonTooltip from '@worldbrain/memex-common/lib/common-ui/components/button-tooltip'

const Container = styled.div<{
    isOwner: boolean
    isContributor: boolean
    isFollowed: boolean
}>`
    font-family: ${(props) => props.theme.fonts.primary};
    border-radius: 5px;
    border-width: 1px;
    font-weight: bold;
    margin-left: auto;
    ${(props) =>
        props.isContributor &&
        props.isFollowed &&
        css`
            background: transparent;
            color: ${(props) => props.theme.colors.purple};
            cursor: default;
            border: 1px solid ${(props) => props.theme.colors.grey};

            & div {
                cursor: default;
            }
        `}
    ${(props) =>
        props.isOwner &&
        props.isFollowed &&
        css`
            background: transparent;
            color: ${(props) => props.theme.colors.purple};
            cursor: default;
            border: 1px solid ${(props) => props.theme.colors.grey};

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
            color: ${(props) => props.theme.colors.purple};
            cursor: pointer;
            border: 1px solid ${(props) => props.theme.colors.purple};
        `}
    ${(props) =>
        !props.isFollowed &&
        css`
            background-color: ${(props) => props.theme.colors.purple};
            color: white;
            cursor: pointer;
            border: 1px solid ${(props) => props.theme.colors.purple};
        `}
    padding: 5px 15px;
    min-width: 100px;
    height: 34px;
    outline: none;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    display: flex;
`

const PlusIcon = styled.span`
    padding-right: 10px;
`

const ButtonBox = styled.div`
    display: flex;
    align-items: center;
    cursor: pointer;

    & * {
        cursor: pointer;
    }
`

const BtnText = styled.span`
    font-weight: 500;
`

export interface Props {
    onClick: React.MouseEventHandler
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
            return 'purple'
        }
        if (props.isOwner) {
            return 'purple'
        }
        if (!props.isOwner && !props.isContributor && props.isFollowed) {
            return 'purple'
        } else {
            return 'white'
        }
    }

    private renderBody() {
        const { props } = this

        if (props.loadState === 'running') {
            return <LoadingIndicator size={16} />
        }

        const icon = (
            <Icon
                height="18px"
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
            <>
                <ButtonTooltip
                    tooltipText={
                        <>
                            You can add pages <br />
                            and annotations to this Space
                        </>
                    }
                    position="bottom"
                >
                    <Container
                        onMouseEnter={() => this.handleMouseEnter()}
                        onMouseLeave={() => this.handleMouseLeave()}
                        onClick={props.onClick}
                        isContributor={props.isContributor}
                        isFollowed={
                            props.isFollowed ||
                            props.isOwner ||
                            props.isContributor
                        }
                        isOwner={props.isOwner}
                    >
                        {this.renderBody()}
                    </Container>
                </ButtonTooltip>
            </>
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
