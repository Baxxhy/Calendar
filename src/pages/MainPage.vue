<template>
  <div class="main-page">
    <CalendarHeader
      :title="headerTitle"
      :current-view="currentView"
      @prev="onPrev"
      @next="onNext"
      @go-today="onGoToday"
      @change-view="onChangeView"
      @open-settings="showSettingsTip = true"
      @open-widget="showWidgetTip = true"
    />

    <div class="main-body">
      <div v-if="currentView === 'list'" class="list-area">
        <div class="all-todos">
          <div class="all-todos-header">
            <div>
              <h2>清单</h2>
              <span>{{ allTodosList.length }} 个待办</span>
            </div>
            <button class="btn-add-list" @click="onOpenAddModal(selectedDate)">
              + 添加待办
            </button>
          </div>

          <div v-if="allTodosList.length === 0" class="list-empty">
            还没有待办
          </div>

          <div v-else class="all-todos-body">
            <section
              v-for="group in allTodoGroups"
              :key="group.date"
              class="todo-date-group"
            >
              <div class="group-date">{{ group.date }}</div>
              <TodoItem
                v-for="todo in group.todos"
                :key="todo.id"
                :todo="todo"
                @toggle="onToggleTodo"
                @delete="onDeleteTodo"
              />
            </section>
          </div>
        </div>
      </div>

      <div v-else class="calendar-area">
        <MonthView
          v-if="currentView === 'month'"
          :year="currentYear"
          :month="currentMonth"
          :selected-date="selectedDate"
          :all-todos-by-date="allTodosByDate"
          @select-date="onSelectDate"
          @add-todo="onOpenAddModal"
        />
        <WeekView
          v-else-if="currentView === 'week'"
          :selected-date="selectedDate"
          :all-todos-by-date="allTodosByDate"
          @select-date="onSelectDate"
          @add-todo="onOpenAddModal"
        />
      </div>

      <div class="sidebar">
        <TodoList
          :todos="todos"
          :selected-date="selectedDate"
          :loading="loading"
          @toggle="onToggleTodo"
          @delete="onDeleteTodo"
          @add="onOpenAddModal"
        />
      </div>
    </div>

    <TodoEditorModal
      v-if="showAddModal"
      :date="modalDate"
      @save="onSaveTodo"
      @close="showAddModal = false"
    />

    <div v-if="showSettingsTip" class="tip-modal-overlay" @click.self="showSettingsTip = false">
      <div class="tip-modal">
        <div class="tip-title">设置</div>
        <div class="setting-group">
          <div class="setting-label">主题</div>
          <div class="choice-row">
            <button
              class="choice-btn"
              :class="{ active: themeMode === 'light' }"
              @click="setThemeMode('light')"
            >
              明亮
            </button>
            <button
              class="choice-btn"
              :class="{ active: themeMode === 'dark' }"
              @click="setThemeMode('dark')"
            >
              暗色
            </button>
          </div>
        </div>
        <button class="tip-btn" @click="showSettingsTip = false">完成</button>
      </div>
    </div>

    <div v-if="showWidgetTip" class="tip-modal-overlay" @click.self="showWidgetTip = false">
      <div class="tip-modal">
        <div class="tip-title">桌面小组件</div>
        <div class="tip-body">选择要贴到桌面的内容，窗口顶部可以拖动。</div>
        <div class="choice-row">
          <button class="choice-btn" @click="openWidget('calendar')">日历</button>
          <button class="choice-btn" @click="openWidget('list')">清单</button>
        </div>
        <button class="tip-btn secondary" @click="showWidgetTip = false">取消</button>
      </div>
    </div>

    <div v-if="errorMsg" class="error-toast">
      {{ errorMsg }}
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import CalendarHeader from '../components/Calendar/CalendarHeader.vue'
import MonthView from '../components/Calendar/MonthView.vue'
import WeekView from '../components/Calendar/WeekView.vue'
import TodoList from '../components/Todo/TodoList.vue'
import TodoItem from '../components/Todo/TodoItem.vue'
import TodoEditorModal from '../components/Todo/TodoEditorModal.vue'
import { addDays, getMonthTitle, getWeekRangeTitle, nextMonth, prevMonth, today } from '../utils/dateUtils.js'
import { useTodos } from '../composables/useTodos.js'
import { getAllTodos } from '../services/todoService.js'

const storedTheme = localStorage.getItem('theme-mode') || 'light'
const themeMode = ref(storedTheme)
document.documentElement.dataset.mode = storedTheme
document.body.dataset.mode = storedTheme

const currentView = ref('month')
const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth())
const selectedDate = ref(today())
const allTodosByDate = ref({})
const showAddModal = ref(false)
const modalDate = ref('')
const showSettingsTip = ref(false)
const showWidgetTip = ref(false)
const errorMsg = ref('')
let errorTimer = null

const { todos, loading, loadTodosByDate, addTodo, deleteTodo, toggleTodo } = useTodos()

const headerTitle = computed(() => {
  if (currentView.value === 'week') {
    return getWeekRangeTitle(selectedDate.value)
  }
  return getMonthTitle(currentYear.value, currentMonth.value)
})

const allTodosList = computed(() =>
  Object.values(allTodosByDate.value)
    .flat()
    .sort((a, b) => {
      const dateCompare = String(a.date).localeCompare(String(b.date))
      if (dateCompare !== 0) return dateCompare
      return String(a.created_at || '').localeCompare(String(b.created_at || ''))
    })
)

