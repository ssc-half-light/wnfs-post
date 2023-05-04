// import { sign, toString } from './util.js'
// import stringify from 'json-stable-stringify'
import timestamp from 'monotonic-timestamp'
import * as msg from '@ssc-hermes/message'
import { Crypto } from '@oddjs/odd'
// import { Implementation } from '@oddjs/odd/components/crypto/implementation'
// type KeyStore = Implementation['keystore']

export interface Profile {
    humanName: string
    author: string
    username: string
    rootDID: string
    description?: string
}

// export interface ProfileValue extends ProfileArgs {
//     type: string,
//     timestamp: number
// }

// export interface Profile {
//     value: ProfileValue,
//     signature: string
// }

/**
 * @description Create a signed profile, don't write anything.
 */
export async function createProfile (crypto:Crypto.Implementation, args:Profile)
:Promise<msg.SignedRequest<Profile>> {
    return msg.create(crypto, Object.assign({}, args, { timestamp: timestamp() }))
}
