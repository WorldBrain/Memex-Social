import { Theme } from './types'
import { THEME } from '@worldbrain/memex-common/lib/common-ui/styles/theme'

export const theme: Theme = THEME({
    icons: {
        comment: require('../../assets/img/comment.svg'),
        commentFull: require('../../assets/img/comment.svg'),
        commentEmpty: require('../../assets/img/comment-empty.svg'),
        goTo: require('../../assets/img/open.svg'),
        lock: require('../../assets/img/lock.svg'),
        person: require('../../assets/img/person.svg'),
        plus: require('../../assets/img/plus.svg'),
        shareEmpty: require('../../assets/img/shareEmpty.svg'),
        shared: require('../../assets/img/shared.svg'),
        triangle: require('../../assets/img/triangleSmall.svg'),
        copy: require('../../assets/img/copy.svg'),
        removeX: require('../../assets/img/removeX.svg'),
        hamburger: require('../../assets/img/hamburger.svg'),
        addPeople: require('../../assets/img/addPeople.svg'),
        checkRound: require('../../assets/img/checkRound.svg'),
        check: require('../../assets/img/check.svg'),
        people: require('../../assets/img/people.svg'),
        plusIcon: require('../../assets/img/plusIcon.svg'),
        alertRound: require('../../assets/img/alertRound.svg'),
        webLogo: require('../../assets/img/web-logo.svg'),
        mediumLogo: require('../../assets/img/medium-logo.svg'),
        twitterLogo: require('../../assets/img/twitter-logo.svg'),
        substackLogo: require('../../assets/img/substack-logo.svg'),
        webMonetizationLogo: require('../../assets/img/web-monetization-logo.svg'),
        webMonetizationLogoConfirmed: require('../../assets/img/web-monetization-logo-confirmed.svg'),
    },
})
