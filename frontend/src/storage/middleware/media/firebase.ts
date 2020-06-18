const toBuffer = require('typedarray-to-buffer')
const Dauria = require('dauria')
import * as firebase from 'firebase'
import { MediaStorage, UnsavedMediaObject } from "@worldbrain/storex-media-middleware/lib/types";

export type FirebaseMediaPathMapper = (options : { user : firebase.User | null, collectionName : string, fieldName : string }) => string

export default class FirebaseMediaStorage implements MediaStorage {
    constructor(private options : { firebase: typeof firebase, pathMapper : FirebaseMediaPathMapper }) {
    }

    async storeMediaObject(mediaObject : UnsavedMediaObject, options : { collectionName : string, fieldName : string, parent : any }) : Promise<string> {
        const path = this.options.pathMapper({ user: firebase.auth().currentUser, ...options })
        const storageRef = this.options.firebase.storage().ref(path)
        const dataBuffer = toBuffer(mediaObject.data)
        const dataUri = Dauria.getBase64DataURI(dataBuffer, mediaObject.mimetype) as string
        await storageRef.putString(dataUri)
        return path
    }

    async getMediaObjectInfo(id : string | number) : Promise<{url : string}> {
        return { url: `${id}` }
    }
}
