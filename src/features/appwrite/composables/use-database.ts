import { ID, Query } from 'appwrite'
import { database, databaseId } from '../core'

function useDatabase() {
  return {
    getAll: async (collection: string, ownerID: string) =>
      database.listRows({
        databaseId,
        tableId: collection,
        // queries: [Query.equal('owner', ownerID), Query.orderDesc('important'), Query.orderAsc('day'), Query.orderDesc('$createdAt'), Query.limit(300)],
        queries: [Query.equal('owner', ownerID), Query.limit(300), Query.orderDesc('$createdAt')],
        total: false
      }),
    fetchAll: async (collection: string, queries?: string[], ignoreQueries = false, countTotal = false) => {
      const allQueries = ignoreQueries && queries?.length ? queries : [Query.orderDesc('$createdAt'), Query.limit(100)]
      if (!ignoreQueries && queries?.length) {
        allQueries?.push(...queries)
      }

      return database.listRows({
        databaseId,
        tableId: collection,
        queries: allQueries,
        total: countTotal
      })
    },
    get: async (collection: string, id: string) => database.getRow({ databaseId, tableId: collection, rowId: id }),
    save: async (collection: string, id: string, data: any) => await database.createRow({ databaseId, tableId: collection, rowId: id, data }),
    update: async (collection: string, id: string, data: any) => await database.updateRow({ databaseId, tableId: collection, rowId: id, data }),
    delete: async (collection: string, id: string) => {
      await database.deleteRow({ databaseId, tableId: collection, rowId: id })
    },
    saveNewClient: async (clientData: Client, id?: string) => {
      try {
        // upload photo
        clientData.photo = await window.desktop.invoke('upload-file', clientData.photo, 'photo')
        clientData.passportPhoto = await window.desktop.invoke('upload-file', clientData.passportPhoto, 'passport')
        // handle applicants photos and passports
        if (Array.isArray(clientData.applicants) && clientData.applicants.length) {
          for (let i = 0; i < clientData.applicants.length; i++) {
            clientData.applicants[i].photo = await window.desktop.invoke<string>('upload-file', clientData.applicants[i].photo, 'photo')
            clientData.applicants[i].passportPhoto = await window.desktop.invoke<string>('upload-file', clientData.applicants[i].passportPhoto, 'passport')
          }
        }
      } catch (error) {
        console.log('error at uploading photos', (error as Error).message)
      }

      clientData.applicants = JSON.stringify(clientData.applicants || []) as unknown as Applicant[]
      // remove id
      clientData.$id = undefined as unknown as string
      try {
        console.log('client to save', clientData)
        return database.createRow({
          databaseId,
          tableId: 'clients',
          rowId: id || ID.unique(),
          data: clientData
        })
      } catch (error) {
        console.log('error at saving client', (error as Error).message)
        return
      }
    },
    updateClient: async (client: Client) => {
      try {
        await database.updateRow({
          databaseId,
          tableId: 'clients',
          rowId: client.$id,
          data: {
            email: client.email,
            phoneNumber: client.phoneNumber
          } as Client
        })
      } catch (error) {
        console.log('error updating client:', (error as Error).message)
      }
    }
  }
}

export default useDatabase