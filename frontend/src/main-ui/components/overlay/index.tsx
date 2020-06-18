import React from 'react';
import { UIElement, UIElementServices } from '../../classes';
import Logic from './logic';

const defaultIdGenerator = (() => {
    let counter = 0
    return () => ++counter
})()

interface OverlayProps {
    idGenerator? : () => number
    services : UIElementServices<'overlay'>
    onCloseRequested : () => void
    children : any
}
export default class Overlay extends UIElement<OverlayProps> {
    private closeHandler : () => void
    private id : number

    constructor(props : OverlayProps) {
        super(props, { logic: new Logic() })

        this.id = (props.idGenerator || defaultIdGenerator)()

        this.closeHandler = () => {
            this.props.onCloseRequested()
        }
        this.props.services.overlay.events.emit('content.updated', { id: this.id, content: props.children })
    }

    componentWillReceiveProps(props : OverlayProps) {
        this.props.services.overlay.events.emit('content.updated', { id: this.id,content: props.children })
    }

    componentWillMount() {
        this.props.services.overlay.events.on('closeRequest', this.closeHandler)
    }

    componentWillUnmount() {
        this.props.services.overlay.events.off('closeRequest', this.closeHandler)
        this.props.services.overlay.events.emit('content.updated', { id: this.id, content: null })
    }

    render() {
        return <div></div>
    }
}

interface OverlayContainerProps {
    services : UIElementServices<'overlay'>
}
export class OverlayContainer extends UIElement<OverlayContainerProps, { content: any }> {
    styleModule = 'Overlay'

    private rootElement? : HTMLElement | null
    private overlaysById : {[id : string] : any} = {}
    private overlayStack : string[] = []

    constructor(props : OverlayProps) {
        super(props)

        this.state = { content: null }
        this.props.services.overlay.events.on('content.updated', ({ id, content }) => {
            if (content) {
                const isNew = !this.overlaysById[id]
                this.overlaysById[id] = content
                if (isNew) {
                    this.overlayStack.push(id)
                }
            } else {
                this.overlayStack.splice(this.overlayStack.findIndex(elem => elem === id), 1)
                delete this.overlaysById[id]
            }
            this.setState({ content: this.overlayStack.length ? this.overlaysById[this.overlayStack.slice(-1)[0]] : null })
        })
    }

    componentDidMount() {
        
    }

    handleContainerClick(event : any) {
        const isDirectContainerClick = event.target === this.rootElement
        if (isDirectContainerClick) {
            this.props.services.overlay.events.emit('closeRequest')
        }
    }

    render() {
        if (!this.state.content) {
            return null
        }

        return (<div className={this.styles.container} ref={element => { this.rootElement = element }} onClick={event => this.handleContainerClick(event)}>
            <div className={this.styles.inner}>
                {this.state.content}
            </div>
        </div>)
    }
}
