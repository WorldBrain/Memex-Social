import React from 'react'
import { Margin } from 'styled-components-spacing'
import styled from 'styled-components'
import ErrorBox from './error-box'
import Button from './button'

const ListNotFoundBox = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    width: 100%;
    padding: 20px 20px;
    color: ${(props) => props.theme.colors.prime1};
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-align: center;
`

export default function ErrorWithAction(
    props: {
        children: React.ReactNode
    } & (
        | {
              errorType: 'internal-error'
          }
        | {
              errorType: 'not-found'
              action: {
                  label: string
                  url: string
              }
          }
    ),
) {
    return (
        <ListNotFoundBox>
            <Margin bottom={'large'}>
                {props.errorType === 'internal-error' && (
                    <ErrorBox>{props.children}</ErrorBox>
                )}
                {props.errorType === 'not-found' && props.children}
            </Margin>
            {props.errorType === 'internal-error' && (
                <Button
                    type="small"
                    externalHref="https://worldbrain.io/report-bugs"
                >
                    Report Problem
                </Button>
            )}
            {props.errorType === 'not-found' && (
                <Button type="small" externalHref={props.action.url}>
                    {props.action.label}
                </Button>
            )}
        </ListNotFoundBox>
    )
}
