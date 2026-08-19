import { ref, onUnmounted, reactive, type Ref } from 'vue'
import useMainStore from '@/stores/main-store'
import useWebviewStore from '@/stores/webview-store'
// import EmailService from '@renderer/features/email/services/emails-service'
import { ID } from 'appwrite'
// import { useSoundEffect } from '@renderer/composables/use-sound'
// import { useDatabase } from '@renderer/composables/appwrite'
import { ClientsBookingState } from '@/features/appwrite/types'
import EmailService from '@/features/email/composables/use-email'

type NikkaController = {
  say(message: string, type?: 'error' | 'info', pose?: 'normal' | 'think' | 'sad' | 'lol' | 'dk'): void
}

const useBookingNavigator = (webviewTag: Ref<Electron.WebviewTag | null>, client: Client, nikka: NikkaController, autoMode: Ref<boolean>) => {
  const store = useMainStore()
  const webviewStore = useWebviewStore()
  const appointmentDate = ref('')

  let emailService: EmailService | undefined

  const allListeners = new Set<(e: Electron.IpcMessageEvent) => Promise<void>>()

  let isSessionStillValid = false
  let sessionTimeout: NodeJS.Timeout

  // const sounds = useSoundEffect()

  // const emailService = new EmailService(client.email)
  // const db = useDatabase()

  // let applicantSelectionAlreadyHandled = false

  async function handleNavigation() {
    if (autoMode.value === false) {
      nikka.say('automation is paused', 'error')
      return
    }
    const url = webviewTag.value!.getURL().toLowerCase()
    if (['https://spain-mauritania.blsinternational.com', 'https://spain-mauritania.blsinternational.com/', 'https://spain-mauritania.blsinternational.com/login'].includes(url)) {
      handleLogin()
    } else {
      nikka.say('navigated but to an unhandled page', 'error')
    }
  }

  async function handleNavigationInPage() {

    if (autoMode.value === false) {
      nikka.say('automation is paused', 'error')
      return
    }

    const url = webviewTag.value!.getURL().toLowerCase()

    if (url.includes('my-account')) {
      await waitForElement('#main-scrollable-container button', 'book button')
      webviewTag.value?.executeJavaScript(`(() => {
        document.querySelectorAll('#main-scrollable-container button')?.[0].click()
        })()`)
    } else if (url.includes('book-appointment')) {
      handleBookAppointment()
    } else if (url.includes('manage-appointments')) {
      handleManageAppointments()
    } else {
      // 
    }
  }

  async function handleLogin() {
    let maxRetries = 0
    const handleLoginResponse = async (e: Electron.IpcMessageEvent) => {
      const response = e.args[0] as { url: string, status: number, body: string }
      if (response.url === 'https://api-mauritania.blsinternational.com/api/v1/users/login') {
        if (response.status === 429) {
          await new Promise(r => setTimeout(r, 500))
          if (isSessionStillValid) {
            nikka.say('session is not expired let\'s retry...')
            webviewTag.value?.loadURL('https://spain-mauritania.blsinternational.com/manage-appointments')
            return
          }
          if (maxRetries >= 20) {
            maxRetries = 0
            nikka.say(`limit reached (${maxRetries}) refreshing...`, 'error')
            webviewTag.value?.reload()
          } else {
            nikka.say('retrying...')
            webviewTag.value?.executeJavaScript('document.querySelector("form>button").click()')
            maxRetries++
          }
        } else if (response.status === 200) {
          // console.log("try to remove login")
          // removeAllListeners()
          isSessionStillValid = true
          if(sessionTimeout) clearTimeout(sessionTimeout)
          sessionTimeout = setTimeout(() => {
            isSessionStillValid = false
          }, 1000 * 60 * 20)
        } else {
          console.log('unknown response at login', response)
          webviewTag.value?.reload()
        }
      }
    }

    // webviewTag.value?.removeEventListener('ipc-message', handleLoginResponse)
    // webviewTag.value?.addEventListener('ipc-message', handleLoginResponse)

    listenToResponse(handleLoginResponse)

    nikka.say('waiting for email and password fields...')
    await waitForElement('#email')
    fillInput('#email', client.email)
    fillInput('#password', 'B@c2010da#')
    await new Promise((r) => setTimeout(r, 250))
    webviewTag.value?.executeJavaScript('document.querySelector("form>button").click()')
  }


  async function fillInput(selector: string, value: string) {
    webviewTag.value?.executeJavaScript(`(() => {
      function setInputValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(element, value);
        } else {
          valueSetter.call(element, value);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const inputElement = document.querySelector('${selector}');
      return setInputValue(inputElement, '${value}');
    })()`)
  }

  async function forceClick(selector: string) {
    return webviewTag.value?.executeJavaScript(`(() => {
        console.log("about to force click")
        const element = document.querySelector('${selector}')
        
        if(!element) return;
        console.log("force click is ok")

        element.focus();
      
        const eventOptions = {
          bubbles: true,
          cancelable: true,
          view: window,
          buttons: 1
        };
      
        // Dispatch full interaction lifecycle
        element.dispatchEvent(new PointerEvent('pointerdown', eventOptions));
        element.dispatchEvent(new MouseEvent('mousedown', eventOptions));
        element.dispatchEvent(new PointerEvent('pointerup', eventOptions));
        element.dispatchEvent(new MouseEvent('mouseup', eventOptions));
        element.dispatchEvent(new MouseEvent('click', eventOptions));
      })()`)
  }

  async function handleBookAppointment() {
    let maxRetries = 0
    async function handleBookResponses(e: Electron.IpcMessageEvent) {
      const response = e.args[0] as { url: string, status: number, body: string }

      if (response.url === 'https://api-mauritania.blsinternational.com/api/v1/appointments/data-protection-consent') {
        if (response.status === 429) {
          await new Promise(r => setTimeout(r, 500))
          if (maxRetries >= 5) {
            nikka.say(`limit reached (${maxRetries}) refreshing...`, 'error')
            maxRetries = 0
            removeAllListeners()
            // webviewTag.value?.removeEventListener('ipc-message', handleResponses)
            webviewTag.value?.reload()
          } else {
            nikka.say('retrying...')
            webviewTag.value?.executeJavaScript("document.querySelector('div[role=alert] button')?.click()")
            maxRetries++
          }
        } else if (response.status === 200) {
          const responseBody = JSON.parse(response.body) as { canBook: boolean, consentGivenAt: string, message?: string }
          if (responseBody.canBook) {
            // webviewTag.value?.removeEventListener('ipc-message', handleResponses)
            // click on book appointment's button (on the top)
            webviewTag.value?.executeJavaScript(`(() => {
              document.querySelectorAll('#main-scrollable-container button')?.[0].click()
              })()`)
          } else if (responseBody.canBook === false && responseBody.message === 'Consent email sent successfully!') {
            nikka.say('accepting consent...')
            const isAccepted = await emailService?.accept()
            if (isAccepted) {
              nikka.say('accepted')
              webviewTag.value?.executeJavaScript(`(() => {
                document.querySelector('#main-scrollable-container div[role=alert] button')?.click()  
              })()`)
            } else {
              nikka.say('failed to accept consent', 'error')
            }
          }
        } else {
          // webviewTag.value?.removeEventListener('ipc-message', handleResponses)
        }
      } else if (response.url.startsWith('https://api-mauritania.blsinternational.com/api/v1/appointments/can-book')) {
        const responseBody = JSON.parse(response.body) as { possible: boolean, message: string, statusCode?: number }
        if (responseBody?.statusCode === 429) {
          await new Promise(r => setTimeout(r, 1000))
          webviewTag.value?.executeJavaScript("document.querySelector('div[role=dialog] button')?.click()")
          await new Promise(r => setTimeout(r, 2000))
        } else if (responseBody.possible === false && responseBody.message.toLowerCase().startsWith('no appointments are available for this center at the moment')) {
          await new Promise(r => setTimeout(r, 1000))
          webviewTag.value?.executeJavaScript("document.querySelector('div[role=dialog] button')?.click()")
          await new Promise(r => setTimeout(r, 2000))
          webviewTag.value?.executeJavaScript("document.querySelectorAll('#main-scrollable-container button')?.[0].click()")
        } else if (responseBody.possible === false && responseBody.message.toLowerCase().startsWith('you already have an active appointment')) {
          console.log('already have an appointment')
          await new Promise(r => setTimeout(r, 1000))
          // go to my appointment page and stop listening
          // await waitForElement('div[role=dialog] button')
          webviewTag.value?.executeJavaScript("document.querySelector('div[role=dialog] button')?.click()")
          removeAllListeners()
        } else if (responseBody.possible === true && responseBody.message.toLowerCase() === 'you can book an appointment.') {
          // check slots
          webviewTag.value?.executeJavaScript("document.querySelectorAll('div[role=dialog] button.cursor-pointer')?.[1]?.click()")
        }
      } else if (response.url.startsWith('https://api-mauritania.blsinternational.com/api/v1/reference-data')) {
        const responseBody = JSON.parse(response.body) as { message?: string, statusCode?: number, success?: boolean }
        if (responseBody.statusCode === 429) {
          webviewTag.value?.executeJavaScript("document.querySelectorAll('div[role=dialog] button.cursor-pointer')?.[1]?.click()")
        }
      } else if (response.url.startsWith('https://api-mauritania.blsinternational.com/api/v1/slots/calendar')) {
        const responseBody = JSON.parse(response.body) as { message?: string, statusCode?: number, month?: number, year: number, days: {}[] }
        if (responseBody.statusCode === 429 || response.status === 429 || responseBody?.days?.length === 0) {
          webviewTag.value?.executeJavaScript("document.querySelector('div.sticky.bottom-0 button')?.click()")
        }
      } else {
        // nikka.say('unknown response page')
        // console.log('unknown response page ->', response.url)
      }
    }

    listenToResponse(handleBookResponses)
  }

  async function handleManageAppointments() {
    let busy = false
    async function handleManageResponse(e: Electron.IpcMessageEvent) {
      await new Promise(r => setTimeout(r, 500))
      const response = e.args[0] as { url: string, status: number, body: string }
      console.log('response run on', response.status, response.url)
      console.log('response at manage found', response)
      if (response.url.startsWith('https://api-mauritania.blsinternational.com/api/v1/slots/calendar') || response.url.startsWith('https://api-mauritania.blsinternational.com/api/v1/slots/family/calendar')) {
        console.log('calendar response found', response)
        try {
          const responseBody = JSON.parse(response.body) as { message?: string, statusCode?: number, month?: number, year: number, days: {}[] }
          if (response.status === 429 || responseBody.statusCode === 429 || responseBody.days.length === 0) {
            nikka.say('nothing yet, close it')
            // close calender
            await webviewTag.value?.executeJavaScript("document.querySelector('div.sticky.bottom-0 button')?.click()")
            // handleInCalendar();
          } else if (responseBody.days.length > 0) {
            nikka.say('let get that slots')
            removeAllListeners()
            handleSlots()
          } else {
            console.log('unhandled state at calender', responseBody)
          }
        } catch (error) {
          console.log('error as calendar response', error)
          webviewTag.value?.executeJavaScript("document.querySelector('div.sticky.bottom-0 button')?.click()")
        }
      }

      if (response.url.startsWith('https://api-mauritania.blsinternational.com/api/v1/appointments/manage?')) {
        if (busy) {
          console.log("it's busy...")
          return;
        }
        busy = true
        nikka.say('waiting for 1s before open that dropdown...')
        // await new Promise(r => setTimeout(r, 1000))
        // check again
        if (response.status === 200) {
          nikka.say('triggering dropdown...')
          // await waitForElement('#main-scrollable-container button', 'oh shit book button again')
          await forceClick('#main-scrollable-container button[data-slot=dropdown-menu-trigger]')
          nikka.say('waiting for 300ms...')
          await new Promise(r => setTimeout(r, 500))
          nikka.say('clicking on first dropdown item...')
          await webviewTag.value?.executeJavaScript(`document.querySelector('div[role=menuitem]')?.click()`)
        } else if (response.status === 429) {
          // webviewTag.value?.executeJavaScript("document.querySelector('div[role=alert] button')?.click()")
          nikka.say('refreshing...')
          webviewTag.value?.executeJavaScript(`(() => {
              document.querySelector('#main-scrollable-container button').click()
            })()`)
        }
        busy = false
      }
    }

    listenToResponse(handleManageResponse)

    // nikka.say('waiting for dropdown button')
    // await waitForElement('#main-scrollable-container button')
    // await forceClick('#main-scrollable-container button[data-slot=dropdown-menu-trigger]')
    // nikka.say('1s and click on first dropdown item')
    // await new Promise(r => setTimeout(r, 1000))
    // await forceClick('div[role=menuitem]')

  }

  // async function handleInCalendar(){
  //   webviewTag.value?.executeJavaScript(`(() => {
  //     document.querySelector('div.absolute.inset-0.z-10').style.display = 'none'
  //     })()`)
  // }

  async function handleSlots() {
    nikka.say('handling slots...')
    let lastSelectedSlot = ''
    async function pickRandomSlot(ignore = '') {
      nikka.say('picking a random time...')
      await new Promise(r => setTimeout(r, 250))
      const selectedSlot = await webviewTag.value?.executeJavaScript(`(async () => {
        function randomValue(array) {
          for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
          return array[0];
        }
        const allNormals = Array.from(document.querySelectorAll('div.grid.grid-cols-2.gap-2')[0]?.querySelectorAll('button:not([disabled])') || [])
        const allPremiums = Array.from(document.querySelectorAll('div.grid.grid-cols-2.gap-2')[1]?.querySelectorAll('button:not([disabled])') || [])
        const allAvailableSlots = [...allNormals, ...allPremiums]
        let randomSlot
        if(allAvailableSlots.length){
          randomSlot = randomValue(allAvailableSlots)
          if(randomSlot.innerText === '${ignore}'){
            randomSlot = randomValue(allAvailableSlots)
          }
          randomSlot.click()
          await new Promise(r => setTimeout(r, 300))
          Array.from(document.querySelectorAll('button.cursor-pointer.inline-flex[type=button]')).filter(b => b.innerText.toLowerCase() === 'confirm slot')?.[0]?.click()
        }
        return randomSlot?.innerText || ''
      })()`) as string
      lastSelectedSlot = selectedSlot
      nikka.say(`selected time: ${lastSelectedSlot}`)
    }

    async function handleSlotResponse(e: Electron.IpcMessageEvent) {
      const response = e.args[0] as { url: string, status: number, body: string }

      if (response.url.startsWith('https://api-mauritania.blsinternational.com/api/v1/slots/date-slots')) {
        if (response.status === 429) {
          nikka.say('reselect the day...')
          // click to unblur day button and click on it again to re-fetch
          webviewTag.value?.executeJavaScript(`(() => {
            document.querySelectorAll('button[data-day]:not([disabled])')[0].click()
            await new Promise(r => setTimeout(r, 500))
            document.querySelectorAll('button[data-day]:not([disabled])')[0].click()
          })()`)
        } else if (response.status === 200) {
          pickRandomSlot()
        }
      } else if (response.url === 'https://api-mauritania.blsinternational.com/api/v1/slots/confirm-slot') {
        if (response.status === 204) {
          removeAllListeners()
          handlePhotoAndOtp()
        } else {
          const responseBody = JSON.parse(response.body || '{}') as { "message"?: string, "error"?: "Bad Request", "statusCode"?: number } | undefined | null
          nikka.say(`error ${responseBody?.message}`, 'error')
          // if(responseBody?.error?.toLowerCase() === 'bad request' || response.status === 400 || responseBody?.message === 'slot.errors.allSlotsBooked'){
          //   pickRandomSlot()
          // }
          pickRandomSlot(lastSelectedSlot)
        }
      } else {
        console.log('unhandled response at handling slots', response.url)
      }
    }

    listenToResponse(handleSlotResponse)

    nikka.say('waiting for first available day...')
    // await waitForElement('button[data-day]:not([disabled])')
    nikka.say('clicking on first available day...')
    webviewTag.value?.executeJavaScript(`(() => {
      document.querySelectorAll('button[data-day]:not([disabled])')[0].click()
    })()`)
  }

  async function handlePhotoAndOtp() {

    async function otpResponses(e: Electron.IpcMessageEvent) {
      const response = e.args[0] as { url: string, status: number, body: string }
      if (response.url === 'https://api-mauritania.blsinternational.com/api/v1/otp/appointment/send') {
        if (response.status === 200) {
          nikka.say('getting OTP code...', 'info', 'think')
          const optCode = await emailService?.getOTP()
          if (optCode) fillInput('input[autocomplete="one-time-code"]', optCode)
          await new Promise(r => setTimeout(r, 1000))
          webviewTag.value?.executeJavaScript(`document.querySelector('div.sticky.bottom-0 button:nth-child(2)')?.click()`)
        } else {
          nikka.say('error sending OTP code', 'error')
        }
      } else if (response.url === 'https://api-mauritania.blsinternational.com/api/v1/otp/appointment/verify') {
        // const responseBody = JSON.parse(response.body) as {success?: boolean, message?:"OTP code verified successfully.", statusCode?: number, verified?: boolean}
        if (response.status === 200) {
          // accepting terms
          webviewTag.value?.executeJavaScript(`(() => {
            document.querySelector('div.sticky.bottom-0 button:nth-child(2)').click()
          })()`)
          removeAllListeners()
        }
      }
    }

    listenToResponse(otpResponses)

    await waitForElement('div.max-w-xs button')

    nikka.say('getting client photo...')
    const photoDetails = await window.desktop.getPhotoDetails(client.photo)

    nikka.say('uploading photo...')
    webviewTag.value?.executeJavaScript(`(() => {
      const input = document.querySelector('input[aria-label="File upload"]')
      if (!input) return false;
      const byteCharacters = atob('${photoDetails.base64Data}');
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const file = new File([byteArray], '${photoDetails.fileName}', { type: 'image/jpeg' });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set;
      // if (nativeSetter) nativeSetter.call(input, input.value);

      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`).then(async () => {
      nikka.say('photo uploaded successfully')
      await waitForElement('div.sticky.bottom-0 button:not([disabled]):nth-child(2)')
      webviewTag.value?.executeJavaScript(`Array.from(document.querySelectorAll('div.sticky.bottom-0 button')).filter(b => b.innerText.toLowerCase() === 'next')?.[0].click()`)
    }).catch((error) => {
      nikka.say(`failed to upload photo ${(error as Error).message}`, 'error')
    })
  }

  async function handleServices() {
    // 
  }

  async function handlePaymentResponse() {
    // 
  }

  async function waitForElement(selector: string, selectorName?: string, timeout = 1000 * 15): Promise<boolean> {
    nikka.say(`waiting for ${selectorName} selector...`)
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        webviewTag.value
          ?.executeJavaScript(
            `(() => {
              const element = document.querySelector('${selector}')
              if(element === null) return false

              //Check basic CSS visibility and dimensions
              const rect = element.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(element).visibility === 'hidden' || window.getComputedStyle(element).opacity === '0') {
                return false;
              }
              // Check if it's within the viewport bounds
              const isInViewport = (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
              );
              if (!isInViewport) return false;
              // Check if something is covering the center of the element
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const topElement = document.elementFromPoint(centerX, centerY);

              // Return true if the top element is our target element or contains it
              return element === topElement || element.contains(topElement);
          })()`
          )
          .then(async (exists: boolean) => {
            if (exists) {
              clearInterval(interval)
              clearTimeout(timer)
              resolve(true)
            }
          })
      }, 1000)

      const timer = setTimeout(() => {
        console.log(`Element ${selector} not found within ${timeout}ms`)
        clearInterval(interval)
        resolve(false)
        // reject(new Error(`Element ${selector} not found within ${timeout}ms`))
      }, timeout)
    })
  }

  function listenToResponse(callBack: (e: Electron.IpcMessageEvent) => Promise<void>) {
    if (Array.from(allListeners.values()).findIndex(c => c.name === callBack.name) !== -1) {
      console.log(`listener ${callBack.name} already exists`)
      return
    }
    // removeAllListeners()
    allListeners.add(callBack)
    webviewTag.value?.addEventListener('ipc-message', callBack)
    console.log('✅listener ', callBack.name, 'added')
  }

  function removeAllListeners() {
    for (const callBack of allListeners) {
      webviewTag.value?.removeEventListener('ipc-message', callBack)
      allListeners.delete(callBack)
      console.log('❌ remove ', callBack.name, 'listener')
    }
    // allListeners.clear()
  }

  async function init() {
    webviewTag.value?.addEventListener('dom-ready', handleNavigation)
    webviewTag.value?.addEventListener('did-navigate-in-page', handleNavigationInPage)
    emailService = new EmailService(store.settings.smtpApiKey, client.email)
    emailService?.init()
  }

  async function unInit() {
    webviewTag.value?.removeEventListener('dom-ready', handleNavigation)
    webviewTag.value?.removeEventListener('did-navigate-in-page', handleNavigationInPage)
  }

  onUnmounted(() => {
    unInit()
  })

  return reactive({ init, unInit })
}

