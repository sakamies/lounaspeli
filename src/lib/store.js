import { syncedStore, getYjsDoc } from "@syncedstore/core"
import { svelteSyncedStore } from "@syncedstore/svelte"
// import { WebrtcProvider } from "y-webrtc"

const store = syncedStore({ players: {}, lunches: [] })
//Sveltestore is the thing that we actually modify in the page
export const svelteStore = svelteSyncedStore(store)
export const doc = getYjsDoc(store)
// export const webrtcProvider = new WebrtcProvider("TODO:session-id-from-url-param-here", doc)

// export const disconnect = () => webrtcProvider.disconnect()
// export const connect = () => webrtcProvider.connect()
