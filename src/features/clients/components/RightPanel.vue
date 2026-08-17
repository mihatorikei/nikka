<script lang="ts" setup>
import { ref, computed } from "vue";
import useMainStore from "@/stores/main-store";
import IsEmpty from "@/features/core/components/IsEmpty.vue";
import FetchIndicator from "@/features/core/components/FetchIndicator.vue";
import GlobalSelect from "@/features/core/components/GlobalSelect.vue";
import { ClientsBookingState, ClientsTarget } from "@/features/appwrite/types";
import useWebviewStore from "@/stores/webview-store";
import NikkaImg from "@/features/core/components/NikkaImg.vue";

const store = useMainStore();
const selectedState = ref(ClientsBookingState.PENDING);
const webviewStore = useWebviewStore();

const selectedWhale = ref("all");

const whales = computed(() => {
  const allWhales = store.clients
    .map((client) => client.whale?.toLowerCase())
    .filter((w) => w);
  return [...new Set(allWhales)];
});
const filterQuery = ref("");

const clients = computed(() => {
  let result = store.clients.filter(
    (c) => selectedState.value === ClientsBookingState.PENDING ? c.bookingState === selectedState.value || ClientsBookingState.LOCAL : c.bookingState === selectedState.value,
  );
  if (selectedWhale.value !== "all")
    result = result.filter(
      (client) =>
        client.whale?.toLowerCase() === selectedWhale.value.toLowerCase(),
    );
  if (filterQuery.value)
    result = result.filter(
      (client) =>
        client.firstName
          .toLowerCase()
          .includes(filterQuery.value.toLowerCase()) ||
        client.lastName
          .toLowerCase()
          .includes(filterQuery.value.toLowerCase()) ||
        client.email.toLowerCase().includes(filterQuery.value.toLowerCase()) ||
        client.passportNumber
          .toLowerCase()
          .includes(filterQuery.value.toLowerCase()),
    );

  result.sort((a, b) => {
    if (a.important === b.important) {
      return (b.applicants?.length || 0) - (a.applicants?.length || 0);
    }
    return (Number(b.important) || 0) - (Number(a.important) || 0);
  });

  return result;
});

function selectClient(client: Client) {
  const targetIndex = store.selectedClients.findIndex(
    (id) => id === client.$id,
  );
  if (targetIndex < 0) {
    store.selectedClients.push(client.$id);
  } else {
    store.selectedClients.splice(targetIndex, 1);
  }
  // closeContextMenu()
}

function bookForAll() {
  if (store.selectedClients.length) {
    const targetClients = store.clients.filter(
      (c) => c.isDisabled === false && store.selectedClients.includes(c.$id),
    );
    for (const client of targetClients) {
      webviewStore.add(client, "book");
    }
  } else {
    const targetClients = store.clients.filter((c) => c.isDisabled === false);
    for (const client of targetClients) {
      webviewStore.add(client, "book");
    }
  }
}
</script>

