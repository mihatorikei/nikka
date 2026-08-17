<script lang="ts" setup>
import { onMounted, ref, useTemplateRef } from 'vue'
import type { WebviewTag } from 'electron'
import hexMask from '@/assets/images/hexagon-alt.png?url'
import useCoreNavigator from '@/features/webview/composables/core-navigator'
import useBookingNavigator from '@/features/webview/composables/booking-navigator'
// import useCreationNavigator from '@renderer/features/webview/composables/creation_navigator'
import useMainStore from '@/stores/main-store'
import useWebviewStore from '@/stores/webview-store'
import NikkaGuider from '@/features/core/components/NikkaGuider.vue'
// import { useDatabase } from '@renderer/composables/appwrite'
// import { useSoundEffect } from '@renderer/composables/use-sound'
// import useDeleteNavigation from '@renderer/features/webview/composables/delete_navigation'
// import useUpdatingNavigation from '@renderer/features/webview/composables/updating_navigator'
// import useReRegisterNavigator from '@renderer/features/webview/composables/re-registering_navigator'

const preloadPath = window.desktop.getWebviewPreload()

const props = defineProps<{ browser: AppBrowser }>()
const client = props.browser.client

// const sound = useSoundEffect()

const store = useMainStore()
const webviewStore = useWebviewStore()

const webviewRef = useTemplateRef<WebviewTag | null>('app-webview')

const autoMode = ref(true)

const webviewController = useCoreNavigator(webviewRef, client)
const bookingNavigator = useBookingNavigator(webviewRef, client, webviewController.nikkaController, autoMode)
// const creationNavigator = useCreationNavigator(webviewRef, client, autoMode, webviewController.nikkaController)
// const deleteNavigation = useDeleteNavigation(webviewRef, client, webviewController.nikkaController, autoMode)
// const updatingNavigation = useUpdatingNavigation(webviewRef, client, webviewController.nikkaController, autoMode)
// const reRegisterNavigator = useReRegisterNavigator(webviewRef, client, webviewController.nikkaController, autoMode)

const showTools = ref(false)
const isFullScreen = ref(false)

function navigate() {
  let url = webviewController.url
  url = !url.startsWith('http') ? `https://${url}` : url.startsWith('http://') ? url.replace('http://', 'https://') : url
  webviewRef.value?.loadURL(url)
  showTools.value = false
}

function goBack() {
  if (webviewRef.value?.canGoBack()) {
    webviewRef.value?.goBack()
    showTools.value = false
  }
}

function goForward() {
  if (webviewRef.value?.canGoForward()) {
    webviewRef.value?.goForward()
    showTools.value = false
  }
}

function toggleFullscreen() {
  if (document.fullscreenElement === null) {
    document.getElementById(`webview-container-${client.$id}`)?.requestFullscreen()
    webviewRef.value?.setZoomLevel(0)
    webviewRef.value!.style.height = '100vh'
    isFullScreen.value = true
  } else {
    document.exitFullscreen()
    webviewRef.value?.setZoomLevel(-1.3)
    webviewRef.value!.style.height = '400px'
    isFullScreen.value = false
  }
  showTools.value = false
}

let initUrl = props.browser.action === 'register' ? 'https://spain-mauritania.blsinternational.com/signup' : 'https://spain-mauritania.blsinternational.com/login'

