import { UILogic, UIEvent, loadInitial } from "../../classes/logic"
import { Storage } from "../../../storage/types";
import { Services } from "../../../services/types";
import { UITaskState } from "../../types";
import { Project } from "../../../types";
import { UserRight } from "../../../types/users";

export interface State {
    loadState : UITaskState
    projectsFollowing? : Project[]
    userRights?: UserRight
}
export type Event = UIEvent<{
    requestAccountSettings: {},
    requestCreateProject: {}
}>

export default class Logic extends UILogic<State, Event> {
    constructor(private options : { services : Pick<Services, 'auth' | 'router'>, storage : Storage }) {
        super()
    }

    getInitialState() : State {
        return {
            loadState: 'pristine',
        }
    }

    async processInit() {
        await loadInitial(this, async () => {
            const user = this.options.services.auth.getCurrentUser()
            if (!user) {
                throw new Error(`Tried to access user home page without logged in user`)
            }
            const userRights = await this.options.storage.modules.users.getUserRights(user)
            
            // return new Promise(() => {})
            const subscriptions = await this.options.storage.modules.subscriptions.getUserSubscriptions(user, { withProjects: true })
            this.emitMutation({
                projectsFollowing: {
                    $set: subscriptions.map(subscription => subscription.project as Project)
                },
                userRights: { $set: userRights }
            })
        })
    }

    processRequestAccountSettings() {
        this.options.services.router.goTo('accountSettings')
    }

    processRequestCreateProject() {
        this.options.services.router.goTo('newProject')
    }
}
