<script lang="ts" setup>
const props = defineProps<{ goBack?: boolean; title: string; relative?: boolean }>()
</script>

<template>
  <div :class="{ relative: relative, 'sticky top-0': !relative }" class="grid inset-x-0 flex items-center justify-between bg-dark-9 bg-op-50 backdrop-blur-xl items-center py-5 px-5 z-3 text-white">
    <button @click="props.goBack ? $router.back() : $router.replace('/')">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-arrow-left" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
      </svg>
    </button>
    <div class="flex items-center gap-2 w-max font-600">
      <slot />
      <p v-text="props.title" />
    </div>
  </div>
</template>
