import React from 'react'
import styled, { css } from 'styled-components'
import Overlay from '../../../../main-ui/containers/overlay'
import { ViewportBreakpoint } from '../../../../main-ui/styles/types'
import { UIElementServices } from '../../../../services/types'
import { Margin } from 'styled-components-spacing'
import { PrimaryAction } from '../../../../common-ui/components/PrimaryAction'

const noteIcon = require('../../../../assets/img/comment.svg')

const Content = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    max-width: 900px;
    min-width: 500px;
    display: inline-block;
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
            padding: 40px 20px;
        `}
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            max-width: 90%;
            padding: 20px;
            min-width: unset;
        `}
`

const Title = styled.div<{
    viewportBreakpoint: ViewportBreakpoint
}>`
    font-weight: 800;
    font-size: 22px;
    color: ${(props) => props.theme.colors.greyScale2};
    text-align: center;
    margin-bottom: 5px;

    ${(props) =>
        props.viewportBreakpoint === 'small' &&
        css`
            font-size: 20px;
        `}
    ${(props) =>
        props.viewportBreakpoint === 'mobile' &&
        css`
            font-size: 18px;
        `}
`

const SubTitle = styled.div`
    font-size: 16px;
    color: ${(props) => props.theme.colors.greyScale5};
    margin-bottom: 10px;
    margin-top: 10px;
    pointer-events: none;
    text-align: center;
    line-height: 26px;

    & * {
        color: ${(props) => props.theme.colors.greyScale5} !important;
        font-size: 1rem !important;
    }
`

const NoteIconContainer = styled.div`
    height: 16px;
    width: 16px;
    display: inline-block;
    mask-image: url(${noteIcon});
    background-color: ${(props) => props.theme.colors.greyScale5};
    mask-position: center center;
    mask-repeat: no-repeat;
    margin: 0 5px;
    height: 19px;
    width: 16px;
    mask-size: contain;
    padding: 2px;
    vertical-align: text-bottom;
`

const ButtonsBox = styled.div`
    display: flex;
    justify-content: center;
    width: 250px;
    padding: 15px 0px;
    align-items: center;
    width: 100%;
    justify-content: center;
    margin-bottom: -30px;
    margin-top: 30px;
    flex-direction: column;

    & > div {
        margin-left: unset;
    }
`

const secondaryButtonCss = css`
    display: flex;
    justify-content: center;
    padding: 5px 10px;
    font-size: 14px;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 600;
    color: ${(props) => props.theme.colors.prime1};
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
    renderFollowBtn: () => JSX.Element
    currentUrl: string | undefined
    isSpaceFollowed: boolean
}) {
    const handleOpenPage = () => window.open(props.currentUrl)
    return (
        <Overlay
            services={props.services}
            onCloseRequested={props.onCloseRequested}
        >
            <Content viewportBreakpoint={props.viewportBreakpoint}>
                <Margin>
                    <Title viewportBreakpoint={props.viewportBreakpoint}>
                        Follow this Space to view its annotations on the page
                    </Title>
                    <SubTitle>
                        Then, visit the page & open the sidebar.
                        <br />
                        Click on the <NoteIconContainer />
                        icon in each result block to only read the annotations.
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
                        <PrimaryAction
                            label={'Continue to page'}
                            onClick={handleOpenPage}
                        />
                    ) : (
                        <>
                            {props.renderFollowBtn()}
                            <SecondaryButton onClick={handleOpenPage}>
                                Continue to page without following the Space
                            </SecondaryButton>
                        </>
                    )}
                </ButtonsBox>
                {/* )} */}
            </Content>
        </Overlay>
    )
}
