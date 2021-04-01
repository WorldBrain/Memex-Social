import { CSSObject } from 'styled-components'

import { UserReference as UserRef } from '@worldbrain/memex-common/lib/web-interface/types/users'
import {
    UserPublicProfile as Profile,
    User as ImportedUser,
} from '@worldbrain/memex-common/ts/web-interface/types/storex-generated/user-management'
import { IconKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'

export type UserPublicProfile = Profile
export type User = ImportedUser
export type UserReference = UserRef

export type ProfileWebLinkLabel = 'Website' | 'Medium' | 'Twitter' | 'Substack'
export type ProfileWebLinkName =
    | 'websiteURL'
    | 'mediumURL'
    | 'twitterURL'
    | 'substackURL'
export interface ProfileWebLink {
    urlPropName: ProfileWebLinkName
    label: ProfileWebLinkLabel
    url: string
    icon: IconKeys
}
