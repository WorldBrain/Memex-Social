import StackTrace from 'stacktrace-js'
import { DevelopmentRpcInterface } from './types'
import { MainProgramSetup, ProgramQueryParams } from '../setup/types'
import { mainProgram } from '../setup/main'

export class DevelopmentRpc implements DevelopmentRpcInterface {
    private mainSetup?: MainProgramSetup

    async run(options: { queryParams: ProgramQueryParams }): Promise<void> {
        // console.log('running main application')
        this.mainSetup = await mainProgram({ ...options, backend: 'memory' })
    }

    async stepWalkthrough(): Promise<void> {
        if (!this.mainSetup) {
            throw new Error(
                `Tried to execute 'stepWalkthrough()' RPC method before calling 'run()'`,
            )
        }
        const scenarioService = this.mainSetup.services.scenarios
        if (!scenarioService) {
            throw new Error(
                `Tried to execute 'stepWalkthrough()' RPC method, but 'services.scenarios' is undefined`,
            )
        }
        await scenarioService.stepWalkthrough()
    }
}

export function runDevelopmentRpc() {
    const io = require('socket.io-client')
    const socket = io('http://localhost:5000')
    socket.on('connect', () => {
        socket.emit('set-connection-type', { type: 'ui' })
    })
    console.log = (...args: any[]) => {
        socket.emit('console.log', args)
    }

    const rpc = new DevelopmentRpc()
    socket.on(
        'rpc-request',
        async (event: { func: keyof DevelopmentRpcInterface; args: any[] }) => {
            try {
                await (rpc[event.func] as any).apply(rpc, event.args)
                socket.emit('rpc-response', { success: true, data: null })
            } catch (e) {
                socket.emit('rpc-response', {
                    success: false,
                    data: {
                        message: e.toString(),
                        stack: await StackTrace.fromError(e),
                    },
                })
            }
        },
    )
}
