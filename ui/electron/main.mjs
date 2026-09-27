import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  protocol,
  shell,
} from 'electron'

import fs from 'node:fs'
import path from 'node:path'
import * as yaml from 'js-yaml'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

import {
  getConfigPath,
  getDataRoot,
  getResourceRoot,
  getResourcePath,
} from './paths.mjs'
import {
  getPlayLogs,
  getAdjacentPlayLogs,
  getTodaysPlaySummary,
  updatePlayLog,
  deletePlayLog,
} from './db.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged

let logTerminalOpen = false

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
  }

  function getProjectRoot() {
    return path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
      '..',
    )
  }

  function getBundledResourcePath(name) {
    if (app.isPackaged) {
      return path.join(
        process.resourcesPath,
        'resources',
        name,
      )
    }

    return path.join(
      getProjectRoot(),
      'resources',
      name,
    )
  }

  function getBundledConfigExamplePath() {
    if (app.isPackaged) {
      return path.join(
        process.resourcesPath,
        'config.example.yaml',
      )
    }

    return path.join(
      getProjectRoot(),
      'config.example.yaml',
    )
  }

  function bufferToDataUrl(buffer) {
    return `data:image/png;base64,${buffer.toString('base64')}`
  }

  function readPngDataUrl(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `PNG resource not found: ${filePath}`,
      )
    }

    return bufferToDataUrl(
      fs.readFileSync(filePath),
    )
  }

  function readCurrentOrDefault(
    currentName,
    defaultName,
  ) {
    const currentPath =
      getResourcePath(currentName)

    if (fs.existsSync(currentPath)) {
      return readPngDataUrl(currentPath)
    }

    return readPngDataUrl(
      getResourcePath(defaultName),
    )
  }

  ipcMain.handle('config:get', () => {
    const configPath = getConfigPath()

    if (!fs.existsSync(configPath)) {
      throw new Error(
        `Config file not found: ${configPath}`,
      )
    }

    const content = fs.readFileSync(
      configPath,
      'utf-8',
    )

    return yaml.load(content) ?? {}
  })

  ipcMain.handle(
    'config:save',
    (_event, config) => {
      if (
        config === null ||
        typeof config !== 'object' ||
        Array.isArray(config)
      ) {
        throw new Error(
          'Config must be a YAML mapping',
        )
      }

      const configPath = getConfigPath()

      const content = yaml.dump(
        config,
        {
          noRefs: true,
          lineWidth: -1,
        },
      )

      fs.writeFileSync(
        configPath,
        content,
        'utf-8',
      )

      return {
        saved: true,
      }
    },
  )

  ipcMain.handle(
    'settings:get-resources',
    () => {
      const configPath =
        getConfigPath()

      if (!fs.existsSync(configPath)) {
        throw new Error(
          `Config file not found: ${configPath}`,
        )
      }

      const config = yaml.load(
        fs.readFileSync(
          configPath,
          'utf-8',
        ),
      ) ?? {}

      const defaultConfig =
        yaml.load(
          fs.readFileSync(
            getBundledConfigExamplePath(),
            'utf-8',
          ),
        ) ?? {}

      return {
        config,
        defaultConfig,

        resultSample:
          readCurrentOrDefault(
            'result_sample.png',
            'result_default.png',
          ),

        songStartSample:
          readCurrentOrDefault(
            'song_start_sample.png',
            'song_start_default.png',
          ),

        resultDefault:
          readPngDataUrl(
            getResourcePath(
              'result_default.png',
            ),
          ),

        songStartDefault:
          readPngDataUrl(
            getResourcePath(
              'song_start_default.png',
            ),
          ),
      }
    },
  )

  ipcMain.handle(
    'settings:select-png',
    async () => {
      const result =
        await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [
            {
              name: 'PNG Images',
              extensions: ['png'],
            },
          ],
        })

      if (
        result.canceled ||
        result.filePaths.length === 0
      ) {
        return null
      }

      return readPngDataUrl(
        result.filePaths[0],
      )
    },
  )

  ipcMain.handle(
    'settings:save',
    async (_event, payload) => {
      if (
        !payload ||
        typeof payload !== 'object'
      ) {
        throw new Error(
          'Invalid settings payload',
        )
      }

      const {
        config,
        resultSample,
        songStartSample,
        resultTemplate,
        songStartTemplate,
      } = payload

      if (
        !config ||
        typeof config !== 'object' ||
        Array.isArray(config)
      ) {
        throw new Error(
          'Config must be a YAML mapping',
        )
      }

      const configPath = getConfigPath()
      const resourcesRoot = getResourceRoot()

      fs.mkdirSync(
        path.dirname(configPath),
        { recursive: true },
      )

      fs.mkdirSync(
        resourcesRoot,
        { recursive: true },
      )

      const decodePng = (
        dataUrl,
        name,
      ) => {
        if (
          typeof dataUrl !== 'string' ||
          !dataUrl.startsWith(
            'data:image/png;base64,',
          )
        ) {
          throw new Error(
            `${name} must be a PNG data URL`,
          )
        }

        return Buffer.from(
          dataUrl.slice(
            'data:image/png;base64,'.length,
          ),
          'base64',
        )
      }

      const configYaml =
        yaml.dump(config, {
          noRefs: true,
          lineWidth: -1,
        })

        const files = [
          {
            target: configPath,
            data: Buffer.from(
              configYaml,
              'utf-8',
            ),
          },
          {
            target: path.join(
              resourcesRoot,
              'result_sample.png',
            ),
            data: decodePng(
              resultSample,
              'resultSample',
            ),
          },
          {
            target: path.join(
              resourcesRoot,
              'song_start_sample.png',
            ),
            data: decodePng(
              songStartSample,
              'songStartSample',
            ),
          },
          {
            target: path.join(
              resourcesRoot,
              'result_template.png',
            ),
            data: decodePng(
              resultTemplate,
              'resultTemplate',
            ),
          },
          {
            target: path.join(
              resourcesRoot,
              'song_start_template.png',
            ),
            data: decodePng(
              songStartTemplate,
              'songStartTemplate',
            ),
          },
        ]

      const transactionId =
        `${Date.now()}-${process.pid}`

      const temporary = []
      const backups = []

      try {
        for (const file of files) {
          const target = file.target

          const temp =
            `${target}.tmp-${transactionId}`

          fs.writeFileSync(
            temp,
            file.data,
          )

          temporary.push({
            target,
            temp,
          })
        }

        for (const file of temporary) {
          if (fs.existsSync(file.target)) {
            const backup =
              `${file.target}.bak-${transactionId}`

            fs.renameSync(
              file.target,
              backup,
            )

            backups.push({
              target: file.target,
              backup,
            })
          }
        }

        for (const file of temporary) {
          fs.renameSync(
            file.temp,
            file.target,
          )
        }

        for (const backup of backups) {
          fs.rmSync(
            backup.backup,
            { force: true },
          )
        }

        return {
          saved: true,
        }
      } catch (error) {
        for (const file of temporary) {
          fs.rmSync(
            file.temp,
            { force: true },
          )
        }

        for (
          const file of temporary
        ) {
          fs.rmSync(
            file.target,
            { force: true },
          )
        }

        for (const backup of backups) {
          if (
            fs.existsSync(
              backup.backup,
            )
          ) {
            fs.renameSync(
              backup.backup,
              backup.target,
            )
          }
        }

        throw error
      }
    },
  )

  ipcMain.handle(
    'config:select-file',
    async (_event, options = {}) => {
      const result = await dialog.showOpenDialog({
        defaultPath: options.defaultPath || undefined,
        properties: ['openFile'],
        filters: Array.isArray(options.extensions)
          ? [
              {
                name: 'Files',
                extensions: options.extensions,
              },
            ]
          : undefined,
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      return result.filePaths[0]
    },
  )

  ipcMain.handle(
    'app:show-message-box',
    async (_event, options) => {
      const result =
        await dialog.showMessageBox({
          type:
            options?.type ?? 'info',

          title:
            options?.title ?? '',

          message:
            options?.message ?? '',

          buttons:
            Array.isArray(
              options?.buttons,
            ) &&
            options.buttons.length > 0
              ? options.buttons
              : ['OK'],

          defaultId:
            options?.defaultId,

          cancelId:
            options?.cancelId,
        })

      return {
        response: result.response,
      }
    },
  )

  ipcMain.handle('get-system-sound', () => {
    const soundPath =
      'C:\\Windows\\Media\\Windows Notify System Generic.wav'

    return fs.readFileSync(soundPath).toString('base64')
  })

  ipcMain.handle(
    'log:open',
    async () => {
      logTerminalOpen = true

      const now = new Date()

      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')

      const fileName = `${year}${month}${day}.log`

      const logPath = path.join(
        getDataRoot(),
        'logs',
        fileName,
      )

      try {
        const content = await fs.promises.readFile(
          logPath,
          'utf-8',
        )

        return {
          exists: true,
          fileName,
          content,
        }
      } catch (error) {
        if (error?.code === 'ENOENT') {
          return {
            exists: false,
            fileName,
            content: '',
          }
        }

        throw error
      }
    },
  )

  ipcMain.handle(
    'log:read',
    async () => {
      if (!logTerminalOpen) {
        return null
      }

      const now = new Date()

      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')

      const fileName = `${year}${month}${day}.log`

      const logPath = path.join(
        getDataRoot(),
        'logs',
        fileName,
      )

      try {
        const content = await fs.promises.readFile(
          logPath,
          'utf-8',
        )

        return {
          exists: true,
          fileName,
          content,
        }
      } catch (error) {
        if (error?.code === 'ENOENT') {
          return {
            exists: false,
            fileName,
            content: '',
          }
        }

        throw error
      }
    },
  )

  ipcMain.handle(
    'log:close',
    () => {
      logTerminalOpen = false
    },
  )

  ipcMain.handle('play-log:get-list', (_event, options) => {
    const result = getPlayLogs(options)

    const rows = result.rows.map((row) => {
      const replayPath = path.join(
        getDataRoot(),
        'media',
        row.play_id,
        'replay.mp4',
      )

      return {
        ...row,
        has_replay_video: fs.existsSync(replayPath),
      }
    })

    return {
      ...result,
      rows,
    }
  })

  ipcMain.handle(
    'play-log:get-adjacent',
    (_event, options) => {
      return getAdjacentPlayLogs(options)
    },
  )

  ipcMain.handle(
    'play-log:get-todays-summary',
    (_event, date) => {
      return getTodaysPlaySummary(date)
    },
  )

  ipcMain.handle('play-log:update', (_event, playId, values) => {
      return updatePlayLog(playId, values)
  })

  ipcMain.handle(
    'play-log:delete',
    async (_event, playId) => {
      if (
        typeof playId !== 'string' ||
        !/^[0-9a-f-]+$/i.test(playId)
      ) {
        return {
          deleted: false,
          reason: 'invalid_play_id',
        }
      }

      const mediaDir = path.join(
        getDataRoot(),
        'media',
        playId,
      )

      /*
       * SQLiteから対象プレイ記録を削除する。
       */
      try {
        const sqliteResult =
          deletePlayLog(playId)

        if (!sqliteResult.deleted) {
          return {
            deleted: false,
            reason: 'not_found',
          }
        }
      } catch (error) {
        console.error(
          `Failed to delete SQLite record: ${playId}`,
          error,
        )

        return {
          deleted: false,
          reason: 'sqlite_delete_failed',
        }
      }

      /*
       * プレイ単位のメディアディレクトリを
       * Windowsのゴミ箱へ移動する。
       *
       * メディアが存在しない場合は、
       * すでに削除済みとして処理を継続する。
       */
      try {
        if (fs.existsSync(mediaDir)) {
          await shell.trashItem(mediaDir)
        }
      } catch (error) {
        console.error(
          `Failed to move play media to trash: ${playId}`,
          error,
        )

        return {
          deleted: false,
          reason: 'media_delete_failed',
        }
      }

      return {
        deleted: true,
      }
    },
  )

  ipcMain.handle(
    'app\:open-external',
    async (_event, url) => {
      if (
        typeof url !== 'string' ||
        !/^https:\/\/(x\.com|twitter\.com)\//i.test(url)
      ) {
        return {
          opened: false,
          reason: 'invalid_url',
        }
      }

      try {
        await shell.openExternal(url)

        return {
          opened: true,
        }
      } catch (error) {
        console.error(
          `Failed to open external URL: ${url}`,
          error,
        )

        return {
          opened: false,
          reason: 'open_failed',
        }
      }
    },
  )

  ipcMain.handle(
    'play-log\:open-media-folder',
    async (_event, playId) => {
      if (
        typeof playId !== 'string' ||
        !/^[0-9a-f-]+$/i.test(playId)
      ) {
        return {
          opened: false,
          reason: 'invalid_play_id',
        }
      }

      const mediaDir = path.join(
        getDataRoot(),
        'media',
        playId,
      )

      if (!fs.existsSync(mediaDir)) {
        return {
          opened: false,
          reason: 'not_found',
        }
      }

      try {
        const result = await shell.openPath(mediaDir)

        if (result) {
          console.error(
            `Failed to open media folder: ${mediaDir}`,
            result,
          )

          return {
            opened: false,
            reason: 'open_failed',
          }
        }

        return {
          opened: true,
        }
      } catch (error) {
        console.error(
          `Failed to open media folder: ${mediaDir}`,
          error,
        )

        return {
          opened: false,
          reason: 'open_failed',
        }
      }
    },
  )

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

  ipcMain.handle(
    'play-log:trash-media',
    async (_event, playId, mediaType) => {
      if (
        typeof playId !== 'string' ||
        !/^[0-9a-f-]+$/i.test(playId)
      ) {
        return {
          trashed: false,
          reason: 'invalid_play_id',
        }
      }

      if (mediaType !== 'result' && mediaType !== 'replay') {
        return {
          trashed: false,
          reason: 'invalid_media_type',
        }
      }

      const mediaDir = path.join(
        getDataRoot(),
        'media',
        playId,
      )

      const filename = mediaType === 'result'
        ? 'result.png'
        : 'replay.mp4'

      const mediaPath = path.join(
        mediaDir,
        filename,
      )

      if (!fs.existsSync(mediaPath)) {
        return {
          trashed: false,
          reason: 'not_found',
        }
      }

      try {
        await shell.trashItem(mediaPath)

        const resultPath = path.join(
          mediaDir,
          'result.png',
        )

        const replayPath = path.join(
          mediaDir,
          'replay.mp4',
        )

        if (
          !fs.existsSync(resultPath) &&
          !fs.existsSync(replayPath) &&
          fs.existsSync(mediaDir)
        ) {
          await shell.trashItem(mediaDir)
        }

        return {
          trashed: true,
        }
      } catch (error) {
        console.error(
          `Failed to move media to trash: ${mediaPath}`,
          error,
        )

        return {
          trashed: false,
          reason: 'trash_failed',
        }
      }
    },
  )

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
