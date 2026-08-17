<script setup lang="ts">
import { ref, onMounted } from 'vue'
import useMainStore from '@/stores/main-store'
import ApplicantForm from '@/features/clients/components/ApplicantForm.vue'
import GlobalSelect from '@/features/core/components/GlobalSelect.vue'
// import { useBookingStore } from '@renderer/stores/booking-store'
import axios from 'axios'
import { ID } from 'appwrite'
import { ClientsTarget, ClientsGender } from '@/features/appwrite/types'
import useDatabase from '@/features/appwrite/composables/use-database'
import hexMask from '@/assets/images/hexagon-alt.png?url'
import { useRoute, useRouter } from 'vue-router'

const store = useMainStore()
// const bookingStore = useBookingStore()
const db = useDatabase()
const route = useRoute()
const router = useRouter()

const clientID = route.params.id as string

const client = ref<Client>()

const formError = ref('')

const fetchingData = ref(false)
const fetchError = ref('')
const updatingClient = ref(false)
const aiModel = ref('microsoft')

const photoFile = ref('')

let oldApplicantsPhotos: string[] = []
let oldApplicantsPassports: string[] = []

function selectPhoto(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    photoFile.value = window.desktop.getPath(target.files[0])
  }
}

function normalizeStr(str: string | null) {
  return str
    ? str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace("'", '')
        .toLocaleLowerCase()
    : ''
}

function randomNumber() {
  return Math.floor(Math.random() * 999) + 1
}

async function fetchData() {
  fetchingData.value = true

  const data = (await window.desktop.invoke('fetch-data', client.value?.passportPhoto, JSON.parse(JSON.stringify(store.settings)), aiModel.value.toString())) as EdenAiData | undefined

  if (data) {
    client.value!.$id = ID.unique()
    client.value!.lastName = normalizeStr(data.last_name.value)
    client.value!.firstName = data.given_names.length ? normalizeStr(data.given_names.map((n) => n.value).join(' ')) : ''
    client.value!.passportNumber = data.document_id.value || ''
    client.value!.birthdate = data.birth_date.value || ''
    client.value!.passportIssue = data.issuance_date.value || ''
    client.value!.passportExpire = data.expire_date.value || ''
    client.value!.email = `${client.value?.firstName.replace(' ', '-')}-${randomNumber()}@${store.settings.emailsDomain}`.toLocaleLowerCase()
    client.value!.gender = data.gender.value === 'F' ? ClientsGender.FEMALE : ClientsGender.MALE
    client.value!.birthplace = normalizeStr(data.birth_place.value)
    client.value!.phoneNumber = getPhoneNumber(data.document_id.value || '')

    async function getNationality(countryCode: string) {
      if (!countryCode) {
        store.showNotification('error getting nationality', 'error')
        return 'mauritania'
      }
      try {
        // https://restcountries.com/v4/alpha/mr
        // https://restcountries.com/v4/alpha/sen?fields=name
        const response = await axios.get<{ name: { common: string } }>(`https://restcountries.com/v4/alpha/${countryCode}?fields=name`)
        return response.data.name.common || 'mauritania'
      } catch (error) {
        store.showNotification(`unable to get nationality: ${(error as Error).message}`, 'error')
        return ''
      }
    }

    client.value!.nationality = data.country?.name || (await getNationality(data.nationality.value || ''))

    // photos
    if (data?.image_id?.[0]?.value) {
      client.value!.photo = `data:image/jpeg;base64,${data.image_id[0].value}`
    }

    document.querySelector('button[type=submit]')?.scrollIntoView({
      behavior: 'smooth'
    })
  } else {
    store.showNotification('unable to parse passport data', 'error')
  }
  fetchingData.value = false
}

function getPhoneNumber(passportNumber: string, increase = false) {
  return increase ? (Number(passportNumber) + 1).toString() : '4' + passportNumber.slice(-7).replace(/^[a-z]/i, '4')
}

