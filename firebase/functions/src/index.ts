import * as firebase from 'firebase-admin'
import * as functions from 'firebase-functions';
import { activityStreamFunction, ActivityStreamServiceMethod } from '@worldbrain/memex-common/lib/activity-streams/firebase-functions'

import { runningInEmulator, emulatedConfig } from './constants';
firebase.initializeApp((runningInEmulator) ? emulatedConfig : undefined);


function activityStreamFunctionWithKey(method: ActivityStreamServiceMethod) {
    return {
        [method]: activityStreamFunction({
            firebase: firebase as any,
            functions,
            method,
        })
    }
}

module.exports = {
    activityStreams: {
        ...activityStreamFunctionWithKey('addActivity'),
        ...activityStreamFunctionWithKey('followEntity'),
        ...activityStreamFunctionWithKey('getNotifications'),
    }
}
