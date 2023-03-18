# wnfs blobs

Use Fission as storage for post objects with associated blobs.

## install
```
npm i -S @nichoth/wnfs-blobs
```

## example

### create a post

`wnfsBlobs.post` will write a given post and blob to your `wnfs` filesystem, and then return the post.

```ts
import { test } from 'tapzero'
import { createDID, createUsername } from 'wnfs-blobs/util'
import { WnfsBlobs } from 'wnfs-blobs/index'

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

    const wnfsBlobs = new WnfsBlobs({
        wnfs: session.fs,
        APP_INFO,
        program
    })

    // file is an object like you would get from a form in HTML
    const res = await wnfsBlobs.post(keystore, file, {
        text: 'testing',
        author: 'abc'
    })

    
    t.ok(res.signature)  // @TODO -- verify signature
    t.equal(res.content.type, 'post', 'should set content.type')
    t.equal(res.content.text, 'testing', 'should set content.text')
})
```