const allTodoGroups = computed(() =>
  allTodosList.value.reduce((groups, todo) => {
    const last = groups[groups.length - 1]
    if (!last || last.date !== todo.date) {
      groups.push({ date: todo.date, todos: [todo] })
    } else {
      last.todos.push(todo)
    }
    return groups
  }, [])
)

function showError(msg) {
  errorMsg.value = msg
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => { errorMsg.value = '' }, 3000)
}

function setThemeMode(mode) {
  themeMode.value = mode
  localStorage.setItem('theme-mode', mode)
  document.documentElement.dataset.mode = mode
  document.body.dataset.mode = mode
}

async function loadAllTodosForMonth() {
  try {
    const all = await getAllTodos()
    const grouped = {}
    all.forEach(todo => {
      if (!grouped[todo.date]) grouped[todo.date] = []
      grouped[todo.date].push(todo)
    })
    allTodosByDate.value = grouped
  } catch (err) {
    console.error('Failed to load todos for calendar:', err)
  }
}

function onSelectDate(dateStr) {
  selectedDate.value = dateStr
  const date = new Date(dateStr + 'T00:00:00')
  currentYear.value = date.getFullYear()
  currentMonth.value = date.getMonth()
}

function onPrev() {
  if (currentView.value === 'week') {
    onSelectDate(addDays(selectedDate.value, -7))
    return
  }
  const next = prevMonth(currentYear.value, currentMonth.value)
  currentYear.value = next.year
  currentMonth.value = next.month
}

function onNext() {
  if (currentView.value === 'week') {
    onSelectDate(addDays(selectedDate.value, 7))
    return
  }
  const next = nextMonth(currentYear.value, currentMonth.value)
  currentYear.value = next.year
  currentMonth.value = next.month
}

function onGoToday() {
  const date = new Date()
  currentYear.value = date.getFullYear()
  currentMonth.value = date.getMonth()
  onSelectDate(today())
}

function onChangeView(view) {
  currentView.value = view
}

function onOpenAddModal(dateStr) {
  modalDate.value = dateStr || selectedDate.value
  showAddModal.value = true
}

async function onSaveTodo(todoData) {
  try {
    await addTodo(todoData)
    showAddModal.value = false
    await loadAllTodosForMonth()
    if (todoData.date !== selectedDate.value) {
      onSelectDate(todoData.date)
    } else {
      await loadTodosByDate(selectedDate.value)
    }
  } catch (err) {
    showError(err.message || '保存失败，请重试')
  }
}

async function onDeleteTodo(id) {
  try {
    await deleteTodo(id)
    await loadAllTodosForMonth()
  } catch (err) {
    showError(err.message || '删除失败，请重试')
  }
}

async function onToggleTodo(id) {
  try {
    await toggleTodo(id)
    await loadAllTodosForMonth()
  } catch (err) {
    showError(err.message || '操作失败，请重试')
  }
}

async function openWidget(mode) {
  showWidgetTip.value = false
  await window.electronAPI?.openWidget?.(mode)
}

function onKeydown(e) {
  if (e.ctrlKey && e.key === 't') {
    e.preventDefault()
    onGoToday()
  }
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault()
    onOpenAddModal(selectedDate.value)
  }
  if (e.key === 'Escape') {
    showSettingsTip.value = false
    showWidgetTip.value = false
  }
}

onMounted(async () => {
  await loadAllTodosForMonth()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(errorTimer)
})

watch([currentYear, currentMonth], () => {
  loadAllTodosForMonth()
})

watch(selectedDate, (date) => {
  loadTodosByDate(date)
}, { immediate: true })
</script>

<style scoped>
.main-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-app);
  overflow: hidden;
}

.main-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.calendar-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-surface);
}

.list-area {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  background: var(--bg-surface);
}

.all-todos {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-surface);
}

.all-todos-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.all-todos-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.all-todos-header span {
  font-size: 12px;
  color: var(--text-muted);
}

.btn-add-list {
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: var(--text-on-primary);
  font-size: 13px;
}

.btn-add-list:hover {
  background: var(--primary-dark);
}

.all-todos-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px 16px;
}

.todo-date-group {
  margin-bottom: 14px;
}

.group-date {
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.list-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 13px;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  overflow: hidden;
}

.tip-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.tip-modal {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px 28px;
  box-shadow: var(--shadow-lg);
  min-width: 300px;
  text-align: center;
}

.tip-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.tip-body {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 18px;
}

.setting-group {
  display: grid;
  grid-template-columns: 56px 1fr;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.setting-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.choice-row {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.setting-group .choice-row {
  justify-content: stretch;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-app);
}

.choice-btn {
  flex: 1;
  min-width: 76px;
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: background var(--transition), color var(--transition), box-shadow var(--transition);
}

.choice-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.choice-btn.active {
  background: var(--bg-surface);
  color: var(--primary);
  border-color: var(--border-light);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

.tip-btn {
  padding: 8px 24px;
  background: var(--primary);
  color: var(--text-on-primary);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 18px;
}

.tip-btn.secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.tip-btn:hover {
  background: var(--primary-dark);
}

.tip-btn.secondary:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.error-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #d13438;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  box-shadow: var(--shadow-md);
  z-index: 2000;
}
</style>
