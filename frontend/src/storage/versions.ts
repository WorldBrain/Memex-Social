interface Version {
    date : Date
}

export const STORAGE_VERSIONS : {[version : number]: Version} = {
    0: { date: new Date('2019-04-11') }
}
