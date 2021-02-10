import { UITaskState } from '../../../main-ui/types'
import { AuthService } from '../../../services/auth/types'
import { Services } from '../../../services/types'
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

    async getCurrentUserPaymentPointer() {
        const userRef = this.options.services.auth.getCurrentUserReference()
        if (!userRef) {
            console.error('Please :)')
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
        const meta = document.createElement('meta')
        meta.setAttribute('name', 'monetization')
        meta.setAttribute('content', paymentPointer)
        this._setTaskStateHandler(taskStateHandler, meta)
        document.head.appendChild(meta)
    }

    private _setTaskStateHandler(
        taskStateHandler: (taskState: UITaskState) => void,
        metaTag: HTMLMetaElement,
    ) {
        const docProxy: Document & {
            monetization?: any
        } = {
            ...document,
        }
        if (!docProxy.monetization) {
            console.error('Monetization is not enabled')
            return
        }
        function stopHandler(taskState: UITaskState, metaTag: HTMLMetaElement) {
            taskStateHandler(taskState)
            document.head.removeChild(metaTag)
        }
        docProxy.monetization.addEventListener(
            'monetizationpending',
            taskStateHandler.bind(null, 'running'),
        )
        docProxy.monetization.addEventListener(
            'monetizationstop',
            stopHandler.bind(null, 'success', metaTag),
        )
    }
}
