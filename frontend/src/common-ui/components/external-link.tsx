import React from 'react'
import styled from 'styled-components'

const Link = styled.a``

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
