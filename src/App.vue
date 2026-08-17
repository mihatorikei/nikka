<script setup lang="ts">
import { ref, onMounted, useTemplateRef, inject, type Ref } from "vue";
import TitleBar from "@/features/core/components/TitleBar.vue";
import RightPanel from "@/features/clients/components/RightPanel.vue";
import AppWebview from "@/features/webview/components/AppWebview.vue";
import RouterPanel from "@/features/core/components/RouterPanel.vue";
import GlobalNotifications from "@/features/core/components/GlobalNotifications.vue";
import GlobalAlarm from "@/features/core/components/GlobalAlarm.vue";
import useWebviewStore from "@/stores/webview-store";
import useMainStore from "@/stores/main-store";
import ClientCard from "@/features/clients/components/ClientCard.vue";
import ContextMenu from "@/features/clients/components/ContextMenu.vue";
import GlobalConfirm from "@/features/clients/components/GlobalConfirm.vue";

const rightPanelWidth = ref("300px");
const panelsContainer = useTemplateRef<HTMLDivElement | null>(
  "panels-container",
);

const webviewStore = useWebviewStore();
const store = useMainStore();

const appVersion = inject<Ref<string>>('appVersion');

onMounted(() => {

  const resizer = document.getElementById("panel-resizer") as HTMLDivElement;

  let isResizing = false;
  resizer?.addEventListener("mousedown", (e) => {
    isResizing = true;
    panelsContainer.value?.classList.remove("duration-300");
    document.body.style.cursor = "ew-resize";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const windowWidth = window.innerWidth;
    const newWidth = windowWidth - e.clientX;
    if (newWidth <= 255 || newWidth >= windowWidth / 2) return;
    rightPanelWidth.value = `${newWidth}px`;
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
    panelsContainer.value?.classList.add("duration-300");
    document.body.style.cursor = "default";
  });
});
</script>

<template>
  <TitleBar />
  <div ref="panels-container" class="grid grid-cols-[1fr_300px] py-2 gap-x-2 h-screen" :style="`grid-template-columns: 1fr ${rightPanelWidth};`">
    <main class="overflow-auto flex pb-20">
      <div v-if="webviewStore.webviews.length" class="grid h-max w-full overflow-y-auto overflow-x-hidden pb-20 px-2 gap-x-3 grid-cols-5">
        <AppWebview v-for="browser in webviewStore.webviews" :key="browser.client.$id" :browser="browser" />
      </div>
      <div v-else class="h-90vh w-screen flex items-center justify-center">
        <div class="text-center flex gap-x-5 items-center rounded-xl p-5 bg-gradient-to-br from-gray-5 from-op-10 to-transparent">
          <Transition :appear="true" enter-active-class="!animate-zoom-in-down !animate-duration-1000">
            <img src="./assets/images/icon.png" width="92rem" class="mx-auto duration-200 animate-bounce animate-duration-3000 cursor-pointer" />
          </Transition>
          <div class="grid">
            <p class="text-2xl animate-fade-in-right animate-duration-200"><span class="text-yellow-5 font-black font-[Poppins] text-3xl">N</span>IKKA<span class="text-yellow-5 font-black font-[Poppins] text-3xl">APP</span></p>
            <p class="animate-fade-in-up animate-duration-200"><small>version {{ appVersion }}</small></p>
          </div>
        </div>
      </div>
    </main>
    <div class="relative">
      <RightPanel />
      <div class="flex items-center -left-10px absolute inset-y-0 h-max group my-auto op-70 cursor-pointer hover:(op-100 scale-110) w-max">
        <button id="panel-resizer" class="rounded-full px-3px py-8 bg-gray-4 dark:bg-dark-1 cursor-e-resize"></button>
      </div>
    </div>
  </div>

  <RouterPanel />
  
  <GlobalNotifications v-if="store.appNotification.text"/>
  <GlobalAlarm />
  <ContextMenu v-if="store.contextMenuClient !== null" />
  <GlobalConfirm v-if="store.confirmMessage" />
  <Teleport to="body">
    <ClientCard />
  </Teleport>
</template>

