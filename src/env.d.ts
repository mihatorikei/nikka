/// <reference types="vite/client" />

interface Window {
  desktop: {
    send(...args: Parameters<typeof ipcRenderer.send>): void
    invoke<T = unknown>(...args: Parameters<typeof ipcRenderer.invoke>): Promise<T>
    getPath(file: File): string
    getWebviewPreload(): string
    getPhotoDetails(string): Promise<{
      fileName: string,
      base64Data: string
    }>
    platform: NodeJS.Platform
    versions: {
      electron: string
      chrome: string
      node: string
    }
  }
}
