export interface OrderedMap<T> {
    items: { [key in string | number]: T }
    order: Array<string | number>
}

type KeySelector<T> = (el: T) => string | number

export const createOrderedMap = <T>(): OrderedMap<T> => ({
    items: {},
    order: [],
})

export const arrayToOrderedMap = <T>(
    arr: T[],
    getKey: KeySelector<T>,
): OrderedMap<T> => ({
    order: arr.map((el) => getKey(el)),
    items: arr.reduce(
        (prev, curr) => ({
            ...prev,
            [getKey(curr)]: curr,
        }),
        {},
    ),
})

export const mapOrderedMap = <T, Return>(
    map: OrderedMap<T>,
    cb: (el: T, index: number) => Return,
    inputArrayChainFn: (
        inputArray: Array<string | number>,
    ) => Array<string | number> = (a) => a,
): Return[] => inputArrayChainFn(map.order).map((id, i) => cb(map.items[id], i))

export const filterOrderedMap = <T>(
    map: OrderedMap<T>,
    f: (item: T) => boolean,
): OrderedMap<T> => {
    const filtered: OrderedMap<T> = { order: [], items: {} }
    for (const key of map.order) {
        const value = map.items[key]
        if (f(value)) {
            filtered.order.push(key)
            filtered.items[key] = value
        }
    }
    return filtered
}

export const getOrderedMapIndex = <T>(map: OrderedMap<T>, index: number): T =>
    map.items[map.order[index]]
