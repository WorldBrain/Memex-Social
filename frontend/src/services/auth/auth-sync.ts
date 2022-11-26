import { doesMemexExtDetectionElExist } from '@worldbrain/memex-common/lib/common-ui/utils/content-script'

function validMessage(messageObj: any) {
    return (
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

interface SyncProps {
    awaitAuth: () => Promise<void>
    isLoggedIn: () => boolean
    generateLoginToken: () => Promise<string>
    loginWithToken: (token: string) => Promise<void>
}

const extensionID = 'ifcleiemikljppfppdojadoghfghbinn'

function canMessageExtension() {
    //@ts-ignore next-line
    const base = chrome || browser
    //@ts-ignore next-line
    return (
        base &&
        base.runtime &&
        //this will be available once an extension listens either in content OR background script
        //despite the fact that the content-script can not even recieve messages via sendMessage
        //we need to be careful to not listen in the content-script otherwise the handshake here will need to become much more complicated
        base.runtime.sendMessage &&
        doesMemexExtDetectionElExist()
    )
}

function awaitExtensionReady() {
    let triesLeft = 3
    return new Promise<void>((resolve, reject) => {
        const timer = setInterval(() => {
            if (triesLeft === 0) {
                clearInterval(timer)
                console.info('Extension was not available for syncing login.')
                reject()
            } else {
                triesLeft--
                if (canMessageExtension()) {
                    clearInterval(timer)
                    resolve()
                }
            }
        }, 100)
    })
}

function sendMessageToExtension(
    message: ExtMessage,
    payload?: string,
): Promise<null | ReturnType<typeof unpackMessage>> {
    return new Promise((resolve) => {
        //@ts-ignore next-line
        const base = chrome || browser
        if (!base || !base.runtime || !base.runtime.sendMessage) {
            console.log('Could not send message to Memex extension.')
            resolve(null)
        } else {
            console.log('Sending message to Memex extension.')
            //@ts-ignore next-line
            base.runtime.sendMessage(
                extensionID,
                packMessage(message, payload),
                null,
                (res: any) => {
                    if (validMessage(res)) {
                        resolve(unpackMessage(res))
                    }
                },
            )
        }
    })
}

async function sendTokenToExtPath(generateLoginToken: () => Promise<string>) {
    const loginRequest = await sendMessageToExtension(ExtMessage.LOGGED_IN)
    if (!loginRequest || loginRequest.message !== ExtMessage.TOKEN_REQUEST) {
        return
    }
    const loginToken = await generateLoginToken()
    if (!validGeneratedLoginToken(loginToken)) {
        return
    }
    sendMessageToExtension(ExtMessage.TOKEN, loginToken)
}

async function loginWithExtTokenPath(
    loginWithToken: (token: string) => Promise<void>,
) {
    const tokenFromExtension = await sendMessageToExtension(
        ExtMessage.TOKEN_REQUEST,
    )
    if (
        !tokenFromExtension ||
        tokenFromExtension.message !== ExtMessage.TOKEN ||
        !tokenFromExtension.payload
    ) {
        return
    }
    loginWithToken(tokenFromExtension.payload)
}

export async function syncWithExtension({
    awaitAuth,
    isLoggedIn,
    generateLoginToken,
    loginWithToken,
}: SyncProps) {
    await awaitAuth()
    await awaitExtensionReady()
    if (isLoggedIn()) {
        sendTokenToExtPath(generateLoginToken)
    } else {
        loginWithExtTokenPath(loginWithToken)
    }
}
