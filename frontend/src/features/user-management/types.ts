import { UserReference as UserRef } from '@worldbrain/memex-common/lib/web-interface/types/users'
import {
    UserPublicProfile as Profile,
    User as ImportedUser,
} from '@worldbrain/memex-common/ts/web-interface/types/storex-generated/user-management'

export type UserPublicProfile = Profile
export type User = ImportedUser
export type UserReference = UserRef
export interface ProfileWebLink {
    url: string
    iconPath:
        | 'img/websiteIcon.svg'
        | 'img/mediumIcon.svg'
        | 'img/twitterIcon.svg'
        | 'img/substackIcon.svg'
}