async function updateClient() {
  formError.value = ''

  // if (photoFile.value && client.value?.photo) {
  //     const oldPhoto = client.value.photo
  //     const newPhoto = await window.desktop.invoke<string>('upload-file', photoFile.value)
  //     client.value.photo = newPhoto
  //     if(oldPhoto) await window.desktop.invoke('delete-file', oldPhoto)
  // }

  try {
    updatingClient.value = true

    const clientToSave = JSON.parse(JSON.stringify(client.value)) as Client

    // update photo
    if (photoFile.value) {
      const oldPhoto = client.value?.photo
      const newPhoto = await window.desktop.invoke<string>('upload-file', photoFile.value, 'avatar')
      console.log('============> new photo', newPhoto)
      clientToSave.photo = newPhoto
      if(oldPhoto) await window.desktop.invoke('delete-file', oldPhoto)
    }

    // upload new applicants photos
    if (clientToSave.applicants.length && Array.isArray(clientToSave.applicants)) {
      for (let i = 0; i < clientToSave.applicants.length; i++) {
        if (!oldApplicantsPhotos.includes(clientToSave.applicants[i].photo)) {
          clientToSave.applicants[i].photo = await window.desktop.invoke('upload-file', clientToSave.applicants[i].photo, 'photo')
        }

        if (!oldApplicantsPassports.includes(clientToSave.applicants[i].passportPhoto)) {
          console.log('new passport found for: ', clientToSave.applicants[i].firstName)
          clientToSave.applicants[i].passportPhoto = await window.desktop.invoke('upload-file', clientToSave.applicants[i].passportPhoto, 'passport')
          console.log('passport uploaded', clientToSave.applicants[i].photo)
        }
      }
    }

    await db.update('clients', clientID, {
      firstName: clientToSave.firstName,
      lastName: clientToSave.lastName,
      photo: clientToSave.photo,
      passportPhoto: clientToSave.passportPhoto,
      passportNumber: clientToSave.passportNumber,
      passportIssue: clientToSave.passportIssue,
      passportExpire: clientToSave.passportExpire,
      birthdate: clientToSave.birthdate,
      birthplace: clientToSave.birthplace,
      contactNumbers: clientToSave.contactNumbers,
      day: clientToSave.day,
      email: clientToSave.email,
      gender: clientToSave.gender,
      important: clientToSave.important,
      nationality: clientToSave.nationality,
      nin: clientToSave.nin,
      whale: clientToSave.whale,
      phoneNumber: clientToSave.phoneNumber,
      updatedBy: store.user.$id,
      status: clientToSave.status,
      target: clientToSave.target,
      visaSubType: clientToSave.visaSubType || '',
      applicants: JSON.stringify(clientToSave.applicants) as unknown
    } as Partial<Client>)

    const clientIndex = store.clients.findIndex((c) => c.$id === clientToSave.$id)
    if (clientIndex !== -1) {
      store.clients[clientIndex] = {
        ...store.clients[clientIndex],
        ...clientToSave
      }
    }

    store.showNotification(`client ${clientToSave.firstName} updated`)
    router.back()
  } catch (error) {
    console.log('error updating', error)
    store.showNotification(`failed to update client ${(error as Error).message}`, 'error')
  } finally {
    updatingClient.value = false
  }
}

async function registerClient() {
  // formError.value = ''

  // if (!client.value?.photo && !photoFile.value) {
  //   formError.value = 'please select a photo'
  //   return
  // }

  // const clonedClient = JSON.parse(JSON.stringify(client.value))
  // console.log('cloned client', clonedClient)
  // bookingStore.add(clonedClient, 'register', true)
}

function addApplicant() {
  if (client.value?.applicants.length && client.value?.applicants.length >= 4) return
  client.value?.applicants.push({
    lastName: '',
    firstName: '',
    passportNumber: '',
    birthdate: '',
    gender: ClientsGender.MALE,
    passportExpire: '',
    passportPhoto: '',
    status: 'Single',
    birthplace: '',
    nationality: 'Mauritania',
    relation: 'brother',
    photo: '',
    passportIssue: '',
    nin: ''
  })
}

