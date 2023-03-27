import { sign, toString } from './util.js'
import stringify from 'json-stable-stringify'
import { Implementation } from 'webnative/components/crypto/implementation'
type KeyStore = Implementation['keystore']

export interface Profile {
    type: string,
    humanName: string,
    author: string,
    username: string,
    rootDID: string,
    description?: string,
    signature: string
}

interface ProfileArgs {
    username: string
    author: string
    rootDID: string
    humanName: string
    description?: string
}

// sbot.publish({type: 'about', about: yourId, description: description}, cb)

/**
 * @description Create a signed profile.
 */
export async function createProfile (keystore:KeyStore, args:ProfileArgs)
:Promise<Profile> {
    // const { username } = args

    return Object.assign(args, {
        type: 'about',
        signature: toString(await sign(keystore, stringify(args)))
    })
}
