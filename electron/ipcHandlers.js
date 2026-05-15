const { ipcMain } = require('electron')
const { getDb } = require('./database')
const { v4: uuidv4 } = require('uuid')

function registerIpcHandlers() {

  // Get todos by date
  ipcMain.handle('todos:getByDate', (event, date) => {
    try {
      const db = getDb()
      return db.prepare('SELECT * FROM todos WHERE date = ? ORDER BY created_at ASC').all(date)
    } catch (err) {
      console.error('todos:getByDate error:', err)
      throw err
    }
  })

  // Get all todos
  ipcMain.handle('todos:getAll', () => {
    try {
      const db = getDb()
      return db.prepare('SELECT * FROM todos ORDER BY date DESC, created_at ASC').all()
    } catch (err) {
      console.error('todos:getAll error:', err)
      throw err
    }
  })

  // Add todo
  ipcMain.handle('todos:add', (event, todo) => {
    try {
      const db = getDb()
      const now = new Date().toISOString()
      const id = uuidv4()

      db.prepare(`
        INSERT INTO todos (id, title, description, date, completed, priority, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)
      `).run(id, todo.title, todo.description || null, todo.date, todo.priority || 'medium', todo.color || null, now, now)

      return db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
    } catch (err) {
      console.error('todos:add error:', err)
      throw err
    }
  })

  // Update todo
  ipcMain.handle('todos:update', (event, todo) => {
    try {
      const db = getDb()
      const now = new Date().toISOString()

      db.prepare(`
        UPDATE todos SET title=?, description=?, date=?, priority=?, color=?, updated_at=? WHERE id=?
      `).run(todo.title, todo.description || null, todo.date, todo.priority || 'medium', todo.color || null, now, todo.id)

      return db.prepare('SELECT * FROM todos WHERE id = ?').get(todo.id)
    } catch (err) {
      console.error('todos:update error:', err)
      throw err
    }
  })

  // Delete todo
  ipcMain.handle('todos:delete', (event, id) => {
    try {
      const db = getDb()
      const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id)
      return { success: result.changes > 0 }
    } catch (err) {
      console.error('todos:delete error:', err)
      throw err
    }
  })

  // Toggle todo completed
  ipcMain.handle('todos:toggle', (event, id) => {
    try {
      const db = getDb()
      const now = new Date().toISOString()
      const todo = db.prepare('SELECT completed FROM todos WHERE id = ?').get(id)
      if (!todo) throw new Error('Todo not found: ' + id)

      const newVal = todo.completed === 0 ? 1 : 0
      db.prepare('UPDATE todos SET completed=?, updated_at=? WHERE id=?').run(newVal, now, id)
      return db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
    } catch (err) {
      console.error('todos:toggle error:', err)
      throw err
    }
  })

  // Get dates that have todos in a given year/month
  ipcMain.handle('todos:getDates', (event, year, month) => {
    try {
      const db = getDb()
      const monthStr = `${year}-${String(month).padStart(2, '0')}`
      const rows = db.prepare(`
        SELECT date,
               COUNT(*) as count,
               SUM(CASE WHEN completed=0 THEN 1 ELSE 0 END) as uncompleted
        FROM todos WHERE date LIKE ?
        GROUP BY date
      `).all(`${monthStr}%`)

      const result = {}
      rows.forEach(r => { result[r.date] = { count: r.count, uncompleted: r.uncompleted } })
      return result
    } catch (err) {
      console.error('todos:getDates error:', err)
      throw err
    }
  })

  console.log('[IPC] all handlers registered')
}

module.exports = { registerIpcHandlers }
