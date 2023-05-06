# wnfs posts
Use Fission as storage for post objects with associated blobs.

## install
```
npm i -S @ssc-hermes/wnfs-post
```

## test

### Run tests with `test/index.ts`:
```bash
npm test
```

### Pass in the test file to run
```bash
npm test -- test/friendship.ts
```

## example

### create
Use `.create`, not the constructor, to make a new instance, because it is async

```js
import * as wn from 'webnative'
const APP_INFO = { name: 'testing', creator: 'test' }
const wnfsPosts = await WnfsPosts.create(wn, APP_INFO)
```

### create a post
`wnfsPost.post` will write a given post and blob to your `wnfs` filesystem, and then return the post.

```js
import * as wn from 'webnative'
import { test } from 'tapzero'
import { writeKeyToDid, createUsername, verify } from 'wnfs-post/util'
import { WnfsPosts } from 'wnfs-post'

test('make a post', async t => {
    const APP_INFO = { name: 'testing', creator: 'test' }

    // use `.create` instead of `new` because it is async
    const wnfsPosts = await WnfsPosts.create(wn, APP_INFO)

    const post = await wnfsPosts.post(file, {
        text: 'testing'
    })

    t.ok(wnfsPosts, 'should create a wnfsPosts object')
    t.equal(post.author, await writeKeyToDid(wnfsPosts.program.components.crypto),
        'should have the right author in the post')
    t.equal(post.content.type, 'post', 'should set content.type')
    t.equal(post.content.text, 'testing', 'should set content.text')
    t.equal(post.username, wnfsPosts.username, 'should have the username in the post')
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
const username = await createUsername(program.components.crypto)
```
