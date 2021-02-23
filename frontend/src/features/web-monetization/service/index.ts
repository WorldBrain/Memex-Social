import { EventEmitter } from 'events'
import TypedEventEmitter from 'typed-emitter'
import { AuthService } from '../../../services/auth/types'
import UserManagementService from '../../user-management/service'
import { UserReference } from '../../user-management/types'
import * as browserTypes from '../wm-types'
import {
    WebMonetizationEvents,
    WebMonetizationService as WebMonetizationInterface,
} from './types'

export default abstract class WebMonetizationService
    implements WebMonetizationInterface {
    private _monetization: browserTypes.WebMonetization | null =
        (typeof document !== 'undefined' && (document as any).monetization) ||
        null
    readonly isAvailable = !!this._monetization
    // readonly isAvailable = true

    constructor(
        private options: {
            services: {
                userManagement: UserManagementService
                auth: AuthService
            }
        },
    ) {
        if (this._monetization) {
            this._monetization.addEventListener(
                'monetizationstart',
                (event) => {
                    this.events.emit('monetizationstart', event.detail)
                },
            )
            this._monetization.addEventListener('monetizationstop', (event) => {
                this.events.emit('monetizationstop', event.detail)
            })
        }
    }

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
            console.warn('No payment pointer found: user not logged in')
            return null
        }

        const userProfile = await this.options.services.userManagement.loadUserPublicProfile(
            userRef,
        )
        if (!userProfile) {
            console.warn(
                'No payment pointer found: user does not have a profile',
            )
            return null
        }
        return userProfile?.paymentPointer ?? null
    }

    initiatePayment(paymentPointer: string): void {
        const tag = document.querySelector('meta[name="monetization"]')
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
