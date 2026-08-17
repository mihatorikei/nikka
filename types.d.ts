import * as CloudType from './src/features/appwrite/types'
import type { IpcRenderer } from 'electron'

declare global {
  // interface Window {
  //   sidi: IpcRenderer & { getPath: (file: File) => string; getWebviewPreload: () => string }
  // }

  // type InternalClient = import('./src/renderer/src/appwrite.types').Clients
  type InternalClient = CloudType.Clients
  type InternalNotifications = CloudType.Notifications

  type Client = Omit<InternalClient, 'applicants'> & { applicants: Applicant[] }

  type Applicant = {
    firstName: string
    lastName: string
    birthdate: string
    passportNumber: string
    photo: string
    passportPhoto: string
    passportIssue: string
    passportExpire: string
    gender: Client['gender']
    status: Client['status']
    nationality: string
    birthplace: ''
    relation: 'brother' | 'daughter' | 'father' | 'husband' | 'mother' | 'sister' | 'son' | 'wife'
    nin: string
  }
  type AppSettings = {
    enableProxy: boolean
    proxyServer: string
    captchaProvider: 'trueCaptcha' | 'capastro' | 'noCaptcha' | 'manual'
    trueCaptchaUser: string
    trueCaptchaKey: string
    noCaptchaKey: string
    automationMode: 'human' | 'bot' | 'refresher' | 'manual'
    edenAiToken: string
    betaFeatures: boolean
    gridNumbers: string
    remoteSelfie: boolean
    emailsDomain: string
    /** smtp.dev api key (header token) */
    smtpApiKey: string
    /** smtp.dev domain */
    smtpDomain: string
    refreshTime: number
    soundPack: 'main' | 'one piece' | 'mj' | 'traore' | 'super mario' | 'mixed'
    features: { [key: string]: boolean }
  }
  type BrowserAction = 'book' | 'register' | 'update' | 'delete' | 're-register'
  type LivenessResponse = {
    url: string
    clientID: string
    clientName: string
    clientPhoto: string
    state: number
    owner: string
    userAgent: string
    proxyPort: string
    cookies: string
    paymentUrl: string
    proxyUrl: string
    code: string
    detail?: string
    fingerprint: string
  }
  type AppBrowser = {
    client: Client
    action: BrowserAction
    port: string
    userAgent: string
    type: 'main' | 'remote'
    clientExist: boolean
  }
  type EdenAiResponse = {
    'eden-ai': {
      extracted_data: EdenAiData[]
      status: string | 'success'
    }
    klippa: {
      extracted_data: EdenAiData[]
      status: string | 'success'
    }
    microsoft: {
      extracted_data: EdenAiData[]
      status: string | 'success'
    }
  }
  type EdenAiData = {
    birth_date: { value: string | null; confidence: number | null }
    document_id: { value: string | null; confidence: number | null }
    issuance_date: { value: string | null; confidence: number | null }
    expire_date: { value: string | null; confidence: number | null }
    gender: { value: 'M' | 'F' | null; confidence: number | null }
    given_names: { value: string | null; confidence: number | null }[]
    image_id: { value: string | null; confidence: number | null }[]
    last_name: { value: string | null; confidence: number | null }
    nationality: { value: string | null; confidence: number | null }
    birth_place: { value: string | null; confidence: number | null }
    country: {
      name: string | null
      alpha2: string | null
      alpha3: string | null
      confidence: number | null
    } | null
  }
  type emailMessages = {
    total: number
    unread: number
    count: number
    messages_count: number
    messages_unread: number
    messages: EmailMessage[]
  }
  type EmailMessage = {
    ID: string
    MessageID: string
    Read: boolean
    From: {
      Name: string
      Address: string
    }
    To?: {
      Name?: string
      Address?: string
    }[]
    Subject: string
    Created: string
    Username: string
    Attachments: number
    Snippet: string
  }
  type EmailDetail = {
    ID: string
    Subject: string
    HTML: string
    Text: string
    From: {
      Address: string
      Name: string
    }
    To?: {
      Address?: string
      Name?: string
    }[]
    Username: string
    Date: string
    Attachments: {
      ContentID: string
      ContentType: string
      FileName: string
      Size: number
      PartID: number
    }[]
  }
  type WebviewResponse = { method: 'post' | 'get'; url: string; data: string; type: 'application/json; charset=utf-8' | 'text/html' }
  type StartSessionParams = {
    proxyUrl: string
    port: string
    clientID: string
    useProxy: boolean
    userAgent: string
  }
  type NikkaController = {
    say(message: string, type?: 'error' | 'info', pose?: 'normal' | 'think' | 'sad' | 'lol' | 'dk'): void
  }
  type UserNotification = CloudType.Notifications
  type PopoverClientType = {
    name: string
    photo: string
    applicantsNames: string[]
    isPremium: boolean
    target: ClientsTarget
    createdAt: string
    updatedAt: string
    createdBy: string
  }
}

export { }
