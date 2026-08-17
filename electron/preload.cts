import { contextBridge, webUtils, ipcRenderer } from 'electron/renderer'
import { join, basename } from 'node:path'
import { readFileSync } from 'node:fs'

console.log("preload is ready")

const api = {
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
  getPath(file: File) {
    return webUtils.getPathForFile(file)
  },
  getWebviewPreload() {
    // Sandboxed preloads cannot require Node built-ins (including node:path).
    return `${__dirname}/webview-preload.cjs`
  },
  async getPhotoDetails(photoName: string){
    const resourcesPath = await ipcRenderer.invoke('get-resources-path') as string
    console.log('resources path', resourcesPath)
    const filePath = join(resourcesPath, 'photos', photoName)
    console.log('file path', filePath)
    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const fileName = basename(filePath);
    return {
      fileName,
      base64Data
    }
  }
}

// contextBridge.exposeInMainWorld('desktop', {
//   send(...args: Parameters<typeof ipcRenderer.send>) {
//     const [channel, ...omit] = args
//     return ipcRenderer.send(channel, ...omit)
//   },
//   invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
//     const [channel, ...omit] = args
//     return ipcRenderer.invoke(channel, ...omit)
//   },
//   getPath(file: File) {
//     return webUtils.getPathForFile(file)
//   },
//   getWebviewPreload() {
//     // Sandboxed preloads cannot require Node built-ins (including node:path).
//     return `${__dirname}/../../resources/webview-preload.js`
//   },
//   platform: process.platform,
//   versions: {
//     electron: process.versions.electron,
//     chrome: process.versions.chrome,
//     node: process.versions.node,
//   },
// })


if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('desktop', api)
  } catch (error) {
    console.error('error exposing electron api to main world: ', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.desktop = api
}