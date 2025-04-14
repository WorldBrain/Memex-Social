import React from 'react'
import styled from 'styled-components'
import { useLogic } from '../../hooks/useLogic'
import { AddContentOverlayDependencies, AddContentOverlayLogic } from './logic'

export default function AddContentOverlay(
    props: AddContentOverlayDependencies,
) {
    const { logic, state } = useLogic(AddContentOverlayLogic, props)

    return (
        <Overlay>
            {state.loadState === 'running' ? (
                <ContentContainer>
                    <Title>Importing...</Title>
                </ContentContainer>
            ) : (
                <ContentContainer>
                    <Header>
                        <Title>Add Content</Title>
                        <CloseButton onClick={() => props.handleClose()}>
                            ×
                        </CloseButton>
                    </Header>
                    <MainContent>{/* Content will go here */}</MainContent>
                </ContentContainer>
            )}
        </Overlay>
    )
}

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(17, 19, 23, 0.95);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
`

const ContentContainer = styled.div`
    background: rgba(28, 30, 34, 0.8);
    border-radius: 12px;
    width: 90%;
    max-width: 1200px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
`

const Header = styled.div`
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
`

const Title = styled.h2`
    margin: 0;
    color: #fff;
    font-size: 20px;
    font-weight: 600;
`

const CloseButton = styled.button`
    background: none;
    border: none;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }
`

const MainContent = styled.div`
    padding: 24px;
    overflow-y: auto;
    flex: 1;
`
