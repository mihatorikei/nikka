<script lang="ts" setup>
import { ref } from 'vue'
import nikkaImage from '@/assets/images/nikka.png?url'
import sanjiImage from '@/assets/images/sanji.png?url'
import zoroImage from '@/assets/images/zoro.png?url'

type NikkaGuide = {
  message: string
  type: 'error' | 'info'
  pose: 'normal' | 'think' | 'sad' | 'lol' | 'dk'
}

const props = defineProps<{
  guider: NikkaGuide
  action: BrowserAction
}>()

const showGuider = ref(true)
</script>

<template>
  <div class="absolute bottom-0 left-1 w-max cursor-pointer max-w-full group overflow-hidden" @click="showGuider = !showGuider">
    <div v-if="showGuider" class="flex items-end pr-4 animate-fade-in-up animate-duration-500">
      <img :src="['update', 're-register', 'register'].includes(props.action) ? sanjiImage : props.action === 'delete' ? zoroImage : nikkaImage" class="pointer-events-none duration-200 group-hover:(w-70px) -mb-5px" width="62" />
      <p :class="{ 'bg-red-5 bg-op-05': props.guider.type === 'error' }" class="bg-black text-white font-bold !bg-op-50 px-2 py-3px rounded-full text-xs mb-2 truncate max-w-45 hover:(overflow-visible max-w-full whitespace-normal !rounded-2)" v-text="props.guider.message" />
    </div>
    <button v-else class="mx-auto w-max block bg-black bg-op-30 rounded-t-lg py-2px px-1px ml-5 animate-fade-in-up animate-duration-200">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="m6 11l6-6l6 6M6 19l6-6l6 6" />
      </svg>
    </button>
  </div>
</template>
