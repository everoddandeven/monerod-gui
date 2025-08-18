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
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ProcessStats, AppMainProcess, I2pdProcess, MonerodProcess, PrivateTestnet, TorControlCommand, TorProcess, MoneroI2pdProcess, P2PoolProcess } from './process';
import { BatteryUtils, FileUtils, NetworkUtils } from './utils';
const appName = 'Monero Daemon';
app.setName(appName);
app.setPath('userData', app.getPath('userData').replace(appName, 'MoneroDaemon'));

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
let i2pdProcess: I2pdProcess | null = null;
let torProcess: TorProcess | null = null;
let p2poolProcess: P2PoolProcess | null = null;

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
      defaultFontSize: process.platform == 'win32' ? 12 : 12,
      defaultMonospaceFontSize: process.platform == 'win32' ? 11 : 11
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

    const url = new URL('file:' + path.join(dirname, pathIndex));
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

async function createSplashWindow(): Promise<BrowserWindow> {

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
    window.close();
    throw new Error(`Cannot create splash window: path doesn't exists: ${path.join(dirname, pathIndex)}`);
  }

  const indexPath = 'file:' + path.join(dirname, pathIndex);
  console.log(`createSplashWindow(): loading path ` + indexPath);

  let url: URL;

  try {
    url = new URL(indexPath);
  }
  catch (error: any) {
    const err = error instanceof Error ? error.message : `${error}`;
    window.close();
    throw new Error(`Cannot create splash window at ${indexPath}: ${err}`);
  }

  try {
    await window.loadURL(url.href);
  }
  catch (error: any) {
    const err = error instanceof Error ? error.message : `${error}`;
    window.close();
    throw new Error(`Cannot create splash window, an error uccurred while loading url ${url.href}: ${err}`);
  }

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
    const version = await proc.getVersion();
    win?.webContents.send('monero-version', { version });
  }
  catch(error: any) {
    const err = (error instanceof Error) ? error.message : `${error}`;
    win?.webContents.send('monero-version', { error: err });
  }
}

async function getTorVersion(path: string): Promise<void> {
  const proc = new TorProcess({ path, createConfig: false });

  try {
    const version = await proc.getVersion();
    win?.webContents.send('tor-version', { version });
  }
  catch(error: any) {
    const err = (error instanceof Error) ? error.message : `${error}`;
    win?.webContents.send('tor-version', { error: err });
  }
}

async function checkValidMonerodPath(monerodPath: string): Promise<void> {
  const valid = await MonerodProcess.isValidPath(monerodPath);
  
  win?.webContents.send('on-check-valid-monerod-path', valid);
}

async function wait(delay: number = 5000): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, delay));
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
    await wait(3000);
    win?.webContents.send('monerod-started', {});
  }
  catch(error: any) {
    console.error(error);
    const err = `${error}`;
    win?.webContents.send('monero-stderr', err);
    win?.webContents.send('monerod-started', { error });
    monerodProcess = null;
  }
}

async function monitorProcess(process: 'monerod' | 'i2pd' | 'tor'): Promise<ProcessStats> {
  if (process === 'monerod') {
    if (!monerodProcess) throw new Error('Process monerod is not running.');

    return await monerodProcess.getStats();
  }
  else if (process === 'i2pd') {
    if (!i2pdProcess) throw new Error('Process i2pd is not running.');
    return await i2pdProcess.getStats();

  }
  else if (process === 'tor') {
    if (!torProcess) throw new Error('Process tor is not running.');
    return await torProcess.getStats();
  }
  else throw new Error(`Unknown process ${process}`);
}

// #endregion

// #region Download Utils 

