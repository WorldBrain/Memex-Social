import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'
const stylesContext = require.context('../main-ui', true, /styles.module\.scss$/)

export type StyleModuleMap = {[elementName : string] : StyleModule}
export type StyleModule = {[className : string] : string}

export function getDefaultStyleModules() : StyleModuleMap {
    const styleModules : StyleModuleMap = {}

    for (const path of stylesContext.keys()) {
        const matches = /\/([^/]+)\/styles.module\.scss$/.exec(path)
        if (!matches) {
            throw new Error(`Style module with weird path: ${path}`)
        }
        const moduleName = matches[1]
        const elementName = upperFirst(camelCase(moduleName))
        styleModules[elementName] = stylesContext(path)
    }

    return styleModules
}

export default class StyleRegistryService {
    private styleModules = getDefaultStyleModules()

    getStyleModule(elementName : string) : StyleModule {
        return this.styleModules[elementName]
    }
}
