process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', err)
})

const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = !app.isPackaged

if (isDev) {
  const userDataPath = path.join(__dirname, '../.electron-data')
  fs.mkdirSync(userDataPath, { recursive: true })
  app.setPath('userData', userDataPath)
  app.disableHardwareAcceleration()
  app.commandLine.appendSwitch('disable-gpu')
  app.commandLine.appendSwitch('disable-gpu-compositing')
  app.commandLine.appendSwitch('disable-gpu-sandbox')
}

console.log('[MAIN] starting, isDev =', isDev)

const { initDatabase } = require('./database')
const { registerIpcHandlers } = require('./ipcHandlers')

console.log('[MAIN] modules loaded')

let mainWindow = null
let widgetWindow = null

function loadAppRoute(window, route) {
  if (isDev) {
    window.loadURL(`http://localhost:5173/#${route}`)
  } else {
    window.loadFile(path.join(__dirname, '../dist/index.html'), { hash: route })
  }
}

function createMainWindow() {
  console.log('[MAIN] creating window')
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    title: 'Desktop Calendar Widget',
    backgroundColor: '#f3f3f3',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (isDev) {
    loadAppRoute(mainWindow, '/')
    if (process.env.OPEN_DEVTOOLS === 'true') {
      mainWindow.webContents.openDevTools()
    }
  } else {
    loadAppRoute(mainWindow, '/')
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createWidgetWindow(mode = 'calendar') {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.show()
    widgetWindow.focus()
    loadAppRoute(widgetWindow, `/widget?mode=${mode}`)
    return
  }

  widgetWindow = new BrowserWindow({
    width: 860,
    height: 620,
    minWidth: 720,
    minHeight: 520,
    title: 'Calendar Widget',
    frame: false,
    resizable: true,
    movable: true,
    skipTaskbar: true,
    alwaysOnTop: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  loadAppRoute(widgetWindow, `/widget?mode=${mode}`)

  widgetWindow.once('ready-to-show', () => {
    widgetWindow.show()
  })

  widgetWindow.on('closed', () => {
    widgetWindow = null
  })
}

function onReady() {
  console.log('[MAIN] app ready')

  // 隐藏默认菜单栏（File/Edit/View/Window/Help）
  Menu.setApplicationMenu(null)

  try {
    initDatabase()
    console.log('[MAIN] db init ok')
  } catch (err) {
    console.error('[MAIN] db init failed:', err)
  }

  try {
    registerIpcHandlers()
    console.log('[MAIN] ipc registered')
  } catch (err) {
    console.error('[MAIN] ipc register failed:', err)
  }

  createMainWindow()
}

ipcMain.handle('widget:open', (event, mode) => {
  createWidgetWindow(mode === 'list' ? 'list' : 'calendar')
})

ipcMain.on('window:close-current', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window) {
    window.close()
  }
})

ipcMain.on('widget:show-menu', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window) return

  const menu = Menu.buildFromTemplate([
    {
      label: '关闭桌面组件',
      click: () => window.close()
    }
  ])
  menu.popup({ window })
})

// Use app.on('ready') instead of app.whenReady().then()
app.on('ready', onReady)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})
