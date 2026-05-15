# Design Document: Desktop Calendar Widget

## Overview

The Desktop Calendar Widget is a Phase 1 MVP Electron desktop application for Windows. It presents a monthly calendar view and allows users to manage simple todo items per date. The application uses a layered architecture: an Electron main process handles all database access and IPC, while a Vue 3 renderer process handles all UI. Communication between the two processes is strictly through a typed `electronAPI` bridge exposed via Electron's `contextBridge`.

The tech stack is: **Electron** (main process shell), **Vue 3** (renderer UI framework), **Vite** (build tool and dev server), **better-sqlite3** (synchronous SQLite driver), and **plain JavaScript** (no TypeScript).

---

## Architecture

The application follows a strict two-process architecture enforced by Electron's security model.

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Main Process                    │
│                                                             │
│  main.js ──► windowManager.js ──► BrowserWindow            │
│      │                                                      │
│      ├──► database.js (better-sqlite3)                      │
│      └──► ipcHandlers.js (registers all ipcMain.handle)     │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │  IPC (contextBridge / electronAPI)
                       │  preload.js bridges the gap
┌──────────────────────▼──────────────────────────────────────┐
│                   Electron Renderer Process                  │
│                                                             │
│  src/main.js ──► Vue 3 App ──► Vue Router                   │
│                                                             │
│  pages/MainPage.vue                                         │
│    ├── components/Calendar/                                 │
│    │     ├── CalendarHeader.vue  (month nav + title)        │
│    │     ├── MonthView.vue       (7-col grid)               │
│    │     └── DayCell.vue         (single date cell)         │
│    └── components/Todo/                                     │
│          ├── TodoList.vue        (list for selected date)   │
│          ├── TodoItem.vue        (single todo row)          │
│          └── TodoEditorModal.vue (add todo dialog)          │
│                                                             │
│  services/todoService.js  (wraps electronAPI calls)         │
│  composables/useTodos.js  (reactive state + actions)        │
│  utils/dateUtils.js       (pure date helper functions)      │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **No direct SQLite in renderer**: The renderer never imports or calls better-sqlite3. All data access goes through `window.electronAPI`.
- **Synchronous SQLite**: better-sqlite3 is synchronous, which simplifies the main-process code. IPC calls are still async from the renderer's perspective.
- **Centralized IPC**: All `ipcMain.handle` registrations live in `ipcHandlers.js`. `main.js` calls `registerIpcHandlers(db)` once.
- **Service layer**: `todoService.js` wraps `window.electronAPI` calls so Vue components never call `window.electronAPI` directly. This makes components testable and decoupled.
- **Pure date utilities**: `dateUtils.js` contains only pure functions (no side effects), making them straightforward to test.

---

## Components and Interfaces

### Electron Main Process

#### `electron/main.js`
Entry point. Responsibilities:
- Initialize the database via `database.js`
- Register IPC handlers via `ipcHandlers.js`
- Create the main window via `windowManager.js`
- Handle `app.on('window-all-closed')` to quit on Windows

#### `electron/windowManager.js`
```javascript
// createMainWindow() → BrowserWindow
// - width: 1100, height: 700
// - webPreferences: { preload, contextIsolation: true, nodeIntegration: false }
// - loads VITE_DEV_SERVER_URL in dev, dist/index.html in prod
```

#### `electron/preload.js`
Exposes `electronAPI` on `window` using `contextBridge.exposeInMainWorld`:
```javascript
window.electronAPI = {
  getTodos:   (date)        => ipcRenderer.invoke('todos:get', date),
  addTodo:    (date, title) => ipcRenderer.invoke('todos:add', { date, title }),
  deleteTodo: (id)          => ipcRenderer.invoke('todos:delete', id),
  toggleTodo: (id)          => ipcRenderer.invoke('todos:toggle', id),
}
```

#### `electron/database.js`
```javascript
// initDatabase(dbPath) → db instance
//   - Opens or creates the SQLite file
//   - Runs CREATE TABLE IF NOT EXISTS todos (...)
//   - Returns the db instance for use in ipcHandlers

// getTodos(db, date) → Todo[]
// addTodo(db, date, title) → Todo
// deleteTodo(db, id) → { success: true }
// toggleTodo(db, id) → Todo
```

#### `electron/ipcHandlers.js`
```javascript
// registerIpcHandlers(db)
//   - ipcMain.handle('todos:get',    handler)
//   - ipcMain.handle('todos:add',    handler)
//   - ipcMain.handle('todos:delete', handler)
//   - ipcMain.handle('todos:toggle', handler)
// Each handler wraps database.js calls in try/catch
// Returns { data } on success, { error: message } on failure
```

### Vue Renderer Process

#### `src/services/todoService.js`
```javascript
// getTodos(date)        → Promise<Todo[]>
// addTodo(date, title)  → Promise<Todo>
// deleteTodo(id)        → Promise<{ success: true }>
// toggleTodo(id)        → Promise<Todo>
// All methods wrap window.electronAPI calls in try/catch
```

