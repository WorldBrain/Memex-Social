import React from 'react'
import styled from 'styled-components'
import { Services } from '../../services/types'
import { RouteMap } from '../../routes'

const StyledRouteLink = styled.a`
    text-decoration: none;
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.prime1};
    display: flex;
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

function isStaging() {
    let location = window.location.href
    let staging = location.startsWith('https://staging.')

    return staging
}

export default function RouteLink(props: Props) {
    const url = props.services.router.getUrl(props.route, props.params)

    const isStagingEnv = isStaging()

    return (
        <StyledRouteLink
            className={props.className}
            href={url}
            onClick={(event) => {
                if (event.metaKey || event.ctrlKey) {
                    return
                }
                event.preventDefault()
                if (isStagingEnv === true) {
                    window.open(
                        'https://staging.memex.social/c/' + props.params.id,
                    )
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
