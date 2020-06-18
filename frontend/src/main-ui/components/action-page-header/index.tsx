import React from 'react';
import { UIElement, UIElementServices } from '../../classes';
import Logic, { State, Event } from './logic';
import PageHeader from '../page-header';
import PageContent from '../page-content';

interface Props {
    services : UIElementServices
    title : string
    subtitle? : string
    imageUrl? : string
    actions? : React.ReactNode
}

export default class ActionPageHeader extends UIElement<Props, State, Event> {
    styleBreakpoints = { large: 700 }
    
    constructor(props : Props) {
        super(props, { logic: new Logic() })
    }

    render() {
        return (
            <div className={this.styles.container}>
                <PageHeader services={this.props.services}>
                    <div className={this.styles.content}>
                        {/* {!this.props.imageUrl && <div className={this.styles.image}></div>} */}
                        {this.props.imageUrl && <img className={this.styles.image} src={this.props.imageUrl} />}
                        <div className={this.styles.details}>
                            <div className={this.styles.title}>{this.props.title}</div>
                            {this.props.subtitle && <div className={this.styles.subtitle}>{this.props.subtitle}</div>}
                        </div>
                        <div className={this.styles.actions}>
                            {this.props.actions}
                        </div>
                    </div>
                </PageHeader>
            </div>
        )
    }
}
