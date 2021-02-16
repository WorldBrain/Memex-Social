import { EventEmitter } from 'events'
import TypedEventEmitter from 'typed-emitter'
import { AuthService } from '../../../services/auth/types'
import UserManagementService from '../../user-management/service'
import { UserReference } from '../../user-management/types'
import { WebMonetizationEvents, WebMonetizationService, WebMonetizationStartEvent, WebMonetizationStopEvent } from './types'

export default abstract class WebMonetizationBase implements WebMonetizationService {
    constructor(
        private options: {
            services: {
                userManagement: UserManagementService
                auth: AuthService
            }
        },
    ) {}

    events: TypedEventEmitter<WebMonetizationEvents> = new EventEmitter()

    async getUserPaymentPointer(userRef: UserReference) {
        const userProfile = await this.options.services.userManagement.loadUserPublicProfile(
            userRef,
        )
        return userProfile.paymentPointer
    }

    async getCurrentUserPaymentPointer(): Promise<string | null> {
        const userRef = this.options.services.auth.getCurrentUserReference()
        if (!userRef) {
            console.error('Please login')
            return null
        } else {
            const userProfile = await this.options.services.userManagement.loadUserPublicProfile(
                userRef,
            )
            return userProfile.paymentPointer
        }
    }

    initiatePayment(
        paymentPointer: string
    ) {
        console.log('web mon service initiatePayment method')
        try {
            this._attachEventHandlers()
            const meta = document.createElement('meta')
            meta.setAttribute('name', 'monetization')
            meta.setAttribute('content', paymentPointer)
            document.head.appendChild(meta)
        } catch (err) {
            console.error(err)
        }
    }

    private _attachEventHandlers(): void {

        const monetizationStartHandler = (event: WebMonetizationStartEvent): void => {
            this.events.emit('webMonetizationStart', event)
        }

        const monetizationStopHandler = (event: WebMonetizationStopEvent): void => {
            this.events.emit('webMonetizationStop', event)
        }

        (document as any).monetization.addEventListener('monetizationstart', monetizationStartHandler)
        (document as any).monetization.addEventListener('monetizationstop', monetizationStopHandler)
    
    }

}
