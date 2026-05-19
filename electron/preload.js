const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getTodosByDate: (date)        => ipcRenderer.invoke('todos:getByDate', date),
  getAllTodos:    ()             => ipcRenderer.invoke('todos:getAll'),
  addTodo:       (todo)         => ipcRenderer.invoke('todos:add', todo),
  updateTodo:    (todo)         => ipcRenderer.invoke('todos:update', todo),
  deleteTodo:    (id)           => ipcRenderer.invoke('todos:delete', id),
  toggleTodo:    (id)           => ipcRenderer.invoke('todos:toggle', id),
  getTodoDates:  (year, month)  => ipcRenderer.invoke('todos:getDates', year, month),
  openWidget:    (mode)         => ipcRenderer.invoke('widget:open', mode),
  setThemeMode:   (mode)         => ipcRenderer.send('theme:set-mode', mode),
  onThemeModeChanged: (callback) => {
    const listener = (event, mode) => callback(mode)
    ipcRenderer.on('theme:mode-changed', listener)
    return () => ipcRenderer.removeListener('theme:mode-changed', listener)
  },
  showWidgetMenu: ()            => ipcRenderer.send('widget:show-menu'),
  closeCurrentWindow: ()        => ipcRenderer.send('window:close-current')
})
