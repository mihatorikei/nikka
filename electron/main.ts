import { app, BrowserWindow, shell, nativeTheme, ipcMain, session, nativeImage } from 'electron'
import serve from 'electron-serve'
import { copyFileSync, createReadStream, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path, { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ElectronDownloadManager } from 'electron-dl-manager'
import { Users, Client as AppwriteClient } from 'node-appwrite'
import FormData from 'form-data'
import axios, { type AxiosError } from 'axios'
import { uploadFile, deleteFile } from './appwrite.js'

app.commandLine.appendSwitch('enable-features', 'OverlayScrollbar,FluentOverlayScrollbar,disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-site-isolation-trials')
app.setAppUserModelId('com.devdice.nikka')

let mainWindow: BrowserWindow

let proxyUrl: string
const allSessions = new Map<string, Electron.Session>()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDevelopment = !app.isPackaged && !process.argv.includes('--production')
const devServerUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://127.0.0.1:5173'
const appIconPath = app.isPackaged
  ? path.join(process.resourcesPath, 'icon.ico')
  : path.join(__dirname, '../build/icon.ico')
const resourcesPath = join(app.getPath('documents'), 'nikka')
const filePath = (fileName: string, bucket = 'photos') => `https://appwrite.nikkaa.com/v1/storage/buckets/${bucket}/files/${fileName}/view?project=nikka-bot`
const downloadManager = new ElectronDownloadManager()

const loadProductionUrl = serve({
  directory: path.join(__dirname, '../dist'),
  isCorsEnabled: false, scheme: 'app', hostname: 'nikka'
})

async function createWindow() {
  mainWindow = new BrowserWindow({
    icon: appIconPath,
    width: 800,
    height: 640,
    center: true,
    autoHideMenuBar: true,
    backgroundMaterial: 'acrylic',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: nativeTheme.shouldUseDarkColors ? '#2f3241' : 'white',
      height: 45,
      symbolColor: nativeTheme.shouldUseDarkColors ? 'white' : 'black'
    },
    webPreferences: {
      webviewTag: true,
      // Sandboxed preloads need CommonJS even though this package's main
      // process uses ESM. electron/preload.cts emits this .cjs file.
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: false,
      webSecurity: false,
      // nodeIntegration: false,
      sandbox: false
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDevelopment) {
    await mainWindow.loadURL(devServerUrl)
  } else {
    await loadProductionUrl(mainWindow)
  }

  nativeTheme.on('updated', () => {
    console.log('native theme updated')
    const isDarkMode = nativeTheme.shouldUseDarkColors
    mainWindow.setTitleBarOverlay({
      color: isDarkMode ? '#2f3241' : 'white',
      height: 45,
      symbolColor: isDarkMode ? 'white' : 'black'
    })
  })

}

app.whenReady().then(async () => {

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow()
  })

  app.on('login', (event, _webContents, _request, authInfo, callback) => {
    if (authInfo.isProxy) {
      event.preventDefault() // Stop the default login dialog
      const username = proxyUrl.split('//')[1].split(':')[0].replace('-session-1', '')
      const password = proxyUrl.split('//')[1].split(':')[1].split('@')[0]
      // Provide your username and password here
      callback(username, password)
    }
  })

  try {
    if (existsSync(resourcesPath) === false || existsSync(join(resourcesPath, 'photos')) === false) {
      console.log('initializing folders...')
      mkdirSync(resourcesPath, { recursive: true })
      mkdirSync(join(resourcesPath, 'photos'), { recursive: true })
    }
  } catch (error) {
    console.log('initializing folders error', (error as Error).message)
  }

  mainWindow.webContents.on('did-attach-webview', (_e, webview) => {
    try {
      // 1. Attach CDP Debugger to the webview's webContents
      webview.debugger.attach('1.3');
      webview.debugger.sendCommand('Network.enable');
      webview.debugger.on('message', async (event, method, params) => {
        if (method === 'Network.responseReceived') {
          const { requestId, response } = params;
          if ((response.url as String).startsWith('https://api-mauritania.blsinternational.com')) {
            // console.log(`[Webview HTTP] ${response.status} -> ${response.url}`);
            let bodyResult = { body: '' }
            try {
              bodyResult = await webview.debugger.sendCommand(
                'Network.getResponseBody',
                { requestId }
              );
            } catch (error) {
              console.log('catching response body failed', (error as Error).message)
            }

            webview.send('get-response', {
              url: response.url,
              status: response.status,
              body: bodyResult?.body || ''
            })
          }
        }
      });
    } catch (err) {
      console.error('Debugger attach failed:', err);
    }
    // webview.send('response', 'test')
    // console.log('created and sent')
  })

  createWindow()

})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('quit', () => {
  clearAllSessions()
})

