const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getConfig: () =>
    ipcRenderer.invoke(
      'config:get',
    ),

  saveConfig: (config) =>
    ipcRenderer.invoke(
      'config:save',
      config,
    ),

  selectFile: (options) =>
    ipcRenderer.invoke(
      'config:select-file',
      options,
    ),

  getPlayLogs: (options) =>
    ipcRenderer.invoke(
      'play-log:get-list',
      options,
    ),

  getAdjacentPlayLogs: (options) =>
    ipcRenderer.invoke(
      'play-log:get-adjacent',
      options,
    ),

  getTodaysPlaySummary: (date) =>
    ipcRenderer.invoke(
      'play-log:get-todays-summary',
      date,
    ),

  showMessageBox: (options) =>
    ipcRenderer.invoke(
      'app:show-message-box',
      options,
    ),

  openLogTerminal: () =>
    ipcRenderer.invoke(
      'log:open',
    ),

  readLogTerminal: () =>
    ipcRenderer.invoke(
      'log:read',
    ),

  closeLogTerminal: () =>
    ipcRenderer.invoke(
      'log:close',
    ),

  getPlayMedia: (playId) =>
    ipcRenderer.invoke(
      'play-log:get-media',
      playId,
    ),

  trashPlayMedia: (
    playId,
    mediaType,
  ) =>
    ipcRenderer.invoke(
      'play-log:trash-media',
      playId,
      mediaType,
    ),

  updatePlayLog: (
    playId,
    values,
  ) =>
    ipcRenderer.invoke(
      'play-log:update',
      playId,
      values,
    ),

  deletePlayRecord: (playId) =>
    ipcRenderer.invoke(
      'play-log:delete',
      playId,
    ),

  openExternal: (url) =>
    ipcRenderer.invoke(
      'app\:open-external',
      url,
    ),

  openPlayMediaFolder: (playId) =>
    ipcRenderer.invoke(
      'play-log\:open-media-folder',
      playId,
    ),
})
