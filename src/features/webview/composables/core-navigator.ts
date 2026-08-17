import { type Ref, ref, reactive, onMounted, onUnmounted } from 'vue'
import useMainStore from '@/stores/main-store'
import useSoundEffect from '@/features/webview/composables/sound'

export default function useCoreNavigator(webviewTag: Ref<Electron.WebviewTag | null>, client: Client) {
  const url = ref('')
  const isLoading = ref(false)

  const store = useMainStore()

  const sounds = useSoundEffect()

  const error = reactive({
    code: 0,
    message: '',
    url: ''
  })

  const nikkaGuide = ref<{
    message: string
    type: 'info' | 'error'
    pose: 'normal' | 'think' | 'sad' | 'lol' | 'dk'
  }>({
    message: "hold on, i'm warming up",
    type: 'info',
    pose: 'normal'
  })

  const nikka = {
    say(message: string, type: 'info' | 'error' = 'info', pose: 'normal' | 'think' | 'sad' | 'lol' | 'dk' = 'normal') {
      nikkaGuide.value = {
        message,
        type,
        pose: type === 'error' ? 'sad' : pose
      }
    }
  }

  /** redirect from http to https */
  // function didRedirectNavigation(e: Electron.DidRedirectNavigationEvent) {
  //   if (e.isMainFrame && e.url.startsWith('http://')) {
  //     webviewTag.value?.loadURL(e.url.replace('http://', 'https://'))
  //   }
  // }

  function didStartLoading() {
    isLoading.value = true
    // nikka.say(`navigating to ${webviewTag?.value?.getURL()}...`)
  }

  /** hide navigation loading indicator */
  function didStopLoading() {
    isLoading.value = false
  }

  /** catch navigation errors (internet connection mostly) */
  function didFailLoad(e: Electron.DidFailLoadEvent) {
    if (e.isMainFrame) {
      sounds.error.play()
      error.code = e.errorCode
      error.message = e.errorDescription
      error.url = e.validatedURL
    }
  }

  /**
   * - inject javascript in sub frames that prevent window from getting blurred and enable back copy and paste
   * - overwrite window.alert default behavior and log instead of showing a dialog
   * - catch navigation 403 and 429 errors (<- that bullshit is deprecated)
   */
  async function didFrameNavigate(e: Electron.DidFrameNavigateEvent) {
    if(e.isMainFrame){
      url.value = e.url !== 'about:blank' ? e.url : url.value

      if ([403, 429, 404].includes(e.httpResponseCode)) {
        sounds.error.play()
        error.code = e.httpResponseCode
        error.message = e.httpStatusText || e.httpResponseCode === 404 ? 'Page Not Found' : 'unknown error'
        error.url = e.url
      }
    }
  }

  /** hide navigation errors */
  function resetErrors() {
    error.message = ''
    error.code = 0
    error.url = ''
  }

  /** update navigation url from SPA */
  function didNavigateInPage(e: Electron.DidNavigateInPageEvent) {
    if (e.isMainFrame && e.url !== 'about:blank') url.value = e.url
  }

  function renderProcessGone(e: Electron.RenderProcessGoneEvent) {
    // sounds.error.play()
    console.log('render process is gone', e)
    console.log(`webview for client ${client.firstName} crashed due to ${e.details.reason} ${e.details.reason}`)
    store.showNotification(`webview for client ${client.firstName} crashed due to ${e.details.reason} ${e.details.reason}`, 'error')
  }

  function init() {
    // handle navigation errors
    webviewTag.value?.addEventListener('did-fail-load', didFailLoad)

    // set webview zoom level
    webviewTag.value?.addEventListener('did-attach', () => {
      function setZoomLevel() {
        webviewTag.value?.setZoomLevel(-1.3)
      }

      function clearEvents() {
        webviewTag.value?.removeEventListener('dom-ready', setZoomLevel)
        webviewTag.value?.removeEventListener('did-finish-load', clearEvents)
      }

      webviewTag.value?.addEventListener('dom-ready', setZoomLevel)
      webviewTag.value?.addEventListener('did-finish-load', clearEvents)
    })

    // allow copy and past, disable window.alert and much more...
    webviewTag.value?.addEventListener('did-frame-navigate', didFrameNavigate)
    // rest navigation errors (show webview back)
    webviewTag.value?.addEventListener('did-start-navigation', resetErrors)
    // update url (for SPA's cases)
    webviewTag.value?.addEventListener('did-navigate-in-page', didNavigateInPage)
    // show loading indicator when it start to loading
    webviewTag.value?.addEventListener('did-start-loading', didStartLoading)
    // hide loading indicator when it stop to loading
    webviewTag.value?.addEventListener('did-stop-loading', didStopLoading)
    // show the reason why process has gone
    webviewTag.value?.addEventListener('render-process-gone', renderProcessGone)
  }

  function unInit() {
    // allow copy and past, disable window.alert and much more...
    webviewTag.value?.removeEventListener('did-frame-navigate', didFrameNavigate)
    // rest navigation errors (show webview back)
    webviewTag.value?.removeEventListener('did-start-navigation', resetErrors)
    // update url (for SPA's cases)
    webviewTag.value?.removeEventListener('did-navigate-in-page', didNavigateInPage)
    // show loading indicator when it start to loading
    webviewTag.value?.removeEventListener('did-start-loading', didStartLoading)
    // hide loading indicator when it stop to loading
    webviewTag.value?.removeEventListener('did-stop-loading', didStopLoading)
    // show the reason why process has gone
    webviewTag.value?.removeEventListener('render-process-gone', renderProcessGone)
  }

  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    unInit()
  })

  return reactive({
    url,
    isLoading,
    error,
    // waitForElement,
    nikkaGuide,
    nikkaController: nikka
    // remoteSelfie,
    // isCheckingSastro,
    // sAstroRowID
  })
}