function fetchClient() {
  fetchingData.value = true
  fetchError.value = ''
  db.get('clients', clientID)
    .then((clientData) => {
      clientData.applicants = JSON.parse(clientData.applicants || '[]') as unknown as Client['applicants']
      client.value = clientData as unknown as Client
    })
    .catch((error) => {
      store.showNotification(`error fetching client: ${(error as Error).message}`, 'error')
      fetchError.value = `error fetching client: ${(error as Error).message}`
    })
    .finally(() => {
      fetchingData.value = false
    })
}

function removeContactNumber(index: number) {
  client.value?.contactNumbers?.splice(index, 1)
}
function addContactNumber() {
  client.value?.contactNumbers?.push('')
}

onMounted(() => {
  fetchClient()
})
</script>

<template>
  <div class="grid gap-8 overflow-x-hidden max-h-screen pb-15">
    <div class="sticky top-0 grid inset-x-0 flex items-center justify-between bg-dark-9 bg-op-50 backdrop-blur-xl items-center py-5 px-5 z-3 text-white">
      <button @click="$router.replace('/')">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-arrow-left" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
        </svg>
      </button>
      <div class="flex items-center gap-2 w-max font-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-person-fill-add" viewBox="0 0 16 16">
          <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0m-2-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
          <path d="M2 13c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4" />
        </svg>
        <p>Edit Client</p>
      </div>
    </div>
    <div v-if="fetchingData" class="text-center">please wait...</div>
    <div v-else-if="fetchError || !client || Object.keys(client).length < 1">{{ fetchError || 'Error fetching client' }}</div>
    <form v-else class="grid gap-6 items-center justify-center px-10 pb-10" @submit.prevent="updateClient">
      <!-- Passport Pic -->
      <div class="relative grid items-center gap-y-5">
        <!-- important -->
        <div class="absolute -right-4 -top-4 z-3">
          <label for="important" class="block cursor-pointer filter-grayscale-100 rotate-25deg duration-500 rounded-full bg-primary-5 bg-op-20 p-1" :class="{ '!filter-grayscale-0 scale-125 !rotate-0deg': client?.important }">
            <div class="flex items-center gap-2 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 20 20">
                <g fill="none">
                  <path fill="url(#SVGQXhLLblw)" fill-rule="evenodd" d="M8.03 11.97a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 0 1-1.06-1.06l3.75-3.75a.75.75 0 0 1 1.06 0" clip-rule="evenodd" />
                  <path fill="url(#SVGUzUUme0E)" d="M13.325 2.618a2 2 0 0 0-3.203.52L8.393 6.596a1.5 1.5 0 0 1-.784.722l-3.59 1.436a1 1 0 0 0-.336 1.636l5.927 5.927a1 1 0 0 0 1.636-.335l1.436-3.59a1.5 1.5 0 0 1 .722-.785l3.458-1.73a2 2 0 0 0 .52-3.202z" />
                  <path fill="url(#SVG5yp8BdGV)" fill-opacity="1" d="M13.325 2.618a2 2 0 0 0-3.203.52L8.393 6.596a1.5 1.5 0 0 1-.784.722l-3.59 1.436a1 1 0 0 0-.336 1.636l5.927 5.927a1 1 0 0 0 1.636-.335l1.436-3.59a1.5 1.5 0 0 1 .722-.785l3.458-1.73a2 2 0 0 0 .52-3.202z" />
                  <defs>
                    <linearGradient id="SVGQXhLLblw" x1="4.313" x2="11.096" y1="15.687" y2="10.279" gradientUnits="userSpaceOnUse">
                      <stop offset=".114" stop-color="#7b7bff" />
                      <stop offset=".559" stop-color="#102784" />
                    </linearGradient>
                    <linearGradient id="SVGUzUUme0E" x1="3.91" x2="13.971" y1="4.765" y2="15.218" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#43e5ca" />
                      <stop offset="1" stop-color="#1384b1" />
                    </linearGradient>
                    <radialGradient id="SVG5yp8BdGV" cx="0" cy="0" r="1" gradientTransform="matrix(4.37154 4.78393 -12.00179 10.9672 14.648 13.731)" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#e362f8" />
                      <stop offset="1" stop-color="#96f" stop-opacity="0" />
                    </radialGradient>
                  </defs>
                </g>
              </svg>
              <input id="important" v-model="client.important" class="hidden" type="checkbox" name="" />
            </div>
          </label>
        </div>
        <!-- passport pic -->
        <label class="grid text-center gap-4 font-600 w-full h-60 mx-auto relative z-0 hover:scale-105 duration-200">
          <input class="absolute z-1 inset-0 op-0 cursor-pointer" type="file" accept="image/*" disabled />
          <div class="flex justify-center items-center bg-white bg-op-40 w-full text-gray-5 dark:(bg-white bg-op-10 text-gray-4) backdrop-blur-xl rounded-xl h-60 overflow-hidden">
            <img v-if="client.passportPhoto" :src="store.photoPreview(client.passportPhoto, 'passports')" class="w-full h-full object-cover object-center" :class="fetchingData && 'animate-pulse'" />
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="op-50" width="175" height="175" viewBox="0 0 16 16">
              <g fill="none">
                <path fill="url(#SVGsbPF00wZ)" d="M1 4.75C1 3.784 1.784 3 2.75 3h10.5c.966 0 1.75.784 1.75 1.75v6.5A1.75 1.75 0 0 1 13.25 13H2.75A1.75 1.75 0 0 1 1 11.25z" />
                <path fill="url(#SVGNk5FUbLz)" fill-opacity="0.45" d="M1 4.75C1 3.784 1.784 3 2.75 3h10.5c.966 0 1.75.784 1.75 1.75v6.5A1.75 1.75 0 0 1 13.25 13H2.75A1.75 1.75 0 0 1 1 11.25z" />
                <path fill="url(#SVGwVckBbQZ)" d="M9.5 6a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z" />
                <path fill="url(#SVGAVBGobGZ)" d="M3.858 8.392A.86.86 0 0 0 3 9.25a1.67 1.67 0 0 0 1.265 1.62l.053.014c.62.155 1.267.155 1.886 0l.054-.013a1.67 1.67 0 0 0 1.265-1.62a.86.86 0 0 0-.858-.859z" />
                <path fill="url(#SVGx6qEfcoM)" d="M5.261 7.714a1.357 1.357 0 1 0 0-2.714a1.357 1.357 0 0 0 0 2.714" />
                <defs>
                  <linearGradient id="SVGsbPF00wZ" x1="6" x2="8.939" y1="3" y2="13.162" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#b3e0ff" />
                    <stop offset="1" stop-color="#8cd0ff" />
                  </linearGradient>
                  <linearGradient id="SVGNk5FUbLz" x1="10.167" x2="12.633" y1="4.228" y2="18.598" gradientUnits="userSpaceOnUse">
                    <stop offset=".447" stop-color="#ff6ce8" stop-opacity="0" />
                    <stop offset="1" stop-color="#ff6ce8" />
                  </linearGradient>
                  <linearGradient id="SVGwVckBbQZ" x1="10.636" x2="12.653" y1="5.538" y2="13.199" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#0078d4" />
                    <stop offset="1" stop-color="#7d00f0" />
                  </linearGradient>
                  <linearGradient id="SVGAVBGobGZ" x1="3" x2="3.999" y1="6.809" y2="11.382" gradientUnits="userSpaceOnUse">
                    <stop offset=".125" stop-color="#9c6cfe" />
                    <stop offset="1" stop-color="#7a41dc" />
                  </linearGradient>
                  <linearGradient id="SVGx6qEfcoM" x1="3.905" x2="5.933" y1="4.095" y2="7.569" gradientUnits="userSpaceOnUse">
                    <stop offset=".125" stop-color="#9c6cfe" />
                    <stop offset="1" stop-color="#7a41dc" />
                  </linearGradient>
                </defs>
              </g>
            </svg>
          </div>
        </label>
        <!-- client photo -->
        <label class="absolute bottom-8 inset-x-0 grid gap-4 font-600 w-max mx-auto text-center mb-5 z-1 cursor-pointer duration-200 hover:scale-110" :style="`mask-size: 100% 100%; mask-image: url(${hexMask})`">
          <input class="absolute inset-0 bg-red-5 inset-0 op-0 cursor-pointer" type="file" accept="image/*" @change="selectPhoto" />
          <div class="flex justify-center items-center bg-gray-9 bg-op-10 text-gray-5 dark:(bg-white bg-op-10 text-gray-4) backdrop-blur-xl rounded-xl w-32 h-32 overflow-hidden">
            <img v-if="photoFile || client.photo" :src="photoFile || store.photoPreview(client.photo)" class="w-full h-full object-cover object-center" />

            <svg v-else xmlns="http://www.w3.org/2000/svg" width="65" height="65" viewBox="0 0 16 16">
              <g fill="none">
                <path fill="url(#SVG0GOgGcuI)" d="M3 12.5A1.5 1.5 0 0 1 4.5 11h7a1.5 1.5 0 0 1 1.5 1.5V14H3z" />
                <path fill="url(#SVGSFhkSVFF)" d="M3 12.5A1.5 1.5 0 0 1 4.5 11h7a1.5 1.5 0 0 1 1.5 1.5V14H3z" />
                <path fill="url(#SVGPhHzNcdP)" d="M10.75 6.75a2.75 2.75 0 1 0-5.5 0a2.75 2.75 0 0 0 5.5 0" />
                <path fill="url(#SVGL5a0nbBb)" fill-rule="evenodd" d="M3.5 3a.5.5 0 0 0-.5.5V5a1 1 0 0 1-2 0V3.5A2.5 2.5 0 0 1 3.5 1H5a1 1 0 0 1 0 2zM10 2a1 1 0 0 1 1-1h1.5A2.5 2.5 0 0 1 15 3.5V5a1 1 0 1 1-2 0V3.5a.5.5 0 0 0-.5-.5H11a1 1 0 0 1-1-1m-8 8a1 1 0 0 1 1 1v1.5a.5.5 0 0 0 .5.5H5a1 1 0 1 1 0 2H3.5A2.5 2.5 0 0 1 1 12.5V11a1 1 0 0 1 1-1m12 0a1 1 0 0 1 1 1v1.5a2.5 2.5 0 0 1-2.5 2.5H11a1 1 0 1 1 0-2h1.5a.5.5 0 0 0 .5-.5V11a1 1 0 0 1 1-1" clip-rule="evenodd" />
                <defs>
                  <linearGradient id="SVG0GOgGcuI" x1="5.378" x2="5.995" y1="11.399" y2="14.682" gradientUnits="userSpaceOnUse">
                    <stop offset=".125" stop-color="#9c6cfe" />
                    <stop offset="1" stop-color="#7a41dc" />
                  </linearGradient>
                  <linearGradient id="SVGSFhkSVFF" x1="8" x2="8.851" y1="10.643" y2="15.941" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#885edb" stop-opacity="0" />
                    <stop offset="1" stop-color="#e362f8" />
                  </linearGradient>
                  <linearGradient id="SVGPhHzNcdP" x1="6.558" x2="9.361" y1="4.731" y2="9.207" gradientUnits="userSpaceOnUse">
                    <stop offset=".125" stop-color="#9c6cfe" />
                    <stop offset="1" stop-color="#7a41dc" />
                  </linearGradient>
                  <linearGradient id="SVGL5a0nbBb" x1=".447" x2="11.425" y1="-.172" y2="17.561" gradientUnits="userSpaceOnUse">
                    <stop offset=".015" stop-color="#3dcbff" />
                    <stop offset="1" stop-color="#0094f0" />
                  </linearGradient>
                </defs>
              </g>
            </svg>
          </div>
        </label>

        <!-- ai, parse button -->
        <div class="flex w-max mx-auto items-center gap-x-3 mt-8">
          <!-- Ai Model -->
          <GlobalSelect v-model="aiModel" :options="['microsoft', 'klippa']" field-class="rounded-lg" />
          <!-- parse data button -->
          <button class="btn p-2 bg-primary-6 mx-auto rounded-full" :class="fetchingData && 'animate-pulse animate-duration-500'" type="button" :disabled="!client.passportPhoto" @click="fetchData">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-sort-down-alt" viewBox="0 0 16 16">
              <path d="M3.5 3.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 12.293zm4 .5a.5.5 0 0 1 0-1h1a.5.5 0 0 1 0 1zm0 3a.5.5 0 0 1 0-1h3a.5.5 0 0 1 0 1zm0 3a.5.5 0 0 1 0-1h5a.5.5 0 0 1 0 1zM7 12.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7a.5.5 0 0 0-.5.5" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Full Name -->
      <div class="grid grid-cols-2 gap-3 items-center">
        <!-- Family Name -->
        <div class="grid gap-2 font-600">
          <label for="family">Family Name :</label>
          <input id="family" v-model="client.lastName" class="input w-full mx-auto text-center capitalize" placeholder="Family Name" type="text" required />
        </div>

        <!-- First Name -->
        <div class="grid gap-2 font-600">
          <label for="first">First Name :</label>
          <input id="first" v-model="client.firstName" class="input w-full mx-auto text-center capitalize" placeholder="First Name" type="text" required />
        </div>
      </div>

      <!-- Passport & Phone Number -->
      <div class="grid grid-cols-2 gap-3 items-center">
        <div class="grid gap-y-3">
          <label for="passportNum">Passport Number :</label>
          <input id="passport-number" v-model="client.passportNumber" class="input w-full mx-auto text-center capitalize" placeholder="Passport Number" type="text" required />
        </div>
        <div class="grid gap-y-3">
          <label for="phone-number">Phone Number :</label>
          <div class="relative">
            <input id="phone-number" v-model="client.phoneNumber" class="input w-full mx-auto text-center" type="text" placeholder="phone number" required />
            <button class="absolute right-2 inset-y-0 m-auto disabled:(op-20 cursor-not-allowed)" type="button" :disabled="!client.passportNumber" @click="client.phoneNumber = getPhoneNumber(client.passportNumber)">
              <svg xmlns="http://www.w3.org/2000/svg" class="op-80 hover:op-100" width="32" height="32" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M10.998 1.58a2 2 0 0 1 2.004 0l7.5 4.342a2 2 0 0 1 .998 1.731v8.694a2 2 0 0 1-.998 1.73l-7.5 4.343a2 2 0 0 1-2.004 0l-7.5-4.342a2 2 0 0 1-.998-1.731V7.653a2 2 0 0 1 .998-1.73zM5.25 8.092a.5.5 0 0 0-.751.433v6.669a2 2 0 0 0 .998 1.73l5.751 3.33a.5.5 0 0 0 .751-.432v-6.669a2 2 0 0 0-.998-1.73zm10.517-2.575c-.478-.276-1.254-.276-1.732 0s-.478.724 0 1s1.254.276 1.732 0s.478-.724 0-1m-5.8 0c-.478-.276-1.254-.276-1.732 0s-.478.724 0 1s1.254.276 1.732 0c.479-.276.479-.724 0-1m7.025 10.328c.597-.345 1.082-1.184 1.082-1.875c0-.69-.485-.97-1.082-.625S15.91 14.53 15.91 15.22s.485.97 1.082.625M6.365 12.2c.478.277.866.053.866-.5c0-.552-.388-1.223-.866-1.5s-.866-.052-.866.5c0 .553.388 1.224.866 1.5m4.33 5.498c0 .552-.389.776-.867.5s-.866-.948-.866-1.5s.388-.776.866-.5s.866.948.866 1.5M7.231 15.7c0 .553-.388.777-.866.5c-.478-.276-.866-.947-.866-1.5c0-.552.388-.776.866-.5c.478.277.866.948.866 1.5m3.463-2c0 .553-.388.777-.866.5c-.479-.275-.866-.947-.866-1.5c0-.551.387-.775.866-.5c.478.277.866.949.866 1.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Passport Date -->
      <div class="grid grid-cols-2 gap-x-3 items-center">
        <!-- Passport issue Date-->
        <div class="grid gap-2 font-600">
          <label for="issue">Passport issue Date :</label>
          <input id="issue" v-model="client.passportIssue" class="input mx-auto w-full text-center px-2" type="date" name="" required />
        </div>

        <!-- Passport Expire Date -->
        <div class="grid gap-2 font-600">
          <label for="expire">Passport Expire Date :</label>
          <input id="expire" v-model="client.passportExpire" class="input mx-auto w-full text-center px-3" type="date" name="" required />
        </div>
      </div>

      <!-- Date of Birth -->
      <div class="grid gap-2 font-600">
        <label for="birthday">Date of Birth :</label>
        <input id="birthday" v-model="client.birthdate" class="input w-full mx-auto text-center" type="date" required />
      </div>

      <hr class="b-gray-6" />

      <!-- Email -->
      <div class="grid gap-2 font-600">
        <label for="email">Email :</label>
        <input id="email" v-model="client.email" class="input w-full mx-auto text-center" placeholder="Email" type="text" name="" required />
      </div>

      <!-- Whale & Day -->
      <div class="grid grid-cols-[3fr_1fr] items-center gap-4">
        <!-- Whale -->
        <div class="grid gap-2 font-600">
          <label for="whale">Whale :</label>
          <input id="whale" v-model="client.whale" class="input w-full text-center" placeholder="Whale" type="text" name="" />
        </div>
        <!-- Day -->
        <GlobalSelect v-model="client.day" :options="['farthest', 'nearest', 'random', ...Array.from({ length: 31 }, (_, i) => (i + 1).toLocaleString('en', { minimumIntegerDigits: 2 }))]" label="Day" container-class="!w-full" field-class="rounded-lg" />
        <!-- <div class="grid gap-3 font-600 w-full">
          <p>Day :</p>
          <div class="relative">
            <button class="bg-white bg-op-40 dark:(bg-white bg-op-10) flex items-center justify-center w-full gap-3 py-1.5 px-3 rounded-lg text-lg" type="button" @click="showDay = !showDay">
              <small>{{ client.day === '0' || client.day === '00' ? 'nearest' : client.day }}</small>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-chevron-dow duration-500" :class="showDay && 'rotate-180'" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
              </svg>
            </button>

            <ul v-show="showDay" class="absolute top-14 bg-white bg-op-40 dark:(bg-white bg-op-10) rounded-lg max-h-100 overflow-auto backdrop-blur-xl w-full z-1">
              <li :class="client.day === 'farthest' && 'bg-primary-6'" class="py-2 px-4 cursor-pointer rounded-xl" @click="selectDay('farthest')">farthest</li>
              <li :class="client.day === '0' || (client.day === '00' && 'bg-primary-6')" class="py-2 px-4 cursor-pointer rounded-xl" @click="selectDay(0)">nearest</li>
              <li :class="client.day === 'random' && 'bg-primary-6'" class="py-2 px-4 cursor-pointer rounded-xl" @click="selectDay('random')">random</li>
              <li v-for="day in 31" :key="day" :class="day.toLocaleString('en', { minimumIntegerDigits: 2 }) === client.day && 'bg-primary-6'" class="py-2 px-4 cursor-pointer rounded-xl" @click="selectDay(day)">{{ day.toLocaleString('en', { minimumIntegerDigits: 2 }) }}</li>
            </ul>
          </div>
        </div> -->
      </div>

      <!-- Gender & Status -->
      <div class="flex items-center gap-4">
        <!-- Gender -->
        <div class="grid gap-3 font-600 w-full">
          <GlobalSelect v-model="client.gender" label="Gender" :options="[ClientsGender.MALE, ClientsGender.FEMALE]" container-class="!w-full" field-class="rounded-lg" />
        </div>
        <!-- Status -->
        <div class="grid gap-3 font-600 w-full">
          <GlobalSelect v-model="client.status" label="Status" :options="['Single', 'Married']" container-class="!w-full" field-class="rounded-lg" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-x-3">
        <!-- Nationality -->
        <div class="grid gap-2 font-600">
          <label for="nationality">Nationality :</label>
          <input id="nationality" v-model="client.nationality" class="input w-full mx-auto text-center" placeholder="Nationality" type="text" name="" required />
        </div>
        <!-- Nationality Number -->
        <div class="grid gap-2 font-600">
          <label for="nin">NIN :</label>
          <input id="nin" v-model="client.nin" class="input w-full mx-auto text-center" placeholder="Nationality Number" type="text" name="" required />
        </div>
      </div>
      <!-- Birthplace -->
      <div class="grid gap-2 font-600">
        <label for="birthplace">Birthplace :</label>
        <input id="birthplace" v-model="client.birthplace" class="input w-full mx-auto text-center" placeholder="Birthplace" type="text" name="" required />
      </div>
      <!-- contact number -->
      <div class="grid gap-2">
        <label class="font-bold">Contact Numbers :</label>
        <div class="flex gap-2 font-600">
          <div class="grid grid-cols-3 gap-2">
            <div v-for="(_number, i) in client.contactNumbers" :key="i" class="relative">
              <input :id="`number-${i}`" v-model="client.contactNumbers![i]" class="input w-full mx-auto text-center" :placeholder="`Contact Number ${i + 1}`" type="text" :name="`number-${i}`" />
              <button class="absolute -top-1.7 -right-1 text-xs text-red-5 bg-red-5 rounded-md bg-op-20 duration-200 hover:scale-120" type="button" @click="removeContactNumber(i)">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path fill="currentColor" d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z" />
                </svg>
              </button>
            </div>
            <button class="flex justify-center items-center b b-gray b-op-50 text-gray b-dashed rounded-xl px-3 gap-x-1 py-2 max-w-max" type="button" @click="addContactNumber">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none" />
                <path fill="currentColor" d="M11 21v-8H3v-2h8V3h2v8h8v2h-8v8z" />
              </svg>

              <span class="uppercase line-clamp-1 font-black text-sm">Add Number</span>
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-x-4">
        <div class="grid gap-2 font-600">
          <GlobalSelect v-model="client.target" label="Target" :options="[ClientsTarget.NKC_SCHENGEN, ClientsTarget.NKC_NATIONAL, ClientsTarget.NDB_SCHENGEN, ClientsTarget.NDB_NATIONAL]" field-class="rounded-lg" />
        </div>
        <div v-if="[ClientsTarget.NKC_NATIONAL, ClientsTarget.NDB_NATIONAL].includes(client.target)" class="grid gap-2 font-600">
          <GlobalSelect v-model="client.visaSubType" label="Sub Type" default="Employee Visa" :options="['Employee Visa', 'Family Member', 'Family Reunification', 'Non- working Residence', 'Study']" field-class="rounded-lg" />
        </div>
      </div>

      <!-- more applicants if selected -->
      <template v-if="client.applicants?.length">
        <ApplicantForm v-for="(_applicant, i) in client.applicants" :key="i" v-model="client" :number="i" />
      </template>
      <button class="rounded-xl b-2 b-gray-5 text-gray-5 w-full b-dashed py-2 font-bold text-center disabled:op-20" :disabled="client.applicants!.length >= 4" type="button" @click="addApplicant">
        <span v-if="client.applicants && client.applicants?.length >= 4">MAX</span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="mx-auto" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2" />
        </svg>
      </button>

      <p v-show="formError" class="text-center font-bold text-red-5 bg-red bg-op-10 py-3 rounded-xl" v-text="formError" />
      <div class="flex gap-x-3 justify-center w-max mx-auto mt-4">
        <button class="btn bg-transparent gr-from-l from-pink-5 to-transparent mx-auto disabled:(pointer-event-none op-35 shadow-none)" type="button" @click="registerClient">Register</button>
        <button class="btn mx-auto bg-transparent gr-from-l disabled:(pointer-event-none op-35 shadow-none)" type="submit" :disabled="updatingClient">{{ updatingClient ? '...' : 'update' }}</button>
      </div>
    </form>
  </div>
</template>
