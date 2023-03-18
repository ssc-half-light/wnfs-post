import { test } from 'tapzero'
import { createDID, createUsername } from '../src/util.js'
import { WnfsPosts } from '../src/index.js'
import { writeKeyToDid } from '../src/util'

// @ts-ignore
const wn = window.webnative

const blob = new Blob(['ok'], {
    type: 'image/jpeg',
})
const file = new File([blob], 'ok.jpg', { type: 'image/jpeg' })

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
})
