import { UITaskState } from '../../../main-ui/types'
import { AuthService } from '../../../services/auth/types'
import UserManagementService from '../../user-management/service'
import { UserReference } from '../../user-management/types'

export default class WebMonetizationService {
    constructor(
        private options: {
            services: {
                userManagement: UserManagementService
                auth: AuthService
            }
        },
    ) {}

    async getUserPaymentPointer(userRef: UserReference) {
        const userProfile = await this.options.services.userManagement.loadUserPublicProfile(
            userRef,
        )
        return userProfile.paymentPointer
    }

    async getCurrentUserPaymentPointer(): Promise<string | boolean> {
        const userRef = this.options.services.auth.getCurrentUserReference()
        if (!userRef) {
            console.error('Please :)')
            return false
        } else {
            const userProfile = await this.options.services.userManagement.loadUserPublicProfile(
                userRef,
            )
            return userProfile.paymentPointer
        }
    }

    initiatePayment(
        paymentPointer: string,
        taskStateHandler: (taskState: UITaskState) => void,
    ) {
        console.log('web mon service initiatePayment method')
        try {
            const meta = document.createElement('meta')
            meta.setAttribute('name', 'monetization')
            meta.setAttribute('content', paymentPointer)
            this._setTaskStateHandler(taskStateHandler, meta)
            document.head.appendChild(meta)
        } catch (err) {
            console.error(err)
        }
        
        console.log((document as any).monetization.state)
    }

    private _setTaskStateHandler(
        taskStateHandler: any,
        metaTag: HTMLMetaElement,
    ) {
        if (!(document as any).monetization) {
            console.error('Monetization is not enabled')
            return
        }
        function stopHandler(taskState: UITaskState, metaTag: HTMLMetaElement) {
            taskStateHandler(taskState)
            (document as any).head.removeChild(metaTag)
        }
        (document as any).monetization.addEventListener(
            'monetizationpending',
            taskStateHandler.bind(null, 'running'),
        )
        (document as any).monetization.addEventListener(
            'monetizationstop',
            stopHandler.bind(null, 'success', metaTag),
        )
    }
}
