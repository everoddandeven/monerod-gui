import { app, BrowserWindow, ipcMain, screen, dialog, Tray, Menu, MenuItemConstructorOptions, 
  IpcMainInvokeEvent, Notification, NotificationConstructorOptions, clipboard, powerMonitor
} from 'electron';
import { ChildProcessWithoutNullStreams, exec, ExecException, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import { createHash } from 'crypto';
import * as tar from 'tar';
import * as os from 'os';
import AutoLaunch from './auto-launch';

const AdmZip = require('adm-zip');
const pidusage = require('pidusage');
const batteryLevel = require('battery-level');
const network = require('network');

function isOnBatteryPower(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    exec("upower -i $(upower -e | grep 'battery') | grep 'state'", (error, stdout) => {
      if (error) {
        console.error(`isOnBatteryPower(): ${error.message}`);
        resolve(false); // Ritorna false se non riesce a rilevare lo stato della batteria
        return;
      }

      const isOnBattery = stdout.includes("discharging");
      resolve(isOnBattery);
    });
  });
}

interface Stats {
  /**
   * percentage (from 0 to 100*vcore)
   */
  cpu: number;

  /**
   * bytes
   */
  memory: number;

  /**
   * PPID
   */
  ppid: number;

  /**
   * PID
   */
  pid: number;

  /**
   * ms user + system time
   */
  ctime: number;

  /**
   * ms since the start of the process
   */
  elapsed: number;

  /**
   * ms since epoch
   */
  timestamp: number;
}

//import bz2 from 'unbzip2-stream';
//import * as bz2 from 'unbzip2-stream';
const bz2 = require('unbzip2-stream');

app.setName('Monero Daemon');

let autoLauncher = new AutoLaunch({
	name: 'monerod-gui',
  path: process.execPath,
  options: {
    extraArguments: [
      '--auto-launch'
    ],
    linux: {
      comment: 'Monerod GUI startup script',
      version: '1.0.0'
    }
  }
});

const isAutoLaunched: boolean = process.argv.includes('--auto-launch');
const minimized: boolean = process.argv.includes('--hidden');

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

let monerodProcess: ChildProcessWithoutNullStreams | null = null;
const iconRelPath: string = 'assets/icons/monero-symbol-on-white-480.png';
//const wdwIcon = `${dirname}/${iconRelPath}`;
const wdwIcon = path.join(dirname, iconRelPath);

let tray: Tray;
let trayMenu: Menu;

const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

const isAppImage: () => boolean = () => {
  return (!!process.env.APPIMAGE) || (!!process.env.PORTABLE_EXECUTABLE_DIR);
}

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

function createWindow(): BrowserWindow {
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
      allowRunningInsecureContent: (serve),
      contextIsolation: true,
      devTools: !app.isPackaged,
      sandbox: true
    },
    show: false,
    autoHideMenuBar: true,
    icon: wdwIcon
  });

  isHidden = minimized;

  if (!app.isPackaged) win.webContents.openDevTools();

  if (serve) {
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

    win.loadURL(url.href);
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
  return undefined;
  
  if (os.platform() == 'win32' || isAppImage()) {
    return undefined;
  }

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
    fullscreen: false
  });

  // Path when running electron executable
  let pathIndex = './splash.html';

  if (fs.existsSync(path.join(dirname, '../dist/splash.html'))) {
      // Path when running electron in local folder
    pathIndex = '../dist/splash.html';
  }

  const url = new URL(path.join('file:', dirname, pathIndex));

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

function isConnectedToWiFi(): Promise<boolean> {
  try {

    return new Promise<boolean>((resolve, reject) => {
      network.get_active_interface((err: any | null, obj: { name: string, ip_address: string, mac_address: string, type: string, netmask: string, gateway_ip: string }) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        else {
          resolve(obj.type == 'Wireless');
        }
      })
    });
  }
  catch(error: any) {
    return isConnectedToWiFiV2();
  }
}