#### `src/composables/useTodos.js`
```javascript
// Reactive state:
//   todos: ref([])          — todos for the selected date
//   loading: ref(false)
//   error: ref(null)
//
// Actions:
//   loadTodos(date)
//   addTodo(date, title)
//   deleteTodo(id)
//   toggleTodo(id)
//
// Returns { todos, loading, error, loadTodos, addTodo, deleteTodo, toggleTodo }
```

#### `src/utils/dateUtils.js`
```javascript
// toISODate(date)           → string  e.g. "2025-07-15"
// getMonthGrid(year, month) → Day[][]  7-col grid, Mon-Sun
// prevMonth(year, month)    → { year, month }
// nextMonth(year, month)    → { year, month }
// isToday(dateStr)          → boolean
// isSameDate(a, b)          → boolean
// formatMonthYear(year, month) → string  e.g. "July 2025"
```

#### `src/pages/MainPage.vue`
Top-level page. Holds:
- `currentYear`, `currentMonth` (calendar navigation state)
- `selectedDate` (currently selected ISO date string)
- `todoDates` (set of ISO date strings that have todos, for dot indicators)
- Renders `CalendarHeader`, `MonthView`, `TodoList`, `TodoEditorModal`

#### `src/components/Calendar/CalendarHeader.vue`
Props: `year`, `month`
Emits: `prev`, `next`, `today`
Renders: month/year title, prev/next arrow buttons, Today button

#### `src/components/Calendar/MonthView.vue`
Props: `year`, `month`, `selectedDate`, `todoDates`
Emits: `select(dateStr)`, `open-modal(dateStr)`
Renders: 7-column grid of `DayCell` components

#### `src/components/Calendar/DayCell.vue`
Props: `date` (Date object), `isCurrentMonth`, `isToday`, `isSelected`, `hasTodo`
Emits: `click`, `dblclick`
Renders: date number, dot indicator (if hasTodo), applies CSS classes for states

#### `src/components/Todo/TodoList.vue`
Props: `todos`, `selectedDate`
Emits: `delete(id)`, `toggle(id)`
Renders: list of `TodoItem` components, empty state message

#### `src/components/Todo/TodoItem.vue`
Props: `todo` (`{ id, date, title, completed }`)
Emits: `delete(id)`, `toggle(id)`
Renders: checkbox, title (strikethrough if completed), delete button

#### `src/components/Todo/TodoEditorModal.vue`
Props: `date`, `visible`
Emits: `close`, `saved(todo)`
Renders: modal overlay, title input, Save button (disabled if empty/whitespace), handles Escape key

---

## Data Models

### Todo (SQLite row / JS object)

```javascript
{
  id:        number,   // INTEGER PRIMARY KEY AUTOINCREMENT
  date:      string,   // ISO date string, e.g. "2025-07-15"
  title:     string,   // TEXT NOT NULL
  completed: number    // INTEGER, 0 = false, 1 = true
}
```

### SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS todos (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  date      TEXT    NOT NULL,
  title     TEXT    NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_todos_date ON todos(date);
