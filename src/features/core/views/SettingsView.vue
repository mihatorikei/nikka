<script setup lang="ts">
import { ref } from 'vue'
import useMainStore from '@/stores/main-store'
import useDatabase from '@/features/appwrite/composables/use-database'
import type { AppwriteException } from 'appwrite'
import { useRouter } from 'vue-router'
import GlobalSwitch from '@/features/core/components/GlobalSwitch.vue'
import GlobalSelect from '@/features/core/components/GlobalSelect.vue'
// import EmailService from '@renderer/services/emails'
import GlobalRouterBar from '@/features/core/components/GlobalRouterBar.vue'

import { onMounted } from 'vue'
import FetchIndicator from '@/features/core/components/FetchIndicator.vue'

const router = useRouter()

const store = useMainStore()
const activeTab = ref(0)
const pending = ref(false)

const database = useDatabase()

const domains = ref<string[]>([])

const isFetchingDomains = ref(false)
// const emailService = new EmailService(store.settings.emailApiKey, store.settings.emailDomain)

async function fetchDomains() {
  isFetchingDomains.value = true
  database
    .fetchAll('emails_domains')
    .then((data) => {
      domains.value = data.rows[0].available
    })
    .catch((error) => {
      store.showNotification(`error fetching domains: ${(error as Error).message}`, 'error')
    })
    .finally(() => {
      isFetchingDomains.value = false
    })
}

async function saveSettings(goBack = true) {
  pending.value = true

  database
    .update('settings', store.user.$id, { value: JSON.stringify(store.settings) })
    .then(() => {
      store.showNotification('settings updated')
      if (goBack) router.replace('/')
    })
    .catch((error) => {
      const thrownError = error as AppwriteException
      if (thrownError.code === 404) {
        pending.value = true
        database
          .save('settings', store.user.$id, { value: JSON.stringify(store.settings) })
          .then(() => {
            store.showNotification('settings saved', 'success')
            if (goBack) router.replace('/')
          })
          .catch((error) => {
            store.showNotification(`error while saving new settings: ${error.message}`, 'error')
          })
          .finally(() => {
            pending.value = false
          })
      } else {
        store.showNotification(`error while updating settings: ${thrownError.message}`, 'error')
      }
    })
    .finally(() => {
      pending.value = false
      // window.desktop.send('set-settings', JSON.parse(JSON.stringify(store.settings)))
    })
}

onMounted(() => {
  fetchDomains()
})
</script>

