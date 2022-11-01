import React from 'react'
import styled from 'styled-components'
import Overlay from '../../../../main-ui/containers/overlay'
import { ViewportBreakpoint } from '../../../../main-ui/styles/types'
import { UIElementServices } from '../../../../services/types'

const dropImage = require('../../../../assets/img/dropImage.svg')

interface State {
    isBeingDraggedOver: boolean
}

export interface Props {
    services: UIElementServices<'overlay'>
    viewportBreakpoint: ViewportBreakpoint
    onCloseRequested: () => void
}

export default class MissingPdfOverlay extends React.PureComponent<
    Props,
    State
> {
    private static dropId = 'pdf-dropzone'

    state: State = { isBeingDraggedOver: false }

    private setDragOver = (
        isBeingDraggedOver: boolean,
    ): React.DragEventHandler => (e) => {
        this.setState({ isBeingDraggedOver })
    }

    private handleDragOver: React.DragEventHandler = async (e) =>
        e.preventDefault()

    render() {
        return (
            <Overlay
                services={this.props.services}
                onCloseRequested={this.props.onCloseRequested}
            >
                <LocatorContainer
                    onDragOver={this.handleDragOver}
                    onDragEnter={this.setDragOver(true)}
                    onDragLeave={this.setDragOver(false)}
                    onDrop={this.setDragOver(false)}
                    isBeingDraggedOver={this.state.isBeingDraggedOver}
                >
                    <LocatorHeader>
                        This PDF has been annotated as a local file
                    </LocatorHeader>
                    <LocatorText>
                        To see & reply to its annotations, and add your own,
                        find it on your hard drive and drop it here.
                    </LocatorText>
                    <LocatorDropContainerInner
                        onDragEnter={this.setDragOver(true)}
                        onDragLeave={this.setDragOver(false)}
                        onDrop={this.setDragOver(false)}
                        isBeingDraggedOver={this.state.isBeingDraggedOver}
                    >
                        <DropImage src={dropImage} />
                        {this.state.isBeingDraggedOver ? (
                            <LocatorDropText>...aaaand, drop!</LocatorDropText>
                        ) : (
                            <LocatorDropText>
                                Drop PDF file here
                            </LocatorDropText>
                        )}
                    </LocatorDropContainerInner>
                </LocatorContainer>
            </Overlay>
        )
    }
}

const LocatorContainer = styled.div<{ isBeingDraggedOver?: boolean }>`
    width: 50vw;
    height: 50vh;
    min-height: 500px;
    min-width: 600px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
    padding: 50px;
    font-family: ${(props) => props.theme.fonts.primary};
`

const LocatorHeader = styled.h1`
    text-align: center;
    color: ${(props) => props.theme.colors.primary};
    font-size: 1.5rem;
    pointer-events: none;
`

const LocatorText = styled.div`
    font-size: 1.2rem;
    color: ${(props) => props.theme.colors.purple};
    margin-bottom: 50px;
    pointer-events: none;
    text-align: center;
`

const LocatorDropContainerInner = styled.div<{ isBeingDraggedOver?: boolean }>`
    border-radius: 5px;
    border: 2px dashed ${(props) => props.theme.colors.purple};
    box-sizing: border-box;
    height: fill-available;
    width: fill-available;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    max-height: 300px;
    max-width: 1200px;
    pointer-events: none;
    padding: 20px;
`

const DropImage = styled.img`
    display: flex;
    background-size: 25px;
    background-position: center center;
    border-radius: 100px;
    padding: 20px;
    margin-bottom: 40px;
    border: 3px solid ${(props) => props.theme.colors.purple};
    height: fill-available;
    min-height: 30px;
    max-height: 80px;
    width: fill-available;
    min-width: 30px;
    max-width: 80px;
`

const LocatorDropText = styled.div`
    color: ${(props) => props.theme.colors.purple};
    text-align: center;
    pointer-events: none;
    font-size: 1.5rem;
    font-weight: 400;
`
