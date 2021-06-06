const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron')
const path = require('path')

let win = null;

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    //frame: false
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow()

  globalShortcut.register('Alt+G', () => {
    win.webContents.executeJavaScript(`toggleFilter();`).then(() => console.log("toggled"));
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
