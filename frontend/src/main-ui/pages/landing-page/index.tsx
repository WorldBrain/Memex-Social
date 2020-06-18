import React from 'react';
import { UIElement, UIElementServices } from '../../classes';
import Logic from './logic'
import AuthButtonBox from '../../components/auth-button-box';

interface Props {
    services : UIElementServices<'auth'>
}

export default class LandingPage extends UIElement<Props> {
    styleBreakpoints = {
        large: 860
    }

    constructor(props : Props) {
        super(props, { logic: new Logic() })
    }

    render() {
        return (
            <div className={this.styles.container}>
                <div className={this.styles.leftColumn}>
                    <div className={this.styles.introBox}>
                        <div className={this.styles.introTitle}>{this.getText('landing-intro-header')}</div>
                        <div className={this.styles.introBody}>{this.getText('landing-intro-body')}</div>
                        
                        {/* <IntroItem faIcon='hands-helping' label={this.getText('landing-intro-1')} />
                        <IntroItem faIcon='bell' label={this.getText('landing-intro-2')} />
                        <IntroItem faIcon='' label={this.getText('landing-intro-3')} /> */}
                    </div>
                </div>
                <div className={this.styles.rightColumn}>
                    <div className={this.styles.authBoxContainer}>
                        <AuthButtonBox services={this.props.services} />
                    </div>
                </div>
            </div>
        )
    }
}

interface IntroItemProps {
    services : UIElementServices
    label : string
    faIcon : string
}
export class IntroItem extends UIElement<IntroItemProps> {
    render() {
        return (
            <div className={this.styles.introItem}>
                <i className={`fas fa-${this.props.faIcon}`}></i>
                {this.props.label}
            </div>
        )
    }
}

