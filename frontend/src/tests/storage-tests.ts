import * as firebase from '@firebase/testing'
import { Storage } from '../storage/types'
import { createStorage } from '../storage'
import { FirestoreStorageBackend } from '@worldbrain/storex-backend-firestore'
import { generateRulesAstFromStorageModules } from '@worldbrain/storex-backend-firestore/lib/security-rules'
import { serializeRulesAST } from '@worldbrain/storex-backend-firestore/lib/security-rules/ast'
import { StorageHooksChangeWatcher } from '@worldbrain/memex-common/lib/storage/hooks'
import { createServices } from '../services'
import { Services } from '../services/types'
import { ProgramQueryParams } from '../setup/types'
import { mockClipboardAPI } from '../services/clipboard/mock'

export interface StorageTestDevice {
    storage: Storage
    services: Services
    enforcesAccessRules: boolean
    // auth: {
    //     signInTestUser: () => Promise<void>
    //     signOutTestUser: () => Promise<void>
    // }
}
type StorageTestDeviceWithCleanup = StorageTestDevice & {
    cleanup: () => Promise<void>
}
export interface StorageTestDeviceOptions {
    queryParams?: ProgramQueryParams
    withTestUser?: boolean | { uid: string }
    printProjectId?: boolean
}
export interface StorageTestContext extends StorageTestDevice {
    enforcesAccessRules: boolean
    skipTest(): void
}
export interface MultiDeviceStorageTestContext {
    enforcesAccessRules: boolean
    createDevice(options?: StorageTestDeviceOptions): Promise<StorageTestDevice>
    createSuperuserDevice(options?: {
        printProjectId?: boolean
    }): Promise<StorageTestDevice>
    skipTest(): void
}

export type StorageTest<Context = StorageTestContext> = (
    context: Context,
) => Promise<void>
export interface StorageTestOptions extends StorageTestDeviceOptions {}
export interface MultiDeviceStorageTestOptions {}

export type StorageTestFactory<
    Context = StorageTestContext,
    Options = StorageTestOptions
> = ((description: string, test: StorageTest<Context>) => void) &
    ((
        description: string,
        options: Options,
        test: StorageTest<Context>,
    ) => void)
export type StorageTestSuite<
    Context = StorageTestContext,
    Options = StorageTestOptions
> = (context: { it: StorageTestFactory<Context, Options> }) => void
export type MultiDeviceStorageTestSuite = StorageTestSuite<
    MultiDeviceStorageTestContext,
    MultiDeviceStorageTestOptions
>

type StorageTestBackend = keyof typeof STORAGE_TEST_BACKENDS
const STORAGE_TEST_BACKENDS = {
    memory: true,
    'firebase-emulator': true,
}

async function createMemoryTestDevice(
    testOptions: StorageTestOptions & { storage?: Storage },
): Promise<StorageTestDeviceWithCleanup> {
    const storageHooksChangeWatcher = new StorageHooksChangeWatcher()
    const storage =
        testOptions.storage ?? (await createStorage({ backend: 'memory' }))
    const services = createServices({
        backend: 'memory',
        storage,
        queryParams: testOptions.queryParams ?? {},
        clipboard: mockClipboardAPI,
        history: null!,
        uiMountPoint: null!,
        localStorage: null!,
    })
    storageHooksChangeWatcher.setUp({
        fetch,
        services,
        captureException: async (error) => undefined, // TODO: maybe implement this
        serverStorageManager: storage.serverStorageManager,
        getCurrentUserReference: async () =>
            services.auth.getCurrentUserReference(),
    })
    if (testOptions.withTestUser) {
        await services.auth.loginWithProvider('google')
    }
    // const auth = {
    //     signInTestUser: async () => {
    //         await services.auth.loginWithProvider('google')
    //     },
    //     signOutTestUser: async () => {
    //         await services.auth.logout()
    //     },
    // }
    return {
        storage,
        services,
        enforcesAccessRules: false,
        cleanup: async () => {},
    }
}

