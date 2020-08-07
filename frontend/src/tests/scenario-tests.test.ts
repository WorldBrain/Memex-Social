import fs from 'fs'
import path from 'path'
import makeDir from 'make-dir'
import { Builder, By, Key, until } from 'selenium-webdriver'
import { render, fireEvent, screen } from '@testing-library/react'
import { createMemoryHistory } from 'history'
import { DevelopmentRpcInterface, DevelopmentRpcRequest, DevelopmentRpcResponse } from '../rpc/types';
import { getDefaultScenarioModules } from '../services/scenarios';
import { Scenario } from '../services/scenarios/types';
import RouterService from '../services/router';
import ROUTES, { RouteName } from '../routes';
import { mainProgram } from '../setup/main'
import { renderMainUi } from '../main-ui'
import { loadFixture, loadSingleFixture } from '../services/fixtures/utils'
const io = require('socket.io-client')
// import * as webdriver from 'selenium-webdriver'
// import * as chrome from 'selenium-webdriver/chrome'
// import * as firefox from 'selenium-webdriver/firefox'

class UiConnection {
    private socket: any
    private waitForUi: Promise<void>
    // private resolveInitialize? : () => void

    constructor() {
        this.socket = io('http://localhost:5030')

        this.waitForUi = new Promise((resolve, reject) => {
            this.socket.on('registered', (event: any) => {
                if (event.type === 'ui') {
                    resolve()
                }
            })
        })
        this.socket.on('connect', () => {
            this.socket.emit('set-connection-type', { type: 'peer' })
        })
    }

    async execRequest(request: DevelopmentRpcRequest) {
        // console.log('waiting for ui')
        await this.waitForUi
        // console.log('got ui')
        return await new Promise((resolve, reject) => {
            // console.log('sending request')
            this.socket.on('rpc-response', (event: DevelopmentRpcResponse) => {
                if (event.success) {
                    resolve(event.data)
                } else {
                    console.error('Error in UI:', event.data.message)
                    console.error('Stack trace:\n ')
                    console.error(event.data.stack.map(
                        (frame: any) => `  ${frame.functionName} at line ${frame.lineNumber} of ${frame.fileName}`
                    ).join('\n\n') + '\n')
                    reject(new Error(event.data.message))
                }
            })
            this.socket.on('error', reject)

            this.socket.emit('rpc-request', request)
        })
    }

    get methods(): DevelopmentRpcInterface {
        return new Proxy({}, {
            get: (target, name: keyof DevelopmentRpcInterface) => (...args: any[]) => {
                return this.execRequest({ func: name, args })
            }
        }) as DevelopmentRpcInterface
    }

    async cleanup() {
        this.socket.close()
    }
}

describe('Browser scenario tests', () => {
    let i = 0
    const router = new RouterService({ history: null as any, auth: null as any, routes: ROUTES })

    function maybeIt(description: string, test: () => void) {
        if (process.env.TEST_BROWSER_E2E === 'true') {
            it(description, async function () {
                this.timeout(10000)
                await test()
            })
        } else {
            it.skip(description, test)
        }
    }

    async function writeScreenshot(screenshot: string, options: { pageName: string, scenarioName: string, stepIndex: number, stepName: string }) {
        const scenarioDirPath = path.join(__dirname, `scenarios/${options.pageName}/${options.scenarioName}`)
        await makeDir(scenarioDirPath)
        fs.writeFileSync(path.join(scenarioDirPath, `${options.stepIndex}_${options.stepName}.png`), screenshot, 'base64')
    }

    async function runTest(scenario: Scenario, options: { pageName: string, scenarioName: string }) {
        const startUrlPath = router.getUrl(scenario.startRoute.route as RouteName, scenario.startRoute.params)

        const uiConnection = new UiConnection()

        let driver = await new Builder().forBrowser('chrome').build()
        try {
            await driver.get(`http://localhost:3000${startUrlPath}?rpc=true`)
            await uiConnection.methods.run({ queryParams: { scenario: `${options.pageName}/${options.scenarioName}`, walkthrough: 'true' } })

            const screenshot = await driver.takeScreenshot()
            writeScreenshot(screenshot, { ...options, stepIndex: 0, stepName: 'start' })

            for (const [stepIndex, step] of Object.entries(scenario.steps)) {
                await uiConnection.methods.stepWalkthrough()
                // await new Promise(resolve => setTimeout(resolve, 300))
                const screenshot = await driver.takeScreenshot()
                writeScreenshot(screenshot, { ...options, stepIndex: parseInt(stepIndex) + 1, stepName: step.name })
            }
        } finally {
            await driver.quit()
            await uiConnection.cleanup()
        }
    }

    for (const [pageName, pageScenarios] of Object.entries(getDefaultScenarioModules())) {
        describe(`Page: ${pageName}`, () => {
            for (const [scenarioName, scenario] of Object.entries(pageScenarios)) {
                maybeIt(`Scenario: ${scenarioName}`, async () => {
                    await runTest(scenario, { pageName, scenarioName })
                })
            }
        })
    }

    // maybeIt('should run', async function () {

    // })
})

describe('In-memory scenario tests', () => {
    function maybeIt(description: string, test: () => void) {
        if (process.env.TEST_MEMORY_E2E === 'true') {
            it(description, async function () {
                await test()
            })
        } else {
            it.skip(description, test)
        }
    }

    async function runTest(scenario: Scenario, options: { pageName: string, scenarioName: string }) {
        const history = createMemoryHistory()
        const main = await mainProgram({
            queryParams: { scenario: `${options.pageName}/${options.scenarioName}`, walkthrough: 'true' },
            backend: 'memory',
            domUnavailable: true,
            navigateToScenarioStart: true,
            history,
            uiRunner: async (options) => { render(renderMainUi(options)) },
            fixtureFetcher: async name =>
                loadFixture(name, { fixtureFetcher: loadSingleFixture })
        })

        for (const [stepIndex, step] of Object.entries(scenario.steps)) {
            await main.stepWalkthrough?.()
        }
    }

    for (const [pageName, pageScenarios] of Object.entries(getDefaultScenarioModules())) {
        describe(`Page: ${pageName}`, () => {
            for (const [scenarioName, scenario] of Object.entries(pageScenarios)) {
                maybeIt(`Scenario: ${scenarioName}`, async () => {
                    await runTest(scenario, { pageName, scenarioName })
                })
            }
        })
    }
})
