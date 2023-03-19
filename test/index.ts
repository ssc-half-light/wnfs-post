import { test } from 'tapzero'
import { createUsername, verify } from '../src/util.js'
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
        namespace: APP_INFO,
        debug: true
    })

    // *must* call `register` before we use the `session`
    const username = await createUsername(program)
    await program.auth.register({ username })
    const session = program.session ?? await program.auth.session()

    const wnfsPosts = new WnfsPosts({
        wnfs: session.fs,
        APP_INFO,
        program,
        session
    })

    const post = await wnfsPosts.post(file, {
        text: 'testing'
    })

    t.equal(post.author, await writeKeyToDid(program.components.crypto),
        'should have the right author in the post')
    t.equal(post.content.type, 'post', 'should set content.type')
    t.equal(post.content.text, 'testing', 'should set content.text')
    t.equal(post.username, username, 'should have the username in the post')
    t.equal(await verify(post.author, post), true, 'should verify the post')
})
