# wnfs blobs

Use Fission as storage for *hermes*

## example

```ts
const APP_INFO = { name: 'test', creator: 'test' }

const program = await wn.program({
    namespace: APP_INFO
})
const { keystore } = program.components.crypto

const blobs = new WnfsBlobs({
    wnfs: program.session.fs,
    APP_INFO,
    LOG_DIR_PATH: '/log',  // optional
    BLOB_DIR_PATH: '/blobs'  // optional
})

const post = await blobs.post(keystore, file, { text, alt, author: authorDid })
```