const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getScreenSources: () => ipcRenderer.invoke('GET_SCREEN_SOURCES')
});