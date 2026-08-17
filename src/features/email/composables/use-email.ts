import axios from 'axios'

type AccountResponse = { member: { id: string; address: string; mailboxes: { id: string; path: string; '@id': string }[] }[] }
type InboxResponse = {
  member: {
    id: string;
    subject: string;
    '@id': string,
    to: {
      address: string,
      name: string
    }[];
    isRead: boolean;
  }[]
}
type MessageResponse = { id: string; date: string; subject: string; intro: string; text: string; html: string; hasAttachments: boolean; createdAt: string }

class EmailService {
  private inboxPath = ''

  constructor(private apiKey: string, public email: string) { }

  async init() {
    const mainAccount = '*@xastro.org'
    const accountRequest = await this.makeRequest<AccountResponse>(`https://api.smtp.dev/accounts?page=1&address=${mainAccount}&isActive=true`)

    console.log('[NIKKA-EMAIL] -> accountRequest', accountRequest)

    // if email already exists
    if (accountRequest.member.length && accountRequest.member[0].address.toLowerCase() === mainAccount.toLocaleLowerCase()) {
      const account = accountRequest.member[0]
      const inbox = account.mailboxes.find((mailbox) => mailbox.path.toLowerCase() === 'inbox')
      this.inboxPath = `https://api.smtp.dev${inbox?.['@id']}/messages?page=1`
      console.log('[NIKKA-EMAIL] -> inbox is', this.inboxPath)
      
      // delete old emails
      const inboxResponse = await this.makeRequest<InboxResponse>(this.inboxPath)
      if (inboxResponse.member.length > 0) {
        const targetEmails = inboxResponse.member.filter(m => m.to[0].address.toLowerCase() === this.email.toLowerCase() && m.subject.toLowerCase().startsWith('additional information'))
        for(const email of targetEmails){
          this.makeRequest(`https://api.smtp.dev${email['@id']}`, 'delete')
        }
      }
    } else {
      console.log('[NIKKA-EMAIL] ->', 'it seems like the email does not exist', accountRequest)
    }
  }

  async accept(): Promise<boolean> {
    console.log('[NIKKA-EMAIL] -> accepting for', this.email)
    if (this.inboxPath === '') await this.init()
    let isAccepted = false
    for (let tries = 0; tries <= 10; tries++) {
      await new Promise(r => setTimeout(r, 1000))
      const inboxResponse = await this.makeRequest<InboxResponse>(this.inboxPath)
      if (inboxResponse.member.length > 0) {
        console.log('[NIKKA-EMAIL] ->', 'total items', inboxResponse.member)
        const filteredEmails = inboxResponse.member.filter(m => m.to[0].address.toLowerCase() === this.email.toLowerCase() && m.subject.toLowerCase().startsWith('additional information') && m.isRead === false)
        console.log('[NIKKA-EMAIL] ->', 'filtered', filteredEmails)
        
        if(filteredEmails.length === 0) continue;

        const lastOne = filteredEmails[0]
        console.log('[NIKKA-EMAIL] ->', 'last member', lastOne)
        const messageResponse = await this.makeRequest<MessageResponse>(`https://api.smtp.dev${lastOne['@id']}`)
        console.log('[NIKKA-EMAIL] ->', 'last message response', messageResponse)
        if (messageResponse.html[0]) {
          const urlRegex = /https?:\/\/[^\s"'\\]+/;

          const match = messageResponse.html[0].match(urlRegex);
          const acceptUrl = match ? match[0] : null;
          if (acceptUrl) {
            try {
              const response = await fetch(acceptUrl);
              console.log('[NIKKA-EMAIL] ->', 'response', response)
              if (response.ok) {
                console.log('[NIKKA-EMAIL] ->', 'good to go')
                isAccepted = true
                this.makeRequest(`https://api.smtp.dev${lastOne['@id']}`, 'patch', {
                  isRead: true
                }).then(() => {
                  console.log('set as read')
                }).catch(() => {
                  console.log('error setting as read')
                })
                break;
              } else {
                console.log('[NIKKA-EMAIL] ->', 'error at response', response)
                break;
              }
            } catch (error) {
              console.log('[NIKKA-EMAIL] ->', 'accept fetch failed', error)
              break;
            }
          } else {
            console.log('[NIKKA-EMAIL] ->', 'could\'nt extract the url', acceptUrl)
            break;
          }
        } else {
          console.log('[NIKKA-EMAIL] ->', 'no message html found', messageResponse.html.length, messageResponse.html)
        }
      }
    }
    return isAccepted
  }

  async getOTP(): Promise<string>{
    let OTPCode = ''

    if (this.inboxPath === '') await this.init()

    for (let tries = 0; tries <= 10; tries++) {
      await new Promise(r => setTimeout(r, 1000))
      const inboxResponse = await this.makeRequest<InboxResponse>(this.inboxPath)
      if (inboxResponse.member.length > 0) {
        const filteredEmails = inboxResponse.member.filter(m => m.to[0].address.toLowerCase() === this.email.toLowerCase() && m.subject.toLowerCase() === 'appointment verification code' && m.isRead === false)
        if(filteredEmails.length === 0) continue;
        const lastOne = filteredEmails[0]
        const messageResponse = await this.makeRequest<MessageResponse>(`https://api.smtp.dev${lastOne['@id']}`)
        if (messageResponse.text) {
          OTPCode = messageResponse.text.match(/\d{6}/g)?.[0] || ''
          this.makeRequest(`https://api.smtp.dev${lastOne['@id']}`, 'patch', {
            isRead: true
          }).then(() => {
            console.log('message has been set as read')
          }).catch(() => {
            console.log('error setting message as read')
          })
          break;
        }
      }
    }

    return OTPCode
  }

  async getPassword() {

  }

  private async makeRequest<T>(url: string, method: 'get' | 'post' | 'put' | 'patch' | 'delete' = 'get', body?: { [key: string]: string | boolean | number }) {
    const headers = {
      'X-API-KEY': this.apiKey,
      accept: 'application/ld+json',
      'Content-Type': method === 'patch' ? 'application/merge-patch+json' : 'application/ld+json'
    }
    // https://api.smtp.dev/accounts
    try {
      const response = await axios({
        url,
        method,
        headers,
        data: body
      })
      return response.data as T
    } catch (error) {
      console.log('error making email request', error)
      throw error
    }
  }
}


export default EmailService