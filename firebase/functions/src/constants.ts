import * as admin from 'firebase-admin'

export const runningInEmulator = process.env.FUNCTIONS_EMULATOR
export const emulatedConfig = {
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://worldbrain-staging.firebaseio.com',
    projectId: 'worldbrain-staging',
}
