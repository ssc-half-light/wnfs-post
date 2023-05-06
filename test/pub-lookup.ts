import * as odd from '@oddjs/odd'
import { components } from '@ssc-hermes/node-components'
import { test } from 'tapzero'
// import * as BrowserCrypto from '@oddjs/odd/components/crypto/implementation/browser'
// import { PublicFile } from '@oddjs/odd/fs/v1/PublicFile'
import { PublicTree } from '@oddjs/odd/fs/v1/PublicTree'
import { getSimpleLinks } from '@oddjs/odd/fs/protocol/basic'

// let { reference } = wnfsPosts.value.program.components

// const USERNAME_TO_LOOKUP = 'ensxz45kz4wlmbkm3o6e4x2cgbg7foxe'
const USERNAME_TO_LOOKUP = 'icidasset'

globalThis.postMessage = function () {}

let program
test('setup', async t => {
    const config = {
        namespace: { creator: 'test', name: 'testing' },
        debug: true
    }

    const fissionComponents = await odd.compositions.fission({
        ...config,
        crypto: components.crypto,
        storage: odd.storage.memory(),
    })

    // const depot = createDepotComponent()

    const componentsWithCustomDepot = {
        ...fissionComponents,
        depot: createDepotComponent()
        // depot: components.depot
    }

    // Create program
    program = await odd.assemble(
        config,
        componentsWithCustomDepot
    )

    // program = await odd.assemble(config, components)
    // program = odd.compositions.fission({
    //     ...config,
    //     crypto: components.crypto,
    //     storage: odd.storage.memory()
    // })

    const profile = await lookup(USERNAME_TO_LOOKUP)

    t.ok(program, 'create a program')
    t.ok(profile, 'profile exists')
    console.log('**profile***', profile)
})

async function lookup (username) {
    // const { reference } = components
    const { reference } = program.components
    // const { reference } = program.components
    // const { reference, depot } = program.components
    const depot = await createDepotComponent()
    const cid = await reference.dataRoot.lookup(username)
    console.log('** cid **', cid)
    console.log('**cid to string**', cid?.toString())
    // const data = (await getSimpleLinks(components.depot, cid))
    const data = (await getSimpleLinks(depot, cid))
    console.log('***data.public***', data.public)
    console.log('**data**', data)
    const publicCid = data.public.cid
    console.log('**public cid**', publicCid)
    const publicTree = await PublicTree.fromCID(depot, reference, publicCid)
    console.log('**public tree**', publicTree)
    const res = await publicTree.ls(
        odd.path.unwrap(odd.path.directory('Unsplash'))
    )
    //     odd.path.unwrap(odd.path.file('profile.js'))

    console.log('**ressssssssss**', res)
    // const links = Object.values(res)
    return res
}

function createDepotComponent () {
    const ipfsGateway = 'https://ipfs.runfission.com'

    function ipfs (path) {
        return fetch(`${ipfsGateway}${path}`)
            .then(r => r.arrayBuffer())
            .then(r => new Uint8Array(r))
    }

    return {
        // Get the data behind a CID
        getBlock: async cid => {
            return ipfs(`/api/v0/block/get?arg=${cid.toString()}`)
        },
        getUnixFile: async cid => {
            return ipfs(`/api/v0/cat?arg=${cid.toString()}`)
        },
        // We're avoiding having to implement all of this,
        // because we're not using it anyway.
        getUnixDirectory: boom,
        putBlock: boom,
        putChunked: boom,
        size: boom,
    }
}

function boom () {
    throw new Error('Method not implemented')
}
