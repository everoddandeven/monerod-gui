import { app, BrowserWindow, ipcMain, screen, dialog, Tray, Menu, MenuItemConstructorOptions, 
  IpcMainInvokeEvent, Notification, NotificationConstructorOptions, clipboard, powerMonitor,
  WebContents,
  HandlerDetails,
  Event,
  WebContentsWillNavigateEventParams
} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import axios, { AxiosRequestConfig } from 'axios';
import { AppMainProcess, I2pdProcess, MonerodProcess, PrivateTestnet } from './process';
import { BatteryUtils, FileUtils, NetworkUtils } from './utils';

app.setName('Monero Daemon');

if (process.platform === 'win32')
{
  app.setAppUserModelId(app.name);
}

let win: BrowserWindow | null = null;
let isHidden: boolean = false;
let isQuitting: boolean = false;
const separator: string = os.platform() == 'win32' ? '\\' : '/';
const appApp = `${separator}app${separator}app`;
const appSrc = `${separator}app${separator}src`;
const _app = `${separator}app`;
const _src = `${separator}src`;
const dirname = (__dirname.endsWith(appApp) ? __dirname.replace(appApp, appSrc) : __dirname.endsWith(_app) ? __dirname.replace(_app, _src) : __dirname);

console.log('dirname: ' + dirname);

//let monerodProcess: ChildProcessWithoutNullStreams | null = null;
let monerodProcess: MonerodProcess | null = null;

const iconRelPath: string = 'assets/icons/monero-symbol-on-white-480.png';
//const wdwIcon = `${dirname}/${iconRelPath}`;
const wdwIcon = path.join(dirname, iconRelPath);

let tray: Tray;
let trayMenu: Menu;

// #region Window

function updateTrayMenu(): void {
  tray.setContextMenu(trayMenu); 
}

function setTrayItemEnabled(id: string, enabled: boolean): void {
  const item = trayMenu.getMenuItemById(id);

  if (!item) {
    throw new Error(`Item not found: ${id}`);
  }

  item.enabled = enabled;

  updateTrayMenu();
}

function createTrayMenuTemplate(): MenuItemConstructorOptions[] {
  return [
    {
      id: "startDaemon",
      label: "Start",
      toolTip: "Start Daemon",
      click: () => {
        win?.webContents.send('on-tray-start-daemon');
      }
    },
    {
      id: "stopDaemon",
      label: "Stop",
      toolTip: "Stop Daemon",
      click: () => {
        win?.webContents.send('on-tray-stop-daemon');
      }
    },
    {
      id: "startSync",
      label: "Start Sync",
      toolTip: "Start Daemon Sync",
      click: () => {
        win?.webContents.send('on-tray-start-sync');
      }
    },
    {
      id: "stopSync",
      label: "Stop Sync",
      toolTip: "Stop Daemon Sync",
      click: () => {
        win?.webContents.send('on-tray-stop-sync');
      }
    },
    {
      id: "quitDaemon",
      label: "Quit",
      toolTip: "Quit Daemon",
      click: () => {
        win?.webContents.send('on-tray-quit-daemon');
      }
    }
  ]
}

function createTray(): Tray {
  const trayMenuTemplate = createTrayMenuTemplate();
  const tray = new Tray(wdwIcon);
  trayMenu = Menu.buildFromTemplate(trayMenuTemplate);

  tray.setToolTip('Monero Daemon');
  tray.setContextMenu(trayMenu);

  tray.on('click', (event) => {
    if (isHidden) {
      win?.show();
      isHidden = false;
    }
    else
    {
      win?.hide();
      isHidden = true;
    }
  });

  return tray;
}

