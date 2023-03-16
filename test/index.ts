import { test } from 'tapzero'
import { WnfsBlobs } from '../src/index.js'
// import fs from 'fs'
// import path from 'path'
// import * as wn from 'webnative'

// @ts-ignore
const wn = window.webnative

// const data = fs.readFileSync(path.join(__dirname, 'caracal.jpg'))
// const blob = new Blob([data as BlobPart])
// const file = new File([blob], 'caracal.jpg')

const blob = new Blob(['ok'], {
    type: 'image/jpeg',
})
const file = new File([blob], 'ok.jpg', { type: 'image/jpeg' })

test('make a post', async t => {
    const APP_INFO = { name: 'test', creator: 'test' }

    const program = await wn.program({
        namespace: APP_INFO
    })

    const { keystore } = program.components.crypto

    if (!program.session?.fs) return

    // constructor ({ APP_INFO, LOG_DIR_PATH, BLOB_DIR_PATH, wnfs }:wnfsBlobsArgs) {
    const wnfsBlobs = new WnfsBlobs({
        wnfs: program.session.fs,
        APP_INFO
    })

    const res = await wnfsBlobs.post(keystore, file, {
        text: 'testing',
        author: ''
    })

    t.ok(res.signature)
    console.log('res', res)
})
