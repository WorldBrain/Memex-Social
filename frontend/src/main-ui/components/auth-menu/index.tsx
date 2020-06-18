import React from 'react';
import classNames from 'classnames'
const enhanceWithClickOutside = require('react-click-outside')
import { Services } from '../../../services/types'
import { UIElement, UIElementServices } from '../../classes'
import { shouldTranslate } from '../../../utils/translation'
import AuthOverlay from '../auth-overlay';
import Logic, { State, Event } from './logic';
import { User } from '../../../types/users';

interface Props {
    services : UIElementServices<'auth' | 'overlay' | 'router'>
    contrast? : boolean
}

export default class AuthMenu extends UIElement<Props, State, Event> {
    constructor(props : Props) {
        super(props, { logic: new Logic(props) })
    }

    render() {
        return (
            <div className={classNames(this.styles.container, this.props.contrast && this.styles.contrast)}>
                <div className={this.styles.topTogglers}>
                    {!this.state.user && <i
                        className={`fas fa-user ${this.styles.anonIcon}`}
                        onClick={() => this.processEvent('toggleAuthOverlay', { })}
                    />}
                    {this.state.user && this.state.user.picture && <img
                        className={this.styles.avatar} src={this.state.user.picture}
                        onClick={() => this.processEvent('toggleVisibility', {})}
                    />}
                </div>
                {this.state.user && this.state.showMenu && <WrappedInnerAuthMenu
                    styles={this.styles}
                    user={this.state.user}
                    onAccountRouteRequest={() => this.processEvent('goToAccount', {})}
                    onClickOutside={() => this.processEvent('toggleVisibility', {})}
                    onSignOut={() => this.processEvent('signOut', {})}
                />}
                {this.state.showAuthOverlay && <AuthOverlay
                    services={this.props.services}
                    authRequest={this.state.authRequest}
                    onCloseRequested={() => this.processEvent('toggleAuthOverlay', { })}
                />}
            </div>
        )
    }
}

interface InnerAuthMenuProps {
    styles: {[className: string]: string}
    user: User
    onAccountRouteRequest: () => void
    onClickOutside: () => void
    onSignOut: () => void
}
class InnerAuthMenu extends React.Component<InnerAuthMenuProps> {
    handleClickOutside() {
        this.props.onClickOutside()
    }

    render() {
        const { styles, user } = this.props

        return (<div className={styles.menu}>
            <div className={styles.menuTopRow}>
                <img
                    className={styles.menuAvatar} src={user.picture}
                />
                <div className={styles.menuUserDetails}>
                    <div className={styles.menuDisplayName}>{user.displayName}</div>
                    <div
                        className={styles.menuAccountButton}
                        onClick={() => this.props.onAccountRouteRequest()}
                    >
                        {shouldTranslate("My account")}
                    </div>
                </div>
            </div>
            <div className={styles.menuAccountButtons}>
                <div
                    className={styles.menuSignOutButton}
                    onClick={() => this.props.onSignOut()}
                >
                    {shouldTranslate("Sign out")}
                </div>
            </div>
        </div>)
    }
}

const WrappedInnerAuthMenu = enhanceWithClickOutside(InnerAuthMenu) as (props : InnerAuthMenuProps) => any
