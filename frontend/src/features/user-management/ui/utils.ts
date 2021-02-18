import { UserPublicProfile } from '@worldbrain/memex-common/ts/web-interface/types/storex-generated/user-management'
import { ProfileWebLink } from '../types'

export function getProfileLinks(
    profileData: UserPublicProfile,
): ProfileWebLink[] {
    const { websiteURL, mediumURL, twitterURL, substackURL } = profileData
    const arr: ProfileWebLink[] = []
    if (websiteURL) {
        arr.push({
            label: 'Website',
            urlPropName: 'websiteURL',
            url: websiteURL,
            fileName: 'web-logo.svg',
        })
    }
    if (mediumURL) {
        arr.push({
            label: 'Medium',
            urlPropName: 'mediumURL',
            url: mediumURL,
            fileName: 'medium-logo.svg',
        })
    }
    if (twitterURL) {
        arr.push({
            label: 'Twitter',
            urlPropName: 'twitterURL',
            url: twitterURL,
            fileName: 'twitter-logo.svg',
        })
    }
    if (substackURL) {
        arr.push({
            label: 'Substack',
            urlPropName: 'substackURL',
            url: substackURL,
            fileName: 'substack-logo.svg',
        })
    }
    return arr
}
