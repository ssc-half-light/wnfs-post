import { test } from 'tapzero'
import { WnfsPost } from '../src'

// @ts-ignore
const wn = window.webnative

test('request friendship', async t => {
    const APP_INFO = { name: 'testing', creator: 'test' }
    const wnfsPosts = await WnfsPost.create(wn, APP_INFO)

    const details = await wnfsPosts.requestFriendship(
        'ensxz45kz4wlmbkm3o6e4x2cgbg7foxe')

    console.log('details', details)
    t.ok(details, 'returns share details')
})
