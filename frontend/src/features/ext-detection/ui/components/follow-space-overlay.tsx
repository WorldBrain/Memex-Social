import React from 'react'
import styled, { css } from 'styled-components'
import Overlay from '../../../../main-ui/containers/overlay'
import { ViewportBreakpoint } from '../../../../main-ui/styles/types'
import { UIElementServices } from '../../../../services/types'
import { Margin } from 'styled-components-spacing'
import ExternalLink from '../../../../common-ui/components/external-link'
import { PrimaryAction } from '../../../../common-ui/components/PrimaryAction'

const noteIcon = require('../../../../assets/img/comment.svg')

const Content = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    max-width: 900px;
    min-width: 500px;
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
    font-size: 22px;
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

const SubTitle = styled.div`
    font-size: 1rem;
    color: ${(props) => props.theme.colors.purple};
    margin-bottom: 10px;
    margin-top: 10px;
    pointer-events: none;
    text-align: center;

    & * {
        color: ${(props) => props.theme.colors.purple} !important;
        font-size: 1rem !important;
    }
`

const NoteIconContainer = styled.img`
    height: 16px;
    width: 16px;
    display: flex;
    mask-image: url(${noteIcon});
    background-color: ${(props) => props.theme.colors.primary};
    mask-position: center center;
    mask-repeat: no-repeat;
    margin: 0 5px;
    height: 19px;
    width: 16px;
    mask-size: contain;
`

const SubSubTitle = styled.div`
    font-size: 0.8rem;
    color: ${(props) => props.theme.colors.darkgrey};
    text-align: center;
    display: inline-flex;
    justiy-content: center;
    align-items: center;
    flex-direction: column;
`

const SubSubSubTitle = styled.div`
    font-size: 0.8rem;
    color: ${(props) => props.theme.colors.darkgrey};
    text-align: center;
    display: inline-flex;
    justiy-content: center;
    align-items: center;
`

const BrowserIconsBox = styled.div`
    display: grid;
    padding: 15px 0px;
    justify-content: space-between;
    grid-auto-flow: column;
    grid-gap: 30px;
`

const BrowserIcon = styled.img`
    height: 40px;
    cursor: pointer;
`

const ButtonsBox = styled.div`
    display: flex;
    justify-content: center;
    width: 250px;
    padding: 15px 0px;
    align-items: center;
    width: 120%;
    justify-content: center;
    margin-bottom: -30px;
    margin-top: 30px;
    flex-direction: column;

    & > div {
        margin-left: unset;
    }
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
    margin-top: 10px;
`

const SecondaryButton = styled.div`
    ${secondaryButtonCss}
`

export default function FollowSpaceOverlay(props: {
    services: UIElementServices<'overlay'>
    viewportBreakpoint: ViewportBreakpoint
    onCloseRequested: () => void
    renderFollowBtn: () => void
    currentUrl: string | URL | undefined
    isSpaceFollowed: boolean
}) {
    return (
        <Overlay
            services={props.services}
            onCloseRequested={props.onCloseRequested}
        >
            <Content viewportBreakpoint={props.viewportBreakpoint}>
                <Margin>
                    <Title viewportBreakpoint={props.viewportBreakpoint}>
                        Follow this Space to see its annotations
                    </Title>
                    <SubTitle>
                        Follow the Space, visit the page & open the sidebar to
                        see the annotations in context of the page
                        <SubSubSubTitle>
                            Click on the <NoteIconContainer />
                            icon in each result block to only read the
                            annotations.
                        </SubSubSubTitle>
                    </SubTitle>
                </Margin>
                {/* {props.installModalState && (*/}
                {/* <Margin top={'medium'}>
                    <SubSubTitle>
                        You just want to read the highlights?
                        <SubSubSubTitle>
                            Click on the <NoteIconContainer />
                            icon in each result to see them.
                        </SubSubSubTitle>
                    </SubSubTitle>
                </Margin> */}
                {/* )} */}
                {/* {props.installModalState && (*/}
                <ButtonsBox>
                    {/* <PrimaryAction
                        label={'Follow Space'}
                        onClick={() => {
                            props.onFollowRequested()
                        }}
                    /> */}
                    {props.isSpaceFollowed ? (
                        <>
                            <PrimaryAction
                                label={'Continue to page'}
                                onClick={() => window.open(props.currentUrl)}
                            />
                        </>
                    ) : (
                        <>
                            {props.renderFollowBtn()}
                            <SecondaryButton
                                onClick={() => window.open(props.currentUrl)}
                            >
                                Continue to page without following
                            </SecondaryButton>
                        </>
                    )}
                </ButtonsBox>
                {/* )} */}
            </Content>
        </Overlay>
    )
}
