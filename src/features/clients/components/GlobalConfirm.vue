<script lang="ts" setup>
import useMainStore from '@/stores/main-store'
const store = useMainStore()
</script>

<template>
  <div class="fixed inset-0 bg-black bg-op-50 flex items-center justify-center" @click.self="store.closeConfirm()">
    <div id="nikka-confirm" class="animate-flip-in-y animate-duration-200 relative w-sm text-center rounded-md bg-dark-1 bg-op-50 py-3 px-5 grid gap-y-3 backdrop-blur-2xl">
      <p class="my-3" v-text="store.confirmMessage" />
      <div class="flex items-center gap-x-3 mx-auto w-max">
        <button class="accept font-bold gr-from-l px-2 py-1 rounded-sm">YES</button>
        <button class="font-bold px-2 py-1 rounded-md" @click="store.closeConfirm()">Cancel</button>
      </div>
      <button class="absolute -right-3 -top-3 op-70" @click="store.closeConfirm()">
        <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <path class="fill-red-5" d="M12 22c-4.714 0-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12s0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22" />
          <path fill="white" d="M8.97 8.97a.75.75 0 0 1 1.06 0L12 10.94l1.97-1.97a.75.75 0 1 1 1.06 1.06L13.06 12l1.97 1.97a.75.75 0 1 1-1.06 1.06L12 13.06l-1.97 1.97a.75.75 0 0 1-1.06-1.06L10.94 12l-1.97-1.97a.75.75 0 0 1 0-1.06" />
        </svg>
      </button>
    </div>
  </div>
</template>
