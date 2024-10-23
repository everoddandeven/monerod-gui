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
  monitorMonerod: () => {
    ipcRenderer.invoke('monitor-monerod');
  },
  onMonitorMonerod: (callback) => {
    ipcRenderer.on('on-monitor-monerod', callback);
  },
  onMonitorMonerodError: (callback) => {
    ipcRenderer.on('on-monitor-monerod-error', callback);
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
  checkValidMonerodPath: (path) => {
    ipcRenderer.invoke('check-valid-monerod-path', path);
  },
  onCheckValidMonerodPath: (callback) => {
    ipcRenderer.on('on-check-valid-monerod-path', callback);
  },
  selectFolder: () => {
    ipcRenderer.invoke('select-folder')
  },
  onSelectedFolder: (callback) => {
    ipcRenderer.on('selected-folder', callback);
  },
  selectFile: (extensions = undefined) => {
    ipcRenderer.invoke('select-file', extensions);
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
  showNotification: (options) => {
    ipcRenderer.invoke('show-notification', options);
  },
  quit: () => {
    ipcRenderer.invoke('quit');
  },
  enableAutoLaunch: () => {
    ipcRenderer.invoke('enable-auto-launch');
  },
  isAutoLaunchEnabled: () => {
    ipcRenderer.invoke('is-auto-launch-enabled');
  },
  onIsAutoLaunchEnabled: (callback) => {
    ipcRenderer.on('on-is-auto-launch-enabled', callback);
  },
  onEnableAutoLaunchError: (callback) => {
    ipcRenderer.on('on-enable-auto-launch-error', callback);
  },
  onEnableAutoLaunchSuccess: (callback) => {
    ipcRenderer.on('on-enable-auto-launch-success', callback);
  },
  disableAutoLaunch: () => {
    ipcRenderer.invoke('disable-auto-launch');
  },
  onDisableAutoLaunchError: (callback) => {
    ipcRenderer.on('on-disable-auto-launch-error', callback);
  },
  onDisableAutoLaunchSuccess: (callback) => {
    ipcRenderer.on('on-disable-auto-launch-success', callback);
  },
  isAppImage: () => {
    ipcRenderer.invoke('is-app-image');
  },
  onIsAppImage: (callback) => {
    ipcRenderer.on('on-is-app-image', callback);
  },
  isAutoLaunched: () => {
    ipcRenderer.invoke('is-auto-launched');
  },
  onIsAutoLaunched: (callback) => {
    ipcRenderer.on('on-is-auto-launched', callback);
  }
});
