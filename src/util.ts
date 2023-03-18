import * as uint8arrays from 'uint8arrays'
import { sha256 } from 'webnative/components/crypto/implementation/browser'
import type { Crypto } from 'webnative'
import { publicKeyToDid } from 'webnative/did/transformers'
import { Implementation } from 'webnative/components/crypto/implementation'
type KeyStore = Implementation['keystore']

export function sign (keystore:KeyStore, msg:string) {
    return keystore.sign(uint8arrays.fromString(msg))
}

export function toString (arr:Uint8Array) {
    return uint8arrays.toString(arr, 'base64url')
}

export async function createUsername (did:string):Promise<string> {
    const normalizedDid = did.normalize('NFD')
    const hashedUsername = await sha256(
        new TextEncoder().encode(normalizedDid)
    )

    return uint8arrays.toString(hashedUsername, 'base32').slice(0, 32)
}

export async function createDID (
    crypto: Crypto.Implementation
): Promise<string> {
    const pubKey = await crypto.keystore.publicExchangeKey()
    const ksAlg = await crypto.keystore.getAlgorithm()
    return publicKeyToDid(crypto, pubKey, ksAlg)
}

export async function writeKeyToDid (crypto: Crypto.Implementation)
:Promise<string> {
    const [pubKey, ksAlg] = await Promise.all([
        await crypto.keystore.publicWriteKey(),
        await crypto.keystore.getAlgorithm()
    ])
    return publicKeyToDid(crypto, pubKey, ksAlg)
}
