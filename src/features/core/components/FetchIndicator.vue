<script lang="ts" setup>
const props = defineProps<{ size?: number; text?: string }>()
</script>
<template>
  <div class="block m-auto w-max my-5 text-center">
    <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto" :width="props.size ?? 42" :height="props.size ?? 42" viewBox="0 0 24 24">
      <circle cx="4" cy="12" r="3" fill="currentColor">
        <animate id="SVG9IgbRbsl" attributeName="r" begin="0;SVGFUNpCWdG.end-0.2s" dur="0.6s" values="3;.2;3" />
      </circle>
      <circle cx="12" cy="12" r="3" fill="currentColor">
        <animate attributeName="r" begin="SVG9IgbRbsl.end-0.48s" dur="0.6s" values="3;.2;3" />
      </circle>
      <circle cx="20" cy="12" r="3" fill="currentColor">
        <animate id="SVGFUNpCWdG" attributeName="r" begin="SVG9IgbRbsl.end-0.36s" dur="0.6s" values="3;.2;3" />
      </circle>
    </svg>
    <p v-show="props.text" class="font-bold" v-text="props.text" />
  </div>
</template>