async function createWindow(): Promise<BrowserWindow> {
  const size = screen.getPrimaryDisplay().workAreaSize;
  
  tray = createTray();

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      allowRunningInsecureContent: (AppMainProcess.serve),
      contextIsolation: true,
      devTools: !app.isPackaged,
      sandbox: true,
      defaultFontSize: process.platform == 'win32' ? 12 : 16,
      defaultMonospaceFontSize: process.platform == 'win32' ? 11 : 13
    },
    show: false,
    autoHideMenuBar: true,
    icon: wdwIcon
  });

  isHidden = AppMainProcess.startMinized;

  if (!app.isPackaged) win.webContents.openDevTools();

  if (AppMainProcess.serve) {
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(dirname, '../dist/index.html'))) {
       // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', dirname, pathIndex));
    console.log(`Main window url: ${url}`);

    await win.loadURL(url.href);
  }

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win?.hide();
      isHidden = true;
      //event.returnValue = false;
    }

    return false;
  });

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

const createSplashWindow = async (): Promise<BrowserWindow | undefined> => {  
  console.log("createSplashWindow()");

  const window = new BrowserWindow({
    width: 480,
    height: 480,
    transparent: true, 
    frame: false, 
    alwaysOnTop: true,
    show: false,
    icon: wdwIcon,
    minimizable: false,
    maximizable: false,
    fullscreen: false,
    fullscreenable: false,
    movable: false,
    resizable: false,
    closable: true,
    center: true
  });

  // Path when running electron executable
  let pathIndex = './splash.html';

  if (fs.existsSync(path.join(dirname, '../dist/splash.html'))) {
      // Path when running electron in local folder
    pathIndex = '../dist/splash.html';
  }

  if (!fs.existsSync(path.join(dirname, pathIndex))) {
    console.error("createSplashScreen(): path doesn't exists: " + path.join(dirname, pathIndex));
    window.close();
    return undefined;
  }

  const indexPath = path.join('file:', dirname, pathIndex);

  const url = new URL(indexPath);

  await window.loadURL(url.href);

  await new Promise<void>((resolve) => {
    setTimeout(() => {
      window.show();
      resolve();
    }, 400);
  });

  return window;
}

// #endregion

// #region WiFi 

async function isWifiConnected() {
  let connected: boolean = false;

  try {
    connected = await NetworkUtils.isConnectedToWiFi();
  }
  catch (error: any) {
    console.error(error);
    connected = false;
  }

  win?.webContents.send('is-wifi-connected-result', connected);
}

// #endregion

// #region monerod 

async function getMonerodVersion(monerodFilePath: string): Promise<void> {
  const proc = new MonerodProcess({
    monerodCmd: monerodFilePath,
    isExe: true
  });

  try {
    console.log("Before proc.getVersion()");
    const version = await proc.getVersion();
    console.log("After proc.getVersion()");
    win?.webContents.send('monero-version', version);
  }
  catch(error: any) {
    const err = (error instanceof Error) ? error.message : `${error}`;
    win?.webContents.send('monero-version-error', err);
  }
}

async function checkValidMonerodPath(monerodPath: string): Promise<void> {
  const valid = await MonerodProcess.isValidMonerodPath(monerodPath);
  
  win?.webContents.send('on-check-valid-monerod-path', valid);
}

async function startMoneroDaemon(commandOptions: string[]): Promise<void> {
  const monerodPath = commandOptions.shift();

  if (!monerodPath) {
    const error = `Invalid monerod path provided: ${monerodPath}`;
    win?.webContents.send('monero-stderr', error);
    throw new Error("Invalid monerod path provided");
  }

  if (monerodProcess != null) {
    const error: string = 'Monero daemon already started';
    win?.webContents.send('monero-stderr', error);
    throw new Error("Monerod already started");
  }

  let monerodProc: MonerodProcess;
  const privnet: boolean = commandOptions.includes('--privnet');

  if (privnet) {
    PrivateTestnet.init(monerodPath);
    monerodProc = PrivateTestnet.node2 as MonerodProcess;    
  }
  else {
    commandOptions.push('--non-interactive');
    monerodProc = new MonerodProcess({
      monerodCmd: monerodPath,
      flags: commandOptions,
      isExe: true
    });

  }

  monerodProc.onStdOut((data) => {
    win?.webContents.send('monero-stdout', `${data}`);
  });

  monerodProc.onStdErr((data) => {
    win?.webContents.send('monero-stderr', `${data}`);
  });

  monerodProc.onError((err: Error) => {
    win?.webContents.send('monero-stderr', `${err.message}`);
  });

  monerodProc.onClose((_code: number | null) => {
    const code = _code != null ? _code : -Number.MAX_SAFE_INTEGER;
    const msg = `Process monerod ${monerodProc.pid} exited with code: ${code}`;
    console.log(msg);
    win?.webContents.send('monero-stdout', msg);
    win?.webContents.send('monero-close', code);
    monerodProcess = null;
  });

  monerodProcess = null;
  monerodProcess = monerodProc;

  try {
    if (privnet) await PrivateTestnet.start();
    else await monerodProcess.start();
    win?.webContents.send('monerod-started', true);
  }
  catch(error: any) {
    console.error(error);
    win?.webContents.send('monero-stderr', `${error}`);
    win?.webContents.send('monerod-started', false);
    monerodProcess = null;
  }
}

