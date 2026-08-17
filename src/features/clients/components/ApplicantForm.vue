<script setup lang="ts">
import { ref } from 'vue'
import useMainStore from '@/stores/main-store'
import GlobalSelect from '@/features/core/components/GlobalSelect.vue'
// import PassportInput from '@renderer/components/PassportInput.vue'
import axios from 'axios'
import { ClientsGender } from '@/features/appwrite/types'

const client = defineModel<Client>()

const props = defineProps({
  number: {
    type: Number,
    required: true
  },
  edit: {
    type: Boolean,
    default: true
  },
  remote: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update'])

const store = useMainStore()

const fetchingData = ref(false)
const visible = ref(true)
const formError = ref('')
const registering = ref(false)

function selectPhoto(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    if (target.files[0].size >= 200000) {
      store.showNotification(`photo is bigger than 200kb (${Math.round(target.files[0].size / 1024)}kb)`, 'error')
      return
    }
    ;(client.value?.applicants[props.number] as Applicant).photo = window.desktop.getPath(target.files[0])
  }
}

function selectPassport(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    ;(client.value?.applicants[props.number] as Applicant).passportPhoto = window.desktop.getPath(target.files[0])
  }
}

const normalizeStr = (str: string) =>
  str
    ? str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace("'", '')
    : ''

