import React from 'react';
import { UIElement, UIElementServices } from '../../classes';
import Logic, { State, Event } from './logic';

interface Props {
    services : UIElementServices
}

export default class NavMenu extends UIElement<Props, State, Event> {
    constructor(props : Props) {
        super(props, { logic: new Logic() })
    }

    render() {
        return (
            <div className={this.styles.container}>
                <i className={`fas fa-bars ${this.styles.menuIcon}`} />
            </div>
        )
    }
}
