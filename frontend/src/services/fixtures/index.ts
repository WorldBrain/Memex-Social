// import * as jsYaml from 'js-yaml'
import { loadFixtures } from '@worldbrain/storex-data-tools/lib/test-fixtures/loading'
// import { dumpFixtures } from '@worldbrain/storex-data-tools/lib/test-fixtures/dumping'
import { Storage } from "../../storage/types";
import { FixtureFetcher, Fixture } from './types';
export * from './types'

export default class FixtureService {
    private loading = Promise.resolve()

    constructor(private options: { storage: Storage, fixtureFetcher: FixtureFetcher }) {
    }

    async loadFixture(name: string, options?: { context?: { [key: string]: any } }) {
        return this.loading = (async () => {
            let fixture = await this.options.fixtureFetcher(name)
            await loadFixtures({ storageManager: this.options.storage.serverStorageManager, fixtures: fixture.objects, context: options && options.context })
        })()
    }

    // async dumpFixtures(options : { collections : string[] }) {
    //     return jsYaml.safeDump(await dumpFixtures(this.options.storage.manager, options))
    // }

    async waitForFixtureLoad() {
        return this.loading
    }
}

export async function defaultFixtureFetcher(name: string): Promise<Fixture> {
    const response = await fetch('/playground/fixture/' + name)
    const data = response.json()
    return data
}
