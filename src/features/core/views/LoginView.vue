<script lang="ts" setup>
import { ref, inject, type Ref } from 'vue'
import TitleBar from '@/features/core/components/TitleBar.vue'
import logoImage from '@/assets/images/icon.png?url'
import { account } from '@/features/appwrite/core'

const version = inject<Ref<string>>('appVersion', ref('wait...'))

const showPassword = ref(false)

const isSubmitting = ref(false)
const formError = ref('')

const phoneNumber = ref<number>()
const password = ref('')

async function loginSubmit() {
  formError.value = ''

  if (String(phoneNumber.value).length !== 8) {
    formError.value = 'phone number must be 7 length'
    return
  }
  if (password.value.length < 8) {
    formError.value = 'password must be 8 letters at least'
    return
  }

  isSubmitting.value = true

  account
    .createEmailPasswordSession({
      email: `${phoneNumber.value}@nikkaa.com`,
      password: password.value
    })
    .then(async () => {
      const currentUser = await account.get()
      if (currentUser.labels.includes('admin')) {
        refresh()
      } else {
        const allSessions = await account.listSessions()
        const desktopSessions = allSessions.sessions.filter((s) => s.osName.toLocaleLowerCase() === 'windows' && s.current === false)
        for (const desktopSession of desktopSessions) {
          await account.deleteSession({
            sessionId: desktopSession.$id
          })
        }
        refresh()
      }
    })
    .catch((error) => {
      const errorMessage = (error as Error).message
      if (errorMessage.includes('Value must be a valid email address')) {
        formError.value = 'invalid phone number'
      } else if (errorMessage.includes('Please check the email and password.')) {
        formError.value = 'invalid phone number or password'
      } else if (errorMessage.toLocaleLowerCase().includes('creation of a session is prohibited')) {
        window.location.reload()
      } else {
        formError.value = errorMessage
      }
    })
    .finally(() => {
      isSubmitting.value = false
    })
}