async function createFirebaseTestDevice(
    testOptions: StorageTestOptions & {
        firebaseProjectId: string
        superuser?: boolean
    },
): Promise<StorageTestDeviceWithCleanup> {
    const userId = testOptions.withTestUser
        ? testOptions.withTestUser === true
            ? 'default-user'
            : testOptions.withTestUser.uid
        : undefined
    const firebaseApp = testOptions.superuser
        ? firebase.initializeAdminApp({
              projectId: testOptions.firebaseProjectId,
          })
        : firebase.initializeTestApp({
              projectId: testOptions.firebaseProjectId,
              auth: userId ? { uid: userId } : undefined,
          })

    const firestore = firebaseApp.firestore()
    const storageBackend = new FirestoreStorageBackend({
        firebase: firebaseApp as any,
        firebaseModule: firebase as any,
        firestore: firestore as any,
    })
    const storage = await createStorage({ backend: storageBackend })

    if (process.env.DISABLE_FIRESTORE_RULES === 'true') {
        await firebase.loadFirestoreRules({
            projectId: testOptions.firebaseProjectId,
            rules: `
            service cloud.firestore {
                match /databases/{database}/documents {
                    match /{document=**} {
                        allow read, write; // or allow read, write: if true;
                    }
                }
            }
            `,
        })
    } else {
        const ast = await generateRulesAstFromStorageModules(
            storage.serverModules as any,
            {
                storageRegistry: storage.serverStorageManager.registry,
            },
        )
        const rules = serializeRulesAST(ast)
        if (process.env.PRINT_FIRESTORE_RULES === 'true') {
            console.log(rules)
        }
        await firebase.loadFirestoreRules({
            projectId: testOptions.firebaseProjectId,
            rules: rules,
        })
    }

    const services = createServices({
        backend: 'memory',
        firebase: firebaseApp as any,
        storage,
        queryParams: testOptions.queryParams ?? {},
        history: null!,
        uiMountPoint: null!,
        localStorage: null!,
        clipboard: mockClipboardAPI,
    })
    if (userId) {
        await services.auth.loginWithEmailPassword({
            email: userId,
            password: 'testing',
        })
    }
    return {
        storage,
        services,
        enforcesAccessRules: true,
        cleanup: async () => {
            await firebaseApp.delete()
        },
    }
}

function pickTestAndOptions<Test, Options>(params: {
    testOrOptions: Test | Options
    defaultOptions: Options
    maybeTest?: Test
}) {
    const testOptions: Options = params.maybeTest
        ? (params.testOrOptions as Options)
        : params.defaultOptions
    const test = params.maybeTest ?? (params.testOrOptions as Test)
    return { testOptions, test }
}

export function createMultiDeviceStorageTestFactory(suiteOptions: {
    backend: StorageTestBackend
}) {
    const factory: StorageTestFactory<
        MultiDeviceStorageTestContext,
        MultiDeviceStorageTestOptions
    > = (
        description: string,
        testOrOptions:
            | StorageTest<MultiDeviceStorageTestContext>
            | MultiDeviceStorageTestOptions,
        maybeTest?: StorageTest<MultiDeviceStorageTestContext>,
    ) => {
        const { testOptions, test } = pickTestAndOptions<
            StorageTest<MultiDeviceStorageTestContext>,
            StorageTestOptions
        >({
            testOrOptions,
            maybeTest,
            defaultOptions: {},
        })
        it(description, async function () {
            const createdDevices: Array<StorageTestDeviceWithCleanup> = []
            const storage = await createStorage({ backend: 'memory' })
            try {
                if (suiteOptions.backend === 'memory') {
                    await test({
                        enforcesAccessRules: false,
                        createDevice: async (options) => {
                            const device = await createMemoryTestDevice({
                                ...options,
                                storage,
                            })
                            createdDevices.push(device)
                            return device
                        },
                        createSuperuserDevice: async () => {
                            const device = await createMemoryTestDevice({
                                storage,
                            })
                            createdDevices.push(device)
                            return device
                        },
                        skipTest: () => this.skip(),
                    })
                } else if (suiteOptions.backend === 'firebase-emulator') {
                    const firebaseProjectId = `unit-test-${Date.now()}`
                    if (testOptions.printProjectId) {
                        console.log(
                            `Running test with Firebase emulator project: ${firebaseProjectId}`,
                        )
                    }

                    await test({
                        enforcesAccessRules: true,
                        createDevice: async (options) => {
                            const device = await createFirebaseTestDevice({
                                ...options,
                                firebaseProjectId,
                            })
                            createdDevices.push(device)
                            return device
                        },
                        createSuperuserDevice: async (options) => {
                            const device = await createFirebaseTestDevice({
                                ...options,
                                firebaseProjectId,
                                superuser: true,
                            })
                            createdDevices.push(device)
                            return device
                        },
                        skipTest: () => this.skip(),
                    })
                } else {
                    throw new Error(
                        `Got unknown backend for test '${description}': ${suiteOptions.backend}`,
                    )
                }
            } finally {
                await Promise.all(
                    createdDevices.map((device) => device.cleanup()),
                )
            }
        })
    }
    return factory
}

