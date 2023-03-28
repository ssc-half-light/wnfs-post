# wnfs posts
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
import { WnfsPosts } from 'wnfs-post/index'

test('make a post', async t => {
    const APP_INFO = { name: 'test', creator: 'test' }

    const program = await wn.program({
        namespace: APP_INFO
    })

    // *must* call `register` before we use the `session`
    const username = await createUsername(program)
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
    t.ok(post.signature, 'should have a signature')
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

### create a username
This will create a unique 32 character string that will be used for DNS, and is unique per account (not per machine).

```js
import * as wn from 'webnative'
import { createUsername } from 'wnfs-post/util'

const program = await wn.program({
    namespace: { name: 'test', creator: 'test' }
})
const username = await createUsername(program)
```

### create a "profile"
Create a profile object and write it to `wnfs`

```js
test('make a profile', async t => {
    // call `.profile` with arguments, and it will write a profile to `wnfs`
    const profile = await wnfsPosts.profile({
        humanName: 'aaa',
        description: 'look at my description'
    })

    t.equal(typeof profile.username, 'string', 'should have a username')
    t.equal(profile.humanName, 'aaa', 'should have a human name')
    t.equal(profile.description, 'look at my description',
        'should have description')
    t.equal(typeof profile.signature, 'string', 'should have a signature')
    t.equal(profile.author, await writeKeyToDid(program.components.crypto),
        'should set author to the DID that wrote the message')
})
```

### read your profile
Call `.profile` without any arguments, and it will read from `wnfs`

```js
const profile = await wnfsPosts.profile()
```

### create a post, then write it

```js
test('create a profile, then write it to disk', async t => {
    const { keystore } = program.components.crypto
    const profile = await createProfile(keystore, {
        humanName: 'bbb',
        author: await writeKeyToDid(program.components.crypto),
        username: await createUsername(program),
        rootDID: await writeKeyToDid(program.components.crypto),
        description: 'wooo describing things'
    })
    t.ok(profile.signature, 'should sign the profile message')
    await wnfsPosts.writeProfile(profile)
})

test('read the profile we just made', async t => {
    const profile = await wnfsPosts.profile()
    t.equal(profile.humanName, 'bbb', 'should return the new profile')
})
```
