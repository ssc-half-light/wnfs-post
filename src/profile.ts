import { sign, toString } from './util.js'
import stringify from 'json-stable-stringify'
import { Implementation } from 'webnative/components/crypto/implementation'
type KeyStore = Implementation['keystore']

interface ProfileArgs {
    humanName: string
    author: string
    username: string
    rootDID: string
    description?: string
}

export interface Profile extends ProfileArgs {
    type: string,
    signature: string
}

/**
 * @description Create a signed profile, don't write anything.
 */
export async function createProfile (keystore:KeyStore, args:ProfileArgs)
:Promise<Profile> {
    // const { username } = args

    return Object.assign(args, {
        type: 'about',
        signature: toString(await sign(keystore, stringify(args)))
    })
}
