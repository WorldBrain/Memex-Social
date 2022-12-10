import FirebaseAuthService from './firebase'
//TODO: use helpers from memex-common (how to publish?)
function validMessage(messageObj: any) {
    return (
        messageObj &&
        typeof messageObj === 'object' &&
        typeof messageObj.message === 'string' &&
        (!messageObj.payload || typeof messageObj.payload === 'string')
    )
}

enum ExtMessage {
    LOGGED_IN = 'LOGGED_IN',
    TOKEN_REQUEST = 'TOKEN_REQUEST',
    TOKEN = 'TOKEN',
}

function unpackMessage(messageObj: any) {
    return {
        message: atob(messageObj.message) as ExtMessage,
        payload: messageObj.payload ? atob(messageObj.payload) : null,
    }
}

function packMessage(message: ExtMessage, payload?: string) {
    return {
        message: btoa(message),
        payload: payload ? btoa(payload) : null,
    }
}

function validGeneratedLoginToken(loginToken: any) {
    return loginToken && typeof loginToken === 'string'
}

function canMessageExtension(extensionID: string) {
    //@ts-ignore next-line
    const base = chrome || browser
    //@ts-ignore next-line
    if (
        !base ||
        !base.runtime ||
        //this will be available once an extension listens either in content OR background script
        //despite the fact that the content-script can not even recieve messages via sendMessage
        //we need to be careful to not listen in the content-script otherwise the handshake here will need to become more complicated
        !base.runtime.sendMessage
    ) {
        return false
    }

    //the first checks will also pass if another extension is listening
    //so we to try a purposefully invalid message which the extension will recieve but not act upon
    //if this throws it means the extensionID does not fit, which means only another extension is listening
    //by doing this we don't need to check for the injected DOM-element
    //which means this check also works if the content-script is not executed
    try {
        //@ts-ignore next-line
        base.runtime.sendMessage(extensionID, null)
        return true
    } catch (error) {
        console.log('Another extension is listening for the webpage.')
        return false
    }
}

function awaitExtensionReady(extensionID: string) {
    const shortTriesInterval = 300
    let shortTriesLeft = 10

    const longTriesInterval = 2000

    return new Promise<void>((resolve) => {
        if (canMessageExtension(extensionID)) {
            resolve()
        }

        //first, we wait a fixed amount of short intervals
        //this gives the extension enough time to start listening
        const shortTimer = setInterval(() => {
            if (shortTriesLeft === 0) {
                clearInterval(shortTimer)
            } else {
                shortTriesLeft--
                if (canMessageExtension(extensionID)) {
                    clearInterval(shortTimer)
                    resolve()
                }
            }
        }, shortTriesInterval)

        //in this case, the extension is not installed currently
        //so we poll in case it is installed later - which we want to encourage
        const longTimer = setInterval(() => {
            if (canMessageExtension(extensionID)) {
                clearInterval(longTimer)
                resolve()
                return
            }
            // console.log('Waiting for extension')
        }, longTriesInterval)
    })
}

function sendMessageToExtension(
    message: ExtMessage,
    extensionID: string,
    payload?: string,
): Promise<null | ReturnType<typeof unpackMessage>> {
    return new Promise((resolve) => {
        //@ts-ignore next-line
        const base = chrome || browser

        const packedMessage = packMessage(message, payload)
        // console.log(
        //     'Sending message to Memex extension: ' +
        //         JSON.stringify(unpackMessage(packedMessage), null, 2),
        // )
        //@ts-ignore next-line
        base.runtime.sendMessage(
            extensionID,
            packedMessage,
            null,
            (res: any) => {
                if (validMessage(res)) {
                    const unpackedMessage = unpackMessage(res)
                    // console.log(
                    //     'Recieved: ' + JSON.stringify(unpackedMessage, null, 2),
                    // )
                    resolve(unpackedMessage)
                }
            },
        )
    })
}

async function sendTokenToExtPath(
    authService: FirebaseAuthService,
    extensionID: string,
) {
    const loginRequest = await sendMessageToExtension(
        ExtMessage.LOGGED_IN,
        extensionID,
    )
    if (!loginRequest || loginRequest.message !== ExtMessage.TOKEN_REQUEST) {
        return
    }
    const loginToken = (await authService.generateLoginToken()).token
    if (!validGeneratedLoginToken(loginToken)) {
        return
    }
    await sendMessageToExtension(ExtMessage.TOKEN, extensionID, loginToken)
}

async function loginWithExtTokenPath(
    authService: FirebaseAuthService,
    extensionID: string,
) {
    const tokenFromExtension = await sendMessageToExtension(
        ExtMessage.TOKEN_REQUEST,
        extensionID,
    )
    if (
        !tokenFromExtension ||
        tokenFromExtension.message !== ExtMessage.TOKEN ||
        !tokenFromExtension.payload
    ) {
        return
    }
    await authService.loginWithToken(tokenFromExtension.payload)
}

export async function syncWithExtension(authService: FirebaseAuthService) {
    const extensionID =
        process.env.NODE_ENV === 'development'
            ? 'ifcleiemikljppfppdojadoghfghbinn' //needs to be adjusted for dev, this depends on your local environment
            : 'abkfbakhjpmblaafnpgjppbmioombali'

    const isLoggedIn = () => !!authService.getCurrentUser()

    await authService.waitForAuthReady()
    await awaitExtensionReady(extensionID)
    if (isLoggedIn()) {
        await sendTokenToExtPath(authService, extensionID)
    } else {
        await loginWithExtTokenPath(authService, extensionID)
    }

    if (!isLoggedIn()) {
        let inExecution = false
        //TODO:
        //this needs to poll the ext too for seeing if it was logged in
        //can currently only detect "later" login if we do it in the app

        //scenarios:
        //0. both installed, one of app/ext logged in (2)
        //1. both installed, no logged in - login in each separately (2)
        //2. having app open, installing ext
        //3. having multiple tabs of the app open, installing ext
        authService.events.on('changed', () => {
            if (!inExecution) {
                inExecution = true
                syncWithExtension(authService).then(() => (inExecution = false))
            }
        })
    }
}
