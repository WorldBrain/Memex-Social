import React from 'react'
import styled from 'styled-components'
import { UIElement } from '../../classes'
import { UIElementServices } from '../../../services/types'

const StyledOverlayContainer = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: ${(props) => props.theme.colors.overlay.background};
    backdrop-filter: blur(3px);
    z-index: ${(props) => props.theme.zIndices.overlay};
`

const OverlayContent = styled.div`
    background-color: ${(props) => props.theme.colors.overlay.dialog};
    max-width: 90%;
    top: 50%;
    padding: 20px;
    border-radius: 5px;
    overflow-y: scroll;
    max-height: 90%;
    height: max-content;
`

interface OverlayContainerProps {
    services: UIElementServices<'overlay'>
}
export class OverlayContainer extends UIElement<
    OverlayContainerProps,
    { content: any }
> {
    styleModule = 'Overlay'

    private rootElement?: HTMLElement | null
    private overlaysById: { [id: number]: any } = {}
    private overlayStack: number[] = []

    constructor(props: OverlayContainerProps) {
        super(props)

        this.state = { content: null }
        this.props.services.overlay.events.on(
            'contentUpdated',
            this.handleOverlayContentUpdate,
        )
    }

    componentDidMount() {}

    handleOverlayContentUpdate = (event: {
        id: number
        content: React.ReactNode
    }) => {
        if (event.content) {
            const isNew = !this.overlaysById[event.id]
            this.overlaysById[event.id] = event.content
            if (isNew) {
                this.overlayStack.push(event.id)
            }
        } else {
            this.overlayStack.splice(
                this.overlayStack.findIndex((elem) => elem === event.id),
                1,
            )
            delete this.overlaysById[event.id]
        }
        this.setState({
            content: this.overlayStack.length
                ? this.overlaysById[this.overlayStack.slice(-1)[0]]
                : null,
        })
    }

    handleContainerClick: React.MouseEventHandler = (event) => {
        const isDirectContainerClick = event.target === this.rootElement
        if (isDirectContainerClick) {
            this.props.services.overlay.events.emit('closeRequest', {
                id: this.overlayStack[this.overlayStack.length - 1],
            })
        }
    }

    render() {
        if (!this.state.content) {
            return null
        }

        return (
            <StyledOverlayContainer
                ref={(element) => {
                    this.rootElement = element
                }}
                onClick={this.handleContainerClick}
            >
                <OverlayContent>{this.state.content}</OverlayContent>
            </StyledOverlayContainer>
        )
    }
}
