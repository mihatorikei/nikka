import { ID, type Models } from 'appwrite'
import useDatabase from '@/features/appwrite/composables/use-database'

class UserReporter {
  private db = useDatabase()

  constructor(private user: Models.User) {}

  report(message: string) {
    const parsedMessage = message.replace(/{(.*?)}/g, (match) => {
      const [kind, name, id] = match.replace(/[{}]/g, '').split(':') as [string, string | undefined, string | undefined, string | undefined]
      switch (kind) {
        case 'subject':
          return `<span class="subject">${this.user.name}</span>`
        case 'client':
          return `<span class="client" data-nikka-url="/edit/${id}">${name}</span>`
        case 'user':
          return `<span class="user">${name}</span>`
        default:
          return match
      }
    })
    return this.db.save('users_logs', ID.unique(), {
      message: parsedMessage,
      subject: this.user.$id
    } as {
      message: string
      subject: string
    })
  }
}

export default UserReporter