function isConnectedToWiFiV2(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const platform = os.platform();  // Use os to get the platform

    let command = '';
    if (platform === 'win32') {
      // Windows: Use 'netsh' command to check the Wi-Fi status
      command = 'netsh wlan show interfaces';
    } else if (platform === 'darwin') {
      // macOS: Use 'airport' command to check the Wi-Fi status
      command = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | grep 'state: running'";
    } else if (platform === 'linux') {
      // Linux: Use 'nmcli' to check for Wi-Fi connectivity
      command = 'nmcli dev status';
    } else {
      resolve(false);  // Unsupported platform
    }

    // Execute the platform-specific command
    if (command) {
      exec(command, (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          console.error(error);
          reject(stderr);
          resolve(false);  // In case of error, assume not connected to Wi-Fi
        } else {
          // Check if the output indicates a connected status
          if (stdout) {
            const components: string[] = stdout.split("\n");

            components.forEach((component: string) => {
              if (component.includes('wifi') && !component.includes('--')) {
                resolve(true);
              }
            });

            resolve(false);
          } else {
            resolve(false);
          }
        }
      });
    }
  });
}

function isWifiConnected() {
  isConnectedToWiFi().then((connected: boolean) => {
    win?.webContents.send('is-wifi-connected-result', connected);
  }).catch((error: any) => {
    console.error(error);
    win?.webContents.send('is-wifi-connected-result', false);
  });
}

// #endregion

// #region monerod 

function getMonerodVersion(monerodFilePath: string): void {
  const monerodProcess = spawn(monerodFilePath, [ '--version' ]);

  monerodProcess.stdout.on('data', (data) => {
    win?.webContents.send('monero-version', `${data}`);
  })

  monerodProcess.stderr.on('data', (data) => {
    win?.webContents.send('monero-version-error', `${data}`);
  })
}

function checkValidMonerodPath(monerodPath: string): void {
  let foundUsage: boolean = false;
  const monerodProcess = spawn(monerodPath, ['--help']);

  monerodProcess.stderr.on('data', (data) => {
    win?.webContents.send('on-check-valid-monerod-path', false);
  });

  monerodProcess.stdout.on('data', (data) => {
    if (`${data}`.includes('monerod [options|settings] [daemon_command...]')) {
      foundUsage = true;
    }
  });

  monerodProcess.on('close', (code: number) => {
    win?.webContents.send('on-check-valid-monerod-path', foundUsage);
  })

}

let moneroFirstStdout: boolean = true;

function startMoneroDaemon(commandOptions: string[]): ChildProcessWithoutNullStreams {
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

  const message: string = "Starting monerod daemon with options: " + commandOptions.join(" ");
  
  console.log(message);
  
  moneroFirstStdout = true;

  commandOptions.push('--non-interactive');

  // Avvia il processo usando spawn
  monerodProcess = spawn(monerodPath, commandOptions);

  // Gestisci l'output di stdout in streaming
  monerodProcess.stdout.on('data', (data) => {
    //console.log(`monerod stdout: ${data}`);
    const pattern = '**********************************************************************';

    if (moneroFirstStdout && data.includes(pattern)) {
      win?.webContents.send('monerod-started', true);
      moneroFirstStdout = false;
    }

    win?.webContents.send('monero-stdout', `${data}`);
    // Puoi anche inviare i log all'interfaccia utente tramite IPC
  });

  // Gestisci gli errori in stderr
  monerodProcess.stderr.on('data', (data) => {
    console.error(`monerod error: ${data}`);

    if (moneroFirstStdout) {
      win?.webContents.send('monerod-started', false);
      moneroFirstStdout = false;
    }

    win?.webContents.send('monero-stderr', `${data}`);
  });

  // Gestisci la chiusura del processo
  monerodProcess.on('close', (code: number) => {
    console.log(`monerod exited with code: ${code}`);
    win?.webContents.send('monero-stdout', `monerod exited with code: ${code}`);
    win?.webContents.send('monero-close', code);
    monerodProcess = null;
  });

  return monerodProcess;
}

