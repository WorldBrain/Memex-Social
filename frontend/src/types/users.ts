import { AuthProvider } from "./auth";
import * as generatedUsers from './storex-generated/users'

export type User<WithPk extends boolean = true, Relationships extends null = null, ReverseRelationships extends 'emails' | 'rights' | null = null>
    = generatedUsers.User<WithPk, Relationships, ReverseRelationships> &
    { managementData? : UserManagementData }

export interface UserPublicProfile {
}

export interface UserManagementData {
    provider : AuthProvider
}

export type UserEmail<WithPk extends boolean = true> = generatedUsers.UserEmail<WithPk>
export type UserRight = generatedUsers.UserRight

