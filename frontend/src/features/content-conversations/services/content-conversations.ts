import ContentConversationStorage from "../storage";
import { AuthService } from "../../../services/auth/types";
import { ConversationReplyReference } from "@worldbrain/memex-common/lib/content-conversations/types";
import { CreateConversationReplyParams } from "@worldbrain/memex-common/lib/content-conversations/storage/types";

export default class ContentConversationsService {
    constructor(private options: {
        auth: AuthService
        storage: ContentConversationStorage
    }) {

    }

    async submitReply(params: Omit<CreateConversationReplyParams, 'userReference'>): Promise<{ status: 'success', replyReference: ConversationReplyReference } | { status: 'not-authenticated' }> {
        const userReference = this.options.auth.getCurrentUserReference()
        if (!userReference) {
            return { status: 'not-authenticated' }
        }
        const { reference: replyReference } = await this.options.storage.createReply({
            userReference,
            ...params
        })
        return { status: 'success', replyReference }
    }
}
