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
            fileName: data.fileName,
        })
    }

    maybePush('websiteURL', {
        label: 'Website',
        fileName: 'web-logo.svg',
    })
    maybePush('mediumURL', {
        label: 'Medium',
        fileName: 'medium-logo.svg',
    })
    maybePush('twitterURL', {
        label: 'Twitter',
        fileName: 'twitter-logo.svg',
    })
    maybePush('substackURL', {
        label: 'Substack',
        fileName: 'substack-logo.svg',
    })
    return arr
}
