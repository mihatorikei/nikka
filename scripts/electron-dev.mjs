import { spawn } from 'node:child_process'
import { watch } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import electron from 'electron'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const electronOutput = path.join(projectRoot, 'dist-electron')
let appProcess
let restartTimer
let restarting = false

function start() {
  appProcess = spawn(electron, ['.'], {
    cwd: projectRoot,
    stdio: 'inherit',
  })

  appProcess.on('exit', () => {
    appProcess = undefined
    if (restarting) {
      restarting = false
      start()
    }
  })
}

function restart() {
  clearTimeout(restartTimer)
  restartTimer = setTimeout(() => {
    if (!appProcess) {
      start()
      return
    }

    restarting = true
    appProcess.kill()
  }, 150)
}

watch(electronOutput, { recursive: true }, (_event, filename) => {
  // Only restart when main-process outputs change (avoid restarting for renderer builds and other noise).
  // TypeScript also writes maps and declarations; only executable output needs
  // an application restart.
  if (!filename) return

  // Normalize and check only the basename to avoid platform path differences.
  const changedBasename = path.basename(filename)
  const mainFiles = new Set([
    'main.js', 'main.cjs', 'main.mjs',
    'preload.js', 'preload.cjs', 'preload.mjs'
  ])

  // Only consider JS-like compiled outputs.
  if (!/\.(?:js|cjs|mjs)$/.test(changedBasename)) return

  // Restart when a main process file changed (exact match or common prefixes).
  if (mainFiles.has(changedBasename) || changedBasename.startsWith('main.') || changedBasename.startsWith('preload.')) {
    restart()
  }
})

start()

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    appProcess?.kill()
    process.exit()
  })
}
