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
    display: flex;
    flex-direction: column;

    padding: 15px 15px 10px 15px;
    border-bottom: 1px solid #e0e0e0;
`

const PageContentBoxBottom = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`

const PageInfoBoxLink = styled.a`
  text-decoration: none;
`;

const PageInfoBoxLeft = styled.div`
  text-decoration: none;
  padding: 15px 0px 15px 15px;
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
  padding-bottom: 5px;
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

const StyledPageResult = styled.div`
    display: flex;
    flex-direction: column;
`
const ResultContent = styled(Margin)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
`
const PageUrl = styled.span`
    font-size: 12px;
    color: #545454;
    padding-bottom: 5px;
`

const PageTitle = styled(Margin)`
    font-size: 14px;
    font-weight: bold;
    color: #3a2f45;
    justify-content: flex-start;
`

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
  const domain = pageInfo.normalizedUrl.split('/');
  console.log(pageInfo)

  return (
    <ItemBox>
      <PageInfoBoxLink href={pageInfo.originalUrl} target="_blank">
        <StyledPageResult>
          <PageContentBox>
              <ResultContent>
                <PageUrl>{domain[0]}</PageUrl>
              </ResultContent>
              <PageTitle>
                  {pageInfo.fullTitle}
              </PageTitle>
          </PageContentBox>
          <PageContentBoxBottom>
            <PageInfoBoxLeft>
            <CreatedWhenDate>
                    {moment(pageInfo.createdWhen).format("LLL")}
            </CreatedWhenDate>
            </PageInfoBoxLeft>
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
          </PageContentBoxBottom>

        </StyledPageResult>
      </PageInfoBoxLink>
    </ItemBox>
  );
}
