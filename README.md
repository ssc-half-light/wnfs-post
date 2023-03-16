# wnfs blobs

Use Fission as storage for a merkle log with associated blobs.

## example

### create a post
```ts
import { test } from 'tapzero'
import { createDID, createUsername } from '../src/util.js'
import { WnfsBlobs } from '../src/index.js'

test('make a post', async t => {
    const APP_INFO = { name: 'test', creator: 'test' }

    const program = await wn.program({
        namespace: APP_INFO
    })
    const { crypto } = program.components
    const username = await createUsername(await createDID(crypto))

    // *must* call `register` before we use the `session`
    await program.auth.register({ username })

    const { keystore } = program.components.crypto

    const session = program.session ?? await program.auth.session()

    // constructor ({ APP_INFO, LOG_DIR_PATH, BLOB_DIR_PATH, wnfs }:wnfsBlobsArgs) {
    const wnfsBlobs = new WnfsBlobs({
        wnfs: session.fs,
        APP_INFO
    })

    const res = await wnfsBlobs.post(keystore, file, {
        text: 'testing',
        author: 'abc'
    })

    // @TODO -- verify signature
    t.ok(res.signature)
    t.equal(res.content.type, 'post', 'should set content.type')
    t.equal(res.content.text, 'testing', 'should set content.text')
})
```
