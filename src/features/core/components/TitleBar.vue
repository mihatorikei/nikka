<script lang="ts" setup>
import { inject, type Ref } from "vue";
import useMainStore from "@/stores/main-store";
import { account } from '@/features/appwrite/core'
const store = useMainStore()

const appVersion = inject<Ref<string>>('appVersion')

function logout() {
  store.showConfirm('are u sure wanna logout').then((result) => {
    if (result) {
      account.deleteSession({
        sessionId: 'current'
      }).then(() => {
        window.location.reload()
      }).catch((error) => {
        store.showNotification((error as Error).message, 'error')
      })
    }
  })
}
</script>

<template>
  <div id="titlebar"
    class="fixed top-0 inset-x-0 flex items-center block bg-white text-dark h-45px dark:(!bg-#2f3241 !text-white) px-3 font-bold text-xs z-1000">
    <div id="user-space" class="flex items-center gap-x-3 cursor-pointer group" @click="store.user?.$id ? logout() : () => { }">
      <template v-if="store.user?.$id">
        <img width="32" height="32" class="rounded-full" :src="store.photoPreview(store.user?.$id!, 'avatars')" />
        <span class="capitalize" v-text="store.user?.name || 'PARASITE'" />

        <svg xmlns="http://www.w3.org/2000/svg" width="19px" height="19px" class="hidden group-hover:block animate-fade-in-left animate-duration-200 text-red-5" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <path fill="currentColor" d="M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12q0-2.1.788-3.912t2.137-3.163l1.4 1.4q-1.1 1.1-1.712 2.55T4 12q0 3.35 2.325 5.675T12 20t5.675-2.325T20 12q0-1.675-.612-3.125t-1.713-2.55l1.4-1.4q1.35 1.35 2.138 3.163T22 12q0 2.075-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m-1-9V2h2v11z" />
        </svg>

      </template>
    </div>
    <span class="absolute inset-x-0 w-max m-auto flex items-center gap-x-2 text-sm">
      <img width="32" height="32" src="@/assets/images/icon.png" />
      <span><span class="text-yellow-5 font-black font-[Poppins]">N</span>IK<span class="text-yellow-5 font-black font-[Poppins]">KA</span> v{{ appVersion || "..." }}</span>
    </span>
  </div>
</template>


<style>
#titlebar {
  user-select: none;
  app-region: drag;
}

#user-space {
  -webkit-app-region: no-drag;
  app-region: no-drag;
}
</style>