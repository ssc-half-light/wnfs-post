import * as uint8arrays from 'uint8arrays'
import type { Crypto } from 'webnative'
import { publicKeyToDid } from 'webnative/did/transformers'
import * as BrowserCrypto from 'webnative/components/crypto/implementation/browser'
import * as wn from 'webnative'
import stringify from 'json-stable-stringify'
import { Message } from './post'
import { Implementation } from 'webnative/components/crypto/implementation'
type KeyStore = Implementation['keystore']

const KEY_TYPE = {
    RSA: 'rsa',
    Edwards: 'ed25519',
    BLS: 'bls12-381'
}
const EDWARDS_DID_PREFIX = new Uint8Array([ 0xed, 0x01 ])
const BLS_DID_PREFIX = new Uint8Array([ 0xea, 0x01 ])
const RSA_DID_PREFIX = new Uint8Array([ 0x00, 0xf5, 0x02 ])
const BASE58_DID_PREFIX = 'did:key:z'

export function sign (keystore:KeyStore, msg:string) {
    return keystore.sign(uint8arrays.fromString(msg))
}

export function toString (arr:Uint8Array) {
    return uint8arrays.toString(arr, 'base64url')
}

export async function createUsername (program:wn.Program):Promise<string> {
    const { crypto } = program.components
    const did = await createDID(crypto)
    const normalizedDid = did.normalize('NFD')
    const hashedUsername = await BrowserCrypto.sha256(
        new TextEncoder().encode(normalizedDid)
    )

    return uint8arrays.toString(hashedUsername, 'base32').slice(0, 32)
}

async function createDID (crypto: Crypto.Implementation): Promise<string> {
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

export const verify = async (did:string, msg:Message) => {
    const { publicKey, type } = didToPublicKey(did)
    const keyType = BrowserCrypto.did.keyTypes[type]
    const sig = msg.signature as string
    const msgValue:Partial<Message> = Object.assign({}, msg)
    delete msgValue.signature
    const msgString = stringify(msgValue)

    const res = await keyType.verify({
        message: uint8arrays.fromString(msgString),
        publicKey,
        signature: uint8arrays.fromString(sig, 'base64url')
    })

    return res
}

export function didToPublicKey (did:string): ({ publicKey:Uint8Array, type:string }) {
    if (!did.startsWith(BASE58_DID_PREFIX)) {
        throw new Error('Please use a base58-encoded DID formatted `did:key:z...`')
    }

    const didWithoutPrefix = ('' + did.substr(BASE58_DID_PREFIX.length))
    const magicalBuf = uint8arrays.fromString(didWithoutPrefix, 'base58btc')
    const { keyBuffer, type } = parseMagicBytes(magicalBuf)

    return {
        publicKey: keyBuffer,
        type
    }
}

export function rootDIDForWnfs (program):string {
    return program.session.fs.account.rootDID
}

export function rootDIDForUsername (program, username) {
    return program.components.reference.didRoot.lookup(username)
}

/**
 * Parse magic bytes on prefixed key-buffer
 * to determine cryptosystem & the unprefixed key-buffer.
 */
function parseMagicBytes (prefixedKey) {
    // RSA
    if (hasPrefix(prefixedKey, RSA_DID_PREFIX)) {
        return {
            keyBuffer: prefixedKey.slice(RSA_DID_PREFIX.byteLength),
            type: KEY_TYPE.RSA
        }
    // EDWARDS
    } else if (hasPrefix(prefixedKey, EDWARDS_DID_PREFIX)) {
        return {
            keyBuffer: prefixedKey.slice(EDWARDS_DID_PREFIX.byteLength),
            type: KEY_TYPE.Edwards
        }
    // BLS
    } else if (hasPrefix(prefixedKey, BLS_DID_PREFIX)) {
        return {
            keyBuffer: prefixedKey.slice(BLS_DID_PREFIX.byteLength),
            type: KEY_TYPE.BLS
        }
    }

    throw new Error('Unsupported key algorithm. Try using RSA.')
}

const arrBufs = {
    equal: (aBuf, bBuf) => {
        const a = new Uint8Array(aBuf)
        const b = new Uint8Array(bBuf)
        if (a.length !== b.length) return false

        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false
        }

        return true
    }
}

function hasPrefix (prefixedKey, prefix) {
    return arrBufs.equal(prefix, prefixedKey.slice(0, prefix.byteLength))
}

