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
    const session = program.session ?? await program.auth.session()

    const wnfsBlobs = new WnfsBlobs({
        wnfs: session.fs,
        APP_INFO,
        program
    })

    const post = await wnfsBlobs.post(file, {
        text: 'testing'
    })

    t.equal(post.author, await writeKeyToDid(program.components.crypto),
        'should have the right author in the post')
    t.ok(post.signature, 'should have a signature')
    t.equal(post.content.type, 'post', 'should set content.type')
    t.equal(post.content.text, 'testing', 'should set content.text')
})
```
