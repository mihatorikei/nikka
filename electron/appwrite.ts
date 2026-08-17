import { Client, Storage, Users, Databases, ID } from 'node-appwrite'
import { readFileSync } from 'node:fs'

const client = new Client()

client.setEndpoint('https://appwrite.nikkaa.com/v1').setProject('nikka-bot').setKey('standard_0a84912e53204048a1f4c8c741a4cc125b21c41257c0298335c3be8ba2e2ee24784be140e0af3008fdd2721af49d5957166835998d768cd480c30fdb75a8142ce74b256a040b408cb1d53dc7554a8f73a566a74509258959d190ef833603959b6830045670c5198a6e6408b1198b788bf56208ed3289cc367e8d0628bab3d775')

const storage = new Storage(client)
const users = new Users(client)

const uploadFile = async (path: string, fileName: string, bucket: 'photos' | 'passports' = 'photos') => {
  const file = readFileSync(path)
  const fileClass = new File([file], fileName)
  return storage.createFile({
    bucketId: bucket,
    fileId: fileName,
    file: fileClass,
    onProgress: (uploadProgress) => {
      console.log('Upload progress: ', uploadProgress.progress)
    }
  })
}

/** delete a file from appwrite storage by its name (aka id) */
const deleteFile = async (fileName: string, bucket: 'photos' | 'passports' = 'photos') =>
  storage.deleteFile({
    bucketId: bucket,
    fileId: fileName
  })

const filePath = (fileName: string, bucket = 'photos') => `https://appwrite.nikkaa.com/v1/storage/buckets/${bucket}/files/${fileName}/view?project=nikka-bot`

// const getUsers = async () => (await users.list()).users.map((u) => ({ name: u.name, id: u.$id }))
async function getUsers() {
  const usersList = await users.list()
  const filteredUsers = usersList.users.map((u) => ({ name: u.name, id: u.$id }))
  return [...filteredUsers.filter((u) => u.id !== 'trash')!, filteredUsers.find((u) => u.id === 'trash')!]
}

const useDatabase = () => {
  const database = new Databases(client)
  return {
    save: async (collection: string, id: string, data: any) => await database.createDocument('vegapunk-database', collection, id || ID.unique(), data),
    getAll: async (collection: string, queries?: string[]) => await database.listDocuments('vegapunk-database', collection, queries),
    delete: async (collection: string, id: string) => await database.deleteDocument('vegapunk-database', collection, id),
    updateClient: async (documentID: string, data: Partial<globalThis.Client>) => await database.updateDocument('vegapunk-database', 'clients', documentID, data)
  }
}

export { uploadFile, deleteFile, filePath, getUsers, useDatabase }
