import FirebaseAuthService from './firebase'
import {
    ExtMessage,
    logPackedMessage,
    logUnpackedMessage,
    packMessage,
    unpackMessage,
    validGeneratedLoginToken,
    validMessage,
} from '@worldbrain/memex-common/lib/authentication/auth-sync'

const enableMessageLogging = false

async function canMessageExtension(extensionID: string) {
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
    } catch (error) {
        console.log('Another extension is listening for the webpage.')
        return false
    }
    await sendMessageToExtension(
        ExtMessage.EXT_IS_READY,
        extensionID,
        'ext is ready payload',
    )
    return true
}

export async function awaitExtensionReady(extensionID: string) {
    let extensionIsReady = false
    const shortTriesInterval = 300
    let shortTriesLeft = 10

    await new Promise<void>(async (resolve) => {
        if (await canMessageExtension(extensionID)) {
            resolve()
            return
        }

        //first, we wait a fixed amount of short intervals
        //this gives the extension enough time to start listening
        const shortTimer = setInterval(async () => {
            if (shortTriesLeft === 0) {
                clearInterval(shortTimer)
                resolve()
            } else {
                shortTriesLeft--
                if (await canMessageExtension(extensionID)) {
                    extensionIsReady = true
                    clearInterval(shortTimer)
                    resolve()
                }
            }
        }, shortTriesInterval)
    })
    if (extensionIsReady) {
        return true
    }

    const longTriesInterval = 2000

    await new Promise<void>((resolve) => {
        console.log(
            'Extension was not ready or installed after initial wait period. Starting polling.',
        )
        //in this case, the extension is not installed currently
        //so we poll in case it is installed later - which we want to encourage
        const longTimer = setInterval(async () => {
            if (await canMessageExtension(extensionID)) {
                extensionIsReady = true
                clearInterval(longTimer)
                resolve()
                return
            }
        }, longTriesInterval)
    })

    return extensionIsReady
}

export function sendMessageToExtension(
    message: ExtMessage,
    extensionID?: string,
    payload?: string,
): Promise<null | ReturnType<typeof unpackMessage>> {
    return new Promise((resolve) => {
        //@ts-ignore next-line
        const base = chrome || browser
        const packedMessage = packMessage(message, payload)
        logPackedMessage(packedMessage, 'Sending', enableMessageLogging)

        //@ts-ignore next-line
        base.runtime.sendMessage(
            extensionID,
            packedMessage,
            null,
            (res: any) => {
                if (validMessage(res)) {
                    const unpackedMessage = unpackMessage(res)
                    logUnpackedMessage(
                        unpackedMessage,
                        'Recieved',
                        enableMessageLogging,
                    )

                    resolve(unpackedMessage)
                }
            },
        )
    })
}

async function sendTokenToExtHandler(
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

async function loginWithExtTokenHandler(
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
    //currently we can not avoid duplicate token generation if multiple tabs exist, but we can at least try to avoid duplicate login
    if (!(await authService.isLoggedIn()))
        await authService.loginWithToken(tokenFromExtension.payload)
}

function bothNotLoggedInHandler(
    authService: FirebaseAuthService,
    extensionID: string,
) {
    console.log(
        'Neither app nor extension are logged in. Starting polling until either one logs in.',
    )
    const interval = 4000
    const tryAgain = () => {
        setTimeout(async () => {
            await sync(authService, extensionID)
            if (!authService.isLoggedIn()) {
                tryAgain()
            } else {
                console.log(
                    'Successfully synced with extension after trying multiple times.',
                )
            }
        }, interval)
    }
    tryAgain()
}

async function sync(authService: FirebaseAuthService, extensionID: string) {
    await authService.waitForAuthReady()
    await awaitExtensionReady(extensionID)
    if (authService.isLoggedIn()) {
        setTimeout(async () => {
            await sendTokenToExtHandler(authService, extensionID)
        }, 4000)
    } else {
        await loginWithExtTokenHandler(authService, extensionID)
    }
}

export async function syncWithExtension(authService: FirebaseAuthService) {
    const extensionID = process.env.MEMEX_EXTENSION_ID
    if (!extensionID) {
        console.error('Could not find extension ID for auth sync')
    } else {
        await sync(authService, extensionID)
        if (!authService.isLoggedIn()) {
            bothNotLoggedInHandler(authService, extensionID)
        } else {
            console.log(
                'Successfully synced with extension immediately after it was ready.',
            )
        }
    }
}
