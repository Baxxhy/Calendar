# Requirements Document

## Introduction

A Phase 1 MVP Desktop Calendar Widget built with Electron + Vue 3 + JavaScript + SQLite + Vite. The application runs as a native Windows desktop window, displays a monthly calendar view, and allows users to manage simple todo items per date. Todos persist across app restarts via a local SQLite database. The UI is inspired by Microsoft To Do and Windows Calendar — clean, modern, and light-themed.

## Glossary

- **App**: The Electron desktop application as a whole
- **Main_Process**: The Electron main process (Node.js environment) responsible for window management, IPC handling, and database access
- **Renderer_Process**: The Vue 3 frontend running inside the Electron BrowserWindow
- **Calendar**: The month-view calendar component displayed in the main window
- **Day_Cell**: A single date cell within the Calendar grid
- **Todo**: A task item associated with a specific calendar date, stored in SQLite
- **Todo_Modal**: The dialog that opens when a user double-clicks a Day_Cell, used to add a new Todo
- **IPC**: Inter-Process Communication channel between Main_Process and Renderer_Process via Electron's contextBridge
- **electronAPI**: The object exposed on `window.electronAPI` in the Renderer_Process for all IPC calls
- **Database**: The SQLite database file managed by better-sqlite3 in the Main_Process
- **Selected_Date**: The date the user has most recently clicked or interacted with
- **Today**: The current calendar date according to the system clock

---

## Requirements

### Requirement 1: Project Initialization and Build Setup

**User Story:** As a developer, I want a properly configured Electron + Vue 3 + JavaScript + Vite project, so that I can run and build the application reliably.

#### Acceptance Criteria

1. THE App SHALL use Electron, Vue 3, Vite, and better-sqlite3 as its core dependencies with no TypeScript, React, Tauri, or Rust.
2. WHEN a developer runs `npm install`, THE App SHALL install all dependencies without errors.
3. WHEN a developer runs `npm run dev`, THE App SHALL launch the Electron window with the Vue renderer loaded.
4. THE App SHALL follow the project structure with `electron/` for main-process files and `src/` for renderer files.

---

### Requirement 2: Electron Main Process Configuration

**User Story:** As a developer, I want a correctly configured Electron main process, so that the application window launches and IPC communication works.

#### Acceptance Criteria

1. THE Main_Process SHALL create a BrowserWindow on application startup with appropriate width, height, and security settings.
2. THE Main_Process SHALL load the Vite dev server URL in development mode and the built `index.html` in production mode.
3. THE Main_Process SHALL register all IPC handlers via `ipcHandlers.js` before the window is shown.
4. THE Main_Process SHALL initialize the Database connection via `database.js` before registering IPC handlers.
5. WHEN the last window is closed on Windows, THE Main_Process SHALL quit the application.
6. THE Main_Process SHALL use a `preload.js` script to expose `electronAPI` on the `window` object in the Renderer_Process via Electron's `contextBridge`.

---

### Requirement 3: SQLite Database Setup and Persistence

**User Story:** As a user, I want my todos to be saved locally, so that they persist after I close and reopen the application.

#### Acceptance Criteria

1. THE Database SHALL be initialized using better-sqlite3 in the Main_Process only; the Renderer_Process SHALL NOT access SQLite directly.
2. WHEN the App starts, THE Database SHALL create a `todos` table if it does not already exist, with columns: `id` (integer primary key autoincrement), `date` (text, ISO string), `title` (text), `completed` (integer, 0 or 1).
3. THE Database SHALL store all date values as ISO 8601 date strings (e.g., `"2025-07-15"`) to ensure timezone safety.
4. WHEN the App is closed and reopened, THE Database SHALL retain all previously saved Todo records.
5. IF a database operation fails, THEN THE Main_Process SHALL return a structured error response to the Renderer_Process without crashing.

---

### Requirement 4: IPC Communication Layer

**User Story:** As a developer, I want all frontend-to-backend communication centralized through IPC, so that the architecture remains clean and maintainable.

#### Acceptance Criteria

1. THE Renderer_Process SHALL communicate with the Main_Process exclusively through `window.electronAPI` methods.
2. THE Main_Process SHALL centralize all IPC handler registrations in `ipcHandlers.js`.
3. THE electronAPI SHALL expose the following methods: `getTodos(date)`, `addTodo(date, title)`, `deleteTodo(id)`, `toggleTodo(id)`.
4. WHEN `getTodos(date)` is called, THE Main_Process SHALL return all Todo records matching the given ISO date string.
5. WHEN `addTodo(date, title)` is called, THE Main_Process SHALL insert a new Todo record and return the created record including its generated `id`.
6. WHEN `deleteTodo(id)` is called, THE Main_Process SHALL delete the Todo record with the matching `id` and return a success indicator.
7. WHEN `toggleTodo(id)` is called, THE Main_Process SHALL flip the `completed` value of the matching Todo record and return the updated record.
8. IF any IPC handler receives invalid input, THEN THE Main_Process SHALL return a structured error object without throwing an unhandled exception.

---

### Requirement 5: Month View Calendar Display

**User Story:** As a user, I want to see a monthly calendar grid, so that I can view and navigate dates visually.

#### Acceptance Criteria

