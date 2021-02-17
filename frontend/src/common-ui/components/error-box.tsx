import React from 'react'
import styled from 'styled-components'

const StyledErrorBox = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    width: 100%;
    padding: 20px 20px;
    border-radius: 5px;
    box-shadow: rgba(15, 15, 15, 0.1) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 2px 4px;
    background-color: #f29d9d;
    color: white;
    display: flex;
    justify-content: center;
    text-align: center;
`

export default function ErrorBox(props: { children: React.ReactNode }) {
    return <StyledErrorBox>{props.children}</StyledErrorBox>
}
