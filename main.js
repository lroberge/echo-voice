const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron')
const path = require('path')

let win = null;

let currHk = 'Alt+G';

function createWindow () {
  win = new BrowserWindow({
    width: 880,
    height: 740,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    backgroundColor: '#0f1218',
    frame: false,
    resizable: false
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow()

  globalShortcut.register(currHk, () => {
    win.webContents.executeJavaScript(`toggleFilter();`).then(() => console.log("toggled"));
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

ipcMain.on('request-mainprocess-quit', (event) => {
  win.close();
})

ipcMain.on('request-mainprocess-change-hotkey', (event, hk) => {
  globalShortcut.unregisterAll();

  let success = globalShortcut.register(hk, () => {
    win.webContents.executeJavaScript(`toggleFilter();`).then(() => console.log("toggled"));
  });
  if(success) {currHk = hk;}
  else {
    win.webContents.executeJavaScript(`hotkeyError();`).then(() => console.log("error setting hotkey " + hk));

    globalShortcut.unregisterAll();

    globalShortcut.register(currHk, () => {
      win.webContents.executeJavaScript(`toggleFilter();`).then(() => console.log("toggled"));
    });
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
