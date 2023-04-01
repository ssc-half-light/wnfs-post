import { test } from 'tapzero'
import { createUsername, verify } from '../src/util.js'
import { WnfsPost } from '../src/index.js'
import { createProfile } from '../src/profile.js'
import { writeKeyToDid } from '../src/util'

// @ts-ignore
const wn = window.webnative

const blob = new Blob(['ok'], {
    type: 'image/jpeg',
})
const file = new File([blob], 'ok.jpg', { type: 'image/jpeg' })
let wnfsPost:WnfsPost

test('make a post', async t => {
    const APP_INFO = { name: 'testing', creator: 'test' }

    wnfsPost = await WnfsPost.create(wn, APP_INFO)

    const post = await wnfsPost.post(file, {
        text: 'testing'
    })

    t.ok(wnfsPost, 'should create a wnfsPosts object')
    t.equal(post.author, await writeKeyToDid(wnfsPost.program.components.crypto),
        'should have the right author in the post')
    t.equal(post.content.type, 'post', 'should set content.type')
    t.equal(post.content.text, 'testing', 'should set content.text')
    t.equal(post.username, wnfsPost.username, 'should have the username in the post')
    t.equal(await verify(post.author, post), true, 'should verify the post')
})

test('create and write a profile', async t => {
    const profile = await wnfsPost.profile({
        humanName: 'aaa',
        description: 'look at my description'
    })

    t.equal(typeof profile.value.username, 'string', 'should have a username')
    t.ok(profile.value.timestamp, 'should have a timestamp')
    t.equal(profile.value.humanName, 'aaa', 'should have a human name')
    t.equal(profile.value.description, 'look at my description',
        'should have description')
    t.equal(typeof profile.signature, 'string', 'should have a signature')
    t.equal(profile.value.author, await writeKeyToDid(wnfsPost.program.components.crypto),
        'should set author to the DID that wrote the message')
})

test('read your own profile', async t => {
    const profile = await wnfsPost.profile()
    t.ok(profile, 'should get profile')
    t.equal(profile.value.type, 'about', 'should have "type: about" property')
    t.equal(profile.value.description, 'look at my description',
        'should have the right description')
    t.ok(profile.value.author, 'should have author in profile')
})

test('create a profile, then write it to disk', async t => {
    const { keystore } = wnfsPost.program.components.crypto
    const profile = await createProfile(keystore, {
        humanName: 'bbb',
        author: await writeKeyToDid(wnfsPost.program.components.crypto),
        username: await createUsername(wnfsPost.program.components.crypto),
        rootDID: await writeKeyToDid(wnfsPost.program.components.crypto),
        description: 'wooo describing things'
    })
    t.ok(profile.signature, 'should sign the profile message')
    await wnfsPost.writeProfile(profile)
})

test('read the profile we just made', async t => {
    const profile = await wnfsPost.profile()
    t.equal(profile.value.humanName, 'bbb', 'should return the new profile')
})
