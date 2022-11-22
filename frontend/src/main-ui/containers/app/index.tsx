import React from 'react'
import { UIElement } from '../../classes'
import { UIElementServices } from '../../../services/types'
import styled from 'styled-components'
import { EventHandlers } from '../../classes/events'
import AuthDialog from '../../../features/user-management/ui/containers/auth-dialog'
import { StorageModules } from '../../../storage/types'
// import ROUTES from "../../../routes";

interface Props {
    children: React.ReactNode
    services: UIElementServices<'auth' | 'overlay' | 'router'>
    storage: Pick<StorageModules, 'users'>
}

const MainArea = styled.div`
    height: 100%;
    width: 100%;
    background: ${(props) => props.theme.colors.backgroundColor};
`

class App extends UIElement<Props> {
    private eventHandlers = new EventHandlers()

    componentDidMount() {
        this.eventHandlers.subscribeTo(
            this.props.services.auth.events,
            'changed',
            () => this.forceUpdate(),
        )
    }

    componentWillUnmount() {
        this.eventHandlers.unsubscribeAll()
    }

    render() {
        // const currentRoute = this.props.services.router.matchCurrentUrl();
        // const routeInfo = currentRoute && ROUTES[currentRoute.route];

        return (
            <MainArea id="mainArea">
                {this.props.children}
                <AuthDialog
                    services={this.props.services}
                    storage={this.props.storage}
                />
            </MainArea>
        )
    }
}

export default App
