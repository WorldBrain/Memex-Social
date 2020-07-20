import * as firebase from '@firebase/testing'
import { Storage } from "../storage/types"
import { createStorage } from "../storage"
import { FirestoreStorageBackend } from '@worldbrain/storex-backend-firestore'
import { generateRulesAstFromStorageModules } from '@worldbrain/storex-backend-firestore/lib/security-rules'
import { serializeRulesAST } from '@worldbrain/storex-backend-firestore/lib/security-rules/ast'
import { createServices } from '../services'
import { Services } from '../services/types'

export interface StorageTestContext {
    storage: Storage
    services: Services
    auth: {
        signInTestUser: () => Promise<void>
        signOutTestUser: () => Promise<void>
    }
}
export type StorageTest = (context: StorageTestContext) => Promise<void>
export interface StorageTestOptions {
    printProjectId?: boolean
    withTestUser?: boolean
}
export type StorageTestFactory = (
    ((description: string, test: StorageTest) => void) &
    ((description: string, options: StorageTestOptions, test: StorageTest) => void)
)
export type StorageTestSuite = (context: { it: StorageTestFactory }) => void

type StorageTestBackend = keyof typeof STORAGE_TEST_BACKENDS
const STORAGE_TEST_BACKENDS = {
    memory: true,
    'firebase-emulator': true
}

export function createStorageTestFactory(suiteOptions: { backend: StorageTestBackend }) {
    const factory: StorageTestFactory = (description: string, testOrOptions: StorageTest | StorageTestOptions, maybeTest?: StorageTest) => {
        const testOptions: StorageTestOptions = maybeTest ? (testOrOptions as StorageTestOptions) : {}
        const test = maybeTest ?? (testOrOptions as StorageTest)

        it(description, async () => {
            if (suiteOptions.backend === 'memory') {
                const storage = await createStorage({ backend: 'memory' })
                const services = createServices({
                    backend: 'memory',
                    storage,
                    history: null!,
                    uiMountPoint: null!,
                    localStorage: null!,
                })
                await test({
                    storage,
                    services,
                    auth: {
                        signInTestUser: async () => {
                            await services.auth.loginWithProvider('google')
                        },
                        signOutTestUser: async () => {
                            await services.auth.logout()
                        }
                    }
                })
            } else if (suiteOptions.backend === 'firebase-emulator') {
                const projectId = `unit-test-${Date.now()}`
                if (testOptions.printProjectId) {
                    console.log(`Creating Firebase emulator project: ${projectId}`)
                }

                const firebaseApp = firebase.initializeTestApp({
                    projectId: projectId,
                    auth: testOptions.withTestUser ? { uid: 'test-user-1' } : undefined
                })

                const firestore = firebaseApp.firestore()
                const storageBackend = new FirestoreStorageBackend({
                    firebase: firebaseApp as any,
                    firebaseModule: firebase as any,
                    firestore: firestore as any
                })
                const storage = await createStorage({ backend: storageBackend })

                // await firebase.loadFirestoreRules({
                //     projectId,
                //     rules: `
                //     service cloud.firestore {
                //         match /databases/{database}/documents {
                //             match /{document=**} {
                //                 allow read, write; // or allow read, write: if true;
                //              }
                //         }
                //       }                      
                //     `
                // })
                const ast = await generateRulesAstFromStorageModules(storage.serverModules as any, {
                    storageRegistry: storage.serverStorageManager.registry,
                })
                const rules = serializeRulesAST(ast)
                // console.log(rules)
                await firebase.loadFirestoreRules({
                    projectId,
                    rules: rules,
                })

                const services = createServices({
                    backend: 'memory',
                    firebase: firebaseApp as any,
                    storage,
                    history: null!,
                    uiMountPoint: null!,
                    localStorage: null!,
                })
                if (testOptions.withTestUser) {
                    await services.auth.loginWithProvider('google')
                }

                try {
                    await test({
                        storage,
                        services,
                        auth: {
                            signInTestUser: async () => {
                                await services.auth.loginWithProvider('google')
                            },
                            signOutTestUser: async () => {
                                await services.auth.logout()
                            }
                        }
                    })
                } finally {
                    await firebaseApp.delete()
                }
            } else {
                throw new Error(`Got unknown backend for test '${description}': ${suiteOptions.backend}`)
            }
        })
    }

    return factory
}

export function createStorageTestSuite(description: string, suite: StorageTestSuite) {
    const backends = selectSuiteBackends()
    describe(description, () => {
        if (backends.has('memory')) {
            describe('In memory (Dexie)', () => {
                suite({ it: createStorageTestFactory({ backend: 'memory' }) })
            })
        }
        if (backends.has('firebase-emulator')) {
            describe('Firebase emulator', () => {
                suite({ it: createStorageTestFactory({ backend: 'firebase-emulator' }) })
            })
        }
    })
}

function selectSuiteBackends(): Set<StorageTestBackend> {
    const selectionString = process.env.STORAGE_TEST_BACKEND || 'memory'
    const selection = selectionString.split(',')
    for (const backend of selection) {
        if (!(backend in STORAGE_TEST_BACKENDS)) {
            throw new Error(`Unknown test backend passed as STORAGE_TEST_BACKEND`)
        }
    }
    return new Set<StorageTestBackend>(selection as StorageTestBackend[])
}
