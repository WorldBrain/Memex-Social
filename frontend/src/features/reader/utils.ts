const READER_PATH_REGEX = /^\/c\/([^\/]+)\/p\/([^\/]+)\/?$/

export function parseReaderPath(pathname: string) {
    const match = READER_PATH_REGEX.exec(pathname)
    if (!match) {
        return null
    }
    return { collectionId: match[1], entryId: match[2] }
}