async function clearAllSessions() {
  for (const [, thisSession] of allSessions) {
    await thisSession.closeAllConnections()
    await thisSession.clearStorageData({
      storages: ['cookies', 'localstorage']
    })
    await thisSession.setProxy({
      mode: 'direct'
    })
  }
  return true
}

async function downloadPhoto(photo: string, bucket = 'photos') {
  if (existsSync(join(resourcesPath, 'photos', photo)) === false) {
    console.log("photo don't exist ", join(resourcesPath, 'photos', photo))
    const downloadPath = filePath(photo, bucket)

    const request = await fetch(downloadPath)

    if (request.status === 404) {
      console.error('photo not found on the cloud', 'bucket', bucket, photo)
      return
    }

    return downloadManager.download({
      window: mainWindow,
      saveAsFilename: photo,
      url: downloadPath,
      directory: join(resourcesPath, 'photos'),
      callbacks: {
        onError: (err) => console.log('error downloading photo', err),
        onDownloadCompleted: () => console.log('a new photo downloaded', photo)
      }
    })
  }
  return
}

ipcMain.handle('get-version', () => app.getVersion())

ipcMain.handle('download-photo', async (_e, photo: string, bucket = 'photos') => downloadPhoto(photo, bucket))

ipcMain.handle('start-session', async (_e, params: StartSessionParams) => {
  // update first proxy url
  proxyUrl = params.proxyUrl
  console.log('proxy url', proxyUrl)
  const targetSession = session.fromPartition(`persist:${params.clientID}`)
  allSessions.set(params.clientID, targetSession)
  await targetSession.closeAllConnections()
  await targetSession.clearData({
    dataTypes: ['cookies', 'localStorage']
  })

  targetSession.setUserAgent(params.userAgent)

  targetSession.webRequest.onBeforeSendHeaders(
    { urls: ['<all_urls>'] }, // Modify to target your API endpoint
    (details, callback) => {
      details.requestHeaders['Origin'] = 'https://spain-mauritania.blsinternational.com'
      callback({ requestHeaders: details.requestHeaders })
    }
  )

  targetSession.webRequest.onBeforeRequest({ urls: ['https://spainfraudcheck.blsinternational.com/fraud-check.php?signature=*'] }, (details, callback) => {
    // const newUrl = details.url.replace(/[?&]signature=([^&]+)/, '?last=true&signature=BAcAan5BiQFqfkTuQQAGgAGBAcAAIL4Pb48wpuG7u1i4jKEz-58JfdQHsHFsFjLDZC_fQqScwQAgjyJp87oT1CY66LlDPYI-Dwhv9t6yzOEsiyuP_9IpiuQ')
    // callback({ redirectURL: newUrl, cancel: false })
    callback({ cancel: true })
  })

  if (params.useProxy === false) {
    return targetSession.setProxy({
      mode: 'direct'
    })
  } else {
    // http://customer-medou_SJPka-cc-es-sessid-0338032952-sesstime-1440:Buster__2025@pr.oxylabs.io:7777
    const proxyHost = params.proxyUrl.split('@')[1].split(':')[0]

    return targetSession
      .setProxy({
        mode: 'fixed_servers',
        proxyRules: `http://${proxyHost}:${params.port}`
      }).then(() => {
        console.log("proxy set for ", `http://${proxyHost}:${params.port}`)
      })
      .catch((e) => {
        console.log('Error setting proxy for session', e.message)
      })
  }
})

