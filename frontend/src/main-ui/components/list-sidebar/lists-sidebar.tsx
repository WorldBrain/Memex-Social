import React, { PureComponent } from "react";
import styled from "styled-components";
import {
  SharedList,
  SharedListReference,
} from "@worldbrain/memex-common/lib/content-sharing/types";
import { UITaskState } from "../../types";
import LoadingIndicator from "../../../common-ui/components/loading-indicator";

const Container = styled.div``;

const SectionTitle = styled.h1``;

const ListName = styled.span``;

const EmptyMsg = styled.span``;

const ErrorMsg = styled.span``;

export interface Props {
  followedLists: Array<SharedList & { reference: SharedListReference }>;
  loadState: UITaskState;
  onSharedListClick: (listRef: SharedListReference) => React.MouseEventHandler
}

export default class ListsSidebar extends PureComponent<Props> {
  private renderSharedListNames() {
    if (this.props.loadState === "running") {
      return <LoadingIndicator />;
    }

    if (this.props.loadState === "error") {
      return (
        <>
          <ErrorMsg>
            There was a problem loading your followed collections.
          </ErrorMsg>
          <ErrorMsg>Reload the page</ErrorMsg>
          <ErrorMsg>If the problem persists, contact support.</ErrorMsg>
        </>
      );
    }

    if (!this.props.followedLists.length) {
      return <EmptyMsg>You don't follow any collections yet</EmptyMsg>;
    }

    return this.props.followedLists.map(({ title, reference }) => (
      <ListName onClick={this.props.onSharedListClick(reference)}>
        {title}
      </ListName>
    ));
  }

  render() {
    return (
      <Container>
        <SectionTitle>Followed Collections</SectionTitle>
        {this.renderSharedListNames()}
      </Container>
    );
  }
}
