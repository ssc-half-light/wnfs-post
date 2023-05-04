import timestamp from 'monotonic-timestamp'
import * as msg from '@ssc-hermes/message'
import { Crypto } from '@oddjs/odd'

export interface Profile {
    humanName: string
    author: string
    username: string
    rootDID: string
    description?: string
}

/**
 * @description Create a signed profile, don't write anything.
 */
export async function createProfile (crypto:Crypto.Implementation, args:Profile)
:Promise<msg.SignedRequest<Profile & {timestamp:number}>> {
    return msg.create(
        crypto,
        Object.assign({}, args, { timestamp: timestamp() })
    )
}
