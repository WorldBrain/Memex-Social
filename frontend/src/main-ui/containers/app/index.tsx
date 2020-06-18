import React from 'react';
import '../../styles/global.scss'
import { UIElement, UIElementServices } from '../../classes';
import { EventHandlers } from '../../classes/events';
import TopMenus from '../../components/top-menus';
import ROUTES from '../../../routes';

interface Props {
    children: React.ReactNode
    services: UIElementServices<'auth' | 'overlay' | 'router'>
}

class App extends UIElement<Props> {
    private eventHandlers = new EventHandlers()

    componentDidMount() {
        this.eventHandlers.subscribeTo(this.props.services.auth.events, 'changed', () => this.forceUpdate())
    }

    componentWillUnmount() {
        this.eventHandlers.unsubscribeAll()
    }

    render() {
        const currentRoute = this.props.services.router.matchCurrentUrl()
        const routeInfo = currentRoute && ROUTES[currentRoute.route]
        const noContrastTopMenu = currentRoute && routeInfo.noContrastTopMenu
        const noAuthMenu = currentRoute && routeInfo.hideAuthMenu
        
        return (
            <div>
                {this.props.children}
                <div className={this.styles.auth}>
                    <TopMenus services={this.props.services} contrast={!noContrastTopMenu} hideAuthMenu={noAuthMenu} />
                </div>
            </div>
        )
    }
}

export default App
