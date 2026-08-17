<script lang="ts" setup>
const props = defineProps<{ text: string }>()
</script>

<template>
  <div>
    <slot>
      <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto op-20" width="125" height="125" viewBox="0 0 24 24">
        <mask id="SVG9bHMecmR">
          <g fill="#fff" fill-opacity="0" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
            <path stroke-dasharray="20" stroke-dashoffset="20" d="M12 5c1.66 0 3 1.34 3 3c0 1.66 -1.34 3 -3 3c-1.66 0 -3 -1.34 -3 -3c0 -1.66 1.34 -3 3 -3Z">
              <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.32s" values="20;0" />
            </path>
            <path stroke-dasharray="36" stroke-dashoffset="36" d="M12 14c4 0 7 2 7 3v2h-14v-2c0 -1 3 -3 7 -3Z">
              <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.4s" values="36;0" />
            </path>
            <g fill="none" stroke-dasharray="28" stroke-dashoffset="28" transform="rotate(45 12 12)">
              <path stroke="#000" d="M0 11h24" />
              <path d="M1 13h22" />
              <animate fill="freeze" attributeName="stroke-dashoffset" begin="1.08s" dur="0.32s" values="28;0" />
            </g>
            <animate fill="freeze" attributeName="fill-opacity" begin="0.88s" dur="0.12s" values="0;0.3" />
          </g>
        </mask>
        <rect width="24" height="24" fill="currentColor" mask="url(#SVG9bHMecmR)" />
      </svg>
    </slot>
    <p class="font-bold text-center text-gray-4" v-text="props.text ?? 'Empty!'" />
  </div>
</template>
