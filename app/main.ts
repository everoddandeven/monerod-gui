import { app, BrowserWindow, ipcMain, screen, dialog, Tray, Menu, MenuItemConstructorOptions } from 'electron';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import { createHash } from 'crypto';
import * as tar from 'tar';
import * as os from 'os';

//import bz2 from 'unbzip2-stream';
//import * as bz2 from 'unbzip2-stream';
const bz2 = require('unbzip2-stream');

let win: BrowserWindow | null = null;
let isHidden: boolean = false;
let isQuitting: boolean = false;

const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  const size = screen.getPrimaryDisplay().workAreaSize;
  const wdwIcon = path.join(__dirname, 'assets/icons/monero-symbol-on-white-480.png');

  const trayMenuTemplate: MenuItemConstructorOptions[] = [
    {
      id: "stopDaemon",
      label: "Stop",
      toolTip: "Stop monero daemon",
      click: () => {
        console.log("Clicked stop daemon tray icon menu");
      }
    },
    {
      id: "quitDaemon",
      label: "Quit",
      toolTip: "Quit monero daemon",
      click: () => {
        isQuitting = true;
        app.quit();
        console.log("Quit monero daemon");
      }
    }
  ];

  const tray = new Tray(wdwIcon);
  const trayMenu = Menu.buildFromTemplate(trayMenuTemplate);

  tray.setToolTip('Monero Daemon');
  tray.setContextMenu(trayMenu);

  console.log(`createWindow(): icon = ${wdwIcon}`);

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
      devTools: true,
    },
    autoHideMenuBar: true,
    icon: wdwIcon
  });

  win.webContents.openDevTools();
  //win.setIcon()

  if (serve) {
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
       // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href);
  }

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
    
    console.log("Clicked monero gui icon tray");
    console.log(event);
  });

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

function isWifiConnected() {
  const networkInterfaces = os.networkInterfaces();
  
  for (const interfaceName in networkInterfaces) {
    const networkInterface = networkInterfaces[interfaceName];

    if (networkInterface) {
      for (const network of networkInterface) {
        if (network.family === 'IPv4' && !network.internal && network.mac !== '00:00:00:00:00:00') {
          if (interfaceName.toLowerCase().includes('wifi') || interfaceName.toLowerCase().includes('wlan')) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function getMonerodVersion(monerodFilePath: string): void {
  const monerodProcess = spawn(monerodFilePath, [ '--version' ]);

  monerodProcess.stdout.on('data', (data) => {
    win?.webContents.send('monero-version', `${data}`);
  })

  monerodProcess.stderr.on('data', (data) => {
    win?.webContents.send('monero-version-error', `${data}`);
  })
}

function startMoneroDaemon(commandOptions: string[]): ChildProcessWithoutNullStreams {
  const monerodPath = commandOptions.shift();

  if (!monerodPath) {
    win?.webContents.send('monero-sterr', `Invalid monerod path provided: ${monerodPath}`);
    throw Error("Invalid monerod path provided");
  }

  console.log("Starting monerod daemon with options: " + commandOptions.join(" "));

  // Avvia il processo usando spawn
  const monerodProcess = spawn(monerodPath, commandOptions);

  // Gestisci l'output di stdout in streaming
  monerodProcess.stdout.on('data', (data) => {
    //console.log(`monerod stdout: ${data}`);
    win?.webContents.send('monero-stdout', `${data}`);
    // Puoi anche inviare i log all'interfaccia utente tramite IPC
  });

  // Gestisci gli errori in stderr
  monerodProcess.stderr.on('data', (data) => {
    //console.error(`monerod stderr: ${data}`);
    win?.webContents.send('monero-stderr', `${data}`);
  });

  // Gestisci la chiusura del processo
  monerodProcess.on('close', (code) => {
    console.log(`monerod chiuso con codice: ${code}`);
    win?.webContents.send('monero-stdout', `monerod exited with code: ${code}`);
    win?.webContents.send('monero-close', code);
  });

  return monerodProcess;
}

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
          const file = fs.createWriteStream(destination);

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

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

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

  ipcMain.handle('start-monerod', (event, configFilePath: string[]) => {
    startMoneroDaemon(configFilePath);
  })

  ipcMain.handle('get-monero-version', (event, configFilePath: string) => {
    getMonerodVersion(configFilePath);
  });

  // Gestione IPC
  ipcMain.handle('download-monerod', async (event, downloadUrl: string, destination: string) => {
    try {
      //const fileName = path.basename(downloadUrl);
      //const filePath = path.join(destination, fileName);
      const hashUrl = 'https://www.getmonero.org/downloads/hashes.txt';

      // Inizializza il progresso
      event.sender.send('download-progress', { progress: 0, status: 'Starting download' });

      // Scarica il file Monero
      const fileName = await downloadFile(downloadUrl, destination, (progress) => {
        event.sender.send('download-progress', { progress, status: 'Downloading' });
      });

      // Scarica e verifica l'hash
      event.sender.send('download-progress', { progress: 100, status: 'Verifying hash' });
      await downloadAndVerifyHash(hashUrl, fileName, destination);

      // Estrai il file
      const fPath = `${destination}/${fileName}`;
      event.sender.send('download-progress', { progress: 100, status: 'Extracting' });
      const extractedDir = await extractTarBz2(fPath, destination);

      event.sender.send('download-progress', { progress: 100, status: 'Download and extraction completed successfully' });
      event.sender.send('download-progress', { progress: 200, status: `${destination}/${extractedDir}` });
    } catch (error) {
      event.sender.send('download-progress', { progress: 0, status: `Error: ${error}` });
      //throw new Error(`Error: ${error}`);
    }
  });
  
  ipcMain.handle('select-folder', async (event) => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],  // Specifica che vogliamo solo cartelle
    });

    const path = result.canceled ? null : result.filePaths[0];

    win?.webContents.send('selected-folder', path ? `${path}` : '');
  });

  ipcMain.handle('is-wifi-connected', async (event) => {
    win?.webContents.send('is-wifi-connected-result', isWifiConnected());
  });

  ipcMain.handle('get-os-type', (event) => {
    win?.webContents.send('got-os-type', { platform: os.platform(), arch: os.arch() });
  })

} catch (e) {
  // Catch Error
  // throw e;
}
