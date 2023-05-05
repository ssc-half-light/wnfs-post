# profile

## create
Create a profile through the main `wnfsPost` object.

Create profile:
```js
const profile = await wnfsPost.profile({
    humanName: 'aaa',
    description: 'look at my description'
})
```

Needs two params:
```ts
interface newProfile {
    description?: string,
    humanName: string,
}
```
