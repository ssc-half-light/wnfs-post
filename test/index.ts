import { test } from 'tapzero'
import { createUsername, verify } from '../src/util.js'
import { WnfsPosts } from '../src/index.js'
import { createProfile } from '../src/profile.js'
import { writeKeyToDid } from '../src/util'

// @ts-ignore
const wn = window.webnative

const blob = new Blob(['ok'], {
    type: 'image/jpeg',
})
const file = new File([blob], 'ok.jpg', { type: 'image/jpeg' })
let wnfsPosts:WnfsPosts
let program

test('make a post', async t => {
    const APP_INFO = { name: 'test', creator: 'test' }

    program = await wn.program({
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

test('create and write a profile', async t => {
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

test('read your own profile', async t => {
    const profile = await wnfsPosts.profile()
    t.ok(profile, 'should get profile')
    t.equal(profile.type, 'about', 'should have "type: about" property')
    t.equal(profile.description, 'look at my description',
        'should have the right description')
    t.ok(profile.author, 'should have author in profile')
})

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
