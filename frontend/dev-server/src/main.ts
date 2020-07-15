import flatten from 'lodash/flatten'
import * as fs from 'fs'
import * as path from 'path'
import jsYaml from 'js-yaml'
import Koa from 'koa'
const Router = require('koa-router')
const IO = require('koa-socket-2');

interface Fixture {
    extends?: string | string[]
    objects: { [collection: string]: any[] }
}

export async function main() {
    const app = new Koa()
    const router = new Router()
    const io = new IO()

    router.get('/playground/fixture/:name', async (ctx: Koa.Context, next) => {
        ctx.body = await loadFixture(ctx.params.name, { fixtureFetcher: loadSingleFixture })
    })

    io.attach(app)

    const socketsByType = {}
    const socketDataById: { [id: string]: { type: string } } = {}
    const maybeSendTo = (targetType: string, eventName: string, eventData: any) => {
        const target = socketsByType[targetType]
        if (target) {
            target.emit(eventName, eventData)
        }
    }

    io.on('set-connection-type', (ctx, data) => {
        const socketType = data.type as 'peer' | 'ui'
        socketsByType[socketType] = ctx.socket
        socketDataById[ctx.socket.id] = { type: socketType }
        if (socketType === 'ui') {
            maybeSendTo('peer', 'registered', { type: 'ui' })
        }
    })
    io.on('disconnect', (ctx) => {
        const socketData = socketDataById[ctx.socket.id]
        if (socketData) {
            delete socketsByType[socketData.type]
            delete socketDataById[ctx.socket.id]
        }
    })
    io.on('rpc-request', (ctx, data) => {
        maybeSendTo('ui', 'rpc-request', data)
    })
    io.on('rpc-response', (ctx, data) => {
        //        console.log('sending data', data)
        maybeSendTo('peer', 'rpc-response', data)
    })
    io.on('console.log', (ctx, data) => {
        console.log('UI console.log:', ...data)
    })

    app
        .use(router.routes())
        .use(router.allowedMethods())
        .listen(5030)
}

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
    return jsYaml.safeLoad(fs.readFileSync(path.join(__dirname, '../../fixtures', `${name}.yaml`).toString()).toString())
}

if (require.main === module) {
    main()
}
