type BoolStr = 'true' | 'false'

export interface ContentSharingQueryParams {
    key?: string
    /** Exists to prevent the reader automatically opening pages in the extension. */
    noAutoOpen?: BoolStr
    annotationId?: string
    fromListEntry?: string
    toListEntry?: string
    fromAnnotEntry?: string
    toAnnotEntry?: string
    fromReply?: string
    toReply?: string
}
