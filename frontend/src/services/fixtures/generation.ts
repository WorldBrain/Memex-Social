import update from 'immutability-helper'
import pick from 'lodash/pick'
import { StorageRegistry } from "@worldbrain/storex";
import { generateSchemaTemplate, generateObjects } from "@worldbrain/storex-data-tools/lib/data-generation"
import { MultiObjectTemplate } from "@worldbrain/storex-data-tools/lib/data-generation/types";
import normalizeUrl from '@worldbrain/memex-url-utils/lib/normalize'

export type GenerateTestDataOptions = Omit<MultiObjectTemplate, 'values' | 'prepareObjects'>;

export function generateTestData(registry: StorageRegistry, options: GenerateTestDataOptions) {
    const schemaTemplate = generateSchemaTemplate(registry.collections, {
        autoPkType: 'string'
    })
    schemaTemplate.values = update(schemaTemplate.values, {
        sharedList: {
            title: { $set: { fake: ({ lorem }) => lorem.sentence() } },
            description: { $set: { fake: ({ lorem }) => lorem.sentences() } },
        },
        sharedListEntry: {
            originalUrl: { $set: { template: ({ context }) => context.originalUrl } },
            normalizedUrl: { $set: { template: ({ context }) => normalizeUrl(context.originalUrl) } },
        },
        sharedAnnotation: {
            body: { $set: { fake: ({ lorem }) => lorem.sentences() } },
            comment: { $set: { fake: ({ lorem }) => lorem.sentences() } },
            normalizedPageUrl: { $set: { template: ({ object }) => object('sharedListEntry').normalizedUrl } },
        },
        sharedAnnotationListEntry: {
            sharedAnnotation: { $set: { template: ({ context }) => context.sharedAnnotation.id } },
            normalizedPageUrl: { $set: { template: ({ context }) => context.sharedAnnotation.normalizedPageUrl } },
        },
    })
    const objects = generateObjects({
        values: pick(schemaTemplate.values, Object.keys(options.counts)),
        prepareObjects: {
            sharedListEntry: ({ value }) => ({ context: { originalUrl: value({ fake: ({ internet }) => internet.url() }) } }),
            sharedAnnotationListEntry: ({ object }) => ({ context: { sharedAnnotation: object('sharedAnnotation') } })
        },
        order: ['user', 'sharedList', 'sharedListEntry', 'sharedAnnotation', 'sharedAnnotationListEntry'],
        ...options,
    })
    return objects
}
