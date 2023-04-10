const sendMessageFromIframe = (message: string) => {
    console.log(message)
}

export const attachToWindow = () => {
    // @ts-ignore
    window.injected = {
        sendMessageFromIframe,
    }
}
