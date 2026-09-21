import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  net,
  protocol,
} from 'electron'

import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

import { getDataRoot } from './paths.mjs'
import {
  getPlayLogs,
  updatePlayLog,
} from './db.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'sdvx-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
])

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const windows = BrowserWindow.getAllWindows()
    const win = windows[0]

    if (!win) {
      return
    }

    if (win.isMinimized()) {
      win.restore()
    }

    if (!win.isVisible()) {
      win.show()
    }

    win.focus()
  })

  function createWindow() {
    const win = new BrowserWindow({
      width: 1280,
      height: 800,
      title: 'SDVX PlayLog Tool',
      icon: path.join(__dirname, 'icon.ico'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    if (isDev) {
      win.loadURL('http://localhost:5173')
      win.webContents.openDevTools()
    } else {
      const indexPath = path.join(
        app.getAppPath(),
        'dist',
        'index.html',
      )
      win.loadFile(indexPath)
    }

    win.webContents.on('before-input-event', (event, input) => {
      if (input.type !== 'mouseDown') return

      if (input.button === 'X1') {
        event.preventDefault()

        if (win.webContents.canGoBack()) {
          win.webContents.goBack()
        }

        return
      }

      if (input.button === 'X2') {
        event.preventDefault()

        if (win.webContents.canGoForward()) {
          win.webContents.goForward()
        }
      }
    })
  }

  ipcMain.handle('play-log:get-list', (_event, options) => {
    return getPlayLogs(options)
  })

  ipcMain.handle('play-log:update', (_event, playId, values) => {
      return updatePlayLog(playId, values)
  })

  ipcMain.handle('play-log:get-media', (_event, playId) => {
    if (
      typeof playId !== 'string' ||
      !/^[0-9a-f-]+$/i.test(playId)
    ) {
      return {
        resultImage: null,
        replayVideo: null,
      }
    }

    const mediaDir = path.join(
      getDataRoot(),
      'media',
      playId,
    )

    const resultPath = path.join(
      mediaDir,
      'result.png',
    )

    const replayPath = path.join(
      mediaDir,
      'replay.mp4',
    )

    const resultImage = fs.existsSync(resultPath)
      ? `sdvx-media://${playId}/result.png`
      : null

    const replayVideo = fs.existsSync(replayPath)
      ? `sdvx-media://${playId}/replay.mp4`
      : null

    return {
      resultImage,
      replayVideo,
    }
  })

  app.whenReady().then(() => {
    protocol.handle('sdvx-media', async (request) => {
      const url = new URL(request.url)
      const playId = url.hostname
      const filename = url.pathname.slice(1)

      if (
        !playId ||
        !filename ||
        !/^[0-9a-f-]+$/i.test(playId) ||
        !['result.png', 'replay.mp4'].includes(filename)
      ) {
        return new Response('Not Found', { status: 404 })
      }

      const mediaPath = path.join(
        getDataRoot(),
        'media',
        playId,
        filename,
      )

      if (!fs.existsSync(mediaPath)) {
        return new Response('Not Found', { status: 404 })
      }

      const stat = fs.statSync(mediaPath)
      const fileSize = stat.size
      const range = request.headers.get('range')

      const contentType = filename === 'replay.mp4'
        ? 'video/mp4'
        : 'image/png'

      if (!range) {
        const stream = fs.createReadStream(mediaPath)

        return new Response(Readable.toWeb(stream), {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': String(fileSize),
            'Accept-Ranges': 'bytes',
          },
        })
      }

      const match = /^bytes=(\d*)-(\d*)$/.exec(range)

      if (!match) {
        return new Response('Range Not Satisfiable', {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        })
      }

      let start
      let end

      if (match[1] === '') {
        const suffixLength = Number(match[2])

        if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
          return new Response('Range Not Satisfiable', {
            status: 416,
            headers: {
              'Content-Range': `bytes */${fileSize}`,
            },
          })
        }

        start = Math.max(fileSize - suffixLength, 0)
        end = fileSize - 1
      } else {
        start = Number(match[1])
        end = match[2] === ''
          ? fileSize - 1
          : Number(match[2])

        if (
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(end) ||
          start < 0 ||
          start >= fileSize ||
          end < start
        ) {
          return new Response('Range Not Satisfiable', {
            status: 416,
            headers: {
              'Content-Range': `bytes */${fileSize}`,
            },
          })
        }

        end = Math.min(end, fileSize - 1)
      }

      const contentLength = end - start + 1
      const stream = fs.createReadStream(mediaPath, {
        start,
        end,
      })

      return new Response(Readable.toWeb(stream), {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(contentLength),
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
        },
      })
    })

    Menu.setApplicationMenu(null)
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