```

### IPC Response Envelope

All IPC handlers return one of:
```javascript
{ data: <result> }   // success
{ error: <string> }  // failure
```

### Calendar Day Object (internal to dateUtils)

```javascript
{
  date:           Date,    // JS Date object
  dateStr:        string,  // ISO date string "YYYY-MM-DD"
  isCurrentMonth: boolean,
  isToday:        boolean,
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This feature involves pure date utility functions, database CRUD operations, and data transformation logic — all of which are well-suited to property-based testing. The UI rendering and Electron IPC wiring are tested with example-based and smoke tests instead.

The property-based testing library used is **[fast-check](https://github.com/dubzzz/fast-check)** (JavaScript).

---

### Property 1: Calendar grid always has 7 columns

*For any* valid year and month (1–12), the calendar grid generated by `getMonthGrid(year, month)` shall have exactly 7 cells in every row, and every cell in the grid shall belong to exactly one row.

**Validates: Requirements 5.1, 5.3**

---

### Property 2: Calendar grid contains all days of the month

*For any* valid year and month, the calendar grid generated by `getMonthGrid(year, month)` shall contain a cell for every day of that month (i.e., all day numbers 1 through N where N is the number of days in that month) with `isCurrentMonth: true`.

**Validates: Requirements 5.2**

---

### Property 3: Calendar grid total cells is a multiple of 7

*For any* valid year and month, the total number of cells in the calendar grid shall be a multiple of 7 (complete rows only, no partial rows).

**Validates: Requirements 5.3**

---

### Property 4: Month navigation is a round trip

*For any* valid year and month, calling `nextMonth` followed by `prevMonth` shall return the original year and month. Equivalently, calling `prevMonth` followed by `nextMonth` shall return the original year and month.

**Validates: Requirements 6.1, 6.2**

---

### Property 5: Todo persistence round trip

*For any* valid ISO date string and non-empty title, adding a todo via `addTodo(db, date, title)` and then retrieving todos via `getTodos(db, date)` shall return a list that includes a todo with the same date and title.

**Validates: Requirements 3.4, 4.4, 4.5**

---

### Property 6: getTodos returns only todos for the requested date

*For any* set of todos stored across multiple dates, calling `getTodos(db, date)` shall return only todos whose `date` field exactly matches the requested date — no todos from other dates shall appear in the result.

**Validates: Requirements 4.4**

---

### Property 7: deleteTodo removes the todo

*For any* existing todo, after calling `deleteTodo(db, id)`, calling `getTodos(db, date)` for that todo's date shall not include a todo with that `id`.

**Validates: Requirements 4.6, 10.3**

---

### Property 8: toggleTodo is an involution (double-toggle round trip)

*For any* existing todo with any `completed` value, calling `toggleTodo(db, id)` twice shall return the todo to its original `completed` state.

**Validates: Requirements 4.7, 11.1, 11.2**

---

### Property 9: Database initialization is idempotent

*For any* number of calls to `initDatabase`, the resulting database shall always have a valid `todos` table with the correct schema — calling it multiple times shall not corrupt or duplicate the table.

**Validates: Requirements 3.2**

---

### Property 10: IPC error responses are always structured

*For any* invalid input to an IPC handler (null id, empty date, missing title, non-existent id), the handler shall return an object with an `error` string field and shall not throw an unhandled exception.

**Validates: Requirements 4.8, 12.1**

---

### Property 11: Save button disabled for whitespace-only titles

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), the `TodoEditorModal` save button shall be disabled (i.e., the title validation function shall return false).

**Validates: Requirements 9.3**

---

### Property 12: toISODate produces valid ISO 8601 date strings

*For any* valid JavaScript Date object, `toISODate(date)` shall return a string matching the pattern `YYYY-MM-DD` where YYYY is a 4-digit year, MM is a 2-digit month (01–12), and DD is a 2-digit day (01–31).

**Validates: Requirements 3.3**

---

## Error Handling

### Main Process Error Strategy

All database functions in `database.js` are wrapped in try/catch. On error, they throw a descriptive Error object. All IPC handlers in `ipcHandlers.js` catch these errors and return `{ error: err.message }` instead of letting the error propagate to Electron's unhandled exception handler.

```javascript
// Pattern used in every ipcMain.handle:
ipcMain.handle('todos:add', async (event, { date, title }) => {
  try {
    const todo = addTodo(db, date, title)
    return { data: todo }
  } catch (err) {
    console.error('[IPC todos:add]', err)
    return { error: err.message }
  }
})
```

### Renderer Process Error Strategy

All `todoService.js` methods check the IPC response envelope:

```javascript
async function addTodo(date, title) {
  try {
    const result = await window.electronAPI.addTodo(date, title)
    if (result.error) throw new Error(result.error)
    return result.data
  } catch (err) {
    throw err  // re-throw for composable to handle
  }
}
```

The `useTodos` composable sets `error.value` on failure, and components display the error to the user.

### Input Validation

- `addTodo`: title must be a non-empty string after trimming whitespace; date must be a valid ISO date string
- `deleteTodo`: id must be a positive integer
- `toggleTodo`: id must be a positive integer
- `getTodos`: date must be a non-empty string

---

## Testing Strategy

### Dual Testing Approach

Unit/property tests cover the pure logic layer. Integration/smoke tests cover the Electron wiring.

### Property-Based Tests (fast-check)

Each correctness property defined above maps to one property-based test. Tests run a minimum of 100 iterations each.

**Library**: `fast-check` (npm install --save-dev fast-check)
**Test runner**: Vitest (compatible with Vite projects)

Tag format for each test:
```javascript
// Feature: desktop-calendar-widget, Property N: <property text>
```

Properties to implement as PBT:
- Property 1, 2, 3: `dateUtils.getMonthGrid` — pure function, ideal for PBT
- Property 4: `dateUtils.prevMonth` / `nextMonth` — pure functions
- Property 5, 6, 7, 8, 9, 10: `database.js` functions — use an in-memory SQLite database (`:memory:`) for fast, isolated tests
- Property 11: title validation function extracted from `TodoEditorModal`
- Property 12: `dateUtils.toISODate`

### Unit / Example Tests

- Smoke test: `electronAPI` methods exist on `window` (renderer integration)
- Example test: `app.on('window-all-closed')` quits the app on Windows
- Example test: `TodoEditorModal` closes on Escape key
- Example test: `TodoEditorModal` Save button disabled when title is empty string
- Example test: `getTodos` returns empty array for a date with no todos

### What Is NOT Property-Tested

- Electron window creation and BrowserWindow configuration (smoke test)
- Vue component rendering and CSS visual states (snapshot/visual tests)
- IPC channel wiring end-to-end (integration test with a real Electron instance)
- npm install / npm run dev (manual smoke test)