onMounted(() => {
  if (props.browser.action === 'book') {
    bookingNavigator.init()
  } 
  // else if (props.browser.action === 'register') {
  //   creationNavigator.init()
  // } else if (props.browser.action === 'delete') {
  //   // deleteNavigation.init()
  // } else if (props.browser.action === 'update') {
  //   // updatingNavigation.init()
  // } else if (props.browser.action === 're-register') {
  //   // reRegisterNavigator.init()
  // } else {
  //   webviewController.nikkaController.say('unknown action', 'error', 'sad')
  // }
})
</script>
<template>
  <div class="relative grid gap-y-1 rounded-xl b-1 b-white b-op-30 w-full h-640px bg-gradient-linear from-white from-op-50 to-transparent dark:(bg-gradient-linear from-#7f7f7f40 to-transparent) mt-12">
    <!-- tools -->
    <ul class="flex items-center gap-x-2 absolute -top-5 -right-2 children:(duration-200 cursor-pointer) hover:children:scale-120 z-1">
      <li>
        <button class="bg-primary-5 bg-op-40 rounded-lg p-1 light-text-white" @click="autoMode = !autoMode">
          <svg v-if="autoMode" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 18l-2 0l0 -12l2 0l0 12M15 6l2 0l0 12l-2 0l0 -12">
              <animate fill="freeze" attributeName="d" dur="0.6s" keyTimes="0;0.33;1" values="M13 15l-5 3l0 -12l5 3l0 0M13 9l5 3l0 0l-5 3l0 0;M13 15l-5 3l0 -12l5 3l0 6M13 9l5 3l0 0l-5 3l0 -6;M9 18l-2 0l0 -12l2 0l0 12M15 6l2 0l0 12l-2 0l0 -12" />
            </path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 15l-5 3l0 -12l5 3l0 0M13 9l5 3l0 0l-5 3l0 0">
              <animate fill="freeze" attributeName="d" dur="0.6s" keyTimes="0;0.33;1" values="M9 18l-2 0l0 -12l2 0l0 12M15 6l2 0l0 12l-2 0l0 -12;M13 15l-5 3l0 -12l5 3l0 6M13 9l5 3l0 0l-5 3l0 -6;M13 15l-5 3l0 -12l5 3l0 0M13 9l5 3l0 0l-5 3l0 0" />
            </path>
          </svg>
        </button>
      </li>
      <li>
        <button class="bg-red-5 bg-op-40 rounded-lg p-1" @click="webviewStore.remove(client.$id)">
          <svg xmlns="http://www.w3.org/2000/svg" class="text-red-5" width="24" height="24" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <path fill="none" stroke="currentColor" stroke-dasharray="12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 12l7 7M12 12l-7 -7M12 12l-7 7M12 12l7 -7">
              <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="12;0" />
            </path>
          </svg>
        </button>
      </li>
    </ul>

    <!-- client info -->
    <div class="relative flex items-end gap-y-2 -mt-8.75 overflow-hidden text-ellipsis">
      <img class="w-68px h-68px object-cover object-center relative z-1" :style="`mask-size: 100% 100%; mask-image: url(${hexMask})`" :src="store.photoPreview(client.photo)" />
      <p class="absolute op-70 font-bold text-black dark:text-white truncate text-xs left-14 top-12px max-w-60% font-['Poppins'] capitalize bg-white bg-op-20 w-max inset-x-0 ps-3.5 pe-8px py-3px rounded-tr-xl" :title="`${client.firstName} ${client.lastName}`">{{ client.firstName }} {{ client.lastName }}</p>
    </div>
    <!-- webview container -->
    <div :id="`webview-container-${client.$id}`" class="relative webview-container">
      <!-- loading indicator -->
      <div v-show="webviewController.isLoading" class="absolute top-0 z-0 inset-x-0">
        <div class="h-1 w-full overflow-hidden rounded-full">
          <div class="progress w-full h-full rounded-full bg-gradient-to-l from-pink-5 to-blue-5"></div>
        </div>
      </div>
      <!-- navigation tools trigger -->
      <button v-if="!showTools" class="absolute -top-3 inset-x-0 mx-auto w-max block duration-200 hover:(scale-125 bg-op-100) bg-primary-5 rounded-lg bg-op-30" @click="showTools = true">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m19 9l-7 6l-1.75-1.5M5 9l2.333 2" />
        </svg>
      </button>
      <!-- navigation tools -->
      <div v-if="showTools" class="absolute inset-0 bg-black bg-op-50 flex flex-col justify-between px-2 backdrop-blur-5 z-1" @click="showTools = false">
        <div class="flex flex items-center gap-x-1 mt-3" :class="{ container: isFullScreen }">
          <form class="w-full" @submit.prevent="navigate">
            <input v-model="webviewController.url" type="text" class="rounded-lg bg-white bg-op-20 ps-3 py-6px w-full" placeholder="URL goes here..." @click.stop />
          </form>
          <ul class="flex hover:children:scale-150 children:duration-200 line-height-0">
            <li>
              <button @click="goBack">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                  <path fill="currentColor" d="m8.165 11.63l6.63-6.43C15.21 4.799 16 5.042 16 5.57v12.86c0 .528-.79.771-1.205.37l-6.63-6.43a.5.5 0 0 1 0-.74" />
                </svg>
              </button>
            </li>
            <li>
              <button @click="goForward">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M15.835 11.63L9.205 5.2C8.79 4.799 8 5.042 8 5.57v12.86c0 .528.79.771 1.205.37l6.63-6.43a.5.5 0 0 0 0-.74" />
                </svg>
              </button>
            </li>
            <li class="hover:scale-125!">
              <button @click.stop="webviewController.isLoading ? webviewRef?.stop() : webviewRef?.reload()">
                <svg v-if="webviewController.isLoading" xmlns="http://www.w3.org/2000/svg" class="text-red" width="28" height="28" viewBox="0 0 24 24">
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path fill="none" stroke="currentColor" stroke-dasharray="12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 12l7 7M12 12l-7 -7M12 12l-7 7M12 12l7 -7">
                    <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="12;0" />
                  </path>
                </svg>

                <svg v-else xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12.079 2.25c-4.794 0-8.734 3.663-9.118 8.333H2a.75.75 0 0 0-.528 1.283l1.68 1.666a.75.75 0 0 0 1.056 0l1.68-1.666a.75.75 0 0 0-.528-1.283h-.893c.38-3.831 3.638-6.833 7.612-6.833a7.66 7.66 0 0 1 6.537 3.643a.75.75 0 1 0 1.277-.786A9.16 9.16 0 0 0 12.08 2.25" />
                  <path fill="currentColor" d="M20.841 10.467a.75.75 0 0 0-1.054 0L18.1 12.133a.75.75 0 0 0 .527 1.284h.899c-.381 3.83-3.651 6.833-7.644 6.833a7.7 7.7 0 0 1-6.565-3.644a.75.75 0 1 0-1.276.788a9.2 9.2 0 0 0 7.84 4.356c4.809 0 8.766-3.66 9.151-8.333H22a.75.75 0 0 0 .527-1.284z" opacity="0.5" />
                </svg>
              </button>
            </li>
          </ul>
        </div>
        <ul class="flex justify-between">
          <li>
            <button @click="webviewRef?.openDevTools()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5">
                  <path d="m17 7.83l1.697 1.526c1.542 1.389 2.313 2.083 2.313 2.974c0 .89-.771 1.585-2.314 2.973L17 16.83" />
                  <path d="m13.987 5l-3.974 14.83" opacity="0.5" />
                  <path d="M7 7.83L5.304 9.356C3.76 10.745 2.99 11.44 2.99 12.33s.771 1.585 2.314 2.973L7 16.83" />
                </g>
              </svg>
            </button>
          </li>
          <li>
            <button @click="toggleFullscreen">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5">
                  <path d="M22 14c0 3.771 0 5.657-1.172 6.828S17.771 22 14 22" opacity="0.5" />
                  <path d="M10 22c-3.771 0-5.657 0-6.828-1.172S2 17.771 2 14" />
                  <path d="M10 2C6.229 2 4.343 2 3.172 3.172S2 6.229 2 10" opacity="0.5" />
                  <path d="M14 2c3.771 0 5.657 0 6.828 1.172S22 6.229 22 10" />
                </g>
              </svg>
            </button>
          </li>
        </ul>
      </div>

      <!-- webview container -->
      <div>
        <div v-if="webviewController.error.message" class="flex flex-col gap-y-3 items-center justify-center text-center h-600px text-wrap px-5">
          <p class="text-2xl font-black text-red-5" v-text="`Error ${webviewController.error.code}`" />
          <p class="font-bold" v-text="webviewController.error.message" />
          <small class="op-50 text-wrap break-all line-clamp-2" v-text="webviewController.url" />
          <button class="gr-from-r px-2 py-1 rounded-md" @click="webviewController.error.code === 404 ? webviewRef?.goBack() : webviewRef?.reload()">
            <span v-if="webviewController.error.code === 404" v-text="'Go Back'" />
            <span v-else v-text="'Refresh'" />
          </button>
        </div>
        <!-- actual webview -->
        <webview v-show="!webviewController.error.message" ref="app-webview" :src="initUrl" class="overflow-hidden w-full h-600px rounded-xl" webpreferences="contextIsolation=no" disablewebsecurity :preload="preloadPath" :partition="`persist:${client.$id}`" />
      </div>
      <NikkaGuider :guider="webviewController.nikkaGuide" :action="props.browser.action" />
    </div>
  </div>
</template>

<style>
.progress {
  animation: progress 1s infinite linear;
  transform-origin: 0% 50%;
}
@keyframes progress {
  0% {
    transform: translateX(0) scaleX(0);
  }
  40% {
    transform: translateX(0) scaleX(0.4);
  }
  100% {
    transform: translateX(100%) scaleX(0.7);
  }
}
</style>
