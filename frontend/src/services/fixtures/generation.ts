import pick from 'lodash/pick'
import { StorageRegistry } from "@worldbrain/storex";
import { generateSchemaTemplate, generateObjects } from "@worldbrain/storex-data-tools/lib/data-generation"
import { MultiObjectTemplate } from "@worldbrain/storex-data-tools/lib/data-generation/types";

export function generateTestData(registry: StorageRegistry, options: Omit<MultiObjectTemplate, 'values'>) {
    const schemaTemplate = generateSchemaTemplate(registry.collections, {
        autoPkType: 'string'
    })
    const objects = generateObjects({
        values: pick(schemaTemplate.values, Object.keys(options.counts)),
        ...options,
    })
}
