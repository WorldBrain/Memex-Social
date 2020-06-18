import React from 'react';
import { UIElement, UIElementServices } from '../../classes';
import Logic, { State, Event } from './logic';

interface Props {
    services : UIElementServices
    children : React.ReactNode
}

export default class PageHeader extends UIElement<Props, State, Event> {
   render() {
        return (
            <div className={this.styles.container}>
                {this.props.children}
            </div>
        )
    }
}