async function fetchData() {
  fetchingData.value = true
  const data = (await window.desktop.invoke('fetch-data', (client.value?.applicants[props.number] as Applicant).passportPhoto, JSON.parse(JSON.stringify(store.settings)), 'klippa')) as EdenAiData | undefined
  if (data) {
    ;(client.value?.applicants[props.number] as Applicant).lastName = normalizeStr(data.last_name.value || '')
    ;(client.value?.applicants[props.number] as Applicant).firstName = data.given_names.length ? normalizeStr(data.given_names.map((n) => n.value?.replace("'", '')).join(' ')) : ''
    ;(client.value?.applicants[props.number] as Applicant).passportNumber = data.document_id.value || ''
    ;(client.value?.applicants[props.number] as Applicant).birthdate = data.birth_date.value || ''
    ;(client.value?.applicants[props.number] as Applicant).passportIssue = data.issuance_date.value || ''
    ;(client.value?.applicants[props.number] as Applicant).passportExpire = data.expire_date.value || ''
    ;(client.value?.applicants[props.number] as Applicant).gender = data.gender.value === 'F' ? ClientsGender.FEMALE : ClientsGender.MALE

    async function getNationality(countryCode: string) {
      if (!countryCode) {
        store.showNotification('error getting nationality for applicant', 'error')
        return 'mauritania'
      }
      try {
        // https://restcountries.com/v3.1/alpha/sen?fields=name
        const response = await axios.get<{ name: { common: string } }>(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=name`)
        return response.data.name.common || 'mauritania'
      } catch (error) {
        store.showNotification(`unable to get nationality for applicant: ${(error as Error).message}`, 'error')
        return ''
      }
    }

    ;(client.value?.applicants[props.number] as Applicant).nationality = await getNationality(data.nationality.value || '')

    // photos
    if (data.image_id?.[0]?.value) {
      ;(client.value?.applicants[props.number] as Applicant).photo = `data:image/jpeg;base64,${data.image_id[0].value}`
    }
  } else {
    store.showNotification('unable to parse passport data')
  }
  fetchingData.value = false
}

// async function register(client: Client) {
// 	formError.value = "";

// 	if (!client.photo) {
// 		formError.value = "please select a photo";
// 		return;
// 	}

// 	registering.value = true;

// 	try {
// 		await window.desktop.invoke("register", JSON.parse(JSON.stringify(client)), JSON.parse(JSON.stringify(store.settings)), props.remote);
// 	} catch (error) {
// 		store.showNotification(`error separating applicant: ${(error as Error).message}`, "error");
// 	}

// 	registering.value = false;
// }

// async function separate(_applicant: Applicant) {
// formError.value = "";
// const upgraded: Client = {
// 	firstName: applicant.firstName,
// 	familyName: applicant.lastName,
// 	birthdate: applicant.birthdate,
// 	gender: applicant.gender,
// 	passportNumber: applicant.passportNumber,
// 	passportIssue: applicant.passportIssue,
// 	passportExpire: applicant.passportExpire,
// 	passportPath: applicant.passportFile,
// 	owner: client.value?.owner || "",
// 	important: client.value?.important || false,
// 	photo: applicant.photo,
// 	status: applicant.status,
// 	email: `${store.settings.emailNamespace}.${applicant.firstName.toLocaleLowerCase().replaceAll(" ", "-")}-${Math.floor(Math.random() * 999)}@inbox.testmail.app`,
// 	day: client.value?.day || "0",
// 	whale: client.value?.whale || "no one",
// 	nationality: applicant.nationality,
// 	applicants: [],
// 	birthplace: applicant.birthplace,
// 	otpCode: "",
// 	paymentPhoneNumber: store.settings.bankily,
// 	selfieMode: "local",
// 	target: "nkc-schengen",
// 	nationalSubType: "",
// 	bookingState: "pending",
// 	selfieUrl: "",
// 	paymentUrl: "",
// 	photoPageUrl: "",
// 	nin: applicant.nin || "",
// 	phoneNumber: "1234",
// };
// for (const [key, value] of Object.entries(upgraded)) {
// 	if (value === undefined || value === null) {
// 		formError.value = `${key} is ${value}`;
// 		break;
// 	}
// }
// if (formError.value) return;
// await register(upgraded);
// // remove applicant
// if (Array.isArray(client.value?.applicants)) {
// 	client.value.applicants.splice(props.number, 1);
// 	emit("update", client.value);
// }
// }

function removeApplicant() {
  if (client.value) {
    ;(client.value.applicants as Applicant[]).splice(props.number, 1)
    if (!props.edit === false && !props.remote) {
      emit('update')
    }
  }
}
</script>

<template>
  <div class="grid gap-y-5">
    <hr class="op-20" />
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-bold">Applicant {{ props.number + 2 }} {{ (client?.applicants[props.number] as Applicant).firstName ? ` - ${(client?.applicants[props.number] as Applicant).firstName}` : '' }}</h3>

      <div class="flex items-center gap-x-5">
        <button class="rounded-full text-red-5 bg-red-5 bg-op-15 px-3 py-1 text-xs font-bold" type="button" @click="removeApplicant()">remove</button>
        <button :class="{ 'rotate-180': visible }" class="bg-gray-5 bg-op-15 rounded-full px-2 py-2" type="button" @click="visible = !visible">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
          </svg>
        </button>
      </div>
    </div>
    <div v-show="visible" class="grid gap-5">
      <div class="flex justify-center relative mb-7 w-full h-max mx-auto">
        <!-- passport photo -->
        <label class="grid text-center gap-4 font-600 w-full relative">
          <input class="absolute z-1 inset-0 op-0" type="file" accept="image/*" @change="selectPassport" />
          <div class="flex justify-center items-center bg-white bg-op-10 backdrop-blur-xl rounded-xl h-42 overflow-hidden">
            <img v-if="client?.applicants[props.number].passportPhoto" :src="client?.applicants[props.number].passportPhoto.startsWith('photo') || client?.applicants[props.number].passportPhoto.startsWith('passport') ? store.photoPreview((client?.applicants[props.number] as Applicant).passportPhoto) : (client?.applicants[props.number] as Applicant).passportPhoto" class="w-full h-full object-cover object-center m-auto" :class="fetchingData && 'animate-pulse'" />
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm9 1.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1h-4a.5.5 0 0 0-.5.5M9 8a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1h-4A.5.5 0 0 0 9 8m1 2.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 0-1h-3a.5.5 0 0 0-.5.5m-1 2C9 10.567 7.21 9 5 9c-2.086 0-3.8 1.398-3.984 3.181A1 1 0 0 0 2 13h6.96q.04-.245.04-.5M7 6a2 2 0 1 0-4 0 2 2 0 0 0 4 0" />
            </svg>
          </div>
        </label>
        <!-- photo -->
        <div class="absolute mx-auto -bottom-7">
          <label class="grid gap-4 font-600 w-max mx-auto text-center relative">
            <input class="absolute inset-0 bg-red-5 inset-0 op-0 z-1" type="file" accept="image/*" @change="selectPhoto" />
            <div class="flex justify-center items-center bg-white bg-op-10 backdrop-blur-xl rounded-xl w-25 h-25 overflow-hidden">
              <img v-if="client?.applicants[props.number].photo" :src="client?.applicants[props.number].photo.startsWith('photo') ? store.photoPreview(client?.applicants[props.number].photo) : client?.applicants[props.number].photo" class="w-full h-full object-cover object-center" />
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" class="bi bi-person-bounding-box text-gray-4" viewBox="0 0 16 16">
                <path d="M1.5 1a.5.5 0 0 0-.5.5v3a.5.5 0 0 1-1 0v-3A1.5 1.5 0 0 1 1.5 0h3a.5.5 0 0 1 0 1zM11 .5a.5.5 0 0 1 .5-.5h3A1.5 1.5 0 0 1 16 1.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 1-.5-.5M.5 11a.5.5 0 0 1 .5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 1 0 1h-3A1.5 1.5 0 0 1 0 14.5v-3a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a.5.5 0 0 1 0-1h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 1 .5-.5" />
                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
              </svg>
            </div>
          </label>
        </div>
        <button v-if="client?.applicants[props.number].passportPhoto" class="btn p-2 rounded-full absolute top-2 right-2 duration-300 hover:scale-120 z-10" type="button" :disabled="fetchingData" @click="fetchData">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-sort-down-alt" viewBox="0 0 16 16">
            <path d="M3.5 3.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 12.293zm4 .5a.5.5 0 0 1 0-1h1a.5.5 0 0 1 0 1zm0 3a.5.5 0 0 1 0-1h3a.5.5 0 0 1 0 1zm0 3a.5.5 0 0 1 0-1h5a.5.5 0 0 1 0 1zM7 12.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7a.5.5 0 0 0-.5.5" />
          </svg>
        </button>
      </div>
      <!-- relative -->
      <div class="grid gap-2 font-600">
        <GlobalSelect v-model="(client?.applicants[props.number] as Applicant).relation" container-class="w-full!" field-class="rounded-lg! py-2" label="Relation" :options="['brother', 'daughter', 'father', 'husband', 'mother', 'sister', 'son', 'wife']" />
      </div>
      <div class="grid grid-cols-2 gap-4 items-center">
        <div class="grid gap-2 font-600">
          <label for="first">First Name :</label>
          <input id="first" v-model="(client?.applicants[props.number] as Applicant).firstName" class="input w-full mx-auto text-center" placeholder="First Name" type="text" required />
        </div>
        <div class="grid gap-2 font-600">
          <label for="family">Family Name :</label>
          <input id="family" v-model="(client?.applicants[props.number] as Applicant).lastName" class="input w-full mx-auto text-center" placeholder="Family Name" type="text" required />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 items-center">
        <GlobalSelect v-model="(client?.applicants[props.number] as Applicant).gender" label="gender" :options="[ClientsGender.MALE, ClientsGender.FEMALE]" container-class="w-full!" field-class="rounded-lg" />
        <GlobalSelect v-model="(client?.applicants[props.number] as Applicant).status" label="status" :options="['Single', 'Married']" container-class="w-full!" field-class="rounded-lg" />
      </div>
      <!-- nationality & NIN  -->
      <div class="grid grid-cols-2 gap-4 items-center">
        <div class="grid gap-2 font-600">
          <label for="nationality">Nationality :</label>
          <input id="nationality" v-model="(client?.applicants[props.number] as Applicant).nationality" class="input w-full mx-auto text-center" placeholder="Nationality" type="text" required />
        </div>
        <div class="grid gap-2 font-600">
          <label for="nin">NIN :</label>
          <input id="nin" v-model="(client?.applicants[props.number] as Applicant).nin" class="input w-full mx-auto text-center" placeholder="Nationality ID Number" type="text" required />
        </div>
      </div>
      <div class="grid gap-2 font-600">
        <label for="birthplace">Birthplace :</label>
        <input id="birthplace" v-model="(client?.applicants[props.number] as Applicant).birthplace" class="input w-full mx-auto text-center" placeholder="birthplace" type="text" required />
      </div>
      <div class="grid grid-cols-2 gap-4 items-center">
        <div class="flex gap-x-3">
          <label class="grid gap-2 font-600 w-full">
            <span>Passport Number :</span>
            <input id="passportNumber" v-model="(client?.applicants[props.number] as Applicant).passportNumber" class="input w-full mx-auto text-center" placeholder="Passport Number" type="text" required />
            <!-- <PassportInput v-model="(client?.applicants[props.number] as Applicant).passportNumber" /> -->
          </label>
        </div>
        <div class="flex gap-x-3">
          <label class="grid gap-2 font-600 w-full">
            <span>Birthdate :</span>
            <input v-model="(client?.applicants[props.number] as Applicant).birthdate" class="input text-center" type="date" required />
          </label>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 items-center">
        <div class="flex gap-x-3">
          <label class="grid gap-2 font-600 w-full">
            <span>Passport Issue :</span>
            <input v-model="(client?.applicants[props.number] as Applicant).passportIssue" class="input text-center" type="date" required />
          </label>
        </div>
        <div class="flex gap-x-3">
          <label class="grid gap-2 font-600 w-full">
            <span>Passport Expire :</span>
            <input v-model="(client?.applicants[props.number] as Applicant).passportExpire" class="input text-center" type="date" required />
          </label>
        </div>
      </div>
      <p v-show="formError" class="text-red text-center" v-text="formError" />
      <button v-if="!props.edit" class="btn bg-transparent b-1 b-primary-5 text-primary-5 w-max mx-auto flex items-center gap-x-2" type="button" :disabled="registering">
        <span>separate</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5" />
          <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z" />
        </svg>
      </button>
    </div>
  </div>
</template>
