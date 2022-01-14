import React from 'react'
import styled, { css } from 'styled-components'
import Overlay from '../../../../main-ui/containers/overlay'
import { ViewportBreakpoint } from '../../../../main-ui/styles/types'
import { UIElementServices } from '../../../../services/types'
import { Margin } from 'styled-components-spacing'
import ExternalLink from '../../../../common-ui/components/external-link'

const braveLogo = require('../../../../assets/img/logo-brave.svg')
const firefoxLogo = require('../../../../assets/img/logo-firefox.svg')
const chromeLogo = require('../../../../assets/img/logo-chrome.svg')

const Content = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    max-width: 800px;
    min-width: 70%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 40px;
    width: 100%;

    > * {
        font-family: ${(props) => props.theme.fonts.primary};
    }

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            max-width: 90%;
            padding: 20px;
        `}
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            max-width: 90%;
            padding: 20px;
        `}
`

const Title = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    font-weight: bold;
    font-size: 24px;
    color: ${(props) => props.theme.colors.primary};
    text-align: center;

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            font-size: 18px;
        `}
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            font-size: 18px;
        `}
`

const BrowserIconsBox = styled.div`
    display: flex;
    padding: 15px 0px;
    justify-content: space-between;
    width: 140px;
`

const BrowserIcon = styled.img`
    height: 40px;
`

const ButtonsBox = styled.div`
    display: flex;
    justify-content: center;
    width: 250px;
    padding: 15px 0px;
    flex-direction: column;
    align-items: center;
`
const primaryButtonCss = css`
    display: flex;
    justify-content: center;
    padding: 5px 10px;
    font-size: 14px;
    background-color: ${(props) => props.theme.colors.secondary};
    border-radius: 3px;
    cursor: pointer;
    font-weight: 600;
    color: ${(props) => props.theme.colors.primary};
    text-decoration: none;
`

const PrimaryButtonLink = styled(ExternalLink)`
    ${primaryButtonCss}
`

const secondaryButtonCss = css`
    display: flex;
    justify-content: center;
    padding: 5px 10px;
    font-size: 14px;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 600;
    color: ${(props) => props.theme.colors.primary};
    text-decoration: none;
`

const SecondaryButton = styled.div`
    ${secondaryButtonCss}
`

export default function InstallExtOverlay(props: {
    services: UIElementServices<'overlay'>
    viewportBreakpoint: ViewportBreakpoint
    onCloseRequested: () => void
}) {
    return (
        <Overlay
            services={props.services}
            onCloseRequested={props.onCloseRequested}
        >
            <Content viewportBreakpoint={props.viewportBreakpoint}>
                <Margin top={'small'}>
                    <Title viewportBreakpoint={props.viewportBreakpoint}>
                        Install the Memex Browser extension to <br />
                        add pages and annotations
                    </Title>
                </Margin>
                <Margin top={'small'}>
                    <BrowserIconsBox>
                        <BrowserIcon src={braveLogo} />
                        <BrowserIcon src={firefoxLogo} />
                        <BrowserIcon src={chromeLogo} />
                    </BrowserIconsBox>
                </Margin>
                <Margin top={'medium'}>
                    <ButtonsBox>
                        <PrimaryButtonLink href="https://getmemex.com">
                            Download
                        </PrimaryButtonLink>
                        <SecondaryButton onClick={props.onCloseRequested}>
                            Cancel
                        </SecondaryButton>
                    </ButtonsBox>
                </Margin>
            </Content>
        </Overlay>
    )
}
