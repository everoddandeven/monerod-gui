// preload.js
const { contextBridge, ipcRenderer } = require('electron');
//const os = require('os');

contextBridge.exposeInMainWorld('electronAPI', {
  startMonerod: (args) => {
    ipcRenderer.invoke('start-monerod', args);
  },
  onMonerodStarted: (callback) => {
    ipcRenderer.on('monerod-started', callback);
  },
  unsubscribeOnMonerodStarted: () => {
    const listeners = ipcRenderer.listeners('monerod-started');
    
    listeners.forEach((listener) => {
      ipcRenderer.removeListener('monerod-started', listener);
    });
  },
  onMoneroStdout: (callback) => {
    ipcRenderer.on('monero-stdout', callback);
  },
  onMoneroClose: (callback) => {
    ipcRenderer.on('monero-close', callback);
  },
  getMoneroVersion: (monerodPath) => {
    ipcRenderer.invoke('get-monero-version', monerodPath);
  },
  onMoneroVersion: (callback) => {
    ipcRenderer.on('monero-version', callback);
  },
  onMoneroVersionError: (callback) => {
    ipcRenderer.on('monero-version-error', callback);
  },
  downloadMonerod: (downloadUrl, destination) => {
    ipcRenderer.invoke('download-monerod', downloadUrl, destination);
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', callback);
  },
  selectFolder: () => {
    ipcRenderer.invoke('select-folder')
  },
  onSelectedFolder: (callback) => {
    ipcRenderer.on('selected-folder', callback);
  },
  selectFile: () => {
    ipcRenderer.invoke('select-file');
  },
  onSelectedFile: (callback) => {
    ipcRenderer.on('selected-file', callback);
  },
  isWifiConnected: () => {
    ipcRenderer.invoke('is-wifi-connected');
  },
  onIsWifiConnectedResponse: (callback) => {
    ipcRenderer.on('is-wifi-connected-result', callback);
  },
  getOsType: () => {
    ipcRenderer.invoke('get-os-type');
  },
  gotOsType: (callback) => {
    ipcRenderer.on('got-os-type', callback);
  },
  quit: () => {
    ipcRenderer.invoke('quit');
  }
});
