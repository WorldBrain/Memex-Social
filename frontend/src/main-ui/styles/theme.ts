import { Theme } from './types'
import { THEME } from '@worldbrain/memex-common/lib/common-ui/styles/theme'

export const theme: Theme = THEME({
    icons: {
        memexIconOnly: require('../../assets/img/memex-icon.svg'),
        local: 'foo.png',
        openAIicon: 'xyx.png',
        addPeople: require('../../assets/img/addPeople.svg'),
        warning: require('../../assets/img/alertRound.svg'),
        arrowLeft: require('../../assets/img/arrowLeft.svg'),
        arrowRight: require('../../assets/img/arrowRight.svg'),
        arrowDown: require('../../assets/img/arrowRight.svg'),
        atSign: require('../../assets/img/atSign.svg'),
        backup: require('../../assets/img/backup.svg'),
        chatWithUs: require('../../assets/img/chatWithUs.svg'),
        check: require('../../assets/img/check.svg'),
        checkRound: require('../../assets/img/checkRound.svg'),
        clock: require('../../assets/img/clock.svg'),
        coilIcon: require('../../assets/img/coil-icon.svg'),
        collectionsEmpty: require('../../assets/img/collections_add.svg'),
        collectionsFull: require('../../assets/img/collections_full.svg'),
        command: require('../../assets/img/command.svg'),
        comment: require('../../assets/img/comment_full.svg'),
        commentAdd: require('../../assets/img/comment_add.svg'),
        commentFull: require('../../assets/img/comment_full.svg'),
        compress: require('../../assets/img/compress.svg'),
        calendar: require('../../assets/img/date.svg'),
        copy: require('../../assets/img/copy.svg'),
        cursor: require('../../assets/img/cursor.svg'),
        date: require('../../assets/img/date.svg'),
        discord: require('../../assets/img/discord.svg'),
        dots: require('../../assets/img/3dots.svg'),
        doubleArrow: require('../../assets/img/doubleArrow.svg'),
        dropImage: require('../../assets/img/dropImage.svg'),
        edit: require('../../assets/img/edit.svg'),
        emptyCircle: require('../../assets/img/emptyCircle.svg'),
        expand: require('../../assets/img/expand.svg'),
        feed: require('../../assets/img/feed.svg'),
        file: require('../../assets/img/file.svg'),
        filePDF: require('../../assets/img/file-pdf.svg'),
        filterIcon: require('../../assets/img/filterIcon.svg'),
        folder: require('../../assets/img/folder.svg'),
        globe: require('../../assets/img/globe.svg'),
        goTo: require('../../assets/img/open.svg'),
        hamburger: require('../../assets/img/hamburger.svg'),
        helpIcon: require('../../assets/img/help.svg'),
        highlight: require('../../assets/img/highlights.svg'),
        imports: require('../../assets/img/import.svg'),
        inbox: require('../../assets/img/inbox.svg'),
        integrate: require('../../assets/img/integrate.svg'),
        link: require('../../assets/img/link.svg'),
        linuxLogo: require('../../assets/img/linux_logo.svg'),
        lock: require('../../assets/img/lock.svg'),
        lockFine: require('../../assets/img/lockFine.svg'),
        login: require('../../assets/img/login.svg'),
        logout: require('../../assets/img/logout.svg'),
        longArrowRight: require('../../assets/img/longArrowRight.svg'),
        macLogo: require('../../assets/img/apple_logo.svg'),
        mail: require('../../assets/img/mail.svg'),
        mediumLogo: require('../../assets/img/medium-logo.svg'),
        memexLogoGrey: require('../../assets/img/memexLogoGrey.svg'),
        multiEdit: require('../../assets/img/multiedit.svg'),
        pause: require('../../assets/img/pause.svg'),
        pdf: require('../../assets/img/file-pdf.svg'),
        peopleFine: require('../../assets/img/peopleFine.svg'),
        personFine: require('../../assets/img/personFine.svg'),
        phone: require('../../assets/img/phone.svg'),
        pin: require('../../assets/img/pin.svg'),
        play: require('../../assets/img/play.svg'),
        playFull: require('../../assets/img/playFull.svg'),
        plus: require('../../assets/img/plus.svg'),
        plusIcon: require('../../assets/img/plus.svg'),
        quickActionRibbon: require('../../assets/img/quickActionRibbon.svg'),
        readwise: require('../../assets/img/readwise.svg'),
        redo: require('../../assets/img/redo.svg'),
        reload: require('../../assets/img/reload.svg'),
        remove: require('../../assets/img/remove.svg'),
        removeX: require('../../assets/img/removeX.svg'),
        ribbonOff: require('../../assets/img/ribbonOff.svg'),
        ribbonOn: require('../../assets/img/ribbonOn.svg'),
        sadFace: require('../../assets/img/sadFace.svg'),
        saveIcon: require('../../assets/img/saveIcon.svg'),
        searchIcon: require('../../assets/img/search.svg'),
        settings: require('../../assets/img/settings.svg'),
        share: require('../../assets/img/share.svg'),
        shared: require('../../assets/img/shared.svg'),
        sharedProtected: require('../../assets/img/sharedprotected.svg'),
        shareEmpty: require('../../assets/img/shareEmpty.svg'),
        shield: require('../../assets/img/shield.svg'),
        sidebarIcon: require('../../assets/img/sidebarOn.svg'),
        slack: require('../../assets/img/slack.svg'),
        smileFace: require('../../assets/img/smileFace.svg'),
        sort: require('../../assets/img/sort.svg'),
        spotifyLogo: require('../../assets/img/spotify-logo.svg'),
        stars: require('../../assets/img/stars.svg'),
        stop: require('../../assets/img/stop.svg'),
        substackLogo: require('../../assets/img/substack-logo.svg'),
        sunrise: require('../../assets/img/sunrise.svg'),
        tagEmpty: require('../../assets/img/tag_empty.svg'),
        tagFull: require('../../assets/img/tag_full.svg'),
        tooltipOff: require('../../assets/img/tooltipOff.svg'),
        tooltipOn: require('../../assets/img/tooltipOn.svg'),
        trash: require('../../assets/img/trash.svg'),
        triangle: require('../../assets/img/arrowRight.svg'),
        twitter: require('../../assets/img/twitter.svg'),
        twitterThin: require('../../assets/img/twitterThin.svg'),
        twitterLogo: require('../../assets/img/twitter-logo.svg'),
        blueskyLogo: require('../../assets/img/bluesky-logo.svg'),
        info: require('../../assets/img/infoIcon.svg'),
        webMonetizationLogo: require('../../assets/img/web-monetization-logo.svg'),
        webMonetizationLogoConfirmed: require('../../assets/img/web-monetization-logo-confirmed.svg'),
        winLogo: require('../../assets/img/windows_logo.svg'),
        youtubeLogo: require('../../assets/img/youtube-logo.svg'),
        reply: require('../../assets/img/reply.svg'),
        blueRoundCheck: require('../../assets/img/info.svg'),
        bell: require('../../assets/img/bell.svg'),
        checkedRound: require('../../assets/img/info.svg'),
        heartEmpty: require('../../assets/img/heart.svg'),
        heartFull: require('../../assets/img/heart.svg'),
        newFeed: require('../../assets/img/feed.svg'),
        threadIcon: require('../../assets/img/reply.svg'),
        invite: require('../../assets/img/invite.svg'),
        block: require('../../assets/img/block.svg'),
        boldIcon: require('../../assets/img/boldIcon.svg'),
        italicIcon: require('../../assets/img/italicIcon.svg'),
        h1Icon: require('../../assets/img/h1Icon.svg'),
        h2Icon: require('../../assets/img/h2Icon.svg'),
        imageIcon: require('../../assets/img/imageIcon.svg'),
        timestampIcon: require('../../assets/img/timeStampIcon.svg'),
        numberedListIcon: require('../../assets/img/numberedListIcon.svg'),
        bulletListIcon: require('../../assets/img/bulletListIcon.svg'),
        bulletPoint: require('../../assets/img/bulletListIcon.svg'),
        strikethroughIcon: require('../../assets/img/strikethroughIcon.svg'),
        fullPageReading: require('../../assets/img/bulletListIcon.svg'),
        sideBySide: require('../../assets/img/strikethroughIcon.svg'),
        openAI: require('../../assets/img/openAI.svg'),
        googleLogo: require('../../assets/img/googleLogo.svg'),
        telegram: require('../../assets/img/googleLogo.svg'),

        // TODO: Update these
        moon: require('../../assets/img/googleLogo.svg'),
        sun: require('../../assets/img/googleLogo.svg'),
        cameraIcon: require('../../assets/img/cameraIcon.svg'),
        memexIconDarkMode: require('../../assets/img/memexIconDarkMode.svg'),
        memexIconLightMode: require('../../assets/img/memexIconLightMode.svg'),
        obsidianLogo: require('../../assets/img/obsidianLogo.svg'),
        logseqLogo: require('../../assets/img/logseqLogo.svg'),
        rectangleDraw: require('../../assets/img/rectangleDraw.svg'),
        spread: require('../../assets/img/rectangleDraw.svg'),
        key: require('../../assets/img/rectangleDraw.svg'),
        dragList: require('../../assets/img/rectangleDraw.svg'),
        browserIcon: require('../../assets/img/memexIconLightMode.svg'),
        move: require('../../assets/img/memexIconLightMode.svg'),
        enter: require('../../assets/img/memexIconLightMode.svg'),

        // doubleArrow: require('../../assets/img/doubleArrow.svg'),,
        // import tagFull from '../../assets/img/tag_full.svg'
        // import tagEmpty from '../../assets/img/tag_empty.svg'
        // import heartFull from '../../assets/img/heart_full.svg'
        // import heartEmpty from '../../assets/img/heart_empty.svg'
    },
    variant: 'dark',
    // colors: {
    //     background: 'white',
    //     warning: '#ff9090',
    //     primary: '#3a2f45',
    //     subText: '#aeaeae',
    //     purple: '#347AE2',
    //     white: '#fff',
    //     lightgrey: '#f0f0f0',
    //     darkgrey: '#545454',
    //     secondary: '#5cd9a6',
    //     grey: '#e0e0e0',
    //     black: '#000',
    //     overlay: {
    //         background: 'rgba(0, 0, 0, 0.1)',
    //         dialog: 'white',
    //     },
    //     lightblack: '#292C38',
    //     lineGrey: '#ECEFF4',
    //     lineLightGrey: '#E0E5ED',
    //     iconColor: '#96A0B5',
    //     darkerIconColor: '#7d8598',
    //     lightHover: '#F4F9FF',
    //     backgroundHighlight: '#e6f1ff',
    //     darkhover: '#E5F0FF',
    //     normalText: '#73778B',
    //     darkerText: '#292C38',
    //     lighterText: '#96A0B5',
    //     backgroundColor: '#F8FBFF',
    //     backgroundColorDarker: '#e5f0ff70',
    //     darkerBlue: '#5E6278',
    //     blue: '2563EB',
    // },
})
