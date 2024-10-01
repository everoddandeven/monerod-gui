// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startMonerod: (args) => {
    ipcRenderer.invoke('start-monerod', args);
  },
  onMoneroStdout: (callback) => {
    ipcRenderer.on('monero-stdout', callback);
  },
  onMoneroClose: (callback) => {
    ipcRenderer.on('monero-close', callback);
  },
  getMoneroVersion: () => {
    ipcRenderer.invoke('get-monero-version');
  },
  onMoneroVersion: (callback) => {
    ipcRenderer.on('monero-version', callback);
  },
  onMoneroVersionError: (callback) => {
    ipcRenderer.on('monero-version-error', callback);
  }
});
