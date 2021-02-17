import moment from 'moment'
import React from 'react'
import styled from 'styled-components'
import { Margin } from 'styled-components-spacing'
import { SharedPageInfo } from '@worldbrain/memex-common/lib/content-sharing/types'
import ItemBox from '../components/item-box'

const PageContentBox = styled.div`
    display: flex;
    flex-direction: column;
    padding: 15px 15px 10px 15px;
`

const PageContentBoxBottom = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #e0e0e0;
    height: 50px;
    padding: 0px 15px 0px 15px;
`

const PageInfoBoxLink = styled.a`
    text-decoration: none;
`

const PageInfoBoxLeft = styled.div`
    text-decoration: none;
`

const CreatedWhenDate = styled.div`
    font-family: 'Poppins';
    font-weight: normal;
    font-size: 12px;
    color: ${(props) => props.theme.colors.darkgrey};
`

const PageInfoBoxRight = styled.div`
    text-decoration: none;
    cursor: default;
`

const PageInfoBoxActions = styled.div`
    display: flex;
`
const PageInfoBoxAction = styled.div<{ image: string }>`
    display: block;
    width: 20px;
    height: 20px;
    cursor: pointer;
    background-image: url('${(props) => props.image}');
    background-size: contain;
    background-position: center center;
    background-repeat: no-repeat;
`

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
          image: string
          onClick?: () => void
      }
    | { node: React.ReactNode }

export default function PageInfoBox(props: {
    pageInfo: Pick<
        SharedPageInfo,
        'fullTitle' | 'createdWhen' | 'originalUrl' | 'normalizedUrl'
    >
    actions?: Array<PageInfoBoxAction>
    children?: React.ReactNode
}) {
    const { pageInfo } = props
    const domain = pageInfo.normalizedUrl.split('/')

    return (
        <ItemBox>
            <StyledPageResult>
                <PageInfoBoxLink href={pageInfo.originalUrl} target="_blank">
                    <PageContentBox>
                        <ResultContent>
                            <PageUrl title={pageInfo.normalizedUrl}>
                                {domain[0]}
                            </PageUrl>
                        </ResultContent>
                        <PageTitle>{pageInfo.fullTitle}</PageTitle>
                    </PageContentBox>
                </PageInfoBoxLink>
                <PageContentBoxBottom>
                    <PageInfoBoxLeft>
                        <CreatedWhenDate>
                            {moment(pageInfo.createdWhen).format('LLL')}
                        </CreatedWhenDate>
                    </PageInfoBoxLeft>
                    {props.actions && (
                        <PageInfoBoxRight>
                            <PageInfoBoxActions>
                                {props.actions.map((action, actionIndex) =>
                                    'image' in action ? (
                                        <PageInfoBoxAction
                                            key={actionIndex}
                                            image={action.image}
                                            onClick={action.onClick}
                                        />
                                    ) : (
                                        action.node
                                    ),
                                )}
                            </PageInfoBoxActions>
                        </PageInfoBoxRight>
                    )}
                </PageContentBoxBottom>
            </StyledPageResult>
        </ItemBox>
    )
}
