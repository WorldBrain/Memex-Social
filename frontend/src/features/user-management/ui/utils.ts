import { UserPublicProfile } from '@worldbrain/memex-common/ts/web-interface/types/storex-generated/user-management'
import { ProfileWebLink, ProfileWebLinkName } from '../types'

export function getProfileLinks(
    profileData: UserPublicProfile | null,
    options?: { withEmptyFields?: boolean },
): ProfileWebLink[] {
    if (!profileData && !options?.withEmptyFields) {
        return []
    }

    const arr: ProfileWebLink[] = []
    const maybePush = (
        property: keyof UserPublicProfile,
        data: Omit<ProfileWebLink, 'url' | 'urlPropName'>,
    ) => {
        const url = profileData?.[property]
        if (!url && !options?.withEmptyFields) {
            return
        }
        arr.push({
            label: data.label,
            urlPropName: property as ProfileWebLinkName,
            url: url ?? '',
            icon: data.icon,
        })
    }

    maybePush('websiteURL', {
        label: 'Website',
        icon: 'webLogo',
    })
    maybePush('mediumURL', {
        label: 'Medium',
        icon: 'mediumLogo',
    })
    maybePush('twitterURL', {
        label: 'Twitter',
        icon: 'twitterLogo',
    })
    maybePush('substackURL', {
        label: 'Substack',
        icon: 'substackLogo',
    })
    return arr
}
