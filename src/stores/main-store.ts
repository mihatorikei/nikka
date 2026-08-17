import { defineStore } from 'pinia'
import { nextTick } from 'vue'
import type { Models } from 'appwrite'
import UserReporter from '@/features/users/composables/use-reporter'
import { account, storage } from '@/features/appwrite/core'
import { ClientsBookingState, ClientsTarget } from '@/features/appwrite/types'
import useDatabase from '@/features/appwrite/composables/use-database'

const useMainStore = defineStore('main', {
  state: () => ({
    user: {} as Models.User,
    clients: [] as Client[],
    settings: {} as AppSettings,
    users: [] as (Models.User<Models.Preferences> & { total: number })[],
    selectedClients: [] as string[],
    appNotification: {
      text: '',
      type: '' as 'error' | 'success' | 'info' | 'warning'
    },
    appNotificationTimeout: 0 as number | NodeJS.Timeout,
    isFetchingClients: false,
    settingsFetching: false,
    downloadingPhotos: false,
    fetchingUsers: false,
    contextMenuClient: null as Client | null,
    contextMenuPosition: { x: 0, y: 0 },
    confirmMessage: '',
    clientPopover: {
      name: '',
      photo: '',
      applicantsNames: [],
      isPremium: false,
      target: ClientsTarget.NKC_SCHENGEN,
      createdAt: '',
      updatedAt: '',
      createdBy: ''
    } as PopoverClientType,
    alarmIsOn: false,
    reporter: undefined as UserReporter | undefined,
  }),
  actions: {
    selectClient(clientID: string, all = false, bookingState = ClientsBookingState.PENDING) {
      if (all) {
        if (this.clients.filter((c) => c.bookingState === bookingState).every((c) => this.selectedClients.includes(c.$id))) {
          this.selectedClients = []
        } else {
          this.selectedClients = this.clients.filter((c) => c.bookingState === bookingState).map((c) => c.$id)
        }
        return
      }
      const targetIndex = this.selectedClients.findIndex((id) => id === clientID)
      if (targetIndex < 0) {
        this.selectedClients.push(clientID)
      } else {
        this.selectedClients.splice(targetIndex, 1)
      }
    },
    clearSelectedClients(){
      this.selectedClients = []
    },
    showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
      clearTimeout(this.appNotificationTimeout)
      this.appNotification.type = type
      this.appNotification.text = message
      this.appNotificationTimeout = setTimeout(() => {
        this.appNotification.text = ''
        this.appNotification.type = 'info'
      }, 1000 * 15)
    },
    hideNotification() {
      clearTimeout(this.appNotificationTimeout)
      this.appNotification.text = ''
      this.appNotification.type = 'info'
    },
    setClientPopover(client: Client) {
      this.clientPopover = {
        name: `${client.firstName} ${client.lastName}`,
        photo: client.photo,
        applicantsNames: client.applicants.length ? client.applicants.map((a) => a.firstName + ' ' + a.lastName) : [],
        isPremium: client.isPremium,
        target: client.target,
        createdAt: client.$createdAt,
        updatedAt: client.$updatedAt,
        createdBy: client.createdBy || ''
      }
    },
    showContextMenu(event: PointerEvent, client: Client) {
      this.contextMenuPosition = {
        x: event.clientX >= window.outerWidth / 2 ? event.clientX - 240 : event.clientX,
        y: event.clientY
      }
      this.contextMenuClient = client
    },
    hideContextMenu() {
      this.contextMenuClient = null
    },
    async showConfirm(message: string): Promise<boolean> {
      this.confirmMessage = message
      await nextTick()
      return new Promise((resolve) => {
        const acceptButton = document.querySelector<HTMLButtonElement>('#nikka-confirm .accept')
        acceptButton?.addEventListener('click', () => {
          resolve(true)
          this.closeConfirm()
        })
      })
    },
    closeConfirm() {
      this.confirmMessage = ''
    },
    async report(message: string) {
      return this.reporter?.report(message)
    },
    photoPreview(photoID: string, bucket = 'photos') {
      return photoID.startsWith('data:image') || photoID.includes('/') || photoID.includes('\\') ? photoID : `https://appwrite.nikkaa.com/v1/storage/buckets/${bucket}/files/${photoID}/view?project=nikka-bot`
    },
    async removeClient(clientID: string) {
      const database = useDatabase()
      try {
        await database.delete('clients', clientID)
        const clientIndex = this.clients.findIndex((c) => c.$id === clientID)
        if (clientIndex > -1) {
          await window.desktop.invoke('delete-file', this.clients[clientIndex].photo, 'photos')
          await window.desktop.invoke('delete-file', this.clients[clientIndex].passportPhoto, 'passports')
          for (const applicant of this.clients[clientIndex].applicants) {
            await window.desktop.invoke('delete-file', applicant.photo, 'photos')
            await window.desktop.invoke('delete-file', applicant.passportPhoto, 'passports')
          }
          const targetClient = this.clients[clientIndex]
          this.clients.splice(clientIndex, 1)
          this.report(`{subject} has removed {client:${targetClient.firstName} ${targetClient.lastName}:${clientID}}`)
        }
        this.showNotification(`client removed`, 'success')
      } catch (error) {
        console.log('error while removing client:', (error as Error).message)
        this.showNotification(`error while removing client: ${(error as Error).message}`, 'error')
      }
    },
    startAlarm() {
      if (this.alarmIsOn) return
      const audioElement = document.getElementById('nikka-alarm') as HTMLAudioElement | null
      if (audioElement) {
        audioElement.loop = true
        audioElement.play()
        this.alarmIsOn = true
      }
    },
    stopAlarm() {
      const audioElement = document.getElementById('nikka-alarm') as HTMLAudioElement | null
      if (this.alarmIsOn && audioElement) {
        audioElement.pause()
        this.alarmIsOn = false
      }
    },
    async init(): Promise<'success' | 'offline' | 'notUser' | 'blocked' | 'unknown'> {
      try {
        const currentUser = await account.get()
        if (currentUser.status === false) return 'blocked'
        if (currentUser.labels.includes('admin') === false) {
          const allSessions = await account.listSessions()
          const desktopSessions = allSessions.sessions.filter((s) => s.osName.toLocaleLowerCase() === 'windows' && s.current === false)
          for (const desktopSession of desktopSessions) {
            await account.deleteSession({
              sessionId: desktopSession.$id
            })
          }
        }

        this.user = currentUser
        await this.fetchSettings(this.user.$id)
        this.fetchClients(this.user.$id, true)

        this.fetchUsers()

        this.reporter = new UserReporter(this.user)
        this.report('{subject} has logged in')
        return 'success'
      } catch (error) {
        const thrownError = error as Error
        console.log('initializing error', thrownError.message)
        if ((error as Error).message.includes('(role: guests) missing scopes')) {
          this.showNotification('you need to login', 'error')
          return 'notUser'
        } else if (thrownError.message.toLocaleLowerCase().includes('failed to fetch')) {
          this.showNotification('please check your internet', 'error')
          return 'offline'
        } else {
          return 'unknown'
        }
      }
    },
    async fetchClients(userID?: string, cleanPhotos = false) {
      const database = useDatabase()
      this.isFetchingClients = true
      this.clients = (await database.getAll('clients', userID || this.user.$id)).rows as unknown as Client[]

      if (this.clients.length) {
        for (let i = 0; i < this.clients.length; i++) {
          const client = this.clients[i] as Client
          client.applicants = JSON.parse((client.applicants as unknown as string) || '[]')
          this.clients[i].applicants = client.applicants
          const clientLinks = (client.links || JSON.stringify({ photo: '', selfie: '', payment: '' } as unknown as Client['links'])) as string
          this.clients[i].links = JSON.parse(clientLinks)
          const downloads = [window.desktop.invoke('download-photo', client.photo), window.desktop.invoke('download-photo', client.passportPhoto, 'passports')]

          if (this.clients[i].applicants?.length) {
            for (let j = 0; j < (this.clients[i].applicants as unknown as Applicant[])!.length; j++) {
              const applicant = (this.clients[i]?.applicants as unknown as Applicant[])?.[j] as Applicant
              downloads.push(window.desktop.invoke('download-photo', applicant.passportPhoto, 'passports'))
            }
          }

          Promise.all(downloads).catch((error) => {
            this.showNotification((error as Error).message, 'error')
          })
        }
      }
      this.isFetchingClients = false

      if (cleanPhotos) {
        const allClientsPhotos = this.clients.map((client: Client) => client.photo)
        const allClientsPassports = this.clients.map((client: Client) => client.passportPhoto)
        const allApplicantsPhotos = this.clients.flatMap((client: Client) => client.applicants.map((applicant: Applicant) => applicant.photo))
        const allApplicantsPassports = this.clients.flatMap((client: Client) => client.applicants.map((applicant: Applicant) => applicant.passportPhoto))
        window.desktop.send('clean-photos', [...allClientsPhotos, ...allClientsPassports, ...allApplicantsPhotos, ...allApplicantsPassports])
      }
    },
    async fetchSettings(userID?: string) {
      const database = useDatabase()
      this.settingsFetching = true

      const cloudSettings = await database
        .get('settings', userID || this.user?.$id || '')
        .then((settings) => {
          return settings.value
        })
        .catch(async (error) => {
          console.log('error getting settings: ', error.message)
          return database
            .get('settings', 'default')
            .then((settings) => {
              return settings.value
            })
            .catch((lastError) => {
              console.log('error getting default settings: ', lastError.message)
              return '{}'
            })
        })
        .finally(() => {
          this.settingsFetching = false
        })
      this.settings = JSON.parse(cloudSettings) as AppSettings

      // features
      this.settings.features['precode'] = this.settings.features['precode'] ?? false
      this.settings.features['showCalender'] = this.settings.features['showCalender'] ?? true
      this.settings.features['forceKendo'] = this.settings.features['forceKendo'] ?? false
      this.settings.features['showNikkaGuider'] = this.settings.features['showNikkaGuider'] ?? true

      window.desktop.send('set-settings', JSON.parse(JSON.stringify(this.settings)))
    },
    async fetchUsers() {
      this.fetchingUsers = true
      window.desktop
        .invoke<(Models.User<Models.Preferences> & { total: number })[]>('fetch-users')
        .then((users) => {
          this.users = users
        })
        .catch((error) => {
          console.log('error fetching users:', error.message)
        })
        .finally(() => {
          this.fetchingUsers = false
        })
    },
  }
})

export default useMainStore