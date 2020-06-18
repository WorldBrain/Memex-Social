export interface LimitedWebStorage {
    setItem: WindowLocalStorage['localStorage']['setItem']
    getItem: WindowLocalStorage['localStorage']['getItem']
    removeItem: WindowLocalStorage['localStorage']['removeItem']
}
