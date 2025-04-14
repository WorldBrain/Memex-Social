import * as admin from 'firebase-admin'
import { FieldValue, FieldPath, Timestamp } from 'firebase-admin/firestore'
import * as functionsV1 from 'firebase-functions/v1'
import { onRequest, onCall } from 'firebase-functions/v2/https'
import { defineSecret, defineString } from 'firebase-functions/params'
import {
    onDocumentCreated,
    onDocumentDeleted,
} from 'firebase-functions/v2/firestore'
import { main } from '@worldbrain/memex-common/lib/firebase-backend/main'
import type {
    RequiredFunctionParamsModules,
    RequiredFunctionV2Modules,
} from '@worldbrain/memex-common/lib/firebase-backend/types'

const functionsV2: RequiredFunctionV2Modules = {
    https: { onCall, onRequest },
    firestore: { onDocumentCreated, onDocumentDeleted },
}

const functionParams: RequiredFunctionParamsModules = {
    defineSecret,
    defineString,
}

module.exports = main(admin, functionsV1, functionsV2, functionParams, {
    Timestamp,
    FieldValue,
    FieldPath,
})
