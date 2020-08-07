import flatten from 'lodash/flatten'
import * as fs from 'fs'
import * as path from 'path'
import jsYaml from 'js-yaml'
import { Fixture } from "./types"

export async function loadFixture(name: string, options: { fixtureFetcher: (name: string) => Promise<Fixture> }) {
    let fixture = await options.fixtureFetcher(name)
    while (fixture['extends']) {
        const getBases = (fixture: Fixture): string[] => typeof fixture.extends === 'string' ? [fixture.extends] : fixture.extends || []
        const bases: string[] = getBases(fixture)
        const baseFixtures = await Promise.all(bases.map(
            base => options.fixtureFetcher(base)
        ))

        const mergedExtends = flatten(baseFixtures.map(
            baseFixture => getBases(baseFixture)
        ))
        fixture = {
            extends: mergedExtends.length ? mergedExtends : undefined,
            objects: Object.assign({}, ...baseFixtures.map(baseFixture => baseFixture.objects), fixture.objects)
        }
    }
    return fixture
}

export function loadSingleFixture(name: string) {
    return jsYaml.safeLoad(fs.readFileSync(path.join(__dirname, '../../../fixtures', `${name}.yaml`).toString()).toString())
}
