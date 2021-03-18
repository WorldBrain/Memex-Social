import fs from 'fs'
import path from 'path'
import { generateRulesAstFromStorageModules } from '@worldbrain/storex-backend-firestore/lib/security-rules'
import { serializeRulesAST } from '@worldbrain/storex-backend-firestore/lib/security-rules/ast'
import { getUserMessageRules } from '@worldbrain/memex-common/lib/user-messages/service/firebase'
import { createStorage } from '../src/storage'

export async function main() {
    const firebaseRootDir = process.argv[2]
    if (!firebaseRootDir) {
        throw new Error(`Please provide output file path as only argument`)
    }
    const firebaseConfig = JSON.parse(
        fs.readFileSync(path.join(firebaseRootDir, 'firebase.json')).toString(),
    )

    const storage = await createStorage({ backend: 'memory' })
    const firestoreRulesPath = path.join(
        firebaseRootDir,
        firebaseConfig['firestore']['rules'],
    )
    const ast = await generateRulesAstFromStorageModules(
        storage.serverModules as any,
        {
            storageRegistry: storage.serverStorageManager.registry,
            excludeTypeChecks: [
                'sharedSyncLogDeviceInfo',
                'sharedSyncLogEntryBatch',
            ],
        },
    )
    const serialized = serializeRulesAST(ast)
    fs.writeFileSync(firestoreRulesPath, serialized)
    console.log(
        `Firestore security rules successfully written to file '${firestoreRulesPath}'`,
    )

    const firebaseRulesPath = path.join(
        firebaseRootDir,
        firebaseConfig['database']['rules'],
    )
    fs.writeFileSync(
        firebaseRulesPath,
        JSON.stringify(
            {
                rules: {
                    ...getUserMessageRules(),
                },
            },
            null,
            2,
        ),
    )
    console.log(
        `Real-time database security rules successfully written to file '${firebaseRulesPath}'`,
    )
}

if (require.main === module) {
    main()
}
