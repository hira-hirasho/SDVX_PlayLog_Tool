const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getPlayLogs: (options) => ipcRenderer.invoke('play-log:get-list', options),
  getPlayMedia: (playId) => ipcRenderer.invoke('play-log:get-media', playId),
  updatePlayLog: (playId, values) => ipcRenderer.invoke('play-log:update', playId, values),
})
