import { createApp, ref, nextTick, type DefineComponent, type DirectiveBinding } from 'vue'
import App from './App.vue'
import useMainStore from '@/stores/main-store'
import { createPinia } from 'pinia'
import routes from './routes'

import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import '@/assets/css/main.css'

const mainApp = createApp(App)
const pinia = createPinia()

mainApp.use(routes).use(pinia)

const store = useMainStore()

const appVersion = ref('...')

nextTick(async () => {
  appVersion.value = await window.desktop.invoke('get-version')
  mainApp.provide('appVersion', appVersion)
})

// TODO: 
store.init().then(async (status) => {
  let viewComponent: DefineComponent<any, any, any>
  console.log('init response', status)

  switch (status) {
    case 'offline':
      viewComponent = (await import('@/features/core/views/OfflineVIew.vue')).default
      break
    case 'notUser':
      viewComponent = (await import('@/features/core/views/LoginView.vue')).default
      break
    case 'blocked':
      viewComponent = (await import('@/features/core/views/BlockedView.vue')).default
      break
    case 'unknown':
      viewComponent = (await import('@/features/core/views/UnknownView.vue')).default
      break
    default:
      viewComponent = (await import('@/features/core/views/UnknownView.vue')).default
      break
  }

  if (status === 'success') {
    mainApp.mount('#app')
  } else {
    const app = createApp(viewComponent)
    app.provide('appVersion', appVersion)
    app.mount('#app')
  }
}).catch((error) => {
  console.log('error at initializing store', (error as Error).message)
})


mainApp.directive('ClientPopover', {
  mounted: (el: HTMLImageElement, data: DirectiveBinding<Client>) => {
    const popover = document.getElementById('client-popover') as HTMLDivElement
    const popoverImage = popover?.querySelector<HTMLImageElement>('img')

    el.addEventListener('mousemove', (e) => {
      if (e.pageX >= window.outerWidth / 2) {
        popover.style.left = e.pageX - 320 - 18 + 'px'
      } else {
        popover.style.left = e.pageX + 30 + 'px'
      }

      if (popoverImage?.height && e.pageY + popoverImage.height >= window.innerHeight) {
        popover.style.bottom = '5px'
        popover.style.top = 'unset'
      } else {
        popover.style.top = e.pageY - 18 + 'px'
        popover.style.bottom = 'unset'
      }
    })
    el.addEventListener('mouseleave', () => {
      popover.style.display = 'none'
    })
    el.addEventListener('mouseenter', () => {
      store.setClientPopover(data.value)
      popover.style.display = 'block'
    })
  }
})