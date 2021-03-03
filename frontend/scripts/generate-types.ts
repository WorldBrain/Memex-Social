import kebabCase from 'lodash/kebabCase'
import * as fs from 'fs'
import * as path from 'path'
import StorageManager, { StorageRegistry } from '@worldbrain/storex'
import { StorageModule } from '@worldbrain/storex-pattern-modules'
import { generateTypescriptInterfaces } from '@worldbrain/storex-typescript-generation'
import { createStorage } from '../src/storage'
const glob = require('fast-glob')

type StorageModuleInfoMap = { [className: string]: StorageModuleInfo }
interface StorageModuleInfo {
    path: string
    baseNameWithoutExt: string
    isSingleFile: boolean
}

export async function main() {
    const rootTypesPath = path.join(
        __dirname,
        '../../external/@worldbrain/memex-common/ts/web-interface/types/storex-generated',
    )
    if (!fs.existsSync(rootTypesPath)) {
        fs.mkdirSync(rootTypesPath)
    }

    const storage = await createStorage({ backend: 'memory' })
    const storageModuleInfoMap = collectStorageModuleInfo()
    for (const storageModule of Object.values(storage.serverModules)) {
        const className = Object.getPrototypeOf(storageModule).constructor.name
        console.log(`Generating types for module ${className}...`)
        const storageModuleInfo = storageModuleInfoMap[className]
        const types = generateTypesForStorageModule(storageModule, {
            storageModuleInfo,
            storageRegistry: storage.serverStorageManager.registry,
        })

        const moduleTypesPath = path.join(
            rootTypesPath,
            `${storageModuleInfo.baseNameWithoutExt}.ts`,
        )
        console.log(`Writing types to ${moduleTypesPath}...`)
        fs.writeFileSync(moduleTypesPath, types)
        console.log(`Successfuly written types to ${moduleTypesPath}!\n`)
    }
}

function collectStorageModuleInfo(): StorageModuleInfoMap {
    const infoMap: StorageModuleInfoMap = {}

    const coreStorageModulesGlob = path.join(
        __dirname,
        '../src/storage/modules/*',
    )
    const featureStorageModulesGlob = path.join(
        __dirname,
        '../src/features/*/storage',
    )
    // const storageModuleBaseNames = fs.readdirSync(storageModulesPath)
    for (const storageModulePath of glob.sync(
        [coreStorageModulesGlob, featureStorageModulesGlob],
        { onlyFiles: false },
    )) {
        const StorageModuleClass = require(storageModulePath).default
        if (typeof StorageModuleClass !== 'function') {
            console.log(`Skipping module: ${storageModulePath}`)
            continue
        }

        const isSingleFile = /\.ts$/.test(storageModulePath)
        const storageModuleClasName = StorageModuleClass.name

        let baseName = path.basename(storageModulePath)
        if (baseName === 'storage') {
            baseName = path.basename(path.dirname(storageModulePath))
        }

        infoMap[storageModuleClasName] = {
            path: storageModulePath,
            isSingleFile,
            baseNameWithoutExt: isSingleFile
                ? /(.+)\.ts$/.exec(baseName)[1]
                : baseName,
        }
    }

    return infoMap
}

function generateTypesForStorageModule(
    storageModule: StorageModule,
    options: {
        storageModuleInfo: StorageModuleInfo
        storageRegistry: StorageRegistry
    },
): string {
    const collections = Object.keys(storageModule.getConfig().collections || {})
    const interfaces = generateTypescriptInterfaces(options.storageRegistry, {
        autoPkType: 'generic',
        collections,
        fieldTypeMap: {
            media: 'any',
            timestamp: 'number',
            string: 'string',
            boolean: 'boolean',
            int: 'number',
            json: 'any',
        },
        generateImport: (options) => {
            return { path: `./${kebabCase(options.collectionName)}.ts` }
        },
    })
    return interfaces
}

if (require.main === module) {
    main()
}
