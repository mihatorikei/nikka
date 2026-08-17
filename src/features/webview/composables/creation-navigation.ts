import {type Ref} from 'vue'
import useMainStore from '@/stores/main-store'

type NikkaController = {
  say(message: string, type?: 'error' | 'info', pose?: 'normal' | 'think' | 'sad' | 'lol' | 'dk'): void
}

const useCreationNavigator = (webviewTag: Ref<Electron.WebviewTag | null>, client: Client, nikka: NikkaController, autoMode: Ref<boolean>) => {
  const store = useMainStore()

  const allListeners = new Set<(e: Electron.IpcMessageEvent) => Promise<void>>()

  async function handleNavigation() {
    if (autoMode.value === false) {
      nikka.say('automation is paused', 'error')
      return
    }

    const url = webviewTag.value!.getURL().toLowerCase()
    if (['https://spain-mauritania.blsinternational.com', 'https://spain-mauritania.blsinternational.com/', 'https://spain-mauritania.blsinternational.com/login'].includes(url)) {
      // handleLogin()
    }else if(url === 'https://spain-mauritania.blsinternational.com/signup'){
      // 
    } else {
      nikka.say(`navigated but to an unhandled page ${url}`, 'error')
    }
  }
}

export default useCreationNavigator