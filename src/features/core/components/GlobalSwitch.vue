<script lang="ts" setup>
const props = defineProps<{
  label: string
  horizontal?: boolean
  simpleLabel?: boolean
}>()

const value = defineModel<string | boolean>()
</script>

<template>
  <label class="relative">
    <div :class="props.horizontal ? 'flex items-center gap-3' : 'grid gap-4 w-max'">
      <p :class="props.simpleLabel ? 'font-600 text-sm' : 'font-600 capitalize font-bold text-lg'">{{ props.label }}:</p>
      <input v-model="value" class="op-0 w-0 h-0 absolute" type="checkbox" :id="props.label.replace(' ', '-')" />
      <div :class="`relative w-13 h-5 bg-white bg-op-20 rounded-full cursor-pointer duration-100 ${value ? '!bg-primary-6' : ''} ${props.horizontal ? 'ml-auto' : 'mx-auto'}`">
        <div :class="value && 'left-6.5'" class="absolute top--0.9 left-0 h-6.5 w-6.5 rounded-full bg-white duration-100"></div>
      </div>
    </div>
  </label>
</template>
