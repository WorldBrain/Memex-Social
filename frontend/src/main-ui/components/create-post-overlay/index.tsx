import React from 'react';
import { UIElement, UIElementServices } from '../../classes';
import { Project } from '../../../types';
import Overlay from '../overlay';
import Logic, { State, Event } from './logic';

interface Props {
    project : Required<Project>
    services : UIElementServices<'overlay'>
    onCloseRequested : () => void
}
export default class CreatePostOverlay extends UIElement<Props, State, Event> {
    constructor(props : Props) {
        super(props, { logic: new Logic(props) })
    }

    render() {
        return (<Overlay services={this.props.services} onCloseRequested={this.props.onCloseRequested}>
            <div className={this.styles.title}>Write new post</div>
        </Overlay>)
    }
}
