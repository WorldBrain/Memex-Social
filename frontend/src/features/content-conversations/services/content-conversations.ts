import type ContentConversationStorage from '../storage'
import type { AuthService } from '../../../services/auth/types'
import type { ContentConversationsServiceInterface } from '@worldbrain/memex-common/lib/content-conversations/service/types'
import type { Services } from '../../../services/types'
import type RouterService from '../../../services/router'
import type { UserReference } from '../../user-management/types'
import type { ConversationReplyReference } from '@worldbrain/memex-common/lib/content-conversations/types'

export default class ContentConversationsService
    implements ContentConversationsServiceInterface {
    constructor(
        private options: {
            auth: AuthService
            storage: ContentConversationStorage
            services: Pick<Services, 'activityStreams'> & {
                router: Pick<RouterService, 'blockLeave'>
            }
        },
    ) {}

    private async hasReplyChangeAuthorization(
        { id }: UserReference,
        replyReference: ConversationReplyReference,
    ): Promise<boolean> {
        const reply = await this.options.storage.getReply({ replyReference })
        return reply?.userReference.id === id
    }

    submitReply: ContentConversationsServiceInterface['submitReply'] = async (
        params,
    ) => {
        const userReference = this.options.auth.getCurrentUserReference()
        if (!userReference) {
            return { status: 'not-authenticated' }
        }

        const unblockLeave = this.options.services.router.blockLeave(
            `Your reply is still being submitted`,
        )
        try {
            const {
                reference: replyReference,
            } = await this.options.storage.createReply({
                userReference,
                ...params,
            })
            return { status: 'success', replyReference }
        } catch (error) {
            return { status: 'failure', error: error as Error }
        } finally {
            unblockLeave()
        }
    }

    deleteReply: ContentConversationsServiceInterface['deleteReply'] = async (
        params,
    ) => {
        const userReference = this.options.auth.getCurrentUserReference()
        if (!userReference) {
            return { status: 'not-authenticated' }
        }

        const unblockLeave = this.options.services.router.blockLeave(
            `Your reply is still being deleted`,
        )
        try {
            if (
                !(await this.hasReplyChangeAuthorization(
                    userReference,
                    params.replyReference,
                ))
            ) {
                return { status: 'not-authenticated' }
            }

            await this.options.storage.deleteReply({
                replyReference: params.replyReference,
            })
            return { status: 'success' }
        } catch (error) {
            return { status: 'failure', error: error as Error }
        } finally {
            unblockLeave()
        }
    }

    editReply: ContentConversationsServiceInterface['editReply'] = async (
        params,
    ) => {
        const userReference = this.options.auth.getCurrentUserReference()
        if (!userReference) {
            return { status: 'not-authenticated' }
        }

        const unblockLeave = this.options.services.router.blockLeave(
            `Your reply is still being edited`,
        )
        try {
            if (
                !(await this.hasReplyChangeAuthorization(
                    userReference,
                    params.replyReference,
                ))
            ) {
                return { status: 'not-authenticated' }
            }

            await this.options.storage.deleteReply({
                replyReference: params.replyReference,
            })
            return { status: 'success', replyReference: params.replyReference }
        } catch (error) {
            return { status: 'failure', error: error as Error }
        } finally {
            unblockLeave()
        }
    }
}
