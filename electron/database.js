const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

let db = null

function getDbPath() {
  const { app } = require('electron')
  if (!app.isPackaged) {
    return path.join(__dirname, '../calendar.db')
  }
  return path.join(app.getPath('userData'), 'calendar.db')
}

function initDatabase() {
  const dbPath = getDbPath()
  console.log('[DB] path:', dbPath)

  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      priority TEXT NOT NULL DEFAULT 'medium',
      color TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  console.log('[DB] tables ready')
  return db
}

function getDb() {
  if (!db) {
    throw new Error('DB not initialized. Call initDatabase() first.')
  }
  return db
}

module.exports = { initDatabase, getDb }
