import moment from "moment";
import React from "react";
import styled from "styled-components";
import { Margin } from "styled-components-spacing";
import { SharedPageInfo } from "@worldbrain/memex-common/lib/content-sharing/types";
import ItemBox from "../components/item-box";

const PageBox = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const PageContentBox = styled.div`
  flex: 1;
  width: 80%;
  max-width: 96%;
`;

const PageInfoBoxLink = styled.a`
  text-decoration: none;
`;

const PageInfoBoxLeft = styled.div`
  text-decoration: none;
  padding: 15px 0px 15px 20px;
  cursor: pointer;
`;

const PageInfoBoxTop = styled.div`
  display: flex;
`;
const PageInfoBoxTitle = styled.div`
  flex-grow: 2;
  font-weight: 600;
  color: ${(props) => props.theme.colors.primary};
  text-decoration: none;
  font-size: ${(props) => props.theme.fontSizes.listTitle};
  text-overflow: ellipsis;
  overflow-x: hidden;
  text-decoration: none;
  overflow-wrap: break-word;
  white-space: nowrap;
`;

const PageInfoBoxUrl = styled.div`
  font-weight: 400;
  font-size: ${(props) => props.theme.fontSizes.url};
  color: ${(props) => props.theme.colors.subText};
  text-overflow: ellipsis;
  overflow-x: hidden;
  text-decoration: none;
  overflow-wrap: break-word;
  white-space: nowrap;
  max-width: 100%;
`;

const CreatedWhenDate = styled.div`
  font-family: "Poppins";
  font-weight: normal;
  font-size: 12px;
  color: ${(props) => props.theme.colors.primary};
`;

const PageInfoBoxRight = styled.div`
  text-decoration: none;
  padding: 15px 0px 15px 10px;
  cursor: default;
  width: 50px;
`;

const PageInfoBoxActions = styled.div`
  display: flex;
`;
const PageInfoBoxAction = styled.div<{ image: string }>`
  display: block;
  width: 20px;
  height: 20px;
  cursor: pointer;
  background-image: url("${(props) => props.image}");
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
`;

export type PageInfoBoxAction =
  | {
      image: string;
      onClick?: () => void;
    }
  | { node: React.ReactNode };

export default function PageInfoBox(props: {
  pageInfo: Pick<
    SharedPageInfo,
    "fullTitle" | "createdWhen" | "originalUrl" | "normalizedUrl"
  >;
  actions?: Array<PageInfoBoxAction>;
  children?: React.ReactNode;
}) {
  const { pageInfo } = props;

  return (
    <ItemBox>
      <PageBox>
        <PageContentBox>
          <PageInfoBoxLink href={pageInfo.originalUrl} target="_blank">
            <PageInfoBoxLeft>
              <PageInfoBoxTop>
                <PageInfoBoxTitle title={pageInfo.fullTitle}>
                  {pageInfo.fullTitle}
                </PageInfoBoxTitle>
              </PageInfoBoxTop>
              <Margin bottom="smallest">
                <PageInfoBoxUrl>{pageInfo.normalizedUrl}</PageInfoBoxUrl>
              </Margin>
              <CreatedWhenDate>
                {moment(pageInfo.createdWhen).format("LLL")}
              </CreatedWhenDate>
            </PageInfoBoxLeft>
          </PageInfoBoxLink>
        </PageContentBox>
        {props.actions && (
          <PageInfoBoxRight>
            <PageInfoBoxActions>
              {props.actions.map((action, actionIndex) =>
                "image" in action ? (
                  <PageInfoBoxAction
                    key={actionIndex}
                    image={action.image}
                    onClick={action.onClick}
                  />
                ) : (
                  action.node
                )
              )}
            </PageInfoBoxActions>
          </PageInfoBoxRight>
        )}
      </PageBox>
    </ItemBox>
  );
}
