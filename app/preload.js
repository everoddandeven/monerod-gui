// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBatteryLevel: () => {
    ipcRenderer.invoke('get-battery-level');
  },
  onGetBatteryLevel: (callback) => {
    ipcRenderer.on('on-get-battery-level', callback);
  },
  isOnBatteryPower: () => {
    ipcRenderer.invoke('is-on-battery-power');
  },
  onIsOnBatteryPower: (callback) => {
    ipcRenderer.on('on-is-on-battery-power', callback);
  },
  unregisterOnIsOnBatteryPower: () => {
    ipcRenderer.removeAllListeners('on-is-on-battery-power');
  },
  onAc: (callback) => {
    ipcRenderer.on('on-ac', callback);
  },
  onBattery: (callback) => {
    ipcRenderer.on('on-battery', callback);
  },
  unregisterOnGetBatteryLevel: () => {
    ipcRenderer.removeAllListeners('on-get-battery-level');
  },
  copyToClipboard: (content) => {
    ipcRenderer.invoke('copy-to-clipboard', content);
  },
  onTrayStartDaemon: (callback) => {
    ipcRenderer.on('on-tray-start-daemon', callback);
  },
  onTrayStopDaemon: (callback) => {
    ipcRenderer.on('on-tray-stop-daemon', callback);
  },
  onTrayQuitDaemon: (callback) => {
    ipcRenderer.on('on-tray-quit-daemon', callback);
  },
  onTrayStartSync: (callback) => {
    ipcRenderer.on('on-tray-start-sync', callback);
  },
  onTrayStopSync: (callback) => {
    ipcRenderer.on('on-tray-stop-sync', callback);
  },
  setTrayItemEnabled: (id, enabled) => {
    ipcRenderer.invoke('set-tray-item-enabled', id, enabled);
  },
  setTrayToolTip: (toolTip) => {
    ipcRenderer.invoke('set-tray-tool-tip', toolTip);
  },
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
  unregisterOnMonitorMonerod: () => {
    ipcRenderer.removeAllListeners('on-monitor-monerod');
  },
  unregisterOnMonitorMonerodError: () => {
    ipcRenderer.removeAllListeners('on-monitor-monerod-error');
  },
  unsubscribeOnMonerodStarted: () => {
    ipcRenderer.removeAllListeners('monerod-started');
  },
  onMoneroStdout: (callback) => {
    ipcRenderer.on('monero-stdout', callback);
  },
  onMoneroClose: (callback) => {
    ipcRenderer.on('monero-close', callback);
  },
  unregisterOnMoneroStdout: () => {
    ipcRenderer.removeAllListeners('monero-stdout');
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
  unregisterOnMoneroVersion: () => {
    ipcRenderer.removeAllListeners('on-monero-version');
  },
  unregisterOnMoneroVersionError: () => {
    ipcRenderer.removeAllListeners('unregister-on-monero-version-error');
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
  readFile: (filePath) => {
    ipcRenderer.invoke('read-file', filePath);
  },
  onReadFile: (callback) => {
    ipcRenderer.on('on-read-file', callback);
  },
  onReadFileError: (callback) => {
    ipcRenderer.on('on-read-file-error', callback);
  },
  unregisterOnReadFile: () => {
    ipcRenderer.removeAllListeners('on-read-file');
    ipcRenderer.removeAllListeners('on-read-file-error');
  },
  unregisterOnSelectedFolder: () => {
    ipcRenderer.removeAllListeners('selected-folder');
  },
  saveFile: (defaultPath, content) => {
    ipcRenderer.invoke('save-file', defaultPath, content);
  },
  onSaveFileError: (callback) => {
    ipcRenderer.on('on-save-file-error', callback);
  },
  onSaveFile: (callback) => {
    ipcRenderer.on('on-save-file', callback);
  },
  unregisterOnSaveFile: () => {
    ipcRenderer.removeAllListeners('on-save-file-error');
    ipcRenderer.removeAllListeners('on-save-file');
  },
  selectFile: (extensions = undefined) => {
    ipcRenderer.invoke('select-file', extensions);
  },
  onSelectedFile: (callback) => {
    ipcRenderer.on('selected-file', callback);
  },
  unregisterOnSelectedFile: () => {
    ipcRenderer.removeAllListeners('selected-file');
  },
  isWifiConnected: () => {
    ipcRenderer.invoke('is-wifi-connected');
  },
  onIsWifiConnectedResponse: (callback) => {
    ipcRenderer.on('is-wifi-connected-result', callback);
  },
  unregisterOnIsWifiConnectedResponse: () => {
    ipcRenderer.removeAllListeners('is-wifi-connected-result');
  },
  getPath: (path) => {
    ipcRenderer.invoke('get-path', path);
  },
  onGetPath: (callback) => {
    ipcRenderer.on('on-get-path', callback);
  },
  unregisterOnGetPath: () => {
    ipcRenderer.removeAllListeners('on-get-path');
  },
  getOsType: () => {
    ipcRenderer.invoke('get-os-type');
  },
  gotOsType: (callback) => {
    ipcRenderer.on('got-os-type', callback);
  },
  unregisterGotOsType: () => {
    ipcRenderer.removeAllListeners('got-os-type');
  },

  showNotification: (options) => {
    ipcRenderer.invoke('show-notification', options);
  },
  quit: () => {
    ipcRenderer.invoke('quit');
  },
  enableAutoLaunch: (minimized) => {
    ipcRenderer.invoke('enable-auto-launch', minimized);
  },
  isAutoLaunchEnabled: () => {
    ipcRenderer.invoke('is-auto-launch-enabled');
  },
  onIsAutoLaunchEnabled: (callback) => {
    ipcRenderer.on('on-is-auto-launch-enabled', callback);
  },
  unregisterOnIsAutoLaunchEnabled: () => {
    ipcRenderer.removeAllListeners('on-is-auto-launch-enabled');
  },
  onEnableAutoLaunchError: (callback) => {
    ipcRenderer.on('on-enable-auto-launch-error', callback);
  },
  onEnableAutoLaunchSuccess: (callback) => {
    ipcRenderer.on('on-enable-auto-launch-success', callback);
  },
  unregisterOnEnableAutoLaunchError: () => {
    ipcRenderer.removeAllListeners('on-enable-auto-launch-error');
  },
  unregisterOnEnableAutoLaunchSuccess: () => {
    ipcRenderer.removeAllListeners('on-enable-auto-launch-success')
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
  unregisterOnDisableAutoLaunchError: () => {
    ipcRenderer.removeAllListeners('on-disable-auto-launch-error');
  },
  unregisterOnDisableAutoLaunchSuccess: () => {
    ipcRenderer.removeAllListeners('on-disable-auto-launch-success')
  },
  isAppImage: () => {
    ipcRenderer.invoke('is-app-image');
  },
  onIsAppImage: (callback) => {
    ipcRenderer.on('on-is-app-image', callback);
  },
  unregisterOnIsAppImage: () => {
    ipcRenderer.removeAllListeners('on-is-app-image');
  },
  isAutoLaunched: () => {
    ipcRenderer.invoke('is-auto-launched');
  },
  onIsAutoLaunched: (callback) => {
    ipcRenderer.on('on-is-auto-launched', callback);
  },
  unregisterOnIsAutoLaunched: () => {
    ipcRenderer.removeAllListeners('on-is-auto-launched');
  }
});
