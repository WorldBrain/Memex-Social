import React from "react";
import FollowBtn from "../../../../activity-streams/ui/components/follow-btn";
import { UIElement } from "../../../../../main-ui/classes";
import { State, Events, Dependencies } from './types'
import Logic from "./logic";

export interface Props extends Dependencies {}

export default class FollowBtnContainer extends UIElement<Props, State, Events> {
  constructor(props: Props) {
    super(props, { logic: new Logic(props) });
  }

  private handleClick: React.MouseEventHandler = e => {
      e.preventDefault()

      this.processEvent('clickFollowBtn', null)
  }

  render() {
      return (
          <FollowBtn
            loadState={this.state.followLoadState}
            isFollowed={this.state.isFollowed}
            onClick={this.handleClick}
          />
      )
  }
}
