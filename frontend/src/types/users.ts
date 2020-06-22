import { AuthProvider } from "./auth";
import * as generatedUsers from './storex-generated/users'

export type User = generatedUsers.User &
{ managementData?: UserManagementData }
export interface UserReference {
    type: 'user-reference'
    id: string | number
}

export interface UserPublicProfile {
}

export interface UserManagementData {
    provider: AuthProvider
}

export type UserEmail = generatedUsers.UserEmail

