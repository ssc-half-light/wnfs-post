import { test } from 'tapzero'
import { WnfsBlobs } from '../src/index.js'
import fs from 'node:fs'
import path from 'node:path'
import * as wn from 'webnative'

const data = fs.readFileSync(path.join(__dirname, 'caracal.jpg'))
const blob = new Blob([data as BlobPart])
const file = new File([blob], 'caracal.jpg')

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
})
