import stringify from 'json-stable-stringify'
import { sign, toString } from './util.js'
import timestamp from 'monotonic-timestamp'
import { Implementation } from '@oddjs/odd/components/crypto/implementation'
type KeyStore = Implementation['keystore']

interface newPostArgs {
    sequence: number,  // post sequence number
    alt?: string,  // alt text for image
    author: string  // author DID
    text: string  // message text
    username: string  // DNS username
}

export interface Message {
    sequence: number,
    timestamp: number,
    author: string,
    username: string,
    content: { type:string, text:string, alt:string, mentions: string[] }
    signature: string
}

/**
 * @description Create a signed post from given content.
 */
export async function createPost (keystore:KeyStore, args:newPostArgs):Promise<Message> {
    const { sequence, text, alt, author, username } = args

    const unsignedMsg = {
        sequence,
        timestamp: +timestamp(),
        author,
        username,
        content: {
            type: 'post',
            text: text,
            alt: alt || '',
            mentions: [sequence + '-0.jpg']  // handle 1 image per post
        }
    }

    const msg:Message = Object.assign(unsignedMsg, {
        signature: toString(await sign(keystore, stringify(unsignedMsg)))
    })

    return msg
}
