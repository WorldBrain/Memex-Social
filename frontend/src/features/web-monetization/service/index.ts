import { EventEmitter } from 'events'
import TypedEventEmitter from 'typed-emitter'
import { AuthService } from '../../../services/auth/types'
import UserManagementService from '../../user-management/service'
import { UserReference } from '../../user-management/types'
import {
    WebMonetizationEvents,
    WebMonetizationService as WebMonetizationInterface,
    WebMonetizationStartEvent,
    WebMonetizationStopEvent,
} from './types'

export default abstract class WebMonetizationService
    implements WebMonetizationInterface {
    constructor(
        private options: {
            services: {
                userManagement: UserManagementService
                auth: AuthService
            }
        },
    ) {}

    events: TypedEventEmitter<WebMonetizationEvents> = new EventEmitter()

    async getUserPaymentPointer(
        userRef: UserReference,
    ): Promise<string | null> {
        const userProfile = await this.options.services.userManagement.loadUserPublicProfile(
            userRef,
        )
        if (!userProfile) {
            return null
        }
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

    initiatePayment(paymentPointer: string): void {
        const tag = document.querySelector('meta[name="monetization"]')
        console.log(tag)
        console.log(document.head)
        if (tag) {
            tag?.remove()
        }
        try {
            const meta = document.createElement('meta')
            meta.setAttribute('name', 'monetization')
            meta.setAttribute('content', paymentPointer)
            document.head.appendChild(meta)
        } catch (err) {
            console.error(err)
        }
    }
}
