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
  checkValidTorPath: (path, callback) => {
    const eventId = `on-check-valid-tor-path-${newId()}`;

    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('check-valid-tor-path', { eventId, path });
  },
  getTorHostname: (callback) => {
    const eventId = `on-get-tor-hostname-${newId()}`;

    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('get-tor-hostname', { eventId });
  },
  startTor: (options, callback) => {
    const { path, port, rpcPort, allowIncomingConnections } = options;
    const eventId = `on-start-tor-${newId()}`;
    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('start-tor', { eventId, path, port, rpcPort, allowIncomingConnections });
  },
  stopTor: (callback) => {
    const eventId = `on-stop-tor-${newId()}`;
    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('stop-tor', { eventId });
  },
  onTorOutput: (callback) => {
    ipcRenderer.removeAllListeners('on-tor-stdout');
    ipcRenderer.removeAllListeners('on-tor-stderr');

    const handlerStdOut = (event, stdout) => {
      callback({ stdout });
    };

    const handlerStdErr = (event, stderr) => {
      callback({ stderr });
    };
    
    ipcRenderer.on('on-tor-stderr', handlerStdErr)
    ipcRenderer.on('on-tor-stdout', handlerStdOut);
  },
  invokeTorControlCommand: (command, callback) => {
    const eventId = `on-invoke-tor-control-command-${newId()}`;
    const handler = (event, result) => callback(result);

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('invoke-tor-control-command', { eventId, command });
  },
  getTorVersion: (torPath, callback) => {
    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once('tor-version', handler);
    ipcRenderer.invoke('get-tor-version', torPath);
  },
  checkValidI2pdPath: (path, callback) => {
    const eventId = `on-check-valid-i2pd-path-${newId()}`;

    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('check-valid-i2pd-path', { eventId, path });
  },
  startI2pd: (options, callback) => {
    const { path, port, rpcPort, outproxy, allowIncomingConnections } = options;
    const eventId = `on-start-i2pd-${newId()}`;
    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('start-i2pd', { eventId, path, port, rpcPort, outproxy, allowIncomingConnections });
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
  checkValidP2PoolPath: (path, callback) => {
    const eventId = `on-check-valid-p2pool-path-${newId()}`;

    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('check-valid-p2pool-path', { eventId, path });
  },
  startP2Pool: (options, callback) => {
    const eventId = `on-start-p2pool-${newId()}`;
    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('start-p2pool', { eventId, options });
  },
  stopP2Pool: (callback) => {
    const eventId = `on-stop-p2pool-${newId()}`;
    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('stop-p2pool', { eventId });
  },
  onP2PoolOutput: (callback) => {
    ipcRenderer.removeAllListeners('on-p2pool-stdout');
    ipcRenderer.removeAllListeners('on-p2pool-stderr');

    const handlerStdOut = (event, stdout) => {
      callback({ stdout });
    };

    const handlerStdErr = (event, stderr) => {
      callback({ stderr });
    };
    
    ipcRenderer.on('on-p2pool-stderr', handlerStdErr)
    ipcRenderer.on('on-p2pool-stdout', handlerStdOut);
  },
  onP2PoolClose: (callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.once('p2pool-close', handler);
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
    const handler = (event) => callback();
    ipcRenderer.on('on-ac', handler);
  },
  onBattery: (callback) => {
    const handler = (event) => callback();
    ipcRenderer.on('on-battery', handler);
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
  startMonerod: (args, callback) => {
    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once('monerod-started', handler);
    ipcRenderer.invoke('start-monerod', args);
  },
  stopMonerod: (callback) => {
    let handler, errorHandler;
    handler = (event, code) => {
      ipcRenderer.removeListener('on-stop-monerod-error', errorHandler);
      callback({ code });
    };
    errorHandler = (event, error) => {
      ipcRenderer.removeListener('on-stop-monerod', handler);
      callback({ error });
    };

    ipcRenderer.once('on-stop-monerod-error', errorHandler);
    ipcRenderer.once('on-stop-monerod', handler);
    ipcRenderer.invoke('stop-monerod');
  },
  monitorProcess: (process, callback) => {
    const eventId = `monitor-process-${newId()}`;

    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('monitor-process', { eventId, process });
  },
  unsubscribeOnMonerodStarted: () => {
    ipcRenderer.removeAllListeners('monerod-started');
  },
  onMonerodStdout: (callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.on('monero-stdout', handler);
  },
  onMonerodClose: (callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.on('monero-close', handler);
  },
  onI2pdClose: (callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.once('i2pd-close', handler);
  },
  onTorClose: (callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.once('tor-close', handler);
  },
  unregisterOnMoneroStdout: () => {
    ipcRenderer.removeAllListeners('monero-stdout');
  },
  getMonerodVersion: (monerodPath, callback) => {
    const handler = (event, result) => {
      callback(result);
    }

    ipcRenderer.once('monero-version', handler);
    ipcRenderer.invoke('get-monero-version', monerodPath);
  },
  downloadMonerod: (downloadUrl, destination, progress, complete, error) => {
    const progressHandler = (event, result) => progress(result);
    let errorHandler, completeHandler;

    completeHandler = (event, result) => {
      ipcRenderer.removeListener('download-monerod-progress', progressHandler);
      ipcRenderer.removeListener('download-monerod-error', errorHandler);
      complete(result);
    };

    errorHandler = (event, result) => {
      ipcRenderer.removeListener('download-monerod-progress', progressHandler);
      ipcRenderer.removeListener('download-monerod-complete', completeHandler);
      error(result);
    };

    ipcRenderer.once('download-monerod-error', errorHandler);
    ipcRenderer.once('download-monerod-complete', completeHandler);
    ipcRenderer.on('download-monerod-progress', progressHandler);
    ipcRenderer.invoke('download-monerod', downloadUrl, destination);
  },
  onDownloadProgress: (callback) => {
  },
  checkValidMonerodPath: (path, callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.once('on-check-valid-monerod-path', handler);
    ipcRenderer.invoke('check-valid-monerod-path', path);
  },
  selectFolder: (callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.once('selected-folder', handler);
    ipcRenderer.invoke('select-folder')
  },
  readFile: (filePath, callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.once('on-read-file', handler);
    ipcRenderer.invoke('read-file', filePath);
  },
  saveFile: (defaultPath, content, callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.once('on-save-file', handler);
    ipcRenderer.invoke('save-file', defaultPath, content);
  },
  selectFile: (extensions, callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.once('selected-file', handler);
    ipcRenderer.invoke('select-file', extensions);
  },
  isWifiConnected: (callback) => {
    const handler = (event, result) => callback(result);

    ipcRenderer.once('is-wifi-connected-result', handler);
    ipcRenderer.invoke('is-wifi-connected');
  },
  getPath: (path, callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.once('on-get-path', handler);
    ipcRenderer.invoke('get-path', path);
  },
  getOsType: (callback) => {
    const handler = (event, result) => {
      callback(result);
    };
    
    ipcRenderer.once('got-os-type', handler);
    ipcRenderer.invoke('get-os-type');
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
  enableAutoLaunch: (minimized, callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.once('on-enable-auto-launch', handler);
    ipcRenderer.invoke('enable-auto-launch', minimized);
  },
  isAutoLaunchEnabled: (callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.once('on-is-auto-launch-enabled', handler);
    ipcRenderer.invoke('is-auto-launch-enabled');
  },
  disableAutoLaunch: (callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.once('on-disable-auto-launch', handler);
    ipcRenderer.invoke('disable-auto-launch');
  },
  isPortable: (callback) => {
    const handler = (event, result) => {
      callback(result);
    };

    ipcRenderer.once('on-is-portable', handler);
    ipcRenderer.invoke('is-portable');
  },
  isAutoLaunched: (callback) => {
    const handler = (event, result) => callback(result);
    ipcRenderer.once('on-is-auto-launched', handler);
    ipcRenderer.invoke('is-auto-launched');
  },
  downloadFile: (url, destination, progress, complete, error) => {
    const progressHandler = (event, info) => {
      progress(info);
    };
    const completeHandler = (event, fileName) => {
      ipcRenderer.removeAllListeners('download-file-progress');
      ipcRenderer.removeAllListeners('download-file-error');
      ipcRenderer.removeAllListeners('download-file-complete');
      complete(fileName);
    };
    const errorHandler = (event, err) => {
      ipcRenderer.removeAllListeners('download-file-progress');
      ipcRenderer.removeAllListeners('download-file-error');
      ipcRenderer.removeAllListeners('download-file-complete');
      error(err);
    };

    ipcRenderer.on('download-file-progress', progressHandler);
    ipcRenderer.on('download-file-error', errorHandler);
    ipcRenderer.on('download-file-complete', completeHandler);

    ipcRenderer.invoke('download-file', url, destination);
  },
  showErrorBox: (title, content) => {
    ipcRenderer.invoke('show-error-box', title, content);
  },
  createFolder: (path, callback) => {
    const eventId = `on-start-i2pd-${newId()}`;
    
    const handler = (event, result) => {
      callback(result);
    };
    
    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('create-folder', { eventId, path });
  },
  getOsDetails: (callback) => {
    const eventId = `on-get-os-details-${newId}`;
    const handler = (event, result) => {
      callback(result);
    };
    
    ipcRenderer.once(eventId, handler);
    ipcRenderer.invoke('get-os-details', { eventId });
  }
});
