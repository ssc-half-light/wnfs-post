import { test } from 'tapzero'
import { WnfsBlobs } from '../src/index.js'
import * as wn from 'webnative'

test('make a post', async t => {
    const APP_INFO = { name: 'test', creator: 'test' }

    const program = await wn.program({
        namespace: APP_INFO
    })

    if (!program.session?.fs) return

    // constructor ({ APP_INFO, LOG_DIR_PATH, BLOB_DIR_PATH, wnfs }:wnfsBlobsArgs) {
    const wnfsBlobs = new WnfsBlobs({
        wnfs: program.session.fs,
        APP_INFO
    })

})
