import ContentConversationStorage from "../storage";
import { AuthService } from "../../../services/auth/types";
import { ConversationReplyReference } from "@worldbrain/memex-common/lib/content-conversations/types";
import { CreateConversationReplyParams } from "@worldbrain/memex-common/lib/content-conversations/storage/types";
import { Services } from "../../../services/types";
import RouterService from "../../../services/router";

export default class ContentConversationsService {
    constructor(private options: {
        auth: AuthService
        storage: ContentConversationStorage
        services: Pick<Services, 'activityStreams'> & {
            router: Pick<RouterService, 'blockLeave'>
        }
    }) {

    }

    async submitReply(params: Omit<CreateConversationReplyParams, 'userReference'> & { isFirstReply: boolean }): Promise<{ status: 'success', replyReference: ConversationReplyReference } | { status: 'not-authenticated' }> {
        const userReference = this.options.auth.getCurrentUserReference()
        if (!userReference) {
            return { status: 'not-authenticated' }
        }

        const unblockLeave = this.options.services.router.blockLeave(`Your reply is still being submitted`)
        try {
            const { reference: replyReference } = await this.options.storage.createReply({
                userReference,
                ...params
            })
            try {
                await this.options.services.activityStreams.addActivity({
                    entityType: 'sharedAnnotation',
                    entity: params.annotationReference,
                    activityType: 'conversationReply',
                    activity: {
                        replyReference,
                        isFirstReply: params.isFirstReply,
                    },
                    follow: { home: true },
                })
            } catch (err) {
                console.error(err)
            }
            return { status: 'success', replyReference }
        } finally {
            unblockLeave()
        }
    }
}
