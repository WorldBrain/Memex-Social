import * as _ from 'lodash'
import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'glob'
const toposort = require('toposort')

export async function main() {
    const workspaceDir = path.resolve(__dirname, '..')
    const lernaConfig = JSON.parse(
        fs.readFileSync(path.join(workspaceDir, 'lerna.json')).toString(),
    )
    const packageGlobs: string[] = lernaConfig['packages']
    const potentialPackageDirs = _.flatten(
        packageGlobs.map((packageGlob) =>
            glob.sync(path.join(workspaceDir, packageGlob)),
        ),
    )
    const packageDirs = potentialPackageDirs.filter((dir) =>
        fs.existsSync(path.join(dir, 'package.json')),
    )
    const packageInfoList = packageDirs.map((dir) =>
        JSON.parse(fs.readFileSync(path.join(dir, 'package.json')).toString()),
    )
    const packageInfoByName = _.fromPairs(
        packageInfoList.map((info) => [info.name, info]),
    )

    const packageNames = Object.keys(packageInfoByName)
    const packageEdges: Array<[string, string]> = []
    for (const packageInfo of packageInfoList) {
        for (const dependencyList of [
            packageInfo.dependencies,
            packageInfo.devDependencies ?? [],
        ]) {
            for (const dependency of Object.keys(dependencyList)) {
                if (packageInfoByName[dependency]) {
                    packageEdges.push([packageInfo.name, dependency])
                }
            }
        }
    }

    const sorted = toposort.array(packageNames, packageEdges).reverse()
    console.log(sorted.join(' '))
}

if (require.main === module) {
    main()
}
