<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue'
import useMainStore from '@/stores/main-store'
import { onClickOutside } from '@vueuse/core'
import useWebviewStore from '@/stores/webview-store'
import { useRouter } from 'vue-router'
import useDatabase from '@/features/appwrite/composables/use-database.ts'
import NikkaImg from '@/features/core/components/NikkaImg.vue'
import { ClientsBookingState } from '@/features/appwrite/types'

const router = useRouter()
const store = useMainStore()
const webviewStore = useWebviewStore()

const db = useDatabase()

const client = store.contextMenuClient as Client

const element = useTemplateRef('context-menu')

onClickOutside(element, () => {
  closeContextMenu()
})

const showUsers = ref(false)

function isOverHeight(clientY: number, elHeight: number): boolean {
  return clientY + elHeight >= window.innerHeight
}

function closeContextMenu() {
  store.contextMenuClient = null
}

function updateInfo() {
  store.showNotification('not implemented yet', 'error')
  // if (store.selectedClients.length) {
  //   for (const clientID of store.selectedClients) {
  //     const client = store.clients.find((c) => c.$id === clientID)
  //     if (client) webviewStore.add(client, 'update')
  //   }
  // } else {
  //   webviewStore.add(client, 'update')
  // }
  // closeContextMenu()
}

function goToEmail() {
  router.push(`emails/${client.email}`)
  closeContextMenu()
}

function reRegister() {
  store.showNotification('not implemented yet', 'error')
  // if (store.selectedClients.length) {
  //   for (const clientID of store.selectedClients) {
  //     const client = store.clients.find((c) => c.$id === clientID)
  //     if (client) webviewStore.add(client, 're-register')
  //   }
  // } else {
  //   webviewStore.add(client, 're-register')
  // }
  // closeContextMenu()
}

function toggleTarget() {
  if (store.selectedClients.length) {
    for (const clientID of store.selectedClients) {
      const client = store.clients.find((c) => c.$id === clientID)
      if (client) {
        client.isPremium = !client.isPremium
        db.update('clients', client.$id, { isPremium: client.isPremium } as Partial<Client>).catch((error) => {
          store.showNotification((error as Error).message, 'error')
        })
      }
    }
  } else {
    client.isPremium = !client.isPremium
    db.update('clients', client.$id, { isPremium: client.isPremium } as Partial<Client>).catch((error) => {
      store.showNotification((error as Error).message, 'error')
    })
  }
  closeContextMenu()
}

function setAsDone() {
  if (store.selectedClients.length) {
    for (const clientID of store.selectedClients) {
      const client = store.clients.find((c) => c.$id === clientID)
      if (client) {
        client.bookingState = ClientsBookingState.DONE
        db.update('clients', client.$id, { bookingState: client.bookingState } as Partial<Client>).catch((error) => {
          store.showNotification((error as Error).message, 'error')
        })
      }
    }
  } else {
    client.bookingState = ClientsBookingState.DONE
    db.update('clients', client.$id, { bookingState: client.bookingState } as Partial<Client>).catch((error) => {
      store.showNotification((error as Error).message, 'error')
    })
  }
  closeContextMenu()
}
// function toggleReady() {
//   if (store.selectedClients.length) {
//     for (const clientID of store.selectedClients) {
//       const client = store.clients.find((c) => c.$id === clientID)
//       if (client) {
//         client.isReady = !client.isReady
//         db.update('clients', client.$id, { isReady: client.isReady } as Partial<Client>).catch((error) => {
//           store.showNotification((error as Error).message, 'error')
//         })
//       }
//     }
//   } else {
//     client.isReady = !client.isReady
//     db.update('clients', client.$id, { isReady: client.isReady } as Partial<Client>).catch((error) => {
//       store.showNotification((error as Error).message, 'error')
//     })
//   }
//   closeContextMenu()
// }

function toggleState() {
  if (store.selectedClients.length) {
    for (const clientID of store.selectedClients) {
      const client = store.clients.find((c) => c.$id === clientID)
      if (client) {
        client.isDisabled = !client.isDisabled
        db.update('clients', client.$id, { isDisabled: client.isDisabled } as Partial<Client>).catch((error) => {
          store.showNotification((error as Error).message, 'error')
        })
      }
    }
  } else {
    client.isDisabled = !client.isDisabled
    db.update('clients', client.$id, { isDisabled: client.isDisabled } as Partial<Client>).catch((error) => {
      store.showNotification((error as Error).message, 'error')
    })
  }
  closeContextMenu()
}

