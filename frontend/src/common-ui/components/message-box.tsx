import React from 'react'
import styled from 'styled-components'
import { Margin } from 'styled-components-spacing'

const StyledMessageBox = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    width: 100%;
    padding: 20px 20px;
    text-align: center;
`

const MessageBoxTitle = styled.div`
    font-weight: 800;
    color: ${(props) => props.theme.colors.darkerText};
`

const MessageBoxBody = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-weight: 400;
`

export default function MessageBox(props: {
    title: string
    children: React.ReactNode
}) {
    return (
        <StyledMessageBox>
            <Margin bottom="small">
                <MessageBoxTitle>{props.title}</MessageBoxTitle>
            </Margin>
            <MessageBoxBody>{props.children}</MessageBoxBody>
        </StyledMessageBox>
    )
}
