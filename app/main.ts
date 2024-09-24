import {app, BrowserWindow, ipcMain, screen} from 'electron';
import { ChildProcess, ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';


const monerodFilePath: string = "/home/sidney/Documenti/monero-x86_64-linux-gnu-v0.18.3.4/monerod";

let win: BrowserWindow | null = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

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

function startMoneroDaemon(commandOptions: string[]): ChildProcessWithoutNullStreams {
  const monerodPath = path.resolve(__dirname, monerodFilePath);
  
  console.log("Starting monerod daemon with options: " + commandOptions.join(" "));

  // Avvia il processo usando spawn
  const monerodProcess = spawn(monerodPath, commandOptions);

  // Gestisci l'output di stdout in streaming
  monerodProcess.stdout.on('data', (data) => {
    console.log(`monerod stdout: ${data}`);
    // Puoi anche inviare i log all'interfaccia utente tramite IPC
  });

  // Gestisci gli errori in stderr
  monerodProcess.stderr.on('data', (data) => {
    console.error(`monerod stderr: ${data}`);
  });

  // Gestisci la chiusura del processo
  monerodProcess.on('close', (code) => {
    console.log(`monerod chiuso con codice: ${code}`);
  });

  return monerodProcess;
}

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

  ipcMain.on('start-monerod', (event, configFilePath) => {
    startMoneroDaemon(configFilePath);
  })

} catch (e) {
  // Catch Error
  // throw e;
}
