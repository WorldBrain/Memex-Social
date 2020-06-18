import { UILogic, UIEvent, UIMutation } from "../../classes/logic"
import { Services } from "../../../services/types";
import { AuthProvider } from "../../../types/auth";
import { AuthRequest } from "../../../services/auth/types";

export interface State {
    showEmailLogin: boolean
    email : string
    emailValid : boolean
}
export type Event = UIEvent<{
    providerLogin: { provider : AuthProvider }
    startEmailLogin: {}
    emailChange: { value : string }
    emailSubmit: {}
}>

export default class Logic extends UILogic<State, Event> {
    constructor(private options : { services : Pick<Services, 'auth'>, authRequest? : AuthRequest }) {
        super()
    }

    getInitialState() : State {
        return {
            showEmailLogin: false,
            email: '',
            emailValid: false
        }
    }

    async processProviderLogin(event : Event['providerLogin']) {
        await this.options.services.auth.loginWithProvider(event.provider, { request: this.options.authRequest })
    }

    processStartEmailLogin() : UIMutation<State> {
        return {
            showEmailLogin: { $set: true }
        }
    }

    processEmailChange(event : Event['emailChange']) : UIMutation<State> {
        return {
            email: { $set: event.value },
            emailValid: { $set: /^[^@]+@[^@]+$/.test(event.value) }
        }
    }

    processEmailSubmit(event : Event['emailSubmit']) : UIMutation<State> {
        throw new Error('NIY: Email login submit')
        return {

        }
    }
}
