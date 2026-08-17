import { ipcRenderer } from "electron";

ipcRenderer.on('get-response', (e, args) => {
  ipcRenderer.sendToHost('get-response', args)
})