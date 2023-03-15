import * as wn from 'webnative'
import stringify from 'json-stable-stringify'
import timestamp from 'monotonic-timestamp'
import { sign, toString } from './util.js'
import { Implementation } from 'webnative/components/crypto/implementation'
// import Crypto from 'crypto'
type KeyStore = Implementation['keystore']

interface appInfo {
    name:string,
    creator:string
}

interface newPost {
    text:string,
    alt?: string,
    author: string
}

interface Message {
    sequence: number,
    timestamp: number,
    author: string,
    content: { type:string, text:string, alt:string, mentions: string[] }
    signature?: string
}

interface wnfsBlobsArgs {
    APP_INFO: appInfo,
    LOG_DIR_PATH?: string,
    wnfs: wn.FileSystem
    BLOB_DIR_PATH?: string
}

export class WnfsBlobs {
    APP_INFO:appInfo
    LOG_DIR_PATH:string
    BLOB_DIR_PATH:string
    wnfs:wn.FileSystem

    constructor ({ APP_INFO, LOG_DIR_PATH, BLOB_DIR_PATH, wnfs }:wnfsBlobsArgs) {
        this.APP_INFO = APP_INFO
        this.wnfs = wnfs
        this.LOG_DIR_PATH = LOG_DIR_PATH || 'log'
        this.BLOB_DIR_PATH = BLOB_DIR_PATH || 'blob'
    }

    /**
     * @description Write a new post to the `wnfs`. This will find the latest
     * the correct sequence number for the post, and get the signature of the
     * last post
     * @param file the image File
     * @param newPost content for the new post
     */
    async post (keystore:KeyStore, file:File, { text, alt, author }:newPost)
    :Promise<Message> {
        const logPath = wn.path.appData(
            this.APP_INFO,
            wn.path.directory(this.LOG_DIR_PATH)
        )

        await this.wnfs.mkdir(logPath)
        const existingPosts = await this.wnfs.ls(logPath)
        const ns = (Object.keys(existingPosts) || [])
            .map(key => parseInt(key.split('.')[0]))
            .sort((a, b) => b - a) // sort descending order

        const n = ns.length ? (ns[0] + 1) : 0

        // get filepath for the post JSON
        // posts are like /log-dir/1.json
        const newPostPath = wn.path.appData(
            this.APP_INFO,
            wn.path.file(this.LOG_DIR_PATH, n + '.json')
        )

        // write the JSON
        const newPost:Message = await createPostFromContent(keystore, {
            sequence: n,
            text,
            alt,
            author
        })
        await this.wnfs.write(
            newPostPath,
            new TextEncoder().encode(JSON.stringify(newPost))
        )

        const imgFilepath = wn.path.appData(
            this.APP_INFO,
            // __@TODO__ -- handle other file extensions
            wn.path.file(this.BLOB_DIR_PATH, n + '-0.jpg')
            // ^ we are only supporting single image per post right now
        )

        const reader = new FileReader()
        reader.onloadend = async () => {
            await this.wnfs.write(imgFilepath, reader.result as Uint8Array)
            console.log('img path written...', imgFilepath)
            await this.wnfs.publish()
        }

        reader.readAsArrayBuffer(file)

        return newPost
    }
}

interface newPostArgs {
    sequence: number,  // post sequence number
    alt?: string,  // alt text for image
    author: string  // author DID
    text: string  // message text
}

/**
 * @description Create a post from given content.
 */
async function createPostFromContent (keystore, args:newPostArgs):Promise<Message> {
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