function monitorMonerod(): void {
  if (!monerodProcess) {
    win?.webContents.send('on-monitor-monerod-error', 'Monerod not running');
    return;
  }

  if (!monerodProcess.pid) {
    win?.webContents.send('on-monitor-monerod-error', 'Unknown monero pid');
    return;
  }

  pidusage(monerodProcess.pid, (error: Error | null, stats: Stats) => {
    if (error) {
      win?.webContents.send('on-monitor-monerod-error', `${error}`);
      return;
    }

    win?.webContents.send('on-monitor-monerod', stats);
  });
}

// #endregion

// #region Download Utils 

const downloadFile = (url: string, destinationDir: string, onProgress: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const request = (url: string) => {
      https.get(url, (response) => {
        if (response.statusCode === 200) {
          const contentDisposition = response.headers['content-disposition'];
          let finalFilename = '';

          // Estrai il nome del file dall'URL o dal content-disposition
          if (contentDisposition && contentDisposition.includes('filename')) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match) {
              finalFilename = match[1];
            }
          } else {
            // Se non c'è content-disposition, prendiamo il nome dall'URL
            finalFilename = url.split('/').pop() || 'downloaded-file';
          }

          const destination = `${destinationDir}/${finalFilename}`;
          let file: fs.WriteStream;

          try {
            file = fs.createWriteStream(destination);
            file.on('error', (error: Error) => {
              console.log("file error: " + error);
              reject(error);
            });
          }
          catch (error: any) {
            reject(error);
            return;
          }

          const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
          let downloadedBytes = 0;

          response.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            const progress = (downloadedBytes / totalBytes) * 100;
            onProgress(progress); // Notifica il progresso
          });

          response.pipe(file);

          file.on('finish', () => {
            file.close(() => resolve(finalFilename)); // Restituisci il nome del file finale
          });
        } else if (response.statusCode === 301 || response.statusCode === 302) {
          // Se è un redirect, effettua una nuova richiesta verso il location header
          const newUrl = response.headers.location;
          if (newUrl) {
            request(newUrl); // Ripeti la richiesta con il nuovo URL
          } else {
            reject(new Error('Redirection failed without a location header'));
          }
        } else {
          reject(new Error(`Failed to download: ${response.statusCode}`));
        }
      }).on('error', (err) => {
        reject(err);
      });
    };

    request(url); // Inizia la richiesta
  });
};

// Funzione per scaricare e verificare l'hash
const downloadAndVerifyHash = async (hashUrl: string, fileName: string, filePath: string): Promise<boolean> => {
  //const hashFilePath = path.join(app.getPath('temp'), 'monero_hashes.txt');

  // Scarica il file di hash
  const hashFileName = await downloadFile(hashUrl, app.getPath('temp'), () => {});
  const hashFilePath = `${app.getPath('temp')}/${hashFileName}`;

  // Leggi il file di hash e cerca l'hash corrispondente
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
  const calculatedHash = await verifyFileHash(`${filePath}/${fileName}`);
  return calculatedHash === expectedHash;
};

// Funzione per verificare l'hash del file
const verifyFileHash = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('data', (data) => {
      hash.update(data);
    });

    fileStream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    fileStream.on('error', (err) => {
      reject(err);
    });
  });
};

const extractTarBz2 = (filePath: string, destination: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Crea il file decomprimendo il .bz2 in uno .tar temporaneo
    const tarPath = path.join(destination, 'temp.tar');
    const fileStream = fs.createReadStream(filePath);
    const decompressedStream = fileStream.pipe(bz2());

    const writeStream = fs.createWriteStream(tarPath);

    decompressedStream.pipe(writeStream);

    let extractedDir: string = '';

    writeStream.on('finish', () => {
      // Una volta che il file .tar è stato creato, estrailo
      tar.extract({ cwd: destination, file: tarPath, onReadEntry: (entry: tar.ReadEntry) => {
        if (extractedDir == '') {
          const topLevelDir = entry.path.split('/')[0];
          extractedDir = topLevelDir; // Salva la prima directory
        }
      } })
        .then(() => {
          // Elimina il file .tar temporaneo dopo l'estrazione
          fs.unlink(tarPath, (err) => {
            if (err) reject(err);
            else if (extractedDir == '') reject('Extraction failed')
            else resolve(extractedDir);
          });
        })
        .catch(reject);
    });

    writeStream.on('error', reject);
  });
};

