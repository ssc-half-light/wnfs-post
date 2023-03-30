import { test } from 'tapzero'
import { WnfsPosts } from '../src'

// @ts-ignore
const wn = window.webnative

test('friendship', async t => {
    const APP_INFO = { name: 'testing', creator: 'test' }
    const wnfsPosts = await WnfsPosts.create(wn, APP_INFO)

    wnfsPosts.requestFriendship()
})
