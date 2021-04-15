import { Theme } from './types'

export const theme: Theme = {
    spacing: {
        none: '0',
        smallest: '0.25rem',
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem',
        larger: '2rem',
        largest: '3rem',
    },
    colors: {
        background: 'white',
        warning: 'red',
        primary: '#3a2f45',
        subText: '#aeaeae',
        secondary: '#5cd9a6',
        purple: '#5671cf',
        lightgrey: '#f0f0f0',
        grey: '#e0e0e0',
        darkgrey: '#545454',
        black: '000',
        lightblack: '#2c2c2c',
        overlay: {
            background: 'rgba(0, 0, 0, 0.1)',
            dialog: 'white',
        },
    },
    fonts: {
        primary: '"Poppins", sans-serif',
        secondary: '"Poppins", sans-serif',
    },
    fontWeights: {
        normal: 400,
        bold: 700,
    },
    hoverBackgrounds: {
        primary: '#e0e0e0',
    },
    borderRadii: {
        default: '3px',
    },
    fontSizes: {
        header: '20px',
        listTitle: '16px',
        url: '14px',
        text: '12px',
        smallText: '8px',
    },
    lineHeights: {
        header: '30px',
        listTitle: '24px',
        url: '21px',
        text: '18px',
        smallText: '12px',
    },
    zIndices: {
        overlay: 50000,
    },
    icons: {
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
}