async function monitorMonerod(): Promise<void> {
  if (!monerodProcess) {
    win?.webContents.send('on-monitor-monerod-error', 'Monerod not running');
    return;
  }

  try {
    const stats = await monerodProcess.getStats();
    win?.webContents.send('on-monitor-monerod', stats);
  }
  catch(error: any) {
    let message: string;

    if (error instanceof Error) {
      message = error.message;
    }
    else {
      message = `${error}`;
    }

    win?.webContents.send('on-monitor-monerod-error', message);
  }
}

// #endregion

// #region Download Utils 

async function downloadAndVerifyHash(hashUrl: string, fileName: string, filePath: string): Promise<boolean> {
  const hashFileName = await FileUtils.downloadFile(hashUrl, app.getPath('temp'), () => {});
  const hashFilePath = `${app.getPath('temp')}/${hashFileName}`;

  const hashContent = fs.readFileSync(hashFilePath, 'utf8');
  const hashLines = hashContent.split('\n');
  let expectedHash: string | null = null;

  for (const line of hashLines) {
    const match = line.match(/^(\w+)\s+(\S+)/);
    if (match && match[2] === fileName) {
      expectedHash = match[1];
      break;
    }
  }

  if (!expectedHash) {
    throw new Error('Hash not found for the downloaded file.');
  }

  // Verifica l'hash del file scaricato
  return await FileUtils.checkFileHash(`${filePath}/${fileName}`, expectedHash);
};

// Funzione per verificare l'hash del file

// #endregion

function showNotification(options?: NotificationConstructorOptions): void {
  if (!options) {
    return;
  }

  if (!options.icon) {
    options.icon = wdwIcon;
  }
  
  new Notification(options).show();
}

