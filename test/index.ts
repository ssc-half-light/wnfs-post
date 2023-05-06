import { test } from 'tapzero'
import { writeKeyToDid } from '@ssc-hermes/util'
import { verify } from '../src/util.js'
import { WnfsPost } from '../src/index.js'

// @ts-ignore
const wn = self.oddjs

const blob = new Blob(['ok'], { type: 'image/jpeg', })
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
