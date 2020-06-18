import React from 'react';
import { UIElement, UIElementServices } from '../../classes';
import Logic, { State, Event } from './logic';

interface Props {
    services : UIElementServices
    title : React.ReactNode
}

export default class MainListElement extends UIElement<Props, State, Event> {
    constructor(props : Props) {
        super(props, { logic: new Logic() })
    }

    render() {
        return (
            <div className={this.styles.container}>
                <div className={this.styles.title}>{this.props.title}</div>
                {this.props.children}
            </div>
        )
    }
}