export function createStorageTestFactory(suiteOptions: {
    backend: StorageTestBackend
}) {
    const factory: StorageTestFactory = (
        description: string,
        testOrOptions: StorageTest | StorageTestOptions,
        maybeTest?: StorageTest,
    ) => {
        const { testOptions, test } = pickTestAndOptions<
            StorageTest,
            StorageTestOptions
        >({
            testOrOptions,
            maybeTest,
            defaultOptions: {},
        })

        it(description, async function () {
            if (suiteOptions.backend === 'memory') {
                const device = await createMemoryTestDevice(testOptions)
                await test({
                    ...device,
                    skipTest: () => this.skip(),
                })
            } else if (suiteOptions.backend === 'firebase-emulator') {
                const firebaseProjectId = `unit-test-${Date.now()}`
                if (testOptions.printProjectId) {
                    console.log(
                        `Running test with Firebase emulator project: ${firebaseProjectId}`,
                    )
                }

                const device = await createFirebaseTestDevice({
                    ...testOptions,
                    firebaseProjectId,
                })
                try {
                    await test({
                        ...device,
                        skipTest: () => this.skip(),
                    })
                } finally {
                    await device.cleanup()
                }
            } else {
                throw new Error(
                    `Got unknown backend for test '${description}': ${suiteOptions.backend}`,
                )
            }
        })
    }

    return factory
}

export function createStorageTestSuite(
    description: string,
    suite: StorageTestSuite,
) {
    const backends = selectSuiteBackends()
    describe(description, () => {
        if (backends.has('memory')) {
            describe('In memory (Dexie)', () => {
                suite({ it: createStorageTestFactory({ backend: 'memory' }) })
            })
        }
        if (backends.has('firebase-emulator')) {
            describe('Firebase emulator', () => {
                suite({
                    it: createStorageTestFactory({
                        backend: 'firebase-emulator',
                    }),
                })
            })
        }
    })
}

export function createMultiDeviceStorageTestSuite(
    description: string,
    suite: MultiDeviceStorageTestSuite,
) {
    const backends = selectSuiteBackends()
    describe(description, () => {
        if (backends.has('memory')) {
            describe('In memory (Dexie)', () => {
                suite({
                    it: createMultiDeviceStorageTestFactory({
                        backend: 'memory',
                    }),
                })
            })
        }
        if (backends.has('firebase-emulator')) {
            describe('Firebase emulator', () => {
                suite({
                    it: createMultiDeviceStorageTestFactory({
                        backend: 'firebase-emulator',
                    }),
                })
            })
        }
    })
}

function selectSuiteBackends(): Set<StorageTestBackend> {
    const selectionString = process.env.STORAGE_TEST_BACKEND || 'memory'
    const selection = selectionString.split(',')
    for (const backend of selection) {
        if (!(backend in STORAGE_TEST_BACKENDS)) {
            throw new Error(
                `Unknown test backend passed as STORAGE_TEST_BACKEND`,
            )
        }
    }
    return new Set<StorageTestBackend>(selection as StorageTestBackend[])
}
