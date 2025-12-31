const { contextBridge, ipcRenderer } = require('electron');

// Securely expose IPC methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  getScreenSources: () => ipcRenderer.invoke('GET_SCREEN_SOURCES'),
  performOCR: (imageBase64) => ipcRenderer.invoke('PERFORM_OCR', imageBase64)
});