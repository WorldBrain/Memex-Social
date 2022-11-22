import React from 'react'
import styled from 'styled-components'
import { Services } from '../../services/types'
import { RouteMap } from '../../routes'

const StyledRouteLink = styled.a`
    text-decoration: none;
    font-family: ${(props) => props.theme.fonts.primary};
`

export interface Props {
    services: Pick<Services, 'router'>
    route: keyof RouteMap
    params: { [key: string]: string }
    children: React.ReactNode
    className?: string
    title?: string
}

const isIframe = () => {
    try {
        return window.self !== window.top
    } catch (e) {
        return true
    }
}

export default function RouteLink(props: Props) {
    const url = props.services.router.getUrl(props.route, props.params)
    return (
        <StyledRouteLink
            className={props.className}
            href={url}
            onClick={(event) => {
                if (event.metaKey || event.ctrlKey) {
                    return
                }
                event.preventDefault()
                if (isIframe() === true) {
                    window.open('localhost:3000/c/' + props.params.id)
                } else {
                    props.services.router.goTo(props.route, props.params)
                }
            }}
            title={props.title}
        >
            {props.children}
        </StyledRouteLink>
    )
}