1. THE Calendar SHALL display a 7-column grid with column headers Monday through Sunday (Mon–Sun order).
2. THE Calendar SHALL display all days of the current visible month in the grid.
3. THE Calendar SHALL display trailing days from the previous month and leading days of the next month to fill incomplete grid rows, rendered in a visually dimmed style.
4. THE Calendar SHALL display the current month name and year in a header above the grid.
5. THE Calendar SHALL highlight Today's Day_Cell with a distinct primary color indicator.
6. THE Calendar SHALL highlight the Selected_Date Day_Cell with a distinct secondary color indicator different from Today's highlight.
7. WHEN a date has one or more associated Todos, THE Day_Cell SHALL display a small dot indicator below the date number.

---

### Requirement 6: Calendar Navigation

**User Story:** As a user, I want to navigate between months and return to today, so that I can view and manage todos across different dates.

#### Acceptance Criteria

1. THE Calendar SHALL provide a "previous month" button that, WHEN clicked, navigates the Calendar to the preceding month.
2. THE Calendar SHALL provide a "next month" button that, WHEN clicked, navigates the Calendar to the following month.
3. THE Calendar SHALL provide a "Today" button that, WHEN clicked, navigates the Calendar to the month containing Today and sets the Selected_Date to Today.
4. WHEN the Calendar navigates to a different month, THE Calendar SHALL update the month name and year in the header accordingly.
5. WHEN the Calendar navigates to a different month, THE Calendar SHALL reload Todo dot indicators for all visible dates.

---

### Requirement 7: Date Selection

**User Story:** As a user, I want to select a date by clicking on it, so that I can view and manage todos for that specific date.

#### Acceptance Criteria

1. WHEN a user single-clicks a Day_Cell, THE Calendar SHALL set that date as the Selected_Date and display its Todos in the Todo list panel.
2. THE Calendar SHALL visually distinguish the Selected_Date from other dates and from Today.
3. WHEN the Selected_Date changes, THE Renderer_Process SHALL fetch and display the Todos for the newly selected date.

---

### Requirement 8: Todo List Display

**User Story:** As a user, I want to see the todos for a selected date, so that I can review and manage my tasks.

#### Acceptance Criteria

1. WHEN a Selected_Date is set, THE Renderer_Process SHALL display all Todos associated with that date in a list.
2. THE Todo list SHALL display each Todo's title.
3. THE Todo list SHALL display a checkbox for each Todo reflecting its `completed` state.
4. WHEN a Todo's `completed` value is true, THE Todo list SHALL render the Todo title with a strikethrough style.
5. WHEN no Todos exist for the Selected_Date, THE Renderer_Process SHALL display an empty state message.

---

### Requirement 9: Add Todo

**User Story:** As a user, I want to add a new todo by double-clicking a date, so that I can quickly capture tasks for that day.

#### Acceptance Criteria

1. WHEN a user double-clicks a Day_Cell, THE Renderer_Process SHALL open the Todo_Modal for that date.
2. THE Todo_Modal SHALL contain a text input field for the Todo title.
3. THE Todo_Modal SHALL contain a "Save" button that is disabled WHEN the title input is empty or contains only whitespace.
4. WHEN the user submits a valid title via the Save button, THE Renderer_Process SHALL call `addTodo(date, title)` and close the Todo_Modal.
5. WHEN a new Todo is successfully added, THE Renderer_Process SHALL refresh the Todo list for the Selected_Date and update the dot indicator on the corresponding Day_Cell.
6. WHEN the user presses the Escape key while the Todo_Modal is open, THE Renderer_Process SHALL close the Todo_Modal without saving.
7. IF `addTodo` returns an error, THEN THE Renderer_Process SHALL display an error message to the user without closing the Todo_Modal.

---

### Requirement 10: Delete Todo

**User Story:** As a user, I want to delete a todo with a confirmation step, so that I don't accidentally remove tasks.

#### Acceptance Criteria

1. THE Todo list SHALL display a delete button for each Todo item.
2. WHEN a user clicks the delete button, THE Renderer_Process SHALL display a confirmation prompt before deleting.
3. WHEN the user confirms deletion, THE Renderer_Process SHALL call `deleteTodo(id)` and remove the Todo from the list.
4. WHEN the user cancels the confirmation, THE Renderer_Process SHALL take no action and leave the Todo list unchanged.
5. WHEN a Todo is deleted and no Todos remain for that date, THE Renderer_Process SHALL remove the dot indicator from the corresponding Day_Cell.
6. IF `deleteTodo` returns an error, THEN THE Renderer_Process SHALL display an error message to the user.

---

### Requirement 11: Toggle Todo Completion

**User Story:** As a user, I want to mark a todo as complete or incomplete, so that I can track my progress.

#### Acceptance Criteria

1. WHEN a user clicks the checkbox of a Todo item, THE Renderer_Process SHALL call `toggleTodo(id)`.
2. WHEN `toggleTodo` succeeds, THE Renderer_Process SHALL update the Todo item's visual state to reflect the new `completed` value without reloading the full list.
3. WHEN a Todo is marked complete, THE Todo list SHALL render its title with a strikethrough style.
4. WHEN a Todo is marked incomplete, THE Todo list SHALL render its title without strikethrough.

---

### Requirement 12: Error Handling and Stability

**User Story:** As a user, I want the application to handle errors gracefully, so that it does not crash or produce confusing behavior.

#### Acceptance Criteria

1. THE App SHALL wrap all IPC handler logic in try/catch blocks and return structured error objects on failure.
2. THE Renderer_Process SHALL wrap all `electronAPI` calls in try/catch blocks and display user-facing error messages on failure.
3. WHEN the App starts, THE Main_Process SHALL log any database initialization errors to the console without crashing the application.
4. THE App SHALL produce no unhandled promise rejections or uncaught exceptions during normal operation.
