import React, { PureComponent } from "react";
import styled from "styled-components";
import {
  SharedList,
  SharedListReference,
} from "@worldbrain/memex-common/lib/content-sharing/types";
import { UITaskState } from "../../types";
import LoadingIndicator from "../../../common-ui/components/loading-indicator";
import RouteLink from "../../../common-ui/components/route-link";
import { Services } from "../../../services/types";

const Container = styled.div`
  position: fixed;
  top: 50px;
  height: 100vh;
  font-family: ${(props) => props.theme.fonts.primary};
  background: ${(props) => props.theme.colors.grey};
`;

const SectionTitle = styled.h1``;

const ListNameLink = styled(RouteLink)``;

const EmptyMsg = styled.span``;

const ErrorMsg = styled.span``;

export interface Props {
  services: Pick<Services, 'router'>;
  followedLists: Array<SharedList & { reference: SharedListReference }>;
  loadState: UITaskState;
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
      <ListNameLink
        route="collectionDetails"
        services={this.props.services}
        params={{ id: reference.id as string }}
      >
        {title}
      </ListNameLink>
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
