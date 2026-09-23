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
