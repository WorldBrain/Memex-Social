import React from 'react'
import styled from 'styled-components'

const Link = styled.a`
    font-size: inherit;
    color: inherit;
    font-weight: bold;
    display: inline-block;
    text-decoration: none;
    padding: 0 3px;
    margin-top: 2px;
    cursor: pointer;
`

export default function ExternalLink(props: {
    href: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <Link className={props.className} href={props.href} target="_blank">
            {props.children}
        </Link>
    )
}
