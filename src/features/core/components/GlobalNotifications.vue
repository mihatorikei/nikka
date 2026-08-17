<script setup lang="ts">
import useMainStore from '@/stores/main-store'
const store = useMainStore()
</script>

<template>
  <div :class="store.appNotification.type === 'success' ? 'bg-green-5' : store.appNotification.type === 'info' ? 'bg-blue-5' : store.appNotification.type === 'warning' ? 'bg-orange-5' : 'bg-red-5'" class="animate-fade-in-up animate-duration-200 fixed bottom-5 text-white px-3 py-2 z-10 inset-x-0 w-max mx-auto rounded-md max-w-80vw font-bold text-sm" @click="store.hideNotification()" v-text="store.appNotification.text" />
</template>
