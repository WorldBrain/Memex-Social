import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions';
import { activityStreamFunctions } from '@worldbrain/memex-common/lib/activity-streams/firebase-functions/server'

import { runningInEmulator, emulatedConfig } from './constants';
admin.initializeApp((runningInEmulator) ? emulatedConfig : undefined);

export const activityStreams = activityStreamFunctions({
    firebase: admin as any,
    functions,
})