<template>
  <div class="sticky top-0 flex flex-col gap-y-3 h-[calc(100vh-60px)] inset-y-0 overflow-hidden">
    <!-- tools -->
    <ul
      class="flex gap-x-3 justify-center bg-white bg-op-50 dark:(bg-white bg-op-10) rounded-full py-3 px-5 text-xs w-max mx-auto hover:children:scale-130 children:(duration-200 cursor-pointer)">
      <li>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
          <path fill="orange"
            d="m20.092 14.326l.193-1.894c.103-1.011.17-1.678.117-2.099h.02c.871 0 1.578-.746 1.578-1.666S21.293 7 20.421 7s-1.579.746-1.579 1.667c0 .416.145.797.384 1.089c-.343.223-.792.695-1.468 1.405c-.52.547-.78.82-1.07.863a.84.84 0 0 1-.473-.07c-.268-.124-.447-.462-.804-1.139L13.527 7.25c-.22-.417-.405-.766-.572-1.047c.683-.368 1.15-1.117 1.15-1.98C14.105 2.994 13.163 2 12 2s-2.105.995-2.105 2.222c0 .864.467 1.613 1.15 1.98c-.167.282-.351.631-.572 1.048L8.59 10.816c-.358.676-.537 1.014-.805 1.139a.84.84 0 0 1-.473.07c-.29-.043-.55-.317-1.07-.864c-.676-.71-1.125-1.182-1.468-1.405c.24-.292.384-.673.384-1.09C5.158 7.747 4.45 7 3.578 7C2.708 7 2 7.746 2 8.667c0 .92.707 1.666 1.579 1.666h.019c-.054.42.014 1.088.117 2.099l.193 1.894c.107 1.051.196 2.051.306 2.952h15.572c.11-.9.199-1.901.306-2.952M10.855 22h2.29c2.985 0 4.478 0 5.474-.94c.434-.412.71-1.152.908-2.116H4.473c.198.964.473 1.704.908 2.115C6.377 22 7.87 22 10.855 22" />
        </svg>
      </li>
      <!-- emails -->
      <li @click="$router.push('/emails')">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16">
          <g fill="none">
            <path fill="#1b44b1" d="M3 4h10a2 2 0 0 1 2 2v4a4 4 0 0 1-4 4H5a2 2 0 0 1-2-2z" />
            <path fill="#367af2"
              d="M7.237 7.103L13 4v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4l5.763 3.103a.5.5 0 0 0 .474 0" />
            <path fill="url(#SVGmBCS0bWF)"
              d="M7.237 7.103L13 4v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4l5.763 3.103a.5.5 0 0 0 .474 0" />
            <path fill="url(#SVG7P2a1wzr)"
              d="M7.237 7.103L13 4v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4l5.763 3.103a.5.5 0 0 0 .474 0" />
            <path fill="url(#SVGX9xXNdCj)" fill-opacity="0.75"
              d="M7.237 7.103L13 4v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4l5.763 3.103a.5.5 0 0 0 .474 0" />
            <path fill="url(#SVGWyEXiwLm)" fill-opacity="0.7"
              d="M7.237 7.103L13 4v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4l5.763 3.103a.5.5 0 0 0 .474 0" />
            <path fill="url(#SVGx4kQ3TwE)"
              d="M1 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v.84L7.237 7.943a.5.5 0 0 1-.474 0L1 4.84z" />
            <defs>
              <linearGradient id="SVGmBCS0bWF" x1="8.523" x2="12.026" y1="5.568" y2="11.814"
                gradientUnits="userSpaceOnUse">
                <stop offset=".228" stop-color="#0094f0" stop-opacity="0" />
                <stop offset=".431" stop-color="#0094f0" />
              </linearGradient>
              <linearGradient id="SVG7P2a1wzr" x1="5.286" x2="1.394" y1="4.842" y2="12.198"
                gradientUnits="userSpaceOnUse">
                <stop offset=".228" stop-color="#0094f0" stop-opacity="0" />
                <stop offset=".431" stop-color="#0094f0" />
              </linearGradient>
              <linearGradient id="SVGX9xXNdCj" x1="9.906" x2="10.749" y1="8" y2="12.727" gradientUnits="userSpaceOnUse">
                <stop stop-color="#2764e7" stop-opacity="0" />
                <stop offset="1" stop-color="#2764e7" />
              </linearGradient>
              <linearGradient id="SVGWyEXiwLm" x1="8.857" x2="9.938" y1="4.982" y2="13.035"
                gradientUnits="userSpaceOnUse">
                <stop offset=".533" stop-color="#dd3ce2" stop-opacity="0" />
                <stop offset="1" stop-color="#dd3ce2" />
              </linearGradient>
              <linearGradient id="SVGx4kQ3TwE" x1="4.565" x2="8.993" y1=".079" y2="10.481"
                gradientUnits="userSpaceOnUse">
                <stop stop-color="#6ce0ff" />
                <stop offset=".462" stop-color="#29c3ff" />
                <stop offset="1" stop-color="#4894fe" />
              </linearGradient>
            </defs>
          </g>
        </svg>
      </li>
      <!-- search -->
      <li>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <g fill="none">
            <path fill="url(#SVGp2Ojne6g)"
              d="M24 13.5C24 19.299 19.299 24 13.5 24S3 19.299 3 13.5S7.7 3 13.5 3S24 7.701 24 13.5" />
            <path fill="url(#SVGYfXZQcuf)"
              d="M20.7 22.467A11.45 11.45 0 0 1 13.5 25C7.149 25 2 19.851 2 13.5S7.149 2 13.5 2S25 7.149 25 13.5c0 2.725-.948 5.229-2.532 7.2l6.167 6.166a1.25 1.25 0 0 1-1.768 1.768zm1.8-8.967a9 9 0 1 0-18 0a9 9 0 0 0 18 0" />
            <path fill="url(#SVGpcRDXdUD)"
              d="m28.74 12.656l-.919-.299a1.9 1.9 0 0 1-1.199-1.197l-.298-.918a.363.363 0 0 0-.684 0l-.299.918a1.89 1.89 0 0 1-1.18 1.197l-.919.299a.363.363 0 0 0 0 .684l.919.298a1.9 1.9 0 0 1 1.198 1.202l.299.918a.363.363 0 0 0 .684 0l.299-.918a1.89 1.89 0 0 1 1.198-1.197l.919-.299a.363.363 0 0 0 0-.684z" />
            <path fill="url(#SVGMo5KLbDs)"
              d="M18.775 7.837a3.5 3.5 0 0 0-1.647-1.168l-1.684-.546a.665.665 0 0 1 0-1.254l1.684-.547a3.47 3.47 0 0 0 2.15-2.154l.014-.042l.547-1.682a.665.665 0 0 1 1.255 0l.547 1.682a3.47 3.47 0 0 0 2.198 2.196l1.683.547l.034.008a.665.665 0 0 1 0 1.254l-1.684.547a3.47 3.47 0 0 0-2.197 2.196l-.548 1.682l-.016.042a.664.664 0 0 1-1.238-.042l-.548-1.682a3.5 3.5 0 0 0-.55-1.037" />
            <defs>
              <radialGradient id="SVGpcRDXdUD" cx="0" cy="0" r="1"
                gradientTransform="rotate(63.379 16.51 3.958)scale(34.3364 26.737)" gradientUnits="userSpaceOnUse">
                <stop offset=".718" stop-color="#ffcd0f" />
                <stop offset=".991" stop-color="#e67505" />
              </radialGradient>
              <radialGradient id="SVGMo5KLbDs" cx="0" cy="0" r="1"
                gradientTransform="rotate(61.2 24.09 -12.708)scale(47.2968 36.829)" gradientUnits="userSpaceOnUse">
                <stop offset=".698" stop-color="#ffcd0f" />
                <stop offset=".991" stop-color="#e67505" />
              </radialGradient>
              <linearGradient id="SVGp2Ojne6g" x1="18.75" x2="3" y1="6.5" y2="24" gradientUnits="userSpaceOnUse">
                <stop stop-color="#fdfdfd" />
                <stop offset="1" stop-color="#b3e0ff" />
              </linearGradient>
              <linearGradient id="SVGYfXZQcuf" x1="3.421" x2="26.158" y1="26.158" y2="7.683"
                gradientUnits="userSpaceOnUse">
                <stop stop-color="#0094f0" />
                <stop offset="1" stop-color="#29c3ff" />
              </linearGradient>
            </defs>
          </g>
        </svg>
      </li>
      <!-- notifications -->
      <li>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 20 20">
          <g fill="none">
            <path fill="url(#SVGWhRYwdqV)" d="M12.99 15a3 3 0 1 1-6 0a3 3 0 0 1 6 0" />
            <path fill="url(#SVGuUHCFapn)"
              d="M9.988 2c3.15 0 5.744 2.335 5.985 5.356l.013.222l.005.224l-.001 3.606l.954 2.588l.025.084l.016.087l.005.088c0 .315-.196.59-.522.707l-.113.033l-.115.01H3.742a.8.8 0 0 1-.26-.046c-.286-.106-.475-.372-.482-.716l.005-.118l.033-.13l.951-2.584l.002-3.618l.004-.225C4.117 4.451 6.762 2 9.988 2" />
            <defs>
              <linearGradient id="SVGWhRYwdqV" x1="10.01" x2="10.01" y1="14.5" y2="18" gradientUnits="userSpaceOnUse">
                <stop stop-color="#eb4824" />
                <stop offset="1" stop-color="#ffcd0f" stop-opacity="0.988" />
              </linearGradient>
              <linearGradient id="SVGuUHCFapn" x1="17.01" x2="4.51" y1="15" y2="4" gradientUnits="userSpaceOnUse">
                <stop stop-color="#ff6f47" />
                <stop offset="1" stop-color="#ffcd0f" />
              </linearGradient>
            </defs>
          </g>
        </svg>
      </li>
      <!-- <li>
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="32" height="32" viewBox="0 0 48 48">
          <path fill="#37474F" d="M33 10A6 6 0 1 0 33 22 6 6 0 1 0 33 10zM15 10A6 6 0 1 0 15 22 6 6 0 1 0 15 10z"></path>
          <path fill="#37474F" d="M46.7,25l-15.3,3H16.7L1.4,25l4.3-7.9c1.1-1.9,3.1-3.1,5.3-3.1h26.2c2.2,0,4.2,1.2,5.3,3.1L46.7,25z"></path>
          <path fill="#37474F" d="M38 20A10 10 0 1 0 38 40 10 10 0 1 0 38 20zM10 20A10 10 0 1 0 10 40 10 10 0 1 0 10 20z"></path>
          <path fill="#37474F" d="M24 23A5 5 0 1 0 24 33A5 5 0 1 0 24 23Z"></path>
          <path fill="#546E7A" d="M24 26A2 2 0 1 0 24 30A2 2 0 1 0 24 26Z"></path>
          <g><path fill="#A0F" d="M38 23A7 7 0 1 0 38 37 7 7 0 1 0 38 23zM10 23A7 7 0 1 0 10 37 7 7 0 1 0 10 23z"></path></g>
          <g><path fill="#CE93D8" d="M41.7 27.7c-1-1.1-2.3-1.7-3.7-1.7s-2.8.6-3.7 1.7c-.4.4-.3 1 .1 1.4.4.4 1 .3 1.4-.1 1.2-1.3 3.3-1.3 4.5 0 .2.2.5.3.7.3.2 0 .5-.1.7-.3C42.1 28.7 42.1 28.1 41.7 27.7zM10 26c-1.4 0-2.8.6-3.7 1.7-.4.4-.3 1 .1 1.4.4.4 1 .3 1.4-.1 1.2-1.3 3.3-1.3 4.5 0 .2.2.5.3.7.3.2 0 .5-.1.7-.3.4-.4.4-1 .1-1.4C12.8 26.6 11.4 26 10 26z"></path></g>
        </svg>
      </li> -->
      <!-- Settings -->
      <li>
        <RouterLink to="/settings">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <g fill="none">
              <path fill="url(#SVGGyhq1bul)"
                d="M28.832 18.472a1.48 1.48 0 0 1 .537 1.634a14.3 14.3 0 0 1-3.156 5.443a1.48 1.48 0 0 1-1.671.347l-1.955-.858a1.5 1.5 0 0 0-.68-.128a1.5 1.5 0 0 0-.66.2a1.47 1.47 0 0 0-.727 1.124l-.235 2.13a1.48 1.48 0 0 1-1.13 1.276c-2.076.495-4.24.495-6.316 0a1.48 1.48 0 0 1-1.125-1.27l-.235-2.126a1.48 1.48 0 0 0-.485-.94a1.5 1.5 0 0 0-1.58-.255l-1.955.859a1.48 1.48 0 0 1-1.668-.343a14.3 14.3 0 0 1-3.16-5.45a1.48 1.48 0 0 1 .536-1.632l1.725-1.275a1.488 1.488 0 0 0 0-2.4l-1.725-1.273a1.48 1.48 0 0 1-.536-1.623A14.25 14.25 0 0 1 5.79 6.467c.14-.151.31-.271.5-.351a1.5 1.5 0 0 1 1.17 0l1.947.858a1.493 1.493 0 0 0 2.073-1.206l.236-2.122a1.48 1.48 0 0 1 1.148-1.281a15.5 15.5 0 0 1 3.146-.362c1.052.012 2.1.133 3.127.362a1.48 1.48 0 0 1 1.147 1.284l.236 2.12a1.483 1.483 0 0 0 2.067 1.2l1.946-.857a1.48 1.48 0 0 1 1.674.346a14.2 14.2 0 0 1 3.157 5.44a1.48 1.48 0 0 1-.537 1.63l-1.72 1.273a1.48 1.48 0 0 0-.004 2.395zM16 20a4 4 0 1 0 0-8a4 4 0 0 0 0 8" />
              <defs>
                <linearGradient id="SVGGyhq1bul" x1="22.717" x2="7.059" y1="28.927" y2="4.523"
                  gradientUnits="userSpaceOnUse">
                  <stop stop-color="#70777d" />
                  <stop offset="1" stop-color="#b9c0c7" />
                </linearGradient>
              </defs>
            </g>
          </svg>
        </RouterLink>
      </li>
    </ul>
    <!-- clients list & filters -->
    <div id="right-panel" class="sticky top-0 backdrop-blur-lg">
      <!-- state filter -->
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-lg">
          Clients <small class="font-normal">{{clients.filter(c => c.bookingState !== ClientsBookingState.DONE).length}}/{{clients.filter(c => c.bookingState === ClientsBookingState.DONE).length}}</small>
        </h3>
        <div class="flex gap-x-1 items-center justify-center text-xs bg-gray bg-op-30 dark:(bg-white bg-op-10) rounded-full">
          <button class="duration-200 ps-3" :class="{
            'state-selected': selectedState === ClientsBookingState.PENDING,
          }" @click="selectedState = ClientsBookingState.PENDING">
            PENDING
          </button>
          <button class="duration-200 pe-3" :class="{
            'state-selected': selectedState === ClientsBookingState.DONE,
          }" @click="selectedState = ClientsBookingState.DONE">
            DONE
          </button>
        </div>
      </div>
      <!-- search filter -->
      <div class="flex items-center gap-x-2">
        <input v-model="filterQuery" type="search" placeholder="Search..."
          class="w-full px-2 py-1 bg-white bg-op-10 text-white ps-5 b b-gray-5 b-op-50 rounded-xl bg-white text-black" />
        <GlobalSelect v-model="selectedWhale" :options="['all', ...whales]" class="w-max!" />
      </div>
      <ul v-if="store.isFetchingClients" class="flex h-full items-center justify-center">
        <li>
          <FetchIndicator :size="52" text="Getting Clients..." />
        </li>
      </ul>
      <ul v-else-if="clients.length < 1" class="flex h-full items-center justify-center">
        <li class="relative -top-15">
          <IsEmpty text="No Clients Yet" />
        </li>
      </ul>
      <!-- clients list -->
      <ul v-else class="flex flex-col gap-y-2 overflow-y-auto py-5 select-none pb-17 relative h-full">
        <li v-if="store.selectedClients.length" class="text-xs font-bold ml-auto -mt-5">
          <span class="text-primary-5 font-[poppins] cursor-pointer"
            @click="store.selectClient('', true, selectedState)" v-text="clients.every((c) => store.selectedClients.includes(c.$id))
                ? '&cross; unselect all'
                : '&checkmark; select all'
              " />
        </li>
        <li v-for="client in clients" :key="client.$id" :class="{
          'b-orange-5! b-op-50!': client.important,
          'op-50 filter-grayscale': client.isDisabled,
        }"
          class="min-h-max relative flex items-center gap-x-2 bg-white bg-op-40 dark:(bg-gray bg-op-20) rounded-xl px-2 b b-gray b-op-10 duration-200 hover:(bg-op-50 pl-3) cursor-pointer group py-1 overflow-x-hidden"
          @click.exact="webviewStore.add(client, 'book')" @contextmenu="store.showContextMenu($event, client)"
          @click.ctrl="selectClient(client)">
          <span v-if="store.selectedClients.length"
            class="hover:scale-135 duration-200 animate-fade-in-left animate-duration-200" @click.stop>
            <input type="checkbox" class="scale-130" :checked="store.selectedClients.findIndex(
              (id) => id && id === client.$id,
            ) >= 0
              " @click="store.selectClient(client.$id)" />
          </span>
          <div class="relative"
            :title="`${client.firstName} ${client.lastName} ${client.applicants.length ? ' & ' + client.applicants.map((a) => a.firstName + ' ' + a.lastName).join('&') : ''}`">
            <!-- <img v-client-popover="client" class="w-14 h-14 rounded-2xl b b-white b-op-50 object-cover object-center"
              :src="store.photoPreview(client.photo)" alt="" /> -->
            <NikkaImg v-client-popover="client" :src="store.photoPreview(client.photo)" alt="" class="w-14 h-14 rounded-2xl b b-white b-op-50 object-cover object-center"/>
            <span v-if="client.applicants.length > 0"
              class="absolute -right-1 bottom-0 text-xs font-black bg-primary-5 rounded-xl px-5px py-2px"
              v-text="client.applicants.length" />
          </div>
          <div class="flex flex-col">
            <span class="line-clamp-1 capitalize font-semibold" v-text="`${client.firstName} ${client.lastName}`
              " />
            <small class="op-80" v-text="client.whale ?? 'unknown'" />
          </div>
          <button v-if="
            webviewStore.webviews.find((b) => b.client.$id === client.$id)
          "
            class="flex items-center px-5 absolute gr-from-r group-hover:from-red-7 right-0 inset-y-0 duration-200 hover:px-10 text-center"
            @click.stop="webviewStore.remove(client.$id)">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto group-hover:hidden" width="24" height="42"
              viewBox="0 0 24 24">
              <path fill="currentColor"
                d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity="0.35" />
              <path fill="currentColor"
                d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z">
                <animateTransform attributeName="transform" dur="0.6s" repeatCount="indefinite" type="rotate"
                  values="0 12 12;360 12 12" />
              </path>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto hidden group-hover:block" width="32" height="32"
              viewBox="0 0 24 24">
              <path fill="currentColor"
                d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z" />
            </svg>
          </button>
          <RouterLink v-else :to="`/edit/${client.$id}`"
            class="flex items-center px-2 absolute gr-from-r right-0 inset-y-0 translate-x-20 duration-200 group-hover:-translate-x-1px hover:px-10 text-center"
            @click.stop>
            <img class="mx-auto" width="38" height="38"
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAPsUlEQVR4AexaDZBU1ZX+zuseRQF7kD9BwKCSrD9odI0aNP5EfqJW4q4R1hS6ZtyNJhVNrJhKbW00a2Vra2t1wViAcdfNLFFX4yYbE1NYEWEwLEGIIquuUWMSEUVAwtBj+JvpfvfkO/e+2/N6uhnEiEDFrvf1Offcc++753zn3vd6IMGf+Of9BPyJFwDer4ADsQK2XL/8lK03LLth241L52//2uOrdn69Y0f3zYue7r5p8T07b170lZ6bO/787cZ1QFXAhiufGdj5uSe/nVQKq1y1cLumhas0TU7VamGAuuQUCK4UyCyFPrXzGx3/oV9bNnh3iThgErDpitXnFSV9QavyeZcm4qoCjzSBS01PoE5q8Yrq3/Qc3P3izpsWTa4ZmygHRAI2Xvb8TNdT7HBpYaymBSiDVi9Nj2ACzJZLAuMdLSKPVW5a/HHqTa+GBBz//NYjTnqu656Jz3VtmPhsl574TJno0hP+r0xQrqZc3aXHP10muvS4VWWiS//sqTJB+WRZP/Rkl37oF5S/6NIPrix7TFhR1gkrunTCE2U91rCccnmXHvPzssfRy8rq8b9lHW/42RY9+vEtes3cN7RSTe5zqZD1BMZ6Gtmvk6HP+vOVYFGngnv1lkcOM70vGhJQdOm3VHGlOoykhKoQHEYJBfXQjvYoketHgx9Ls67f5jBk8xlr1k9p8wkDAzH5mR58fcE2oJqQdWM6StMjzJaH2RmWzcdl28W7j+6pDrjT9L6gZ70pdXqxc1xYDTxSqDunMHuUyjaThCijPcpojzLao4z2IG1uhVaJHgftSfEvL3Xg7368nbaErBsk000KWBEBTI7Lg9sjtAWWzFp0ojP1liXDau1MaUgAnFQCg0xCjkkwo8q2SVBq1o4SWdskmvTn/cCE+nYmQeZR5YqIhJj7+kJc9uHFOGjoZigDCgjMqu3zOiT0iX2mRwQbuC7O7K+eqp7jldxXQwLISEee6ciYSeWCTTb2K6tDUetP1bddikwq+wizG1g9YR6FI+OOjKObk1PO2fAILjxxOZ9oPRh8+go4boXIaP97P6GvQXLSdIGSEItZEp1kMo/GBGjL9Rxwv6psUhtoGaRUSo2Sa7XMWsAmjUG1ftq9pG52pb/1eZ0sK+0RwpNJqoAxnjBI0+/a8lNcNPEpiDWY5cEnr4IUqlCXZCwbqxHRZjIP9tf5W18hxvzRqETZkIAXThu4/sXTSjNf+khpBCEvnV7y+NUZJTG8fGZJXv5owK8nlcTjrJL8xnB2SX5r+Bgl8co5JXnl3IA155XE8Or5JTGsuaAka6a0ypoLh8grFw+R57fd8fDUk1YDyqykhKsy+J0YfPJKKJPlmCQlTAYkZFoIk70IPtYWRL0mHU6OgUfZkIDY8V5K/fk17YdM7P4U/J7x+wbcO0SK0keW+KXUqsCRYX8GJNCapO5Zp6zZol+U7HOF3/jJcl/7PAHVe89uw8ED2uBZZ/CpoQrfpt5y2AaUTvupX7KzSqgImlaAtyccFvulTnd8UqQVPO0nyn3t0wQogy+ItGPzRnCjA47Bq8FRJ0ynbejHHsSh41f5ZdcqofZ0ILNeL7AiTDeZh9kCxLXsPgFHr+iacPTS8qPjl/KNbGmXfuBn5YDHKR/v0qOWlD3GdZR1XEeXjl1cDlhESYx5rKyGIxeW9chHiQWdOuYnnTr2oc161P/8Tsc9uEk/8MAm/ep931Oedu0+qs43gaqxzuDJOqljArI2E2DtkZNvx0Gtr3l3Z5VARo3VGsxmicidE2o6bc5A/2qa7D4B2qNzubKp4IkN5f28FCilsq1eCuBl3/7oJ+g95QVJBbCDHSxTs09PO3Ab5qH2sfIvb+KcZN0xCc6kwXSDgyQ7ccS0b6BwyGY/TBlUPYx1Y9pkHsEGlywb3HrmE35w7qthC/DRNrX2jHZ8TvcB3xN4PgV7TU9D21GaTfls1woX3p36t7rQdgBt0yuLcCvm5paQqZtZBZaIlOOcsU846tb29iqKAzZi9NQvoWXgG36QI6vOWK5JYbEIgi3KBK4i5e4dMl1uEecH5r4aE6CCwK5krFPyGW42g1UA2DapUWZjrB8VIOG6+T4JY9uYF7atCma4JbitkGM+txBUeoC3tvDedLYKUK7VEqBsm+6RouWQdRg9+QsYMOw5P1r7O/WzvjRNZo6Yf/oGP6DPV0MCyP5CAp5JriHIXoatzxDtUXr2K3yPN7ACYJIwaZjuFuPWQhPm44KUSicTUGEGPesMvCZZDVF3KQoHd2LU+V/EkBP+E0lxOxlPoFklBClw3CKO50JaketH3HvKI5y96dWQAE3lOjgsDAyTELLr9Ux6ljPd21kFZpMqYEhM8sbCBXmd8q+0A7e17IJ5JhmM1YNbBJuYBEeDQdlZVw1sI3xElAlox7hPXko5n+dpD5RBq2edZ0C1oOqSa0Z9/6R+ss5qDdP1fr8+tfTya1Nap70+pSTUZd3UkqybVpI3DJ+gNFxYkvWGi0qy4WLqhkta5Y1Lh8i6GYfL65cfLq9dMVTW/vUwebXlL6++NR+8Mc04lOeF/QDyvwDtV2BFoYbtDKSTP4Edk5DtfW5s1NC7VK8lLduYgO9g7CcvwZAT50BaNoNVoGk1+ezoh4672zv189VQAf347nGXPedJTbsfmAXumU4BYZVYAsTrYICgDV7i9/xB2lUBT1tA6eAsYwabhD5NrqS4A6UJP8DYC6fj8BNmLzzq0WPvaeLWYNprCfDBQ9qRYxrGdAMYI7dN6OP6WAWm4y2eJ51sVxl43P9s9ntxa2579dzFg++Y94l+/XKdeyUBPnhnwfNOxjRJFC/FsyxsR/ZjRcD3m79BQiXs5OG25VCAjzmeyuzo70qwbe15iwfN+m6/fwTtO0NDAob/pGvCiIfLjw5/uKweP6Ykhv2orIahP9yiw/+beGCzjrxvsx7x3U16RPsmHX33m3rkXRv1K//2gPJR2F7b25FxMuv3uG9zGV6GfQ/rY9uYV1aDH2s27gLtEbhyK7R7EAft4vLMn/XYoFnz9yh4m60hAaLxTZDdnFi57ZQnvUlQGnsG/6wnk8IFB11xOZZglj3nyaZYHwHCdJMBGbu0I/MD9bxP0MVXi/UZdGsJbstI6I6B3DP1y96x4ZSHB826bypXvMdX/UwczvNmqj3bKXkGKQFCYWcR/HOdGaE0lqxtrJqc4TpwWzIXNQaZGNMDqxxTY5i6scv+2Gd+Np8h2nolF5X5orvIJDAR60eyKkpApQhsPfQ7h/7zQ5fQ6x1dDQlQY51MoyY5L3VjxYOBCM8l/4wng4kj89qB2cm8GmPmZ3vcgz7w4DyUVjGoYzxjmu8LQlhfHXzwYazZw9xcdhcrYd3INvn7F/6Wvbu8dtfBmepd+Hz2b4KOp7evBC5WjXG+3TmTZC9IZqGaYka6GP/KHzZKuyEyV2Mzs1u7Dpk9+kfp57A+JrrO39p5e6ptMnv5/PrV73mrIQFVyHVQexMErBrsMSaMVci0kEFjPKE02+VuCWaDf25nkowd0A7Tq6irBjEb+4IEQB3eZno9xPeFqgg6wlycM4wRjte24rdW/NHBg5+GBLx1WenlLdNbp5VntEp5RknKnxkinTOHyOarhsrvrj5c3vzccNn4+WGyvnrp1bPcHBhzBtvHUZoe2GMSjTki9HH/WyC+zbtTN7/YZ3ovwtjQZ7421qOtOOfdCZ6zvrP/H6B3nN3GrdKO3J6VjFFhUEGXwFxmB+0esZ1J8wfnsTEGY7kmbUwqMFuGtuKd717w7ygBOntSG/cpn/OBIerhHZ6s9rLnmarZwUCsL7DJJ0p+L2d91m+VE32Q8zGdc7QV73p3g9/jBOiCG+7SqrQbG8aSIeh1LAXGGFi+L/gKjPGgA1GaH1gFyMYgx7r5095WvPvdDx78NJwBtDW90gVf/jbGHXutto7gs54sZoxzcb5tMsDYD9UR2Yzs9krewo8P0vwi1JKQ9QUdbcX2vRM87/72zgB9ds7EZNyENhsgY46BGFvZHkZe2uIz9gK7GePeDgQbQoVkfnXjOZf3ob9JcQx+/t4LnivZfQL0+XmDIHiIzgcTwOgx0OLBgfVKYNozm9uz/lxgEN7u2bSqyFcNdfM3WH+TeZiYtuJeDt7i2f0WcLgRkGNgH1WIOraOQawCzxSZ44Jhut8GWdtsAQJvZ1K8D/tNGsBq8pI2ZFUhqbQV7927zFs4hn4ToKpcubvWHMHAkfIPl4SMH+u00ILAsFUBPYxJBhj3cpRhH5Nx9pneO8ZsysREmc1hwd//3gTPO+5mC/z/PP68lFFQLtQxgghNk2TihF7G2RXZQ45J08W34X2DLhDvbzaB+cCBWQREpO2g7713wYOffisAkEsRma8a+9ysaYCMHgKMHe6rwNg2ZoNkLFYNtr/pavY87JlubQvcfmsg+6iy7N9D5rPb7qYC1H3c/zEyMu8YkSElhURy8lhNWvmrjCx7Vmk2lg3gfvaSNhjoAwOLKd48yn3BfLz3LitAf3n7KKSVD4J7HhnrDdJVRc4YAww4yFeCMRsRqoHRWtBZiceb5uW+Yj6uYZcJQA8mw9h2pK8BWSXQLkVF4ZxRkEEHQci6Z3k3Qceb7w3m49xvV+46AWn3eb2M2/4nqgy87iwwG1FIUTh7iMPwFsQDbXcL2NfMx/X1k4DqNJBhXwXc7+EsYAK8rcpACbP7Nu1JNSmccQiSE5gEXvEGzeT+wHxcV9ME6Mp/HE/2j8Qu9z9Zb9rXg2SconiuumRCCrTwDIh3yuT+wny2nF08BZzj/ifDnl2TFTJuMJ3IM58/J8xuQDVJxnSjeObvkRy7FTKAyeAd9yfmuRx/Jf6775frOd+z7/d8hS8rETnmrS8+Hfy5YH3RL5OuB8nwrSh8eBMwYvs3i/vgOd83tL7t5glIK1Nq+78Zw95WYVWwGmKVGPPN7ECnW3vYN1vueO4f+t58f2g3JECX3ng80sowojnzkfWabMJ8rA5gFZLk1MKs/TN4I6AhAUj59mesekZzDJvNI8e8T0ITH62uhOq16Bw4Sa575VW70f6KJgmoXAB/whuzGYxRg7czAQ173vutR7XyXxw7Ra5fc6Z8ee2/yy2/ZMf+GnpYV2MCXGVS2P9k1qrA0Gxvp9VO/tXzh/T9Iv/l8jj5wouj5bpfXyFfWrsoTH1gfDcmIK30wJc2ma6XW2l/hCzfCE1PxWdXDpOrn/60XPPsnXLtr148MMJtXGXSYNLqV/nW5+Aq3WS3g7iJ7bNQaG2VmUsulquWzZarnlgtgsa3nIbJ9n9D0neJctE9D8qn7i/IX/xggHz6RxfIjAX/JJ9ZuFxmfD+8zfQdcIC3GxJwgMezx8t/PwF7nLL9bMAfu5w/AAAA//9Pa6/VAAAABklEQVQDAH5XbETsiCXWAAAAAElFTkSuQmCC" />
          </RouterLink>
          <!-- client details (category and visa type) -->
          <ul class="absolute bottom-3px right-2 flex items-center font-[poppins] text-xs gap-x-1 font-black">
            <li v-if="client.isReady" class="text-sky-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="1.25rem" height="1.25rem" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none" />
                <path fill="currentColor" fill-rule="evenodd"
                  d="M13.803 5.333c0-1.84 1.5-3.333 3.348-3.333A3.34 3.34 0 0 1 20.5 5.333c0 1.841-1.5 3.334-3.349 3.334a3.35 3.35 0 0 1-2.384-.994l-4.635 3.156a3.34 3.34 0 0 1-.182 1.917l5.082 3.34a3.35 3.35 0 0 1 2.12-.753a3.34 3.34 0 0 1 3.348 3.334C20.5 20.507 19 22 17.151 22a3.34 3.34 0 0 1-3.348-3.333a3.3 3.3 0 0 1 .289-1.356L9.05 14a3.35 3.35 0 0 1-2.202.821A3.34 3.34 0 0 1 3.5 11.487a3.34 3.34 0 0 1 3.348-3.333c1.064 0 2.01.493 2.623 1.261l4.493-3.059a3.3 3.3 0 0 1-.161-1.023"
                  clip-rule="evenodd" />
              </svg>
            </li>
            <li v-if="client.isPremium" class="text-pink-5" v-text="'PRE'" />
            <li v-if="client.bookingState === ClientsBookingState.LOCAL" class="text-sky-5" v-text="'LOCAL'" />
            <li v-if="
              [
                ClientsTarget.NDB_SCHENGEN,
                ClientsTarget.NDB_NATIONAL,
              ].includes(client.target)
            " :class="client.target === ClientsTarget.NDB_NATIONAL
                  ? 'text-sky-5'
                  : 'text-orange-5'
                ">
              NDB
            </li>
            <li v-if="client.target === ClientsTarget.NKC_NATIONAL" v-text="'D'" />
          </ul>
        </li>
      </ul>
      <div class="sticky bottom-1 flex items-center justify-center gap-x-3 mt-auto">
        <RouterLink to="/add-client"
          class="rounded-xl flex items-center gap-x-3 text-center justify-center text-white py-2 px-2 bg-gradient-to-r from-primary-7 to-transparent text-shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
            <circle cx="12" cy="6" r="4" fill="currentColor" />
            <path fill="currentColor"
              d="M18.095 15.031C17.67 15 17.149 15 16.5 15c-1.65 0-2.475 0-2.987.513C13 16.025 13 16.85 13 18.5c0 1.166 0 1.92.181 2.443Q12.605 21 12 21c-3.866 0-7-1.79-7-4s3.134-4 7-4c2.613 0 4.892.818 6.095 2.031"
              opacity="0.5" />
            <path fill="currentColor" fill-rule="evenodd"
              d="M16.5 22c-1.65 0-2.475 0-2.987-.513C13 20.975 13 20.15 13 18.5s0-2.475.513-2.987C14.025 15 14.85 15 16.5 15s2.475 0 2.987.513C20 16.025 20 16.85 20 18.5s0 2.475-.513 2.987C18.975 22 18.15 22 16.5 22m.583-5.056a.583.583 0 1 0-1.166 0v.973h-.973a.583.583 0 1 0 0 1.166h.973v.973a.583.583 0 1 0 1.166 0v-.973h.973a.583.583 0 1 0 0-1.166h-.973z"
              clip-rule="evenodd" />
          </svg>
          <span class="font-bold">Add Client</span>
        </RouterLink>
        <button class="duration-200 light:text-primary-7 hover:(gr-from-r py-1 pr-1 rounded-r-xl scale-125 rotate-10)"
          :disabled="store.isFetchingClients" @click="store.fetchClients()">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M12.079 2.25c-4.794 0-8.734 3.663-9.118 8.333H2a.75.75 0 0 0-.528 1.283l1.68 1.666a.75.75 0 0 0 1.056 0l1.68-1.666a.75.75 0 0 0-.528-1.283h-.893c.38-3.831 3.638-6.833 7.612-6.833a7.66 7.66 0 0 1 6.537 3.643a.75.75 0 1 0 1.277-.786A9.16 9.16 0 0 0 12.08 2.25" />
            <path fill="currentColor"
              d="M20.841 10.467a.75.75 0 0 0-1.054 0L18.1 12.133a.75.75 0 0 0 .527 1.284h.899c-.381 3.83-3.651 6.833-7.644 6.833a7.7 7.7 0 0 1-6.565-3.644a.75.75 0 1 0-1.276.788a9.2 9.2 0 0 0 7.84 4.356c4.809 0 8.766-3.66 9.151-8.333H22a.75.75 0 0 0 .527-1.284z"
              opacity="0.5" />
          </svg>
        </button>
        <button class="absolute bottom-1 right-1 duration-200 hover:(bg-primary-7 py-1 px-1 rounded-xl)"
          :disabled="store.isFetchingClients" title="book for all at once" @click="bookForAll">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16">
            <path d="M0 0h16v16H0z" fill="none" />
            <g fill="none">
              <path fill="url(#SVGjSgyOeow)"
                d="M8 1.517A1.5 1.5 0 0 0 5.91.137L1.514 2.022A2.5 2.5 0 0 0 0 4.319v4.164a1.5 1.5 0 0 0 2.09 1.38l5-2.144A1.5 1.5 0 0 0 8 6.341z" />
              <path fill="url(#SVG7oihJemo)"
                d="M11 3.517a1.5 1.5 0 0 0-2.09-1.38L4.514 4.022A2.5 2.5 0 0 0 3 6.319v4.164a1.5 1.5 0 0 0 2.09 1.38l5-2.144A1.5 1.5 0 0 0 11 8.341z" />
              <path fill="url(#SVGnj3hFerZ)"
                d="M14 5.517a1.5 1.5 0 0 0-2.09-1.38L7.514 6.022A2.5 2.5 0 0 0 6 8.319v4.164a1.5 1.5 0 0 0 2.09 1.38l5-2.144a1.5 1.5 0 0 0 .91-1.378z" />
              <path fill="url(#SVG646Ptc5Q)"
                d="M16 13.5c0 1.245-1 2.5-3.5 2.5S9 14.75 9 13.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5" />
              <path fill="url(#SVGuwKHvcHR)" d="M14.5 9a2 2 0 1 1-4 0a2 2 0 0 1 4 0" />
              <defs>
                <linearGradient id="SVGjSgyOeow" x1=".286" x2="7.059" y1="1.884" y2="7.531"
                  gradientUnits="userSpaceOnUse">
                  <stop stop-color="#0078d4" />
                  <stop offset="1" stop-color="#1b44b1" />
                </linearGradient>
                <linearGradient id="SVG7oihJemo" x1="3.286" x2="10.059" y1="3.884" y2="9.531"
                  gradientUnits="userSpaceOnUse">
                  <stop stop-color="#0fafff" />
                  <stop offset="1" stop-color="#2764e7" />
                </linearGradient>
                <linearGradient id="SVGnj3hFerZ" x1="6.286" x2="13.059" y1="5.884" y2="11.531"
                  gradientUnits="userSpaceOnUse">
                  <stop stop-color="#6ce0ff" />
                  <stop offset="1" stop-color="#58aafe" />
                </linearGradient>
                <linearGradient id="SVG646Ptc5Q" x1="10.665" x2="12.102" y1="12.532" y2="16.549"
                  gradientUnits="userSpaceOnUse">
                  <stop offset=".125" stop-color="#9c6cfe" />
                  <stop offset="1" stop-color="#7a41dc" />
                </linearGradient>
                <linearGradient id="SVGuwKHvcHR" x1="11.451" x2="13.49" y1="7.532" y2="10.787"
                  gradientUnits="userSpaceOnUse">
                  <stop offset=".125" stop-color="#9c6cfe" />
                  <stop offset="1" stop-color="#7a41dc" />
                </linearGradient>
              </defs>
            </g>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.state-selected {
  @apply font-black bg-primary-7 text-white rounded-full py-1 px-3 ! flex items-center;
}
#right-panel {
    @apply sticky top-0 rounded-xl py-2 px-2 flex flex-col gap-y-3 h-full bg-gradient-linear from-white from-op-50 to-transparent dark:(bg-gradient-linear from-#7f7f7f40 to-transparent);
}
</style>