function refresh() {
  window.location.reload()
}
</script>
<template>
  <TitleBar :is-login="false"/>
  <div class="relative">
    <div class="grid items-center justify-center h-screen bg-cover bg-center">
      <div class="flex flex-col gap-8 justify-center backdrop-blur-lg rounded-3xl bg-gray dark:(bg-white bg-op-5) bg-op-10 px-15 pb-5 pt-20 animate-zoom-in animate-duration-200 w-max">
        <div class="text-center gap-y-3 flex flex-col">
          <Transition :appear="true" appear-active-class="animate-zoom-in-down animate-duration-1000">
            <img width="100" height="100" class="mx-auto absolute -top-10 inset-x-0 duration-200 hover:(scale-125 -top-15) cursor-pointer" :src="logoImage" />
          </Transition>
          <h3 class="font-black text-xl">LOGIN</h3>

          <form class="grid gap-y-3 w-max mx-auto min-w-17vw text-start" @submit.prevent="loginSubmit">
            <label>Phone Number</label>
            <div class="relative">
              <svg class="absolute inset-y-0 left-2 m-auto" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="m16.556 12.906l-.455.453s-1.083 1.076-4.038-1.862s-1.872-4.014-1.872-4.014l.286-.286c.707-.702.774-1.83.157-2.654L9.374 2.86C8.61 1.84 7.135 1.705 6.26 2.575l-1.57 1.56c-.433.432-.723.99-.688 1.61c.09 1.587.808 5 4.812 8.982c4.247 4.222 8.232 4.39 9.861 4.238c.516-.048.964-.31 1.325-.67l1.42-1.412c.96-.953.69-2.588-.538-3.255l-1.91-1.039c-.806-.437-1.787-.309-2.417.317" />
              </svg>
              <input v-model="phoneNumber" type="number" placeholder="Phone number" class="input w-full ps-10" required />
            </div>
            <label>Password</label>
            <div class="relative">
              <svg class="absolute inset-y-0 left-2 m-auto" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" fill-rule="evenodd" d="M22 8.293c0 3.476-2.83 6.294-6.32 6.294c-.636 0-2.086-.146-2.791-.732l-.882.878c-.519.517-.379.669-.148.919c.096.105.208.226.295.399c0 0 .735 1.024 0 2.049c-.441.585-1.676 1.404-3.086 0l-.294.292s.881 1.025.147 2.05c-.441.585-1.617 1.17-2.646.146l-1.028 1.024c-.706.703-1.568.293-1.91 0l-.883-.878c-.823-.82-.343-1.708 0-2.05l7.642-7.61s-.735-1.17-.735-2.78c0-3.476 2.83-6.294 6.32-6.294S22 4.818 22 8.293m-6.319 2.196a2.2 2.2 0 0 0 2.204-2.195a2.2 2.2 0 0 0-2.204-2.196a2.2 2.2 0 0 0-2.204 2.196a2.2 2.2 0 0 0 2.204 2.195" clip-rule="evenodd" />
              </svg>
              <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Password" class="input w-full ps-10" required />
              <button type="button" class="absolute right-2 inset-y-0" @click="showPassword = !showPassword">
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <g fill="none" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" d="M9 4.46A9.8 9.8 0 0 1 12 4c4.182 0 7.028 2.5 8.725 4.704C21.575 9.81 22 10.361 22 12c0 1.64-.425 2.191-1.275 3.296C19.028 17.5 16.182 20 12 20s-7.028-2.5-8.725-4.704C2.425 14.192 2 13.639 2 12c0-1.64.425-2.191 1.275-3.296A14.5 14.5 0 0 1 5 6.821" />
                    <path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z" />
                  </g>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="mt-2" width="24" height="24" viewBox="0 0 24 24">
                  <path fill="currentColor" fill-rule="evenodd" d="M1.606 6.08a1 1 0 0 1 1.313.526L2 7l.92-.394v-.001l.003.009l.021.045l.094.194c.086.172.219.424.4.729a13.4 13.4 0 0 0 1.67 2.237a12 12 0 0 0 .59.592C7.18 11.8 9.251 13 12 13a8.7 8.7 0 0 0 3.22-.602c1.227-.483 2.254-1.21 3.096-1.998a13 13 0 0 0 2.733-3.725l.027-.058l.005-.011a1 1 0 0 1 1.838.788L22 7l.92.394l-.003.005l-.004.008l-.011.026l-.04.087a14 14 0 0 1-.741 1.348a15.4 15.4 0 0 1-1.711 2.256l.797.797a1 1 0 0 1-1.414 1.415l-.84-.84a12 12 0 0 1-1.897 1.256l.782 1.202a1 1 0 1 1-1.676 1.091l-.986-1.514c-.679.208-1.404.355-2.176.424V16.5a1 1 0 0 1-2 0v-1.544c-.775-.07-1.5-.217-2.177-.425l-.985 1.514a1 1 0 0 1-1.676-1.09l.782-1.203c-.7-.37-1.332-.8-1.897-1.257l-.84.84a1 1 0 0 1-1.414-1.414l.797-.797a15.4 15.4 0 0 1-1.87-2.519a14 14 0 0 1-.591-1.107l-.033-.072l-.01-.021l-.002-.007l-.001-.002v-.001C1.08 7.395 1.08 7.394 2 7l-.919.395a1 1 0 0 1 .525-1.314" clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <p v-show="formError" class="text-sm font-bold text-red-5 text-center animate-fade-in animate-duration-200" @click="formError = ''" v-text="formError" />
            <button class="text-white w-max mx-auto bg-op-50 bg-gradient-to-l from-transparent to-primary-7 px-2 py-2 rounded-md text-sm font-bold" type="submit">LOGIN</button>
          </form>
        </div>
        <button class="absolute -top-3 -right-3 bg-dark bg-op-10 dark:(bg-white bg-op-5) rounded-xl px-1 py-1 hover:(scale-150 rotate-60) duration-200" @click="refresh">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.079 2.25c-4.794 0-8.734 3.663-9.118 8.333H2a.75.75 0 0 0-.528 1.283l1.68 1.666a.75.75 0 0 0 1.056 0l1.68-1.666a.75.75 0 0 0-.528-1.283h-.893c.38-3.831 3.638-6.833 7.612-6.833a7.66 7.66 0 0 1 6.537 3.643a.75.75 0 1 0 1.277-.786A9.16 9.16 0 0 0 12.08 2.25" />
            <path fill="currentColor" d="M20.841 10.467a.75.75 0 0 0-1.054 0L18.1 12.133a.75.75 0 0 0 .527 1.284h.899c-.381 3.83-3.651 6.833-7.644 6.833a7.7 7.7 0 0 1-6.565-3.644a.75.75 0 1 0-1.276.788a9.2 9.2 0 0 0 7.84 4.356c4.809 0 8.766-3.66 9.151-8.333H22a.75.75 0 0 0 .527-1.284z" opacity="0.5" />
          </svg>
        </button>
      </div>
    </div>
  </div>
  <span class="absolute inset-x-0 bottom-2 text-white op-50 text-center" v-text="`version: ${version}`" />
</template>

<style>
input {
  @apply py-2 rounded-lg bg-gray-5 bg-op-10 duration-200 ps-10 placeholder:(text-xs op-50);
}
label {
  @apply text-xs op-75 font-bold;
}
</style>
