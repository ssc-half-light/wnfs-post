import * as wn from '@oddjs/odd'
import type { Crypto } from '@oddjs/odd'
import { Message, createPost } from './post'
import { createProfile, Profile } from './profile'
import { createUsername, writeKeyToDid, rootDIDForWnfs, sign, toString } from './util'
import { ShareDetails } from '@oddjs/odd/fs/types'
import stringify from 'json-stable-stringify'
import * as Path from '@oddjs/odd/path/index'

export interface AcceptedFriendship {
    type:string,
    requestFrom:string,
    acceptor:string,
    acceptorShareDetails:ShareDetails
}

export interface Friend {
    username:string,
    humanName:string,
    rootDID:string
}

interface RequestValue extends ShareDetails {
    author: string,
    sharedTo: { username: string }
}

export interface FriendRequest {
    value: RequestValue,
    signature: string
}

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
    LOG_DIR?: string,
    wnfs: wn.FileSystem
    BLOB_DIR?: string
    crypto: Crypto.Implementation
    username: string
    program: wn.Program
}

export class WnfsPost {
    APP_INFO:{ name:string, creator:string }
    LOG_DIR:string
    BLOB_DIR:string
    PROFILE_PATH:Path.FilePath<['private', string, ...string[]]>
    FRIENDS_LIST_PATH:Path.FilePath<['private', string, ...string[]]>
    wnfs:wn.FileSystem
    crypto: Crypto.Implementation
    username: string
    program: wn.Program

    constructor ({
        APP_INFO, LOG_DIR, BLOB_DIR, wnfs, crypto, username, program
    }:wnfsPostsArgs) {
        this.crypto = crypto
        this.username = username
        this.APP_INFO = APP_INFO
        this.wnfs = wnfs
        this.program = program
        this.LOG_DIR = LOG_DIR || 'log'
        this.BLOB_DIR = BLOB_DIR || 'blob'
        this.PROFILE_PATH = wn.path.appData(
            this.APP_INFO,
            wn.path.file('profile.json')
        )
        this.FRIENDS_LIST_PATH = wn.path.appData(
            this.APP_INFO,
            wn.path.file('friends.json')
        )
    }

    static async create (webnative:(typeof wn), APP_INFO:wn.AppInfo) {
        const program = await webnative.program({
            namespace: APP_INFO,
            debug: true
        })

        const username = await createUsername(program.components.crypto)
        // *must* call `register` before we use the `session`
        const { success } = await program.auth.register({ username })
        if (!success) throw new Error('not success registering username')

        const session = program.session ?? await program.auth.session()
        if (!session) throw new Error('not session')
        if (!session.fs) throw new Error('not session.fs')

        const wnfsPost = new WnfsPost({
            APP_INFO,
            wnfs: session.fs,
            crypto: program.components.crypto,
            username: session.username,
            program
        })

        // if we already have a friend list, don't overwrite it
        if (await session.fs.exists(wnfsPost.FRIENDS_LIST_PATH)) {
            return wnfsPost
        }

        // create necessary directories and files
        await session.fs.write(
            wnfsPost.FRIENDS_LIST_PATH,
            new TextEncoder().encode(JSON.stringify([]))
        )

        return wnfsPost
    }

