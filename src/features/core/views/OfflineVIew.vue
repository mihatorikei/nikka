<script lang="ts" setup>
import { inject, ref, type Ref } from 'vue'
import TitleBar from '@/features/core/components/TitleBar.vue'

function reload() {
  window.location.reload()
}

const version = inject<Ref<string>>('appVersion')
</script>
<template>
  <TitleBar />
  <div>
    <div class="grid items-center h-screen">
      <div class="relative flex flex-col gap-8 justify-center backdrop-blur-lg rounded-3xl bg-white bg-op-5 px-10 py-10 animate-zoom-in animate-duration-200 w-max min-w-30vw m-auto">
        <div class="text-center gap-y-3 flex flex-col text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto" width="145" height="145" viewBox="0 0 20 20">
            <g fill="none">
              <path fill="url(#SVGBoyq0dCS)" d="M10 6a8.98 8.98 0 0 0-6.95 3.282A1 1 0 1 1 1.507 8.01A10.98 10.98 0 0 1 10 4a10.98 10.98 0 0 1 8.494 4.01a1 1 0 1 1-1.543 1.272A8.98 8.98 0 0 0 10 6" />
              <path fill="url(#SVGBoyq0dCS)" d="M5.25 11.334A5.99 5.99 0 0 1 10 9c1.932 0 3.651.912 4.75 2.334a1 1 0 0 0 1.582-1.223A7.99 7.99 0 0 0 10 7a7.99 7.99 0 0 0-6.333 3.11a1 1 0 0 0 1.583 1.224" />
              <path fill="url(#SVGBoyq0dCS)" d="M7.488 13.359A3 3 0 0 1 10 12c1.05 0 1.974.539 2.512 1.359a1 1 0 1 0 1.673-1.096A5 5 0 0 0 10 10a5 5 0 0 0-4.185 2.263a1 1 0 1 0 1.673 1.096" />
              <path fill="url(#SVGBoyq0dCS)" d="M10 16.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3" />
              <path fill="url(#SVGd5AtpbJS)" d="m13.603 10.554l-3.496 6.998A1 1 0 0 0 11.002 19h6.996a1 1 0 0 0 .895-1.448l-3.5-6.999a1 1 0 0 0-1.79 0" />
              <path fill="url(#SVGIcr4Id3M)" d="M14.999 12.495v3.002a.5.5 0 1 1-1.001 0v-3.002a.5.5 0 0 1 1 0m-.5 5.504a.5.5 0 1 1 0-1a.5.5 0 0 1 0 1" />
              <defs>
                <radialGradient id="SVGBoyq0dCS" cx="0" cy="0" r="1" gradientTransform="matrix(0 -11 15.3509 0 10 15)" gradientUnits="userSpaceOnUse">
                  <stop offset=".114" stop-color="#8b52f4" />
                  <stop offset="1" stop-color="#ea71ef" />
                </radialGradient>
                <linearGradient id="SVGd5AtpbJS" x1="11.406" x2="17.313" y1="8.594" y2="19.844" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#ffcd0f" />
                  <stop offset="1" stop-color="#fe8401" />
                </linearGradient>
                <linearGradient id="SVGIcr4Id3M" x1="13.164" x2="16.371" y1="11.995" y2="17.697" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#4a4a4a" />
                  <stop offset="1" stop-color="#212121" />
                </linearGradient>
              </defs>
            </g>
          </svg>
          <h3 class="op-65">You are Offline</h3>
          <p class="op-65">please check your internet and reload the page</p>
          <button class="btn w-max mx-auto" @click="reload">Reload</button>
        </div>
      </div>
    </div>
    <span class="absolute inset-x-0 bottom-2 text-white op-50 text-center" v-text="`version: ${version}`" />
  </div>
</template>
