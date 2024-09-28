import {app, BrowserWindow, ipcMain, screen} from 'electron';
import { ChildProcess, ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';


import * as https from 'https';
import { createHash } from 'crypto';
import * as tar from 'tar';


const monerodFilePath: string = "/home/sidney/Documenti/monero-x86_64-linux-gnu-v0.18.3.4/monerod";

let win: BrowserWindow | null = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function getMonerodPath(): string {
  return path.resolve(__dirname, monerodFilePath);
}

function createWindow(): BrowserWindow {

  const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve),
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets/icons/favicon.ico')
  });

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

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

function execMoneroDaemon(configFilePath: string): ChildProcess {
  const monerodPath = path.resolve(__dirname, 'path/to/monerod'); // Percorso del binario di monerod
  //const command = `"${monerodPath}" --config-file "${configFilePath}"`;
  const command = `/home/sidney/Documenti/monero-x86_64-linux-gnu-v0.18.3.4/monerod --testnet --fast-block-sync 1 --prune-blockchain --sync-pruned-blocks --confirm-external-bind --max-concurrency 1 --log-level 1 --rpc-access-control-origins=*`;

  const monerodProcess = exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Errore durante l'avvio di monerod: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }

    console.log(`stdout: ${stdout}`);
  });

  // Gestisci l'output in tempo reale
  if (monerodProcess.stdout == null) {
    throw new Error("No stdout for monero process")
  }
  
  if (monerodProcess.stderr == null) {
    throw new Error("No stderr for monero process");
  }

  monerodProcess.stdout.on('data', (data) => {
    console.log(`monerod stdout: ${data}`);
  });

  monerodProcess.stderr.on('data', (data) => {
    console.error(`monerod stderr: ${data}`);
  });

  return monerodProcess;
}

function getMonerodVersion(monerodFilePath: string): void {
  const monerodProcess = spawn(getMonerodPath(), [ '--version' ]);

  monerodProcess.stdout.on('data', (data) => {
    win?.webContents.send('on-monerod-version', `${data}`);
  })

  monerodProcess.stderr.on('data', (data) => {
    win?.webContents.send('on-monerod-version-error', `${data}`);
  })
}

function startMoneroDaemon(commandOptions: string[]): ChildProcessWithoutNullStreams {
  const monerodPath = getMonerodPath();
  
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


// Funzione per il download
const downloadFile = (url: string, destination: string, onProgress: (progress: number) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          const progress = (downloadedBytes / totalBytes) * 100;
          onProgress(progress); // Notifica il progresso
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close(() => resolve());
        });
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(destination, () => reject(err));
    });
  });
};

// Funzione per scaricare e verificare l'hash
const downloadAndVerifyHash = async (hashUrl: string, fileName: string, filePath: string): Promise<boolean> => {
  const hashFilePath = path.join(app.getPath('temp'), 'monero_hashes.txt');

  // Scarica il file di hash
  await downloadFile(hashUrl, hashFilePath, () => {});

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
  const calculatedHash = await verifyFileHash(filePath);
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

// Funzione per estrarre tar.bz2
const extractTarBz2 = (filePath: string, destination: string): Promise<void> => {
  return tar.x({
    file: filePath,
    cwd: destination,
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

  ipcMain.on('start-monerod', (event, configFilePath: string[]) => {
    startMoneroDaemon(configFilePath);
  })

  ipcMain.on('get-monerod-version', (event, configFilePath: string) => {
    getMonerodVersion(configFilePath);
  });

  
  // Gestione IPC
  ipcMain.handle('download-monero', async (event, downloadUrl: string, destination: string) => {
    try {
      const fileName = path.basename(downloadUrl);
      const filePath = path.join(destination, fileName);
      const hashUrl = 'https://www.getmonero.org/downloads/hashes.txt';

      // Inizializza il progresso
      event.sender.send('download-progress', { progress: 0, status: 'Starting download...' });

      // Scarica il file Monero
      await downloadFile(downloadUrl, filePath, (progress) => {
        event.sender.send('download-progress', { progress, status: 'Downloading...' });
      });

      // Scarica e verifica l'hash
      event.sender.send('download-progress', { progress: 100, status: 'Verifying hash...' });
      await downloadAndVerifyHash(hashUrl, fileName, filePath);

      // Estrai il file
      event.sender.send('download-progress', { progress: 100, status: 'Extracting...' });
      await extractTarBz2(filePath, destination);

      event.sender.send('download-progress', { progress: 100, status: 'Download and extraction completed successfully.' });
    } catch (error) {
      event.sender.send('download-progress', { progress: 0, status: `Error: ${error}` });
      throw new Error(`Error: ${error}`);
    }
  });
  

} catch (e) {
  // Catch Error
  // throw e;
}