const extractZip = (filePath: string, destination: string): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    try {
      const zip = new AdmZip(filePath);

      // Ensure destination exists
      if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
      }

      // Extract the ZIP file
      zip.extractAllTo(destination, true);

      // Get the name of the extracted folder
      const extractedEntries = zip.getEntries();
      const folderName = extractedEntries[0]?.entryName.split('/')[0];

      // Ensure folder name exists
      if (!folderName) {
        reject(new Error("Could not determine the extracted folder name"));
        return;
      }

      resolve(path.join(destination, folderName));
    } catch (error) {
      reject(error);
    }
  });
};

const extract = (filePath: string, destination: string): Promise<string> => {
  if (filePath.endsWith('.zip')) {
    return extractZip(filePath, destination);
  }
  else if (filePath.endsWith('.tar.bz2')) {
    return extractTarBz2(filePath, destination);
  }

  throw new Error("Unknown file type " + filePath);
}

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

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => {
    Menu.setApplicationMenu(null);
    const gotInstanceLock = app.requestSingleInstanceLock();

    if (!gotInstanceLock) {
      dialog.showErrorBox('', 'Another instance of monerod GUI is running');
      app.quit();
      return;
    }

    setTimeout(async () => {
      const splash = await createSplashWindow();
      createWindow();

      await new Promise<void>((resolve, reject) => {
        try {
          setTimeout(() => {
            if (splash) splash.close();
            if (!minimized) { 
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

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  // #region Security 

  app.on('web-contents-created', (event, webContents) => {
    webContents.setWindowOpenHandler((details) => {
      console.warn("Prevented unsafe window creation");
      console.warn(details);
      return { action: 'deny' };
    });
  });

  app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
      event.preventDefault();
      console.warn(`Prevented unsage window navigation to ${navigationUrl}`);
      /*
      const parsedUrl = new URL(navigationUrl)
  
      if (parsedUrl.origin !== 'https://example.com') {
        event.preventDefault()
      }
      */
    })
  })
  // #endregion

  ipcMain.handle('is-on-battery-power', (event: IpcMainInvokeEvent) => {
    const onBattery = powerMonitor.isOnBatteryPower();

    if (!onBattery && os.platform() == 'linux') {
      isOnBatteryPower().then((value) => {
        win?.webContents.send('on-is-on-battery-power', value);
      }).catch((error: any) => {
        console.error(`${error}`);
        win?.webContents.send('on-is-on-battery-power', false);
      });

      return;
    }
    else {
      win?.webContents.send('on-is-on-battery-power', onBattery);
    }

  });

  powerMonitor.on('on-ac', () => win?.webContents.send('on-ac'));
  powerMonitor.on('on-battery', () => win?.webContents.send('on-battery'));

  ipcMain.handle('is-auto-launched', (event: IpcMainInvokeEvent) => {
    console.debug(event);
    
    win?.webContents.send('on-is-auto-launched', isAutoLaunched);
  });

  ipcMain.handle('quit', (event: IpcMainInvokeEvent) => {
    isQuitting = true;
    tray.destroy();
    win?.close();
    win?.destroy();
    app.quit();
  });

  ipcMain.handle('start-monerod', (event: IpcMainInvokeEvent, configFilePath: string[]) => {
    startMoneroDaemon(configFilePath);
  })

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
      const fileName = await downloadFile(downloadUrl, destination, (progress) => {
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
      const extractedDir = await extract(fPath, destination);

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

      const fileName = await downloadFile(url, destination, (progress) => {
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
  })

  ipcMain.handle('show-notification', (event: IpcMainInvokeEvent, options?: NotificationConstructorOptions) => {
    showNotification(options);
  });

  // #region Auto Launch 

  ipcMain.handle('is-auto-launch-enabled', (event: IpcMainInvokeEvent) => {
    autoLauncher.isEnabled().then((enabled: boolean) => {
      win?.webContents.send('on-is-auto-launch-enabled', enabled);
    }).catch((error: any) => {
      console.error(error);
      win?.webContents.send('on-is-auto-launch-enabled', false);
    });
  });

  ipcMain.handle('enable-auto-launch', (event: IpcMainInvokeEvent, minimized: boolean) => {
    autoLauncher.isEnabled().then((enabled: boolean) => {
      if (enabled) {
        win?.webContents.send('on-enable-auto-launch-error', 'already enabled');
        return;
      }

      autoLauncher = new AutoLaunch({
        name: 'monerod-gui',
        path: process.execPath,
        options: {
          launchInBackground: minimized,
          extraArguments: [
            '--auto-launch'
          ]
        }
      });
      
      autoLauncher.enable().then(() => {
        autoLauncher.isEnabled().then((enabled: boolean) => {
          if (enabled) {
            win?.webContents.send('on-enable-auto-launch-success');
          }
          win?.webContents.send('on-enable-auto-launch-error', `Could not enabled auto launch`);
        }).catch((error: any) => {
          win?.webContents.send('on-enable-auto-launch-error', `${error}`);
        });

      }).catch((error: any) => {
        console.error(error);
        win?.webContents.send('on-enable-auto-launch-error', `${error}`);
      });
    }).catch((error: any) => {
      console.error(error);
      win?.webContents.send('on-enable-auto-launch-error', `${error}`);
    });
  });

  ipcMain.handle('get-battery-level', (event: IpcMainInvokeEvent) => {
    batteryLevel().then((level: number) => {
      win?.webContents.send('on-get-battery-level', level);
    }).catch((error: any) => {
      console.error(error);
      win?.webContents.send('on-get-battery-level', -1);
    })
  });

  ipcMain.handle('disable-auto-launch', (event: IpcMainInvokeEvent) => {
    autoLauncher.isEnabled().then((enabled: boolean) => {
      if (!enabled) {
        win?.webContents.send('on-disable-auto-launch-error', 'already disabled');
        return;
      }

      autoLauncher.disable().then(() => {
        autoLauncher.isEnabled().then((enabled: boolean) => {
          if (!enabled) {
            win?.webContents.send('on-disable-auto-launch-success');
          }
          win?.webContents.send('on-disable-auto-launch-error', `Could not disable auto launch`);
        }).catch((error: any) => {
          win?.webContents.send('on-disable-auto-launch-error', `${error}`);
        });

      }).catch((error: any) => {
        console.error(error);
        win?.webContents.send('on-disable-auto-launch-error', `${error}`);
      });
    }).catch((error: any) => {
      console.error(error);
      win?.webContents.send('on-disable-auto-launch-error', `${error}`);
    });
  });

  // #endregion

  ipcMain.handle('show-error-box', (event: IpcMainInvokeEvent, title: string, content: string) => {
    dialog.showErrorBox(title, content);
  });

  ipcMain.handle('set-tray-item-enabled', (event: IpcMainInvokeEvent, id: string, enabled: boolean) => {
    setTrayItemEnabled(id, enabled);
  });

  ipcMain.handle('set-tray-tool-tip', (event: IpcMainInvokeEvent, toolTip: string) => {
    tray.setToolTip(toolTip);
  });

  ipcMain.handle('is-app-image', (event: IpcMainInvokeEvent) => {
    win?.webContents.send('on-is-app-image', isAppImage());
  });

  ipcMain.handle('copy-to-clipboard', (event: IpcMainInvokeEvent, content: string) => {
    clipboard.writeText(content, "selection");
  });

} catch (e: any) {
  // Catch Error
  console.error(e);

  dialog.showErrorBox('', `${e}`);

  app.quit();
  // throw e;
}