ipcMain.handle('fetch-users', async () => {
  const client = new AppwriteClient()

  client.setEndpoint('https://appwrite.nikkaa.com/v1').setProject('nikka-bot').setKey('standard_0a84912e53204048a1f4c8c741a4cc125b21c41257c0298335c3be8ba2e2ee24784be140e0af3008fdd2721af49d5957166835998d768cd480c30fdb75a8142ce74b256a040b408cb1d53dc7554a8f73a566a74509258959d190ef833603959b6830045670c5198a6e6408b1198b788bf56208ed3289cc367e8d0628bab3d775')

  const users = new Users(client)
  const usersList = await users.list()
  return [...JSON.parse(JSON.stringify(usersList.users))]
})


ipcMain.handle('get-resources-path', () => {
  return resourcesPath
})


ipcMain.handle('fetch-data', async (_e, passport: string, settings: AppSettings, model: 'klippa' | 'microsoft') => {
  const formData = new FormData()
  formData.append('providers', model)
  formData.append('file', createReadStream(passport))
  const options = {
    method: 'POST',
    url: 'https://api.edenai.run/v2/ocr/identity_parser',
    headers: {
      Authorization: `Bearer ${settings.edenAiToken}`,
      'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
    },
    data: formData
  }
  try {

    const request = await axios.request<EdenAiResponse>(options)
    return request.data[model].status === 'success' ? request.data[model].extracted_data[0] : undefined
  } catch (error) {
    const axiosError = error as AxiosError
    console.log('EdenAi error', axiosError.response?.status, axiosError.response?.statusText)
    return axiosError.response?.statusText || 'unknown response'
  }
})

// upload a file (photo, passport) to appwrite storage and copy it to resources folder
ipcMain.handle('upload-file', async (_e, file: string, type: 'photo' | 'passport' = 'photo') => {
  try {
    const fileName = `${type === 'passport' ? 'passport' : 'photo'}-${Date.now()}.jpg`
    const filePath = join(resourcesPath, 'photos', fileName)
    let finalPhoto: Buffer

    if (file.startsWith('data:image')) {
      let originalPhoto = nativeImage.createFromDataURL(file)
      if (originalPhoto.getSize().width > 300 && type !== 'passport') originalPhoto = originalPhoto.resize({ width: 300 })
      finalPhoto = originalPhoto.toJPEG(95)
      writeFileSync(filePath, finalPhoto)
    } else {
      let originalPhoto = nativeImage.createFromPath(file)
      if (originalPhoto.getSize().width > 300 && type !== 'passport') originalPhoto = originalPhoto.resize({ width: 300 })
      finalPhoto = originalPhoto.toJPEG(95)
      if (type === 'passport') {
        copyFileSync(file, join(resourcesPath, 'photos', fileName))
      } else {
        writeFileSync(filePath, finalPhoto)
      }
    }
    await uploadFile(filePath, fileName, type === 'passport' ? 'passports' : 'photos')
    return fileName
  } catch (error) {
    console.error('error while handling photo', (error as Error).message)
    return ''
  }
})

// delete a file from local storage and appwrite storage
ipcMain.handle('delete-file', async (_e, photo: string, bucket: 'photos' | 'passports' = 'photos') => {
  try {
    if (existsSync(join(resourcesPath, 'photos', photo))) rmSync(join(resourcesPath, 'photos', photo))
    await deleteFile(photo, bucket)
  } catch (error) {
    console.log('error while deleting photo', (error as Error).message)
  }
})