async function detectInstallation(program: string): Promise<any> {
  if (program === 'i2pd') {
    return await I2pdProcess.detectInstalled();
  }
  else if (program === 'monerod') {
    return await MonerodProcess.detectInstalled();
  }
  else if (program === 'tor') {
    return await TorProcess.detectInstalled();
  }
  else return undefined;
}

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
  powerMonitor.on('on-ac', () => win?.webContents.send('on-ac'));
  powerMonitor.on('on-battery', () => win?.webContents.send('on-battery'));

  // #region App Events

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', async () => {
    try {
      Menu.setApplicationMenu(null);
      const gotInstanceLock = app.requestSingleInstanceLock();
  
      if (!gotInstanceLock) {
        dialog.showErrorBox('', 'Another instance of Monerod GUI is running');
        app.quit();
        return;
      }
  
      const splash = await createSplashWindow();
      const mainWindowPromise = createWindow();
  
      await new Promise<void>((resolve, reject) => {
        mainWindowPromise.then((mainWindow) => {
          setTimeout(() => {
            try {
              splash.close();
                
              if (!AppMainProcess.startMinized) { 
                mainWindow.show();
                mainWindow.maximize();
              }
    
              resolve();
            }
            catch(error: any) {
              reject(error);
            }
          }, 2600);
        })
        .catch((error: any) => reject(error));
      });
    }
    catch (error: any) {
      console.error(error);
      app.quit();
    }
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

  // #region IPC Events

  ipcMain.handle('detect-installation', async (event: IpcMainInvokeEvent, params: { eventId: string; program: string }) => {
    const { eventId, program } = params;

    win?.webContents.send(eventId, await detectInstallation(program));
  });

  ipcMain.handle('start-i2pd', async (event: IpcMainInvokeEvent, params: { eventId: string; path: string; port: number; rpcPort: number; outproxy?: { host: string; port: number; } }) => {
    const { eventId, path, port, rpcPort, outproxy } = params;
    
    let error: string | undefined = undefined;

    if (i2pdProcess && i2pdProcess.running) {
      error = 'i2pd already started';
    }
    else if (!I2pdProcess.isValidPath(path)) {
      error = 'invalid i2pd path provided: ' + path;
    }
    else {
      try {
        //i2pdProcess = new I2pdProcess({ i2pdPath: path, flags, isExe: true });
        i2pdProcess = MoneroI2pdProcess.createSimple(path, port, rpcPort, outproxy);
        await i2pdProcess.start();
        i2pdProcess.onStdOut((out: string) => win?.webContents.send('on-ip2d-stdout', out));
        i2pdProcess.onStdErr((out: string) => win?.webContents.send('on-ip2d-stderr', out));
        i2pdProcess.onClose((_code: number | null) => {
          const code = _code != null ? _code : -Number.MAX_SAFE_INTEGER;
          const msg = `Process i2pd ${i2pdProcess?.pid} exited with code: ${code}`;
          console.log(msg);
          win?.webContents.send('i2pd-stdout', msg);
          win?.webContents.send('i2pd-close', code);
          monerodProcess = null;
        });
      }
      catch (err: any) {
        error = `${err}`;
        i2pdProcess = null;
      }
    }

    win?.webContents.send(eventId, error);
  });

  ipcMain.handle('start-p2pool', async (event: IpcMainInvokeEvent, params: { eventId: string; options: string[] }) => {
    const { eventId, options } = params;
    
    const p = options.shift();
    const path = p ? p : '';

    let error: string | undefined = undefined;

    if (p2poolProcess && p2poolProcess.running) {
      error = 'p2pool already started';
    }
    else if (!P2PoolProcess.isValidPath(path)) {
      error = 'invalid i2pd p2pool provided: ' + path;
    }
    else {
      try {
        p2poolProcess = new P2PoolProcess({ cmd: path, flags: options, isExe: true });
        await p2poolProcess.start();
        p2poolProcess.onStdOut((out: string) => win?.webContents.send('on-p2pool-stdout', out));
        p2poolProcess.onStdErr((out: string) => win?.webContents.send('on-p2pool-stderr', out));
        p2poolProcess.onClose((_code: number | null) => {
          const code = _code != null ? _code : -Number.MAX_SAFE_INTEGER;
          const msg = `Process p2pool ${p2poolProcess?.pid} exited with code: ${code}`;
          console.log(msg);
          win?.webContents.send('p2pool-stdout', msg);
          win?.webContents.send('p2pool-close', code);
          monerodProcess = null;
        });
      }
      catch (err: any) {
        error = `${err}`;
        p2poolProcess = null;
      }
    }

    win?.webContents.send(eventId, error);
  });

  ipcMain.handle('stop-i2pd', async (event: IpcMainInvokeEvent, params: { eventId: string; }) => {
    let err: string | undefined = undefined;
    const { eventId } = params;

    if (i2pdProcess == null) err = 'Already stopped i2pd';
    else if (i2pdProcess.stopping) err = 'Alrady stopping i2pd';
    else if (i2pdProcess.starting) err = 'i2pd is starting';
    else {
      try {
        await i2pdProcess.stop();
        i2pdProcess = null;
      }
      catch(error: any) {
        err = `${error}`;
      }
    }

    win?.webContents.send(eventId, err);
  });

  ipcMain.handle('stop-p2pool', async (event: IpcMainInvokeEvent, params: { eventId: string; }) => {
    let err: string | undefined = undefined;
    const { eventId } = params;

    if (p2poolProcess == null) err = 'Already stopped p2pool';
    else if (p2poolProcess.stopping) err = 'Alrady stopping p2pool';
    else if (p2poolProcess.starting) err = 'p2pool is starting';
    else {
      try {
        await p2poolProcess.stop();
        p2poolProcess = null;
      }
      catch(error: any) {
        err = `${error}`;
      }
    }

    win?.webContents.send(eventId, err);
  });

  ipcMain.handle('get-tor-hostname', async (event: IpcMainInvokeEvent, params: { eventId: string; }) => {
    const { eventId } = params;

    try {
      const hostname = torProcess ? await torProcess.getHostname() : '';
      
      win?.webContents.send(eventId, { hostname });
    }
    catch (err: any) {
      const error = err instanceof Error ? err.message : `${err}`;
      win?.webContents.send(eventId, { error });
    }
  });

  ipcMain.handle('start-tor', async (event: IpcMainInvokeEvent, params: { eventId: string; path: string; port?: number; rpcPort?: number; allowIncomingConnections: boolean; }) => {
    const { eventId, path, port, rpcPort, allowIncomingConnections } = params;
    
    let error: string | undefined = undefined;

    if (torProcess && torProcess.running) {
      error = 'tor already started';
    }
    else if (!TorProcess.isValidPath(path)) {
      error = 'invalid tor path provided: ' + path;
    }
    else {
      try {
        //torProcess = new TorProcess({ i2pdPath: path, flags, isExe: true });

        if (allowIncomingConnections) torProcess = new TorProcess({ path, port, rpcPort, createConfig: true });
        else torProcess = new TorProcess({ path, createConfig: true });
        await torProcess.start();
        torProcess.onStdOut((out: string) => win?.webContents.send('on-tor-stdout', out));
        torProcess.onStdErr((out: string) => win?.webContents.send('on-tor-stderr', out));
        torProcess.onClose((_code: number | null) => {
          const code = _code != null ? _code : -Number.MAX_SAFE_INTEGER;
          const msg = `Process tor ${torProcess?.pid} exited with code: ${code}`;
          console.log(msg);
          win?.webContents.send('tor-stdout', msg);
          win?.webContents.send('tor-close', code);
          monerodProcess = null;
        });
      }
      catch (err: any) {
        error = `${err}`;
        torProcess = null;
      }
    }

    win?.webContents.send(eventId, error);
  });

  ipcMain.handle('stop-tor', async (event: IpcMainInvokeEvent, params: { eventId: string; }) => {
    let err: string | undefined = undefined;
    const { eventId } = params;

    if (torProcess == null) err = 'Already stopped tor';
    else if (torProcess.stopping) err = 'Alrady stopping tor';
    else if (torProcess.starting) err = 'tor is starting';
    else {
      try {
        await torProcess.stop();
        torProcess = null;
      }
      catch(error: any) {
        err = `${error}`;
      }
    }

    win?.webContents.send(eventId, err);
  });

  ipcMain.handle('invoke-tor-control-command', async (event: IpcMainInvokeEvent, params: { eventId: string, command: TorControlCommand }) => {
    const { eventId, command } = params;
    try {
      if (!torProcess) throw new Error("Tor is not running");
      win?.webContents.send(eventId, await torProcess.control.invokeCommand(command));
    }
    catch (error: any) {
      win?.webContents.send(eventId, { error: error instanceof Error ? error.message : `${error}` });
    }
  });

  ipcMain.handle('is-on-battery-power', async (event: IpcMainInvokeEvent, params: { eventId: string; }) => {
    const onBattery = await BatteryUtils.isOnBatteryPower();
    if (!win) {
      console.warn("is-on-battery-power: window not set");
      return;
    }
    win.webContents.send(params.eventId, onBattery);
  });

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

        if (i2pdProcess && i2pdProcess.running) await i2pdProcess.stop();
        if (torProcess && torProcess.running) await torProcess.stop();
        if (p2poolProcess && p2poolProcess.running) await p2poolProcess.stop();

        i2pdProcess = null;
        torProcess = null;
        p2poolProcess = null;
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
    try {
      if (monerodProcess) {
        if (PrivateTestnet.started) {
          await PrivateTestnet.stop();
        }
        else {
          await monerodProcess.stop();
        }
        
        monerodProcess = null;
        win?.webContents.send('monero-close', 0);
        win?.webContents.send('on-stop-monerod', 0);
      }
      else throw new Error("monerod not started");
    }

    catch (error: any) {
      win?.webContents.send('on-stop-monerod-error', error instanceof Error ? error.message : `${error}`);
    }
  });

  ipcMain.handle('get-monero-version', (event: IpcMainInvokeEvent, configFilePath: string) => {
    getMonerodVersion(configFilePath);
  });

  ipcMain.handle('get-tor-version', (event: IpcMainInvokeEvent, configFilePath: string) => {
    getTorVersion(configFilePath);
  });

  ipcMain.handle('download-monerod', async (event: IpcMainInvokeEvent, downloadUrl: string, destination: string) => {
    try {
      const hashUrl = 'https://www.getmonero.org/downloads/hashes.txt';

      win?.webContents.send('download-monerod-progress', { progress: 0, status: 'Starting download' });
      
      win?.setProgressBar(0, {
        mode: 'normal'
      });

      const fileName = await FileUtils.downloadFile(downloadUrl, destination, (progress) => {
        win?.setProgressBar(progress, {
          mode: 'normal'
        });

        win?.webContents.send('download-monerod-progress', { progress, status: 'Downloading' });
      });

      win?.webContents.send('download-monerod-progress', { progress: 100, status: 'Verifying hash' });
      win?.setProgressBar(100, {
        mode: 'indeterminate'
      });

      await downloadAndVerifyHash(hashUrl, fileName, destination);

      const fPath = `${destination}/${fileName}`;
      win?.webContents.send('download-monerod-progress', { progress: 100, status: 'Extracting' });
      const extractedDir = await FileUtils.extract(fPath, destination);

      win?.webContents.send('download-monerod-progress', { progress: 100, status: 'Download and extraction completed' });
      win?.webContents.send('download-monerod-complete', os.platform() == 'win32' ? extractedDir : `${destination}/${extractedDir}`);

      win?.setProgressBar(100, {
        mode: 'none'
      });
      
    } catch (error) {
      win?.webContents.send('download-monerod-error', `${error}`);
      win?.setProgressBar(0, {
        mode: 'error'
      });
    }
  });

  // #region File Utils

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
        win?.webContents.send('on-read-file', { error: `${err}` });
        return;
      }

      win?.webContents.send('on-read-file', { data });
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
      win.webContents.send('on-save-file', { path: '' });
      return;
    }
    try {
      fs.writeFileSync(result.filePath, content);

      win.webContents.send('on-save-file', { path: result.filePath });
    }
    catch(error: any) {
      win.webContents.send('on-save-file-error', { error: `${error}` });
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

  ipcMain.handle('create-folder', (event: IpcMainInvokeEvent, params: { eventId: string, path: string }) => {
    const { eventId, path } = params;
    try {
      fs.mkdir(path, { recursive: true }, (err: NodeJS.ErrnoException | null, path2?: string) => {
        if (err) win?.webContents.send(eventId, { error: `${err}` });
        else win?.webContents.send(eventId, { path });
      });
    } catch (error: any) {
      console.error(error);
      win?.webContents.send(eventId, { error: `${error}` });
    }
  });

  // #endregion

  ipcMain.handle('is-wifi-connected', async (event: IpcMainInvokeEvent) => {
    isWifiConnected();
  });

  ipcMain.handle('get-os-type', (event: IpcMainInvokeEvent) => {
    const osType = { platform: os.platform(), arch: os.arch() };

    win?.webContents.send('got-os-type', { osType });
  })

  ipcMain.handle('monitor-process', async (event: IpcMainInvokeEvent, params: { eventId: string, process: 'monerod' | 'i2pd' | 'tor' }) => {
    const { eventId, process: program } = params;
    
    try {
      const stats = await monitorProcess(program);
      win?.webContents.send(eventId, { stats });
    }
    catch(error: any) {
      let message: string;
  
      if (error instanceof Error) {
        message = error.message;
      }
      else {
        message = `${error}`;
      }
  
      win?.webContents.send(eventId, { error: message });
    }  
  });

  ipcMain.handle('check-valid-monerod-path', (event: IpcMainInvokeEvent, path: string) => {
    checkValidMonerodPath(path);
  });

  ipcMain.handle('check-valid-i2pd-path', async (event: IpcMainInvokeEvent, params: { eventId: string, path: string }) => {
    const { eventId, path } = params;
    win?.webContents.send(eventId, await I2pdProcess.isValidPath(path));
  });

  ipcMain.handle('check-valid-tor-path', async (event: IpcMainInvokeEvent, params: { eventId: string, path: string }) => {
    const { eventId, path } = params;
    win?.webContents.send(eventId, await TorProcess.isValidPath(path));
  });

  ipcMain.handle('check-valid-p2pool-path', async (event: IpcMainInvokeEvent, params: { eventId: string, path: string }) => {
    const { eventId, path } = params;
    win?.webContents.send(eventId, await P2PoolProcess.isValidPath(path));
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
      win?.webContents.send('on-enable-auto-launch', {});
    }
    catch(error: any) {
      const err = (error instanceof Error) ? error.message : `${error}`;

      win?.webContents.send('on-enable-auto-launch', { error: err });
    }
  });

  ipcMain.handle('get-battery-level', async (event: IpcMainInvokeEvent, params: { eventId: string; }) => {
    win?.webContents.send(params.eventId, await BatteryUtils.getLevel());
  });

  ipcMain.handle('disable-auto-launch', async (event: IpcMainInvokeEvent) => {
    try {
      await AppMainProcess.disableAutoLaunch();
      win?.webContents.send('on-disable-auto-launch', {});
    }
    catch(error: any) {
      const err = (error instanceof Error) ? error.message : `${error}`;
      win?.webContents.send('on-disable-auto-launch', { error: err });
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
      let msg: string;
      if (error instanceof AxiosError) {
        msg = error.message
      }
      else msg = `${error}`;

      console.error(msg);

      win?.webContents.send(eventId, { error: msg });
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
      console.error(error);
      let msg: string;
      if (error instanceof AxiosError) {
        msg = error.message
      }
      else msg = `${error}`;

      console.error(msg);

      win?.webContents.send(eventId, { error: msg });
    }

  });

  // #endregion

} catch (e: any) {
  // Catch Error
  console.error(e);

  dialog.showErrorBox('', `${e}`);

  app.quit();
}

