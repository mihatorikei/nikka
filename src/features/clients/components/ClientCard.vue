<script lang="ts" setup>
import useMainStore from '@/stores/main-store'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const store = useMainStore()
</script>
<template>
  <div id="client-popover" class="max-w-md h-50 absolute hidden pointer-events-none select-none z-100 animate-fade-in animate-duration-200 bg-white bg-op-50 backdrop-blur-lg dark:(bg-dark bg-op-70) b-3 pr-3 b-primary-7 overflow-hidden rounded-xl">
    <div class="flex items-center gap-2">
      <img class="rounded-lg h-50 w-50 object-cover object-center" :src="store.photoPreview(store.clientPopover.photo)" />
      <div class="grid gap-y-3 items-center justify-between">
        <p class="text-center text-lg capitalize line-clamp-2 font-bold" v-text="store.clientPopover.name" />
        <span v-if="store.clientPopover.applicantsNames.length" class="text-center capitalize op-70 line-clamp-2 font-bold" v-text="`${store.clientPopover.applicantsNames.join(' & ')}`" />
        <ul class="grid gap-y-1 text-sm op-70 capitalize">
          <li>category: <span class="font-bold" :class="{ 'text-pink-5': store.clientPopover.isPremium }" v-text="store.clientPopover.isPremium ? 'premium' : 'normal'" /></li>
          <li>target: <span class="font-bold" v-text="store.clientPopover.target.replaceAll('-', ' ')" /></li>
          <li>created at: <span class="font-bold" v-text="dayjs(store.clientPopover.createdAt).fromNow()" /></li>
          <li>update at: <span class="font-bold" v-text="dayjs(store.clientPopover.updatedAt).fromNow()" /></li>
          <li>created by: <span class="font-bold" v-text="store.clientPopover.createdBy.replace('_', ' ')" /></li>
        </ul>
      </div>
    </div>
  </div>
</template>
