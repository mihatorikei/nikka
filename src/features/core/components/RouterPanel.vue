<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const isVisible = ref(false)
const route = useRoute()
const router = useRouter()

watch(route, () => {
  isVisible.value = true
})

watch(isVisible, (state) => {
  if (state === false) router.replace('/')
})

const panelWidth = ref('450px')

onMounted(() => {
  if (route.path !== '/' && route.path !== undefined) {
    isVisible.value = true
  }

  const resizer = document.getElementById('resizer') as HTMLDivElement

  let isResizing = false

  resizer?.addEventListener('mousedown', (e) => {
    isResizing = true
    document.body.style.cursor = 'ew-resize'
    e.preventDefault()
  })

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return

    const windowWidth = window.innerWidth
    const newWidth = windowWidth - e.clientX

    panelWidth.value = `${newWidth}px`
  })

  document.addEventListener('mouseup', () => {
    isResizing = false
    document.body.style.cursor = 'default'
  })
})
</script>

<template>
  <Transition :duration="500" leave-active-class="animate-fade-out-right animate-duration-1000">
    <div v-show="isVisible && route.path !== '/'" class="fixed inset-0 z-10" @click.self="isVisible = false">
      <div class="animate-fade-in-right animate-duration-200 max-w-80% min-w-350px h-full mt-45px ml-auto w-max bg-gradient-to-b from-white to-red dark:(from-dark-1 from-op-40 to-transparent) rounded-r-xl backdrop-blur-2xl" :style="`width: ${panelWidth}`">
        <RouterView v-slot="{ Component }">
          <KeepAlive :exclude="['EditClientView']">
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
        <button id="resizer" class="absolute inset-y-0 h-max rounded-full -left-10px px-3px py-8 bg-white dark:bg-dark-1 op-50 my-auto cursor-e-resize hover:op-100"></button>
      </div>
    </div>
  </Transition>
</template>
