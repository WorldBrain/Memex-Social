import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'

export const sharedListRoleIDToString = (roleID: SharedListRoleID): string => {
    if (roleID === SharedListRoleID.Reader) {
        return 'Reader'
    }
    if (roleID === SharedListRoleID.ReadWrite) {
        return 'Contributor'
    }
    if (roleID === SharedListRoleID.Owner) {
        return 'Owner'
    }
    if (roleID === SharedListRoleID.Admin) {
        return 'Admin'
    }
    return ''
}
