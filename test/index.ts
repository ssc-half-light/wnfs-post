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
let wnfsPosts:WnfsPosts

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

    wnfsPosts = new WnfsPosts({
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

test('make a profile', async t => {
    const profile = await wnfsPosts.profile({
        humanName: 'aaa',
        description: 'look at my description'
    })

    t.equal(typeof profile.username, 'string', 'should have username')
    t.equal(typeof profile.humanName, 'aaa', 'should have username')
    t.equal(profile.description, 'look at my description',
        'should have description')
    t.equal(typeof profile.signature, 'string', 'should have signature')
})

// test('read your own profile', async t => {

// })
