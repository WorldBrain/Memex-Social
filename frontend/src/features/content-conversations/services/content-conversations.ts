import ContentConversationStorage from "../storage";
import { AuthService } from "../../../services/auth/types";
import { ConversationReplyReference } from "@worldbrain/memex-common/lib/content-conversations/types";
import { CreateConversationReplyParams } from "@worldbrain/memex-common/lib/content-conversations/storage/types";
import { Services } from "../../../services/types";

export default class ContentConversationsService {
    constructor(private options: {
        auth: AuthService
        storage: ContentConversationStorage
        services: Pick<Services, 'activityStreams'>
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
        await this.options.services.activityStreams.addActivity({
            entityType: 'sharedAnnotation',
            entity: params.annotationReference,
            activityType: 'conversationReply',
            activity: {
                replyReference,
            }
        })
        try {
            await this.options.services.activityStreams.followEntity({
                entityType: 'sharedAnnotation',
                entity: params.annotationReference,
                feeds: { user: true, notification: true },
            })
        } catch (err) {
            console.error(err)
        }
        return { status: 'success', replyReference }
    }
}