function deleteAccount() {
  store.showNotification('not implemented yet', 'error')
  // if (store.selectedClients.length) {
  //   for (const clientID of store.selectedClients) {
  //     const client = store.clients.find((c) => c.$id === clientID)
  //     if (client) webviewStore.add(client, 'delete')
  //   }
  // } else {
  //   webviewStore.add(client, 'delete')
  // }
  // closeContextMenu()
}

async function removeClient() {
  const many = store.selectedClients.length > 1
  store.showConfirm(`are u sure wanna delete ${many ? 'these clients' : 'this client'}?`).then((result) => {
    if (result) {
      if (many) {
        for (const clientID of store.selectedClients) store.removeClient(clientID)
      } else {
        store.removeClient(client.$id)
      }
    }
  })
}

function selectClient() {
  const targetIndex = store.selectedClients.findIndex((id) => id === client.$id)
  if (targetIndex < 0) {
    store.selectedClients.push(client.$id)
  } else {
    store.selectedClients.splice(targetIndex, 1)
  }
  closeContextMenu()
}

async function sendTo(userID: string, username: string) {
  if (store.selectClient.length) {
    for (const client of store.selectedClients) {
      db.update('clients', client, {
        owner: userID
      })
        .then(() => {
          store.clients.splice(
            store.clients.findIndex((c) => c.$id === client),
            1
          )
          store.report(`{subject} has sent {client:${store.selectedClients.length} clients} to {user:${username}}`)
        })
        .catch((err) => {
          store.showNotification((err as Error).message, 'error')
        }).finally(() => {
          store.clearSelectedClients()
        })
    }
    store.report(`{subject} has sent ${store.selectedClients.length} clients to {user:${username}}`)
  } else {
    db.update('clients', client.$id, {
      owner: userID
    } as Client)
      .then(() => {
        const clientName = `${client.firstName} ${client.lastName}`
        store.report(`{subject} has sent {client:${clientName}:${client.$id}} to {user:${username}}`)
        closeContextMenu()
        store.clients.splice(store.clients.findIndex(c => c.$id === client.$id), 1)
        store.showNotification(`client sent to ${userID.replace(/_/g, ' ')}`, 'success')
      })
      .catch((error) => {
        store.showNotification((error as Error).message, 'error')
      })
  }
}
</script>
<template>
  <div id="client-context-menu">
    <!-- users list -->
    <ul v-if="showUsers" ref="context-menu"
      class="shadow-xl bg-white dark:(bg-dark-1 bg-op-50) fixed w-60 grid rounded-md backdrop-blur-2xl max-h-screen overflow-auto hover:children:(bg-primary-5! bg-op-50!) odd:children:(py-1 bg-gray-5 bg-op-10) children:(py-0 px-2 flex items-center gap-x-2 capitalize cursor-pointer duration-200) hover:children:ps-4"
      :style="`top: ${isOverHeight(store.contextMenuPosition.y, 420) ? 'unset' : store.contextMenuPosition.y + 'px'}; bottom: ${isOverHeight(store.contextMenuPosition.y, 420) ? '5px' : 'unset'}; left: ${store.contextMenuPosition.x}px`">
      <li @click="showUsers = false">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <g fill="none">
            <path fill="currentColor" d="M20 12.75a.75.75 0 0 0 0-1.5zm0-1.5H4v1.5h16z" opacity=".5" />
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="m10 6l-6 6l6 6" />
          </g>
        </svg>
        <span>Go Back</span>
      </li>
      <!-- users view -->
      <li v-for="user in store.users" v-show="user.$id !== store.user.$id" :key="user.$id"
        @click="sendTo(user.$id, user.name)">
        <NikkaImg
          :src="`https://appwrite.nikkaa.com/v1/storage/buckets/avatars/files/${user.$id}/view?project=nikka-bot`"
          width="52" class="rounded-md" />
        <span class="truncate" v-text="user.name" />
      </li>
    </ul>
    <!-- items list -->
    <ul v-else ref="context-menu"
      class="animate-zoom-in-up animate-duration-200 shadow-xl bg-white dark:(bg-dark-1 bg-op-50) fixed w-60 grid rounded-md backdrop-blur-2xl max-h-screen overflow-auto hover:children:(bg-primary-5! bg-op-50!) odd:children:(bg-gray-5 bg-op-10) children:(py-2 px-2 flex items-center gap-x-2 capitalize cursor-pointer duration-200) hover:children:ps-7"
      :style="`top: ${isOverHeight(store.contextMenuPosition.y, 420) ? 'unset' : store.contextMenuPosition.y + 'px'}; bottom: ${isOverHeight(store.contextMenuPosition.y, 420) ? '5px' : 'unset'}; left: ${store.contextMenuPosition.x}px`">
      <!-- select client -->
      <li @click="selectClient">
        <template v-if="store.selectedClients.find((id) => id === client.$id)?.length">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <g fill="none" stroke="currentColor" stroke-width="1.5">
              <path
                d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z" />
              <path stroke-linecap="round" d="M15 12H9" />
            </g>
          </svg>
          <span v-text="'unselect'" />
        </template>
        <template v-else>
          <svg xmlns="http://www.w3.org/2000/svg" class="text-primary-5" width="22" height="22" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <g fill="none" stroke="currentColor" stroke-width="1.5">
              <path
                d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.5 12.5l2 2l5-5" />
            </g>
          </svg>

          <span v-text="'select'" />
        </template>
      </li>
      <!-- send to user -->
      <li
        :class="{ 'op-30 pointer-events-none filter-grayscale-100 animate-pulse animate-duration-700': store.fetchingUsers }"
        @click="showUsers = true">
        <img src="@/assets/images/fluent-send.png" width="22" />
        <span>Send to</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="ml-auto" width="22" height="22" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <path fill="currentColor" fill-rule="evenodd"
            d="M8.512 4.43a.75.75 0 0 1 1.057.082l6 7a.75.75 0 0 1 0 .976l-6 7a.75.75 0 0 1-1.138-.976L14.012 12L8.431 5.488a.75.75 0 0 1 .08-1.057"
            clip-rule="evenodd" />
        </svg>
      </li>
      <li @click="goToEmail">
        <img src="@/assets/images/fluent-mail.png" width="22" />
        <span>Go to email</span>
      </li>
      <li @click="[ClientsBookingState.PENDING, ClientsBookingState.LOCAL].includes(client.bookingState) ? setAsDone : undefined">
        <img src="@/assets/images/fluent-check.png" width="22" />
        <span>{{ client.bookingState === ClientsBookingState.DONE ? 'Return To Pending' : 'Set As Done' }}</span>
      </li>
      <!-- <li @click="toggleReady">
        <svg xmlns="http://www.w3.org/2000/svg" class="text-sky-5" width="24" height="24" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <path fill="currentColor" fill-rule="evenodd" d="M13.803 5.333c0-1.84 1.5-3.333 3.348-3.333A3.34 3.34 0 0 1 20.5 5.333c0 1.841-1.5 3.334-3.349 3.334a3.35 3.35 0 0 1-2.384-.994l-4.635 3.156a3.34 3.34 0 0 1-.182 1.917l5.082 3.34a3.35 3.35 0 0 1 2.12-.753a3.34 3.34 0 0 1 3.348 3.334C20.5 20.507 19 22 17.151 22a3.34 3.34 0 0 1-3.348-3.333a3.3 3.3 0 0 1 .289-1.356L9.05 14a3.35 3.35 0 0 1-2.202.821A3.34 3.34 0 0 1 3.5 11.487a3.34 3.34 0 0 1 3.348-3.333c1.064 0 2.01.493 2.623 1.261l4.493-3.059a3.3 3.3 0 0 1-.161-1.023" clip-rule="evenodd" />
        </svg>
        <span>Set as {{ client.isReady ? 'unready' : 'ready' }}</span>
      </li> -->
      <li @click="toggleTarget">
        <svg xmlns="http://www.w3.org/2000/svg" :class="{ 'filter-grayscale': client.isPremium }" width="24" height="24"
          viewBox="0 0 16 16">
          <path d="M0 0h16v16H0z" fill="none" />
          <g fill="none">
            <path fill="url(#SVGhtNcBZlo)"
              d="M7.194 2.102a.9.9 0 0 1 1.614 0l1.521 3.082l3.401.494a.9.9 0 0 1 .5 1.535l-2.462 2.4l.581 3.387a.9.9 0 0 1-1.306.948L8.001 12.35l-3.042 1.6A.9.9 0 0 1 3.653 13l.58-3.387l-2.46-2.399a.9.9 0 0 1 .499-1.535l3.4-.494z" />
            <defs>
              <linearGradient id="SVGhtNcBZlo" x1="14.5" x2="1.125" y1="14.332" y2="1.72"
                gradientUnits="userSpaceOnUse">
                <stop stop-color="#ff6f47" />
                <stop offset="1" stop-color="#ffcd0f" />
              </linearGradient>
            </defs>
          </g>
        </svg>

        <span>Set as {{ client.isPremium ? 'Normal' : 'Premium' }}</span>
      </li>
      <li @click="updateInfo">
        <img src="@/assets/images/fluent-draft.png" width="22" />
        <span>update info</span>
      </li>
      <li @click="reRegister">
        <img src="@/assets/images/fluent-sync.png" width="22" />
        <span>re-register</span>
      </li>
      <li @click="deleteAccount">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48">
          <path d="M0 0h48v48H0z" fill="none" />
          <g fill="none">
            <path fill="url(#SVGG1BzvfHp)"
              d="M24 4c11.046 0 20 8.954 20 20s-8.954 20-20 20S4 35.046 4 24S12.954 4 24 4" />
            <path fill="url(#SVGPSfZ0NBD)"
              d="m17.782 16.025l.102.091L24 22.233l6.116-6.117a1.25 1.25 0 0 1 1.666-.091l.102.091a1.25 1.25 0 0 1 .091 1.666l-.091.102L25.767 24l6.117 6.116a1.25 1.25 0 0 1 .091 1.666l-.091.102a1.25 1.25 0 0 1-1.666.091l-.102-.091L24 25.767l-6.116 6.117a1.25 1.25 0 0 1-1.666.091l-.102-.091a1.25 1.25 0 0 1-.091-1.666l.091-.102L22.233 24l-6.117-6.116a1.25 1.25 0 0 1-.091-1.666l.091-.102a1.25 1.25 0 0 1 1.666-.091" />
            <defs>
              <linearGradient id="SVGG1BzvfHp" x1="10.25" x2="36.5" y1="6.5" y2="45.25" gradientUnits="userSpaceOnUse">
                <stop stop-color="#f83f54" />
                <stop offset="1" stop-color="#ca2134" />
              </linearGradient>
              <linearGradient id="SVGPSfZ0NBD" x1="16.708" x2="25.3" y1="24.729" y2="33.663"
                gradientUnits="userSpaceOnUse">
                <stop stop-color="#fdfdfd" />
                <stop offset="1" stop-color="#fecbe6" />
              </linearGradient>
            </defs>
          </g>
        </svg>
        <span>Delete account</span>
      </li>
      <li v-if="store.user.labels.includes('admin')" @click="removeClient">
        <svg xmlns="http://www.w3.org/2000/svg" class="text-red-5" width="22" height="22" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5">
            <path stroke-linejoin="round" d="m15 18.5l5-5m0 5l-5-5" />
            <path d="M21 6H3m18 4H3m8 4H3m8 4H3" />
          </g>
        </svg>
        <span>Remove</span>
      </li>
      <li v-if="store.contextMenuClient?.isDisabled" class="text-green-5 font-bold" @click="toggleState">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
            <path d="m4 12.9l3.143 3.6L15 7.5" opacity=".5" />
            <path d="m20 7.563l-8.571 9L11 16" />
          </g>
        </svg>
        <span>Enable</span>
      </li>
      <li v-else @click="toggleState">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <path fill="currentColor" fill-rule="evenodd"
            d="M10.706 1.25c-1.087 0-1.843 0-2.535.286c-.691.286-1.225.82-1.994 1.59l-3.05 3.05c-.77.77-1.305 1.304-1.591 1.995S1.25 9.62 1.25 10.706v2.588c0 1.088 0 1.843.286 2.535c.286.691.82 1.226 1.59 1.994l3.05 3.05c.77.77 1.304 1.305 1.995 1.592c.692.286 1.448.286 2.535.285h2.588c1.088 0 1.843.001 2.535-.285c.691-.287 1.226-.822 1.994-1.591l3.05-3.05c.77-.77 1.305-1.304 1.592-1.995c.286-.692.286-1.447.285-2.535v-2.588c0-1.087.001-1.843-.285-2.535c-.287-.691-.822-1.225-1.591-1.994l-3.05-3.05c-.77-.77-1.304-1.305-1.995-1.591s-1.447-.286-2.535-.286zm-1.96 1.671c.38-.158.816-.17 2.103-.17h2.302c1.288 0 1.722.012 2.104.17c.381.158.698.456 1.608 1.367l.895.894L5.182 17.758l-.894-.895c-.91-.91-1.209-1.227-1.367-1.608c-.158-.382-.17-.816-.17-2.104V10.85c0-1.287.012-1.722.17-2.104c.158-.381.456-.698 1.367-1.608l2.849-2.85c.91-.91 1.227-1.208 1.608-1.366M6.241 18.818l.895.894c.91.91 1.227 1.209 1.608 1.367c.382.158.817.171 2.104.171h2.302c1.288 0 1.722-.013 2.104-.171c.381-.158.698-.456 1.608-1.367l2.85-2.849c.91-.91 1.208-1.227 1.366-1.608c.158-.382.171-.816.171-2.104V10.85c0-1.287-.013-1.722-.171-2.104c-.158-.381-.456-.698-1.367-1.608l-.894-.894z"
            clip-rule="evenodd" />
        </svg>
        <span>Disable</span>
      </li>
    </ul>
  </div>
</template>
