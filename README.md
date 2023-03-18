# wnfs blobs

Use Fission as storage for post objects with associated blobs.

## install
```
npm i -S @nichoth/wnfs-post
```

## example

### create a post

`wnfsPost.post` will write a given post and blob to your `wnfs` filesystem, and then return the post.

```ts
import { test } from 'tapzero'
import { createDID, createUsername, verify } from 'wnfs-post/util'
import { WnfsBlobs } from 'wnfs-post/index'

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

    const wnfsPosts = new WnfsPosts({
        wnfs: session.fs,
        APP_INFO,
        program
    })

    const post = await wnfsPosts.post(file, {
        text: 'testing'
    })

    t.equal(post.author, await writeKeyToDid(program.components.crypto),
        'should have the right author in the post')
    t.ok(post.signature, 'should have a signature')  // @TODO -- verify signature
    t.equal(post.content.type, 'post', 'should set content.type')
    t.equal(post.content.text, 'testing', 'should set content.text')
    t.equal(await verify(post.author, post), true, 'should verify the post')
})
```

### verify a post
```ts
import { verify } from 'wnfs-post/util'
// const post = { author: '', signature: '', ... }
const isValid = await verify(post.author, post)
```