<template>
  <div class="grid overflow-x-hidden max-h-screen max-h-screen pb-15">
    <GlobalRouterBar title="Settings" relative>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          fill-rule="evenodd"
          d="M14.279 2.152C13.909 2 13.439 2 12.5 2s-1.408 0-1.779.152a2 2 0 0 0-1.09 1.083c-.094.223-.13.484-.145.863a1.62 1.62 0 0 1-.796 1.353a1.64 1.64 0 0 1-1.579.008c-.338-.178-.583-.276-.825-.308a2.03 2.03 0 0 0-1.49.396c-.318.242-.553.646-1.022 1.453c-.47.807-.704 1.21-.757 1.605c-.07.526.074 1.058.4 1.479c.148.192.357.353.68.555c.477.297.783.803.783 1.361s-.306 1.064-.782 1.36c-.324.203-.533.364-.682.556a2 2 0 0 0-.399 1.479c.053.394.287.798.757 1.605s.704 1.21 1.022 1.453c.424.323.96.465 1.49.396c.242-.032.487-.13.825-.308a1.64 1.64 0 0 1 1.58.008c.486.28.774.795.795 1.353c.015.38.051.64.145.863c.204.49.596.88 1.09 1.083c.37.152.84.152 1.779.152s1.409 0 1.779-.152a2 2 0 0 0 1.09-1.083c.094-.223.13-.483.145-.863c.02-.558.309-1.074.796-1.353a1.64 1.64 0 0 1 1.579-.008c.338.178.583.276.825.308c.53.07 1.066-.073 1.49-.396c.318-.242.553-.646 1.022-1.453c.47-.807.704-1.21.757-1.605a2 2 0 0 0-.4-1.479c-.148-.192-.357-.353-.68-.555c-.477-.297-.783-.803-.783-1.361s.306-1.064.782-1.36c.324-.203.533-.364.682-.556a2 2 0 0 0 .399-1.479c-.053-.394-.287-.798-.757-1.605s-.704-1.21-1.022-1.453a2.03 2.03 0 0 0-1.49-.396c-.242.032-.487.13-.825.308a1.64 1.64 0 0 1-1.58-.008a1.62 1.62 0 0 1-.795-1.353c-.015-.38-.051-.64-.145-.863a2 2 0 0 0-1.09-1.083"
          clip-rule="evenodd"
          opacity="0.5"
        />
        <path fill="currentColor" d="M15.523 12c0 1.657-1.354 3-3.023 3s-3.023-1.343-3.023-3S10.83 9 12.5 9s3.023 1.343 3.023 3" />
      </svg>
    </GlobalRouterBar>

    <!-- tabs -->
    <ul class="sticky top-0 grid grid-cols-3 font-bold children:cursor-pointer text-center children:(py-3 rounded-full duration-200) mt-5 px-3">
      <li :class="{ 'bg-white bg-op-40 dark:(bg-primary-5 bg-op-20)': activeTab === 0 }" @click="activeTab = 0">Generale</li>
      <li :class="{ 'bg-white bg-op-40 dark:(bg-primary-5 bg-op-20)': activeTab === 1 }" @click="activeTab = 1">Advance</li>
      <li :class="{ 'bg-white bg-op-40 dark:(bg-primary-5 bg-op-20)': activeTab === 2 }" @click="activeTab = 2">
        <div class="flex items-center gap-x-1 mx-auto w-max">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="orange" class="bi bi-fire fill-orange-5" viewBox="0 0 16 16">
            <path d="M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16m0-1c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15" />
          </svg>
          <span>Features</span>
        </div>
      </li>
    </ul>
    <!-- tabs -->
    <!-- <ul class="sticky top-0 grid grid-cols-3 font-bold children:cursor-pointer text-center children:py-4 bg-dark-9 bg-op-50 backdrop-blur-md">
      <li class="py-2 b-b-2 b-gray" :class="{ 'b-b-3 b-primary-7 bg-white bg-op-40 dark:(bg-white bg-op-10)': activeTab === 0 }" @click="activeTab = 0">Generale</li>
      <li class="py-2 b-b-2 rgb(156 163 175)" :class="{ 'b-b-3 b-primary-7 bg-white bg-op-40 dark:(bg-white bg-op-10)': activeTab === 1 }" @click="activeTab = 1">Advance</li>
      <li class="py-2 b-b-2 b-gray" :class="{ 'b-b-3 b-primary-7 bg-white bg-op-40 dark:(bg-white bg-op-10)': activeTab === 2 }" @click="activeTab = 2">
        <div class="flex items-center gap-x-1 mx-auto w-max">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="orange" class="bi bi-fire fill-orange-5" viewBox="0 0 16 16">
            <path d="M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16m0-1c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15" />
          </svg>
          <span>Features</span>
        </div>
      </li>
    </ul> -->

    <!-- tabs content -->
    <div class="mt-10 px-5 children:(animate-fade-in-right animate-duration-200)">
      <!-- generale settings -->
      <form v-if="activeTab === 0" class="grid gap-8 text-sm text-center" @submit.prevent="saveSettings(true)">
        <ul class="h-full grid gap-y-5">
          <li>
            <GlobalSelect v-model="store.settings.captchaProvider" label="Captcha Resolver" class="flex items-center justify-between" :options="['Capastro', 'NoCaptchaAi', 'TrueCaptcha']" />
          </li>
          <li>
            <GlobalSelect v-model="store.settings.automationMode" label="Automation Mode" class="flex items-center justify-between" :options="['Human-Like', 'Max Speed', 'Refresher', 'Manual']" />
          </li>
          <li>
            <GlobalSwitch v-model="store.settings.enableProxy" label="Enable Proxy" simple-label horizontal />
          </li>
          <li>
            <GlobalSwitch v-model="store.settings.betaFeatures" label="Beta Features" simple-label horizontal />
          </li>
          <li class="flex items-center justify-between">
            <label for="refresh-time">Refresh Time:</label>
            <input id="refresh-time" v-model="store.settings.refreshTime" class="input w-20 text-center pr-0" type="number" />
          </li>
          <li>
            <GlobalSelect v-model="store.settings.soundPack" label="Sound Pack" class="flex items-center justify-between" :options="['main', 'mj', 'one piece', 'super mario', 'traore']" />
          </li>
        </ul>

        <button class="gr-from-l rounded-lg py-2 px-5 font-black w-max mx-auto" type="submit" :disabled="pending" v-text="pending ? 'please wait...' : 'save'" />
      </form>

      <!-- advance settings -->
      <div v-else-if="activeTab === 1" class="grid gap-6">
        <form class="grid gap-8" @submit.prevent="saveSettings(true)">
          <div class="grid gap-4">
            <div class="flex items-center gap-2 font-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
              </svg>
              <p>Eden Ai Token</p>
            </div>

            <div class="grid gap-3 font-600 text-sm">
              <textarea id="eden-ai" v-model="store.settings.edenAiToken" class="input w-full mx-auto placeholder:text-sm py-2 h-25" placeholder="EdenAi token"></textarea>
            </div>
          </div>

          <hr class="b-gray-6" />

          <div class="grid gap-4">
            <div class="flex items-center gap-2 font-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
              </svg>
              <p>Email</p>
            </div>
            <div class="grid gap-3 font-600 text-sm">
              <label for="nameSpace">Email Api Key :</label>
              <input id="nameSpace" v-model="store.settings.smtpApiKey" class="input w-full mx-auto placeholder:text-s" type="text" />
            </div>
            <div class="flex items-end gap-3 font-600 text-sm">
              <GlobalSelect v-model="store.settings.smtpDomain" :class="{ 'op-50': isFetchingDomains }" :label="`Email Domain (${domains.length}) `" :options="domains" container-class="!w-full" field-class="rounded-lg" :disabled="isFetchingDomains" />
              <button type="button" class="btn disabled:(opacity-50 cursor-wait) py-2" :disabled="isFetchingDomains" @click="fetchDomains">
                <FetchIndicator v-if="isFetchingDomains" :size="28" class="my-0!" />
                <span v-else v-text="'refresh'" />
              </button>
            </div>
          </div>

          <hr class="b-gray-6" />

          <div class="grid gap-4">
            <div class="flex items-center gap-2 font-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
              </svg>
              <p>Proxy URL</p>
            </div>
            <div class="grid gap-3 font-600 text-sm">
              <input id="nameSpace" v-model="store.settings.proxyServer" class="input w-full mx-auto placeholder:text-sm" type="text" />
            </div>
          </div>

          <hr class="b-gray-6" />

          <div class="grid gap-4">
            <div class="flex items-center gap-2 font-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
              </svg>
              <p>Captcha</p>
            </div>

            <div class="grid gap-3 font-600 text-sm">
              <label for="nameSpace">TrueCaptcha ID :</label>
              <input id="nameSpace" v-model="store.settings.trueCaptchaUser" class="input w-full mx-auto placeholder:text-sm" type="text" />
            </div>

            <div class="grid gap-3 font-600 text-sm">
              <label for="apiKey">TrueCaptcha API Key :</label>
              <input id="apiKey" v-model="store.settings.trueCaptchaKey" class="input w-full mx-auto placeholder:text-sm" />
            </div>

            <div class="grid gap-3 font-600 text-sm">
              <label for="apiKey">NoCaptcha API Key :</label>
              <input id="apiKey" v-model="store.settings.noCaptchaKey" class="input w-full mx-auto placeholder:text-sm" />
            </div>
          </div>

          <button class="gr-from-l rounded-lg py-2 px-5 font-black w-max mx-auto" type="submit" :disabled="pending" v-text="pending ? 'please wait...' : 'save'" />
        </form>
      </div>

      <!-- features settings -->
      <div v-else-if="activeTab === 2">
        <form @submit.prevent="saveSettings(true)">
          <ul class="grid gap-y-3 children:py-2 even:children:(bg-gray-7 bg-op-20)">
            <template v-if="Object.keys(store.settings.features).length">
              <li v-for="feature in Object.keys(store.settings.features)" :key="feature">
                <GlobalSwitch v-model="store.settings.features[feature]" class="capitalize" :label="feature.replace(/([a-z])([A-Z])/g, '$1 $2')" simple-label horizontal />
              </li>
            </template>
            <li v-else>
              <p class="text-center">no features available</p>
            </li>
          </ul>
          <button class="block mt-10 gr-from-l rounded-lg py-2 px-5 font-black w-max mx-auto" type="submit" :disabled="pending" v-text="pending ? 'please wait...' : 'save'" />
        </form>
      </div>
      <div v-else>No Tab Selected</div>
    </div>
  </div>
</template>
