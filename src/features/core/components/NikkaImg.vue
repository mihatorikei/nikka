<script setup lang="ts">
import { ref } from 'vue'
import defaultAvatar from '@/assets/images/default-avatar.jpg?url'

const props = defineProps<{
  src: string
  width?: number|string
  height?: number|string
}>()

const finalImg = ref(defaultAvatar)

fetch(props.src)
  .then((res) => {
    if (res.ok) {
      finalImg.value = props.src
    }
  })
  .catch((error) => {
    console.log('error fetching image', props.src, error)
  })
</script>
<template>
  <img :src="finalImg" class="object-center object-cover" :width="props.width || props.height || 42" :height="props.height || props.width || 42" />
</template>
