import { defineStore } from 'pinia'
import useMainStore from './main-store'

const useWebviewStore = defineStore('webview-store', {
  state: () => ({
    webviews: [] as AppBrowser[]
  }),
  actions: {
    /**
     *
     * @param client target client
     * @param action type of process
     * @param exist still looking for it
     * @returns void
     */
    async add(client: Client, action: BrowserAction, exist = false) {
      const store = useMainStore()
      if (client.isDisabled) {
        store.showNotification('Not allowed, client is disabled', 'error')
        return false
      } else if (this.webviews.length && this.webviews.findIndex((b) => b.client.$id === client.$id) > -1) {
        store.showNotification(`Client already has an on-going process (${this.webviews.find((b) => b.client.$id === client.$id)?.action})`, 'error')
        return false
      } else {
        const randomPort = (Math.floor(Math.random() * 10000) + 10000).toString()
        const userAgent = randomChromeUserAgent()
        await window.desktop.invoke('start-session', { clientID: client.$id!, proxyUrl: store.settings.proxyServer, useProxy: store.settings.enableProxy, port: randomPort, userAgent } as StartSessionParams)
        this.webviews.push({ client, action, port: randomPort, userAgent: userAgent, type: 'main', clientExist: exist })
        const clientName = `${client.firstName} ${client.lastName}`
        const attempting = action === 'book' ? 'to book an appointment for' : action === 'delete' ? 'to delete' : action === 'update' ? 'to update' : action === 'register' ? 'to register' : action === 're-register' ? 'to re-register' : 'an unknown action'
        store.report(`{subject} has attempted ${attempting} {client:${clientName}:${client.$id}}`)
        return true
      }
    },
    /**
     * Removes a webview from the list by client's id or email.
     * @param clientID - The ID of the client to remove or email.
     * @param byEmail - Whether to remove by email or ID (default: false).
     */
    async remove(clientID: string, byEmail = false) {
      const index = this.webviews.findIndex((b) => (byEmail ? b.client.email === clientID : b.client.$id === clientID))
      if (index > -1) {
        this.webviews.splice(index, 1)
      }
    }
  }
})

function randomChromeUserAgent(): string {
  function rn(min: number, max: number): number {
    if (min > max) [min, max] = [max, min];
    return Math.round(Math.random() * (max - min) + min);
  }

  // Pool of Chrome user agent templates across different OS platforms
  const chromeTemplates = [
    // Windows 10/11 (64-bit)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{v} Safari/537.36',
    // macOS (Intel / Apple Silicon)
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{v} Safari/537.36',
    // macOS (Alternative naming)
    'Mozilla/5.0 (Macintosh; Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{v} Safari/537.36',
    // Linux (X11)
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{v} Safari/537.36',
    // ChromeOS
    'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{v} Safari/537.36'
  ];

  function getRandomVersion(): string {
    // Ranging major versions roughly from 110 to 135 for modern Chrome releases
    const major = Math.floor(Math.random() * 26) + 110;
    const minor = Math.floor(Math.random() * 10);
    const build = Math.floor(Math.random() * 3000) + 1000;
    const patch = Math.floor(Math.random() * 150);
    return `${major}.${minor}.${build}.${patch}`;
  }

  const template = chromeTemplates[Math.floor(Math.random() * chromeTemplates.length)];
  const version = getRandomVersion();

  return template.replace(/{v}/g, version);
}

export default useWebviewStore