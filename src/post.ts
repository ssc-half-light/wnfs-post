import stringify from 'json-stable-stringify'
import { sign, toString } from './util.js'
import timestamp from 'monotonic-timestamp'
import { Implementation } from 'webnative/components/crypto/implementation'
type KeyStore = Implementation['keystore']

interface newPostArgs {
    sequence: number,  // post sequence number
    alt?: string,  // alt text for image
    author: string  // author DID
    text: string  // message text
}

export interface Message {
    sequence: number,
    timestamp: number,
    author: string,
    content: { type:string, text:string, alt:string, mentions: string[] }
    signature?: string
}

/**
 * @description Create a post from given content.
 */
export async function createPost (keystore:KeyStore, args:newPostArgs):Promise<Message> {
    const { sequence, text, alt, author } = args

    const msg:Message = {
        sequence,
        timestamp: +timestamp(),
        author,
        content: {
            type: 'post',
            text: text,
            alt: alt || '',
            mentions: [sequence + '-0.jpg']  // handle 1 image per post
        }
    }

    const sig = await sign(keystore, stringify(msg))
    msg.signature = toString(sig)
    return msg
}
