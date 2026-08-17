import { Client as AppwriteClient, Account, Storage, TablesDB, Functions, Realtime } from 'appwrite'
const client = new AppwriteClient().setEndpoint('https://appwrite.nikkaa.com/v1').setDevKey('cbb711800456a246ecd836bd0eb1d6eb3b97fa79fb230dbcc6c65bd6f6377dc3237f4bb56bc5d91194fac79218fe99665702bc6da1f635e5b07e1ccc4da3ebcb1ccb15e4c1292eb50e067656722019a1a99099448c90a3adfe72689b78658bd384a1f0df5fa020a03dc4f34c8570496e1df4c1569991b9b76efbd375e1d998ab').setProject('nikka-bot')

const databaseId = 'nikka-db'

const account = new Account(client)
const database = new TablesDB(client)
const storage = new Storage(client)
const functions = new Functions(client)
const realtime = new Realtime(client)

export {
  account,
  database,
  storage,
  functions,
  realtime,
  databaseId
}