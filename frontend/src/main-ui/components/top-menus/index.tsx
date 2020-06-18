import React from 'react';
import { UIElement, UIElementServices } from '../../classes';
import AuthMenu from '../auth-menu';
import Logic, { State, Event } from './logic';
import NavMenu from '../nav-menu';

interface Props {
    services : UIElementServices<'auth' | 'overlay' | 'router'>
    contrast? : boolean
    hideAuthMenu? : boolean
}

export default class TopMenus extends UIElement<Props, State, Event> {
    constructor(props : Props) {
        super(props, { logic: new Logic() })
    }

    render() {
        return (
            <div className={this.styles.container}>
                {/* <NavMenu services={this.props.services} contrast={this.props.contrast} /> */}
                {!this.props.hideAuthMenu && <AuthMenu services={this.props.services} contrast={this.props.contrast} />}
            </div>
        )
    }
}
