import { ContentSharingBackendInterface } from '@worldbrain/memex-common/lib/content-sharing/backend/types'

export class ContentSharingService {
    backend: ContentSharingBackendInterface

    constructor(dependencies: { backend: ContentSharingBackendInterface }) {
        this.backend = dependencies.backend
    }
}
