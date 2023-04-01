import { sign, toString } from './util.js'
import stringify from 'json-stable-stringify'
import { Implementation } from 'webnative/components/crypto/implementation'
import timestamp from 'monotonic-timestamp'
type KeyStore = Implementation['keystore']

interface ProfileArgs {
    humanName: string
    author: string
    username: string
    rootDID: string
    description?: string
}

export interface ProfileValue extends ProfileArgs {
    type: string,
    timestamp: number
}

export interface Profile {
    value: ProfileValue,
    signature: string
}

/**
 * @description Create a signed profile, don't write anything.
 */
export async function createProfile (keystore:KeyStore, args:ProfileArgs)
:Promise<Profile> {
    return {
        value: Object.assign(args, { type: 'about', timestamp: timestamp() }),
        signature: toString(await sign(keystore, stringify(args)))
    }
}
