/*
 * @Description: Description
 * @Author: Yongchao Wang
 * @Date: 2020-09-01 19:56:24
 * @LastEditors: Yongchao Wang
 * @LastEditTime: 2020-09-01 21:50:29
 */
import {
  app,
  BrowserWindow
} from 'electron';
import installExtension, {
  VUEJS_DEVTOOLS
} from 'electron-devtools-installer';
import {
  enableLiveReload
} from 'electron-compile';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) enableLiveReload();

const createWindow = async () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 400,
    height: 400,
    frame: true, //取消window自带的关闭最小化等
    resizable: false, //禁止改变主窗口尺寸
    useContentSize: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  if (isDevMode) {
    await installExtension(VUEJS_DEVTOOLS);
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

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
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.