import * as uint8arrays from 'uint8arrays'
import { Implementation } from 'webnative/components/crypto/implementation'
type KeyStore = Implementation['keystore']

export function sign (keystore:KeyStore, msg:string) {
    return keystore.sign(uint8arrays.fromString(msg))
}

export function toString (arr:Uint8Array) {
    return uint8arrays.toString(arr, 'base64url')
}