    /**
     * @description Write a new post to the `wnfs`. This will find the correct
     * sequence number and author DID for the post, and sign the post
     * @param {File} file - the image File, like from an HTML form
     * @param {newPostArgs} newPostArgs content for the new post
     * @param {string} newPostArgs.text newPostArgs.text - text content for the post
     * @param {string} newPostArgs.alt newPostArgs.alt -
     * `alt` text attribute for the image
     */
    async post (file:File, { text, alt }:newPostArgs):Promise<Message> {
        //
        // images for each post are related via naming convention
        //   so post with seq 1 would have an image file like `1-1.jpg`
        //

        const ext = file.name.split('.').pop()?.toLowerCase()

        const logPath = wn.path.appData(
            this.APP_INFO,
            wn.path.directory(this.LOG_DIR)
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
            wn.path.file(this.LOG_DIR, n + '.json')
        )

        const { keystore } = this.crypto
        const author = await writeKeyToDid(this.crypto)

        // write the JSON
        const newPost:Message = await createPost(keystore, {
            sequence: n,
            text,
            alt,
            author,
            username: this.username
        })

        const imgFilepath = wn.path.appData(
            this.APP_INFO,
            // filename is like `postSeqNumber-imageNumber.jpg`
            wn.path.file(this.BLOB_DIR, n + '-0' + '.' + ext)
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

    async writeProfile (profile:Profile):Promise<Profile> {
        await this.wnfs.write(
            this.PROFILE_PATH,
            new TextEncoder().encode(JSON.stringify(profile))
        )
        await this.wnfs.publish()

        return profile
    }

    /**
     * @description Create a signed profile and write it to `wnfs`
     * at the right path, or read a Profile
     */
    async profile (args?:newProfile):Promise<Profile> {
        if (!args) {
            // read and return existing profile
            const profileData = await this.wnfs.read(this.PROFILE_PATH)
            return JSON.parse(new TextDecoder().decode(profileData))
        }

        const profileArgs = {
            humanName: args.humanName,
            description: args.description,
            author: await writeKeyToDid(this.crypto),
            username: this.username,
            rootDID: rootDIDForWnfs(this.wnfs)
        }
        const { keystore } = this.crypto
        const updatedProfile = await createProfile(keystore, profileArgs)

        await this.wnfs.write(
            this.PROFILE_PATH,
            new TextEncoder().encode(JSON.stringify(updatedProfile))
        )

        await this.wnfs.publish()

        return updatedProfile
    }

    /**
     * @description Get the private list of your friends
     * @returns A list of your friends
     */
    async friends ():Promise<Friend[]> {
        const _friendList = await this.wnfs.read(this.FRIENDS_LIST_PATH)
        const friendList = JSON.parse(new TextDecoder().decode(_friendList))
        return friendList
    }

    /**
     * @description Add to your list of friends
     * @param newFriends {Friend[]} the new friends to add
     * @returns newList {Promise<Friend[]>}
     */
    async addFriends (newFriends:Friend[]):Promise<Friend[]> {
        const friendList = JSON.parse(new TextDecoder().decode(
            await this.wnfs.read(this.FRIENDS_LIST_PATH)
        ))
        const newList = friendList.concat(newFriends)
        await this.wnfs.write(
            this.FRIENDS_LIST_PATH,
            new TextEncoder().encode(newList)
        )

        return newList
    }

    /**
     * @see [share private data]{@link https://guide.fission.codes/developers/webnative/sharing-private-data#creating-a-share}
     * @param recipient {string} the machine-readable username you want to be
     * friends with
     * @returns {{
     *   value: { ...ShareDetails, sharedTo: { username }, author },
     *   signature
     * }}
     * @description This will share your 'friends` directory with the given
     * recipient, and request that they do the same
     */
    async requestFriendship (recipient:string):Promise<FriendRequest> {
        if (!(await this.program.fileSystem.hasPublicExchangeKey(this.wnfs))) {
            await this.program.fileSystem.addPublicExchangeKey(this.wnfs)
        }

        const blobPath = wn.path.appData(
            this.APP_INFO,
            wn.path.directory(this.BLOB_DIR)
        )

        const logPath = wn.path.appData(
            this.APP_INFO,
            wn.path.directory(this.LOG_DIR)
        )

        const shareDetails = await this.wnfs.sharePrivate(
            [this.FRIENDS_LIST_PATH, blobPath, logPath, this.PROFILE_PATH],
            { shareWith: recipient }
        )

        // now there is a pending friendship
        // wait for the recipient to accept

        // fs.acceptShare({
        //   shareId: shareDetails.shareId,
        //   sharedBy: shareDetails.sharedBy.username
        // })
        const { keystore } = this.program.components.crypto
        const value:RequestValue = Object.assign(shareDetails, {
            sharedTo: { username: recipient },
            author: await writeKeyToDid(this.crypto)
        })

        return {
            value,
            signature: toString(await sign(keystore, stringify(value)))
        }
    }

    //
    // need to also share your own filepaths when you accept a friendship
    //
    // we also call `wnfs.sharePrivate` and pass the username of the person
    // who is accepting our share
    //

    /**
     * @see {@link https://guide.fission.codes/developers/webnative/sharing-private-data#resolving-the-share | resolving a share}
     * @param shareDetails {ShareDetails} The share details created by the person
     * requesting the friendship
     * @returns {Promise<ShareDetails>} The share details for the 'acceptor',
     * which should be accepted by the requester.
     */
    async acceptFriendship (shareDetails:{ shareId, sharedBy }):Promise<ShareDetails> {
        await this.wnfs.acceptShare({
            shareId: shareDetails.shareId,
            sharedBy: shareDetails.sharedBy.username
        })

        const blobPath = wn.path.appData(
            this.APP_INFO,
            wn.path.directory(this.BLOB_DIR)
        )

        const logPath = wn.path.appData(
            this.APP_INFO,
            wn.path.directory(this.LOG_DIR)
        )

        const myShareDetails = await this.wnfs.sharePrivate(
            [this.FRIENDS_LIST_PATH, blobPath, logPath, this.PROFILE_PATH],
            { shareWith: shareDetails.sharedBy.username }
        )

        //
        // + add them to our list of friends
        //   should add a profile for friend
        //

        return myShareDetails

        // once the other accepts our friendship shares, we are friends
        // need to  send the returned `shareDetails` to the other person
        // the other person then calls `wnfs.acceptShare` on our shareDetails
    }
}

// newly added friend should get a default shared folder
// we can add posts to it
// __public data__
//   * our profile data -- username, description, avatar
//
// __default shared data__
//   * have a default/friends folder for every user
//   * show who your other friends are (this will be configurable in the future)
//   * 'friends' folder contains -- list of friends, photos added by user
//
// have a list of friends that is semi-private (shared with your friends)
// have a 'friends' folder -- this will be the default way to make a post,
//   it goes in the 'fiends' folder
//
