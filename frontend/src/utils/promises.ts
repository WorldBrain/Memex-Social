export function sleepPromise(miliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, miliseconds))
}
