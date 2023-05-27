import { test } from 'tapzero'
import { writeKeyToDid } from '@ssc-hermes/util'
import { create, verify } from '@ssc-hermes/post'
import { WnfsPost } from '../src/index.js'

// @ts-ignore
const wn = self.oddjs
let wnfsPost:WnfsPost

test('make a post', async t => {
    const APP_INFO = { name: 'testing', creator: 'test' }

    wnfsPost = await WnfsPost.create(wn, APP_INFO)
    // const n = await wnfsPost.getNextSeq()

    const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII'
    const file = dataURItoFile(base64, 'test.png')
    const _post = await create(wnfsPost.crypto, file, {
        text: 'testing',
        username: wnfsPost.username,
        alt: 'testing',
        seq: 0,
        prev: null,
        type: 'private'
    })
    const post = await wnfsPost.post(file, _post, { key: '123' })

    console.log('*post*', post)
    t.ok(wnfsPost, 'should create a wnfsPosts object')
    t.equal(post.metadata.prev, null, 'should have null as previous message')
    t.equal(post.metadata.seq, 0, 'should have the right sequence number')
    t.equal(post.metadata.author, await writeKeyToDid(wnfsPost.crypto),
        'should have the right author in the post')
    t.equal(post.metadata.type, 'private', 'should set content.type')
    t.equal(post.content.text, 'testing', 'should set content.text')
    t.equal(post.metadata.username, wnfsPost.username, 'should have the username in the post')
    t.equal(await verify(post.metadata), true, 'should verify the post')
})

function dataURItoFile (dataurl, filename) {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
    }

    return new File([u8arr], filename, { type: mime })
}

// test('read the post we just made', async t => {
//     // @TODO
// })
