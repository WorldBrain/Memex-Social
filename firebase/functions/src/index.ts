import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { activityStreamFunctions } from '@worldbrain/memex-common/lib/activity-streams/services/firebase-functions/server'
import { contentSharingFunctions } from '@worldbrain/memex-common/lib/content-sharing/service/firebase-functions'
import { createFirestoreTriggers } from '@worldbrain/memex-common/lib/firebase-backend/setup'
import { runningInEmulator, emulatedConfig } from './constants'
admin.initializeApp(runningInEmulator ? emulatedConfig : undefined)

module.exports = {
    activityStreams: activityStreamFunctions({
        firebase: admin as any,
        functions,
    }),
    contentSharing: contentSharingFunctions({
        firebase: admin as any,
        functions,
    }),
    triggers: createFirestoreTriggers({
        firebase: admin as any,
        functions,
    }),
}
