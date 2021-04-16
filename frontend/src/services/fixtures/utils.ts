import flatten from 'lodash/flatten'
import * as fs from 'fs'
import * as path from 'path'
import jsYaml from 'js-yaml'
import { Fixture } from './types'

export async function loadFixture(
    name: string,
    options: { fixtureFetcher: (name: string) => Promise<Fixture> },
) {
    const getBases = (fixture: Fixture): string[] =>
        typeof fixture.extends === 'string'
            ? [fixture.extends]
            : fixture.extends || []

    const mergeFixtures = (child: Fixture, bases: Fixture[]) => {
        const mergedExtends = [
            ...new Set(
                flatten(bases.map((baseFixture) => getBases(baseFixture))),
            ),
        ]

        const merged: Fixture = {
            extends: mergedExtends.length ? mergedExtends : undefined,
            objects: {},
        }
        for (const fixture of [...bases, child]) {
            for (const [collectionName, collectionObjects] of Object.entries(
                fixture.objects ?? {},
            )) {
                if (!merged.objects[collectionName]) {
                    merged.objects[collectionName] = collectionObjects
                } else {
                    merged.objects[collectionName].push(...collectionObjects)
                }
            }
        }
        return merged
    }

    let fixture = await options.fixtureFetcher(name)
    while (fixture['extends']) {
        const bases: string[] = getBases(fixture)
        const baseFixtures = await Promise.all(
            bases.map((base) => options.fixtureFetcher(base)),
        )

        fixture = mergeFixtures(fixture, baseFixtures)
    }
    return fixture
}

export function loadSingleFixture(name: string) {
    return jsYaml.safeLoad(
        fs
            .readFileSync(
                path
                    .join(__dirname, '../../../fixtures', `${name}.yaml`)
                    .toString(),
            )
            .toString(),
    )
}
