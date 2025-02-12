// preload.js
const { contextBridge, ipcRenderer } = require('electron');

function newId() {
  return parseInt(`${Math.random()*1000}`);
}

contextBridge.exposeInMainWorld('electronAPI', {
  detectInstallation: (program, callback) => {
    const eventId = `on-detect-installation-${newId()}`;

    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('detect-installation', { eventId, program });
  },
  checkValidI2pdPath: (path, callback) => {
    const eventId = `on-check-valid-i2pd-path-${newId()}`;

    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('check-valid-i2pd-path', { eventId, path });
  },
  startI2pd: (path, callback) => {
    const eventId = `on-start-i2pd-${newId()}`;
    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('start-i2pd', { eventId, path });
  },
  stopI2pd: (callback) => {
    const eventId = `on-stop-i2pd-${newId()}`;
    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('stop-i2pd', { eventId });
  },
  onI2pdOutput: (callback) => {
    ipcRenderer.removeAllListeners('on-ip2d-stdout');
    ipcRenderer.removeAllListeners('on-ip2d-stderr');

    const handlerStdOut = (event, stdout) => {
      callback({ stdout });
    };

    const handlerStdErr = (event, stderr) => {
      callback({ stderr });
    };
    
    ipcRenderer.on('on-ip2d-stderr', handlerStdErr)
    ipcRenderer.on('on-ip2d-stdout', handlerStdOut);
  },
  httpPost: (params, callback) => {
    const { id } = params;
    
    if (!id) throw new Error("Invalid params");
    const eventId = `on-http-post-result-${id}`;

    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('http-post', params);
  },
  httpGet: (params, callback) => {
    const { id } = params;
    
    if (!id) throw new Error("Invalid params");
    const eventId = `on-http-get-result-${id}`;

    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('http-get', params);
  },
  getBatteryLevel: (callback) => {
    const eventId = `on-get-battery-level-${newId()}`;
    const handler = (event, result) => {
      callback(result);
    };
    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('get-battery-level', { eventId });
  },
  isOnBatteryPower: (callback) => {
    //const eventId = `on-is-on-battery-power-${newId()}`;
    const eventId = 'on-is-on-battery-power';
    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('is-on-battery-power', { eventId });
  },
  onAc: (callback) => {
    ipcRenderer.on('on-ac', callback);
  },
  onBattery: (callback) => {
    ipcRenderer.on('on-battery', callback);
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
  stopMonerod: () => {
    ipcRenderer.invoke('stop-monerod');
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
    ipcRenderer.removeAllListeners('monero-version');
  },
  unregisterOnMoneroVersionError: () => {
    ipcRenderer.removeAllListeners('monero-version-error');
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
  unregisterOnCheckValidMonerodPath: () => {
    ipcRenderer.removeAllListeners('on-check-valid-monerod-path');
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
  quit: (callback) => {
    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once('on-quit', handler);
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
  isPortable: () => {
    ipcRenderer.invoke('is-portable');
  },
  onIsPortable: (callback) => {
    ipcRenderer.on('on-is-portable', callback);
  },
  unregisterIsPortable: () => {
    ipcRenderer.removeAllListeners('on-is-portable');
  },
  isAutoLaunched: () => {
    ipcRenderer.invoke('is-auto-launched');
  },
  onIsAutoLaunched: (callback) => {
    ipcRenderer.on('on-is-auto-launched', callback);
  },
  unregisterOnIsAutoLaunched: () => {
    ipcRenderer.removeAllListeners('on-is-auto-launched');
  },
  downloadFile: (url, destination) => {
    ipcRenderer.invoke('download-file', url, destination);
  },
  onDownloadFileProgress: (callback) => {
    ipcRenderer.on('download-file-progress', callback);
  },
  onDownloadFileError: (callback) => {
    ipcRenderer.on('download-file-error', callback);
  },
  onDownloadFileComplete: (callback) => {
    ipcRenderer.on('download-file-complete', callback);
  },
  unregisterOnDownloadFile: () => {
    ipcRenderer.removeAllListeners('download-file-progress');
    ipcRenderer.removeAllListeners('download-file-error');
    ipcRenderer.removeAllListeners('download-file-complete');
  },
  showErrorBox: (title, content) => {
    ipcRenderer.invoke('show-error-box', title, content);
  }
});
