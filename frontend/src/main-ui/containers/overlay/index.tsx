import React from 'react'
import { UIElement } from '../../classes'
import { UIElementServices } from '../../../services/types'
import Logic from './logic'

export { OverlayContainer } from './container'

const defaultIdGenerator = (() => {
    let counter = 0
    return () => ++counter
})()

export interface OverlayProps {
    idGenerator?: () => number
    services: UIElementServices<'overlay'>
    onCloseRequested: () => void
    children: React.ReactNode
}
export default class Overlay extends UIElement<OverlayProps> {
    private closeHandler: () => void
    private id: number

    constructor(props: OverlayProps) {
        super(props, { logic: new Logic() })

        this.id = (props.idGenerator || defaultIdGenerator)()

        this.closeHandler = () => {
            this.props.onCloseRequested()
        }
        this.props.services.overlay.events.emit('contentUpdated', {
            id: this.id,
            content: props.children,
        })
    }

    componentWillReceiveProps(props: OverlayProps) {
        this.props.services.overlay.events.emit('contentUpdated', {
            id: this.id,
            content: props.children,
        })
    }

    componentWillMount() {
        this.props.services.overlay.events.on('closeRequest', ({ id }) => {
            if (id === this.id) {
                this.closeHandler()
            }
        })
    }

    componentWillUnmount() {
        this.props.services.overlay.events.off(
            'closeRequest',
            this.closeHandler,
        )
        this.props.services.overlay.events.emit('contentUpdated', {
            id: this.id,
            content: null,
        })
    }

    render() {
        return <div></div>
    }
}
