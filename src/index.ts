import * as wn from 'webnative'
import type { Crypto } from 'webnative'
import { Message, createPost } from './post'
import { createProfile, Profile } from './profile'
import { writeKeyToDid, rootDIDForWnfs } from './util'

interface newProfile {
    description?: string,
    humanName: string,
}

interface newPostArgs {
    text:string,
    alt?: string
}

interface wnfsPostsArgs {
    APP_INFO:{ name:string, creator:string }
    LOG_DIR_PATH?: string,
    wnfs: wn.FileSystem
    BLOB_DIR_PATH?: string
    crypto: Crypto.Implementation
    session: wn.Session
}

export class WnfsPosts {
    APP_INFO:{ name:string, creator:string }
    LOG_DIR_PATH:string
    BLOB_DIR_PATH:string
    PROFILE_PATH:string
    wnfs:wn.FileSystem
    crypto: Crypto.Implementation
    session: wn.Session

    constructor ({ APP_INFO, LOG_DIR_PATH, BLOB_DIR_PATH, wnfs, crypto, session }:wnfsPostsArgs) {
        this.crypto = crypto
        this.session = session
        this.APP_INFO = APP_INFO
        this.wnfs = wnfs
        this.LOG_DIR_PATH = LOG_DIR_PATH || 'log'
        this.BLOB_DIR_PATH = BLOB_DIR_PATH || 'blob'
        this.PROFILE_PATH = 'profile.json'
    }

    /**
     * @description Write a new post to the `wnfs`. This will find the correct
     * sequence number and author DID for the post, and sign the post
     * @param {File} file - the image File, like from an HTML form
     * @param {Object} newPostArgs content for the new post
     * @param {string} newPostArgs.text newPostArgs.text - text content for the post
     * @param {string} newPostArgs.alt newPostArgs.alt -
     * `alt` text attribute for the image
     */
    async post (file:File, { text, alt }:newPostArgs):Promise<Message> {
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

        // get filepath for the new post JSON
        // posts are like /log-dir/1.json
        const newPostPath = wn.path.appData(
            this.APP_INFO,
            wn.path.file(this.LOG_DIR_PATH, n + '.json')
        )

        const { keystore } = this.crypto
        const author = await writeKeyToDid(this.crypto)

        // write the JSON
        const newPost:Message = await createPost(keystore, {
            sequence: n,
            text,
            alt,
            author,
            username: this.session.username
        })

        const imgFilepath = wn.path.appData(
            this.APP_INFO,
            // __@TODO__ -- handle other file extensions
            wn.path.file(this.BLOB_DIR_PATH, n + '-0.jpg')
            // ^ we are only supporting single image per post right now
        )

        const reader = new FileReader()
        reader.onloadend = async () => {
            await Promise.all([
                this.wnfs.write(
                    newPostPath,
                    new TextEncoder().encode(JSON.stringify(newPost))
                ),

                this.wnfs.write(imgFilepath, reader.result as Uint8Array)
            ])

            await this.wnfs.publish()
        }

        reader.readAsArrayBuffer(file)

        return newPost
    }

    async writeProfile (profile:Profile):Promise<WnfsPosts> {
        const profilePath = wn.path.appData(
            this.APP_INFO,
            wn.path.file(this.PROFILE_PATH)
        )

        await this.wnfs.write(
            profilePath,
            new TextEncoder().encode(JSON.stringify(profile))
        )
        await this.wnfs.publish()

        return this
    }

    /**
     * @description Create a signed profile and write it to `wnfs`
     * at the right path.
     */
    async profile (args?:newProfile):Promise<Profile> {
        if (!this.session.fs) throw new Error("There's no fs")

        if (!args) {
            // read and return existing profile
            const path = wn.path.appData(
                this.APP_INFO,
                wn.path.file(this.PROFILE_PATH)
            )

            const profileData = await this.wnfs.read(path)
            return JSON.parse(new TextDecoder().decode(profileData))
        }

        const profileArgs = {
            humanName: args.humanName,
            description: args.description,
            author: await writeKeyToDid(this.crypto),
            username: this.session.username,
            rootDID: rootDIDForWnfs(this.wnfs)
        }
        const { keystore } = this.crypto
        const updatedProfile = await createProfile(keystore, profileArgs)
        const profilePath = wn.path.appData(
            this.APP_INFO,
            wn.path.file(this.PROFILE_PATH)
        )

        await this.wnfs.write(
            profilePath,
            new TextEncoder().encode(JSON.stringify(updatedProfile))
        )

        await this.wnfs.publish()

        return updatedProfile
    }
}
