import React, { PureComponent } from "react";
import styled from 'styled-components'
import { UITaskState } from "../../../../main-ui/types";
import LoadingIndicator from "../../../../common-ui/components/loading-indicator";

const Container = styled.button`
  font-family: ${(props) => props.theme.fonts.primary};
  border-radius: 5px;
  border-width: 1px;
  font-weight: bold;
  margin-left: auto;
  color: ${(props) => props.theme.colors.purple};
  border: 1px solid ${(props) => props.theme.colors.purple};
  padding: 5px 20px;
  background: white;
  min-width: 50px;
`

const PlusIcon = styled.span`
  padding-right: 5px;
`

const BtnText = styled.span``

export interface Props {
    onClick: React.MouseEventHandler
    loadState: UITaskState
    isFollowed?: boolean
}

export default class FollowBtn extends PureComponent<Props> {
    private renderBody() {
        if (this.props.loadState === 'running') {
            return <LoadingIndicator />
        }

        const text = (this.props.isFollowed) ? 'Unfollow' : 'Follow Updates'
        const icon = (this.props.isFollowed) ? '' : '+'

        return (
            <>
                <PlusIcon>{icon}</PlusIcon>
                <BtnText>{text}</BtnText>
            </>
        )
    }

    render() {
        return (
            <Container onClick={this.props.onClick}>
                {this.renderBody()}
            </Container>
        )
    }
}
