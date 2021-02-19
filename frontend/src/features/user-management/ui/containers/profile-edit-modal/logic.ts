import {
    UILogic,
    UIEventHandler,
    loadInitial,
    executeUITask,
} from '../../../../../main-ui/classes/logic'
import { UITaskState } from '../../../../../main-ui/types'
import {
    UserPublicProfile,
    User,
    UserReference,
    ProfileWebLink,
} from '../../../types'
import {
    ProfileEditModalDependencies,
    ProfileEditModalEvent,
    ProfileEditModalState,
} from './types'
import { getProfileLinks } from '../../utils'

type EventHandler<
    EventName extends keyof ProfileEditModalEvent
> = UIEventHandler<ProfileEditModalState, ProfileEditModalEvent, EventName>

const EMPTY_USER_PROFILE: UserPublicProfile = {
    websiteURL: '',
    mediumURL: '',
    twitterURL: '',
    substackURL: '',
    bio: '',
    avatarURL: '',
    paymentPointer: '',
}
export default class ProfileEditModalLogic extends UILogic<
    ProfileEditModalState,
    ProfileEditModalEvent
> {
    constructor(private dependencies: ProfileEditModalDependencies) {
        super()
    }

    userRef: UserReference | null = null

    getInitialState(): ProfileEditModalState {
        return {
            loadState: 'pristine',
            savingTaskState: 'pristine',
            user: {
                displayName: '',
            },
            userPublicProfile: EMPTY_USER_PROFILE,
            profileLinks: [],
            inputErrorArray: [],
        }
    }

    init: EventHandler<'init'> = async () => {
        await loadInitial<ProfileEditModalState>(this, async () => {
            this.userRef = this.dependencies.services.auth.getCurrentUserReference()
            if (!this.userRef) {
                return
            }
            const [user, userProfile] = await Promise.all([
                this.dependencies.services.userManagement.loadUserData(
                    this.userRef,
                ),
                this.dependencies.services.userManagement.loadUserPublicProfile(
                    this.userRef,
                ),
            ])
            this.emitMutation({ user: { $set: user ?? { displayName: '' } } })
            this.emitMutation({
                userPublicProfile: { $set: userProfile ?? EMPTY_USER_PROFILE },
            })

            const profileLinks: ProfileWebLink[] = getProfileLinks(
                userProfile ?? EMPTY_USER_PROFILE,
                {
                    withEmptyFields: true,
                },
            )
            this.emitMutation({
                profileLinks: { $set: profileLinks },
            })
        })
    }

    saveProfile: EventHandler<'saveProfile'> = async ({ event }) => {
        const userRef = this.userRef
        if (!userRef) {
            throw new Error(`Cannot save profile without being logged in`)
        }
        await executeUITask<ProfileEditModalState>(
            this,
            'savingTaskState',
            async () => {
                await Promise.all([
                    this.dependencies.services.userManagement.updateUserPublicProfile(
                        event.profileData,
                    ),
                    this.dependencies.services.userManagement.updateUserDisplayName(
                        userRef,
                        event.displayName,
                    ),
                ])
                this.dependencies.onCloseRequested()
            },
        )
    }

    setDisplayName: EventHandler<'setDisplayName'> = ({ event }) => {
        this.emitMutation({
            user: {
                displayName: { $set: event.value },
            },
        })
    }

    setProfileValue: EventHandler<'setProfileValue'> = ({ event }) => {
        this.emitMutation({
            userPublicProfile: {
                [event.key]: { $set: event.value },
            },
        })
    }

    setErrorArray: EventHandler<'setErrorArray'> = ({ event }) => {
        this.emitMutation({
            inputErrorArray: { $set: event.newArray },
        })
    }
}
