export type Resolvable<T> = Promise<T> & {
    resolve: (value: T) => void
    reject: (e: any) => void
}

export function createResolvable<T>(): Resolvable<T> {
    let { promise, resolve, reject } = Promise.withResolvers<T>()
    return Object.assign(promise, { resolve, reject })
}
