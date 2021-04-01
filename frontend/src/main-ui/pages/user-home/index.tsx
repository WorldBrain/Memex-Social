import React from 'react'
import { Storage } from '../../../storage/types'
import { UIElement } from '../../classes'
import { UIElementServices } from '../../../services/types'
import Logic, { State, Event } from './logic'

interface Props {
    storage: Storage
    services: UIElementServices<'auth' | 'router'>
}

export default class UserHome extends UIElement<Props, State, Event> {
    constructor(props: Props) {
        super(props, { logic: new Logic(props) })
    }

    render() {
        const user = this.props.services.auth.getCurrentUser()
        if (!user) {
            throw new Error('User home activated without active user')
        }
        if (!user.displayName) {
            throw new Error('User has no display name')
        }

        return <div></div>
    }
}
