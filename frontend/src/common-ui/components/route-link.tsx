import React from 'react'
import styled from 'styled-components'
import { Services } from '../../services/types'
import { RouteMap } from '../../routes'

const StyledRouteLink = styled.a`
    text-decoration: none;
    font-family: ${(props) => props.theme.fonts.primary};
    color: inherit;
    display: contents;
    grid-gap: 5px;
    align-items: center;

    & > * {
        cursor: pointer;
    }
`

export interface Props {
    services: Pick<Services, 'router'>
    route: keyof RouteMap
    params: { [key: string]: string }
    children: React.ReactNode
    query?: { [key: string]: string } | any
    className?: string
    title?: string
    target?: string
}

const isIframe = () => {
    try {
        return window.self !== window.top
    } catch (e) {
        return true
    }
}

export default function RouteLink(props: Props) {
    const url = props.services.router.getUrl(props.route, props.params, {
        query: props.query,
    })

    return (
        <StyledRouteLink
            className={props.className}
            href={url}
            target={props.target}
            onClick={(event) => {
                if (
                    event.metaKey ||
                    event.ctrlKey ||
                    props.target === '_blank'
                ) {
                    return
                }
                event.preventDefault()
                props.services.router.goTo(props.route, props.params, {
                    query: props.query,
                })
            }}
            title={props.title}
        >
            {props.children}
        </StyledRouteLink>
    )
}
