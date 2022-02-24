import {
    UILogic,
    UIEventHandler,
    loadInitial,
    executeUITask,
} from '../../../../../main-ui/classes/logic'
import {
    UserPublicProfile,
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
            email: '',
            showEmailEditButton: false,
            emailEditSuccess: 'pristine',
            passwordResetSent: false,
            passwordResetSuccessful: false,
        }
    }

    init: EventHandler<'init'> = async () => {
        await loadInitial<ProfileEditModalState>(this, async () => {
            this.userRef = this.dependencies.services.auth.getCurrentUserReference()
            const userEmail = await this.dependencies.services.auth.getCurrentUserEmail()

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
            const profileLinks: ProfileWebLink[] = getProfileLinks(
                userProfile ?? EMPTY_USER_PROFILE,
                {
                    withEmptyFields: true,
                },
            )

            console.log()
            this.emitMutation({
                user: { $set: user ?? { displayName: '' } },
                userPublicProfile: { $set: userProfile ?? EMPTY_USER_PROFILE },
                profileLinks: { $set: profileLinks },
                email: { $set: userEmail },
            })
        })
    }

    saveProfile: EventHandler<'saveProfile'> = async ({ event }) => {
        const { userManagement, auth } = this.dependencies.services
        const userRef = this.userRef
        if (!userRef) {
            throw new Error(`Cannot save profile without being logged in`)
        }
        await executeUITask<ProfileEditModalState>(
            this,
            'savingTaskState',
            async () => {
                await Promise.all([
                    userManagement.updateUserPublicProfile(event.profileData),
                    userManagement.updateUserDisplayName(
                        userRef,
                        event.displayName,
                    ),
                ])
                await auth.refreshCurrentUser()
                auth.events.emit('changed', { displayName: event.displayName })
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

    setEmail: EventHandler<'setEmail'> = ({ event, previousState }) => {
        this.emitMutation({
            email: { $set: event.value },
        })

        if (previousState.email !== event.value) {
            this.emitMutation({
                showEmailEditButton: { $set: true },
            })
        }
    }

    sendPasswordResetEmail: EventHandler<'sendPasswordResetEmail'> = ({
        event,
        previousState,
    }) => {
        const auth = this.dependencies.services.auth
        const email = event.value

        this.emitMutation({
            passwordResetSent: { $set: true },
            passwordResetSuccessful: { $set: true },
        })

        auth.sendPasswordResetEmailProcess(email)
    }

    confirmEmailChange: EventHandler<'confirmEmailChange'> = async ({
        event,
    }) => {
        const auth = this.dependencies.services.auth
        const email = event.value
        this.emitMutation({
            emailEditSuccess: { $set: 'running' },
        })
        try {
            await auth.changeEmailAddressonFirebase(email)
            this.emitMutation({
                emailEditSuccess: { $set: 'success' },
            })
        } catch (e) {
            this.emitMutation({
                emailEditSuccess: { $set: 'error' },
            })
        }
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