export default useBookingNavigator


// https://api-mauritania.blsinternational.com/api/v1/slots/family/calendar?center_id=1&country_id=1&center_type=hub&number_of_applicants=2&visa_type_id=2&slotsAvailabilityType=1&appointment_channel_id=1&visa_sub_type_id=1&nationality_id=128

/**
 *
 *
 *
 */
// https://api-mauritania.blsinternational.com/api/v1/slots/date-slots?centerId=1&countryId=1&centerType=hub&date=2026-08-12&visaTypeId=2&visaSubTypeId=1&nationalityId=128&appointmentChannelId=1

// [
//     {
//         "appointmentType": "Normal",
//         "slots": [
//             {
//                 "id": 3972,
//                 "appointmentTypeId": 1,
//                 "startTime": "08:30:00",
//                 "endTime": "08:50:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3973,
//                 "appointmentTypeId": 1,
//                 "startTime": "08:50:00",
//                 "endTime": "09:10:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3974,
//                 "appointmentTypeId": 1,
//                 "startTime": "09:10:00",
//                 "endTime": "09:30:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3975,
//                 "appointmentTypeId": 1,
//                 "startTime": "09:30:00",
//                 "endTime": "09:50:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3976,
//                 "appointmentTypeId": 1,
//                 "startTime": "09:50:00",
//                 "endTime": "10:10:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3977,
//                 "appointmentTypeId": 1,
//                 "startTime": "10:10:00",
//                 "endTime": "10:30:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3978,
//                 "appointmentTypeId": 1,
//                 "startTime": "10:30:00",
//                 "endTime": "10:50:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3979,
//                 "appointmentTypeId": 1,
//                 "startTime": "10:50:00",
//                 "endTime": "11:10:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3980,
//                 "appointmentTypeId": 1,
//                 "startTime": "11:10:00",
//                 "endTime": "11:30:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3981,
//                 "appointmentTypeId": 1,
//                 "startTime": "11:30:00",
//                 "endTime": "11:50:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3982,
//                 "appointmentTypeId": 1,
//                 "startTime": "11:50:00",
//                 "endTime": "12:10:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3983,
//                 "appointmentTypeId": 1,
//                 "startTime": "12:10:00",
//                 "endTime": "12:30:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3984,
//                 "appointmentTypeId": 1,
//                 "startTime": "12:30:00",
//                 "endTime": "12:50:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3985,
//                 "appointmentTypeId": 1,
//                 "startTime": "12:50:00",
//                 "endTime": "13:10:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3986,
//                 "appointmentTypeId": 1,
//                 "startTime": "13:10:00",
//                 "endTime": "13:30:00",
//                 "numberOfAppointmentsAvailable": 0
//             }
//         ]
//     },
//     {
//         "appointmentType": "Premium",
//         "slots": [
//             {
//                 "id": 3957,
//                 "appointmentTypeId": 2,
//                 "startTime": "08:30:00",
//                 "endTime": "08:50:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3958,
//                 "appointmentTypeId": 2,
//                 "startTime": "08:50:00",
//                 "endTime": "09:10:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3959,
//                 "appointmentTypeId": 2,
//                 "startTime": "09:10:00",
//                 "endTime": "09:30:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3960,
//                 "appointmentTypeId": 2,
//                 "startTime": "09:30:00",
//                 "endTime": "09:50:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3961,
//                 "appointmentTypeId": 2,
//                 "startTime": "09:50:00",
//                 "endTime": "10:10:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3962,
//                 "appointmentTypeId": 2,
//                 "startTime": "10:10:00",
//                 "endTime": "10:30:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3963,
//                 "appointmentTypeId": 2,
//                 "startTime": "10:30:00",
//                 "endTime": "10:50:00",
//                 "numberOfAppointmentsAvailable": 2
//             },
//             {
//                 "id": 3964,
//                 "appointmentTypeId": 2,
//                 "startTime": "10:50:00",
//                 "endTime": "11:10:00",
//                 "numberOfAppointmentsAvailable": 2
//             },
//             {
//                 "id": 3965,
//                 "appointmentTypeId": 2,
//                 "startTime": "11:10:00",
//                 "endTime": "11:30:00",
//                 "numberOfAppointmentsAvailable": 1
//             },
//             {
//                 "id": 3966,
//                 "appointmentTypeId": 2,
//                 "startTime": "11:30:00",
//                 "endTime": "11:50:00",
//                 "numberOfAppointmentsAvailable": 2
//             },
//             {
//                 "id": 3967,
//                 "appointmentTypeId": 2,
//                 "startTime": "11:50:00",
//                 "endTime": "12:10:00",
//                 "numberOfAppointmentsAvailable": 2
//             },
//             {
//                 "id": 3968,
//                 "appointmentTypeId": 2,
//                 "startTime": "12:10:00",
//                 "endTime": "12:30:00",
//                 "numberOfAppointmentsAvailable": 2
//             },
//             {
//                 "id": 3969,
//                 "appointmentTypeId": 2,
//                 "startTime": "12:30:00",
//                 "endTime": "12:50:00",
//                 "numberOfAppointmentsAvailable": 1
//             },
//             {
//                 "id": 3970,
//                 "appointmentTypeId": 2,
//                 "startTime": "12:50:00",
//                 "endTime": "13:10:00",
//                 "numberOfAppointmentsAvailable": 0
//             },
//             {
//                 "id": 3971,
//                 "appointmentTypeId": 2,
//                 "startTime": "13:10:00",
//                 "endTime": "13:30:00",
//                 "numberOfAppointmentsAvailable": 1
//             }
//         ]
//     }
// ]


/**
 *
 */
// https://api-mauritania.blsinternational.com/api/v1/slots/confirm-slot
// {"message":"slot.errors.allSlotsBooked","error":"Bad Request","statusCode":400}