function showSecurityWarning(msg: string): void {
  if (win) {
    dialog.showMessageBoxSync(win, {
      type: 'warning',
      title: 'Security Warning',
      message: msg
    });
  }
  else {
    dialog.showErrorBox('Security Warning', msg);
  }

  console.warn(msg);
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => {
    Menu.setApplicationMenu(null);
    const gotInstanceLock = app.requestSingleInstanceLock();

    if (!gotInstanceLock) {
      dialog.showErrorBox('', 'Another instance of Monerod GUI is running');
      app.quit();
      return;
    }

    setTimeout(async () => {
      const splash = await createSplashWindow();
      await createWindow();

      await new Promise<void>((resolve, reject) => {
        try {
          setTimeout(() => {
            if (splash) splash.close();
            if (!AppMainProcess.startMinized) { 
              win?.show();
              win?.maximize();
            }
            resolve();
          }, 2600);
        }
        catch(error: any) {
          reject(error);
        }
      });
    }, 400);
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', async () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      await createWindow();
    }
  });

  app.on('before-quit', () => {
    isQuitting = true;
    win?.webContents.send('on-quit', undefined);
  });

  // #region Security 

  app.on('web-contents-created', (event, webContents: WebContents) => {
    webContents.setWindowOpenHandler((details: HandlerDetails) => {
      const msg = `Prevented unsafe content: ${details.url}`;
      showSecurityWarning(msg);      
      console.warn(details);

      return { action: 'deny' };
    });

    webContents.on('will-navigate', (event: Event<WebContentsWillNavigateEventParams>, navigationUrl: string) => {
      event.preventDefault();
      const msg = `Prevented unsage window navigation to ${navigationUrl}`;
      showSecurityWarning(msg);
    });
  });

  // #endregion

  ipcMain.handle('is-on-battery-power', async (event: IpcMainInvokeEvent, params: { eventId: string; }) => {
    const onBattery = await BatteryUtils.isOnBatteryPower();
    win?.webContents.send(params.eventId, onBattery);
  });

  powerMonitor.on('on-ac', () => win?.webContents.send('on-ac'));
  powerMonitor.on('on-battery', () => win?.webContents.send('on-battery'));

  ipcMain.handle('is-auto-launched', (event: IpcMainInvokeEvent) => {    
    win?.webContents.send('on-is-auto-launched', AppMainProcess.autoLaunched);
  });

  ipcMain.handle('quit', async (event: IpcMainInvokeEvent) => {
    if (isQuitting) {
      console.warn("Already quitting");
      return;
    }

    isQuitting = true;

    try {
      if (monerodProcess && monerodProcess.running) {
        if (PrivateTestnet.started) {
          await PrivateTestnet.stop();
        }
        else await monerodProcess.stop();
        monerodProcess = null;
      }
    }
    catch (error: any) {
      console.error("An error occured while stopping monerod on quit handler", error);
      win?.webContents.send('on-quit', `${error}`);
      return;
    }

    try {
      tray.destroy();
      win?.close();
      win?.destroy();
      app.quit();
    }
    catch(error: any) {
      console.error("An error occurred on quit handler: ", error);
      win?.webContents.send('on-quit', `${error}`);
    }
  });

  ipcMain.handle('start-monerod', (event: IpcMainInvokeEvent, configFilePath: string[]) => {
    startMoneroDaemon(configFilePath);
  });

  ipcMain.handle('stop-monerod', async (event: IpcMainInvokeEvent) => {
    let stopped: boolean = false;
    console.log("ipcMain.handler('stop-monerod')");

    if (monerodProcess) {
      if (PrivateTestnet.started) {
        console.log("ipcMain.handler('stop-monerod'): stopping private testnet");
        await PrivateTestnet.stop();
        console.log("ipcMain.handler('stop-monerod'): private testnet stopped");
      }
      else {
        console.log("ipcMain.handler('stop-monerod'): stopping monerod process");
        await monerodProcess.stop();
        console.log("ipcMain.handler('stop-monerod'): monerod process stopped");
      }
      
      stopped = true;
      monerodProcess = null;
    }

    win?.webContents.send('monero-close', 0);
  });

  ipcMain.handle('get-monero-version', (event: IpcMainInvokeEvent, configFilePath: string) => {
    getMonerodVersion(configFilePath);
  });

  // Gestione IPC
  ipcMain.handle('download-monerod', async (event: IpcMainInvokeEvent, downloadUrl: string, destination: string) => {
    try {
      //const fileName = path.basename(downloadUrl);
      //const filePath = path.join(destination, fileName);
      const hashUrl = 'https://www.getmonero.org/downloads/hashes.txt';

      // Inizializza il progresso
      event.sender.send('download-progress', { progress: 0, status: 'Starting download' });
      
      win?.setProgressBar(0, {
        mode: 'normal'
      });

      // Scarica il file Monero
      const fileName = await FileUtils.downloadFile(downloadUrl, destination, (progress) => {
        win?.setProgressBar(progress, {
          mode: 'normal'
        });

        event.sender.send('download-progress', { progress, status: 'Downloading' });
      });

      // Scarica e verifica l'hash
      event.sender.send('download-progress', { progress: 100, status: 'Verifying hash' });
      win?.setProgressBar(100, {
        mode: 'indeterminate'
      });

      await downloadAndVerifyHash(hashUrl, fileName, destination);

      // Estrai il file
      const fPath = `${destination}/${fileName}`;
      event.sender.send('download-progress', { progress: 100, status: 'Extracting' });
      const extractedDir = await FileUtils.extract(fPath, destination);

      event.sender.send('download-progress', { progress: 100, status: 'Download and extraction completed successfully' });
      event.sender.send('download-progress', { progress: 200, status: os.platform() == 'win32' ? extractedDir : `${destination}/${extractedDir}` });

      win?.setProgressBar(100, {
        mode: 'none'
      });
      
    } catch (error) {
      event.sender.send('download-progress', { progress: 0, status: `${error}` });
      win?.setProgressBar(0, {
        mode: 'error'
      });
    }
  });

  ipcMain.handle('download-file', async (event: IpcMainInvokeEvent, url: string, destination: string) => {
    try {
      event.sender.send('download-file-progress', { progress: 0, status: 'Starting download' });

      const fileName = await FileUtils.downloadFile(url, destination, (progress) => {
        win?.setProgressBar(progress, {
          mode: 'normal'
        });
  
        event.sender.send('download-file-progress', { progress, status: 'Downloading' });
      });
      
      win?.setProgressBar(0, {
        mode: 'none'
      });
      
      event.sender.send('download-file-complete', `${destination}${separator}${fileName}`);
    }
    catch(error: any) {
      console.error(error);
      event.sender.send('download-file-error', `${error}`);
    }
  });

  ipcMain.handle('read-file', (event: IpcMainInvokeEvent, filePath: string) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err != null) {
        win?.webContents.send('on-read-file-error', `${err}`);
        return;
      }

      win?.webContents.send('on-read-file', data);
    });
  });

  ipcMain.handle('save-file', async (event: IpcMainInvokeEvent, defaultPath: string, content: string) => {
    if (!win) {
      return;
    }

    const result = await dialog.showSaveDialog(win, {
      title: 'Save File',
      defaultPath: defaultPath,
      properties: [
        'showOverwriteConfirmation'
      ]
    });

    if (result.canceled) {
      win.webContents.send('on-save-file', '');
      return;
    }
    try {
      fs.writeFileSync(result.filePath, content);

      win.webContents.send('on-save-file', result.filePath);
    }
    catch(error: any) {
      win.webContents.send('on-save-file-error', `${error}`);
    }
  });

  ipcMain.handle('select-file', async (event: IpcMainInvokeEvent, extensions?: string[]) => {
    if (!win) 
    {
      return;
    }

    const result = await dialog.showOpenDialog(win, {
      title: 'Select File',
      filters: extensions ? [{
        name: 'filter',
        extensions: extensions
      }] : [],
      properties: ['openFile']
    });

    const path = result.canceled ? null : result.filePaths[0];

    win.webContents.send('selected-file', path ? `${path}` : '');
  });
  
  ipcMain.handle('select-folder', async (event: IpcMainInvokeEvent) => {
    if (!win) {
      return;
    }

    const result = await dialog.showOpenDialog(win, {
      title: 'Select Folder',
      properties: ['openDirectory'],  // Specifica che vogliamo solo cartelle
    });

    const path = result.canceled ? null : result.filePaths[0];

    win.webContents.send('selected-folder', path ? `${path}` : '');
  });

  ipcMain.handle('get-path', (event: IpcMainInvokeEvent, path: 'home' | 'appData' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'recent' | 'logs' | 'crashDumps') => {
    win?.webContents.send('on-get-path', app.getPath(path));
  });

  ipcMain.handle('is-wifi-connected', async (event: IpcMainInvokeEvent) => {
    isWifiConnected();
  });

  ipcMain.handle('get-os-type', (event: IpcMainInvokeEvent) => {
    win?.webContents.send('got-os-type', { platform: os.platform(), arch: os.arch() });
  })

  ipcMain.handle('monitor-monerod', (event: IpcMainInvokeEvent) => {
    monitorMonerod();
  });

  ipcMain.handle('check-valid-monerod-path', (event: IpcMainInvokeEvent, path: string) => {
    checkValidMonerodPath(path);
  });

  ipcMain.handle('check-valid-i2pd-path', async (event: IpcMainInvokeEvent, params: { eventId: string, path: string }) => {
    const { eventId, path } = params;
    win?.webContents.send(eventId, await I2pdProcess.isValidPath(path));
  });

  ipcMain.handle('show-notification', (event: IpcMainInvokeEvent, options?: NotificationConstructorOptions) => {
    showNotification(options);
  });

  // #region Auto Launch 

  ipcMain.handle('is-auto-launch-enabled', async (event: IpcMainInvokeEvent) => {    
    const enabled = await AppMainProcess.isAutoLaunchEnabled();
    win?.webContents.send('on-is-auto-launch-enabled', enabled);
  });

  ipcMain.handle('enable-auto-launch', async (event: IpcMainInvokeEvent, minimized: boolean) => {
    try {
      await AppMainProcess.enableAutoLaunch(minimized);
      win?.webContents.send('on-enable-auto-launch-success');
    }
    catch(error: any) {
      const err = (error instanceof Error) ? error.message : `${error}`;

      win?.webContents.send('on-enable-auto-launch-error', err);
    }
  });

  ipcMain.handle('get-battery-level', async (event: IpcMainInvokeEvent, params: { eventId: string; }) => {
    win?.webContents.send(params.eventId, await BatteryUtils.getLevel());
  });

  ipcMain.handle('disable-auto-launch', async (event: IpcMainInvokeEvent) => {
    try {
      await AppMainProcess.disableAutoLaunch();
      win?.webContents.send('on-disable-auto-launch-success');
    }
    catch(error: any) {
      const err = (error instanceof Error) ? error.message : `${error}`;
      win?.webContents.send('on-disable-auto-launch-error', err);
    }
  });

  // #endregion

  ipcMain.handle('show-error-box', (event: IpcMainInvokeEvent, title: string, content: string) => {
    if (win) {
      dialog.showMessageBoxSync(win, {
        message: content,
        type: 'error',
        title: title != '' ? title : 'Error'
      });
      return;
    }
    dialog.showErrorBox(title, content);
  });

  ipcMain.handle('set-tray-item-enabled', (event: IpcMainInvokeEvent, id: string, enabled: boolean) => {
    setTrayItemEnabled(id, enabled);
  });

  ipcMain.handle('set-tray-tool-tip', (event: IpcMainInvokeEvent, toolTip: string) => {
    tray.setToolTip(toolTip);
  });

  ipcMain.handle('is-portable', (event: IpcMainInvokeEvent) => {
    win?.webContents.send('on-is-portable', AppMainProcess.isPortable);
  });

  ipcMain.handle('copy-to-clipboard', (event: IpcMainInvokeEvent, content: string) => {
    clipboard.writeText(content, "selection");
  });

  ipcMain.handle('http-post', async (event: IpcMainInvokeEvent, params: { id: string; url: string; data?: any; config?: AxiosRequestConfig<any> }) => {
    const { id, url, data, config } = params;
    const eventId = `on-http-post-result-${id}`;
    try {
      const result = await axios.post(url, data, config);
      win?.webContents.send(eventId, { data: result.data, code: result.status, status: result.statusText });
    }
    catch (error: any) {
      console.error("post(): ", error);
      win?.webContents.send(eventId, { error: `${error}` });
    }

  });

  ipcMain.handle('http-get', async (event: IpcMainInvokeEvent, params: { id: string; url: string; config?: AxiosRequestConfig<any> }) => {
    const { id, url, config } = params;
    const eventId = `on-http-get-result-${id}`;
    try {
      const result = await axios.get(url, config);
      
      win?.webContents.send(eventId, { data: result.data, code: result.status, status: result.statusText });
    }
    catch (error: any) {
      console.error("get(): ", error);
      win?.webContents.send(eventId, { error: `${error}` });
    }

  });

} catch (e: any) {
  // Catch Error
  console.error(e);

  dialog.showErrorBox('', `${e}`);

  app.quit();
}

