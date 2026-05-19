<template>
  <div
    class="widget-page"
    :class="{ pinned }"
    :style="{ '--widget-opacity': widgetOpacity }"
    @contextmenu.prevent="showContextMenu"
  >
    <div class="widget-titlebar">
      <div class="drag-handle" title="拖动小组件"></div>

      <div class="widget-nav">
        <button class="icon-btn" title="上个月" @click="onPrevMonth">‹</button>
        <strong>{{ title }}</strong>
        <button class="icon-btn" title="下个月" @click="onNextMonth">›</button>
        <button class="today-btn" title="回到今天" @click="onGoToday">今天</button>
      </div>

      <div class="widget-actions">
        <button
          v-if="mode === 'calendar'"
          class="detail-btn"
          :class="{ active: showDetail }"
          :title="showDetail ? '隐藏右侧详情' : '显示右侧详情'"
          @click="showDetail = !showDetail"
        >
          详情
        </button>
        <input
          v-model="widgetOpacity"
          class="opacity-slider"
          title="透明度"
          type="range"
          min="0.2"
          max="0.95"
          step="0.05"
        />
        <button
          class="pin-btn"
          :class="{ active: pinned }"
          :title="pinned ? '已钉住，窗口不能拖动' : '钉住窗口'"
          @click="pinned = !pinned"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 4l6 6-2 2-1.4-1.4-3.5 3.5.4 3.9-1.3 1.3-3.2-3.2-4.1 4.1-1.1-1.1 4.1-4.1-3.2-3.2L6 10.5l3.9.4 3.5-3.5L12 6l2-2z" />
          </svg>
        </button>
        <button
          class="mode-btn"
          :class="{ active: mode === 'calendar' }"
          @click="mode = 'calendar'"
        >
          日历
        </button>
        <button
          class="mode-btn"
          :class="{ active: mode === 'list' }"
          @click="mode = 'list'"
        >
          清单
        </button>
      </div>
    </div>

    <div v-if="mode === 'calendar'" class="widget-body">
      <div class="calendar-area">
        <MonthView
          :year="currentYear"
          :month="currentMonth"
          :selected-date="selectedDate"
          :today-date="currentToday"
          :all-todos-by-date="allTodosByDate"
          @select-date="onSelectDate"
          @add-todo="onOpenAddModal"
        />
      </div>

      <div v-if="showDetail" class="sidebar">
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

    <div v-else class="list-only">
      <TodoList
        :todos="todos"
        :selected-date="selectedDate"
        :loading="loading"
        @toggle="onToggleTodo"
        @delete="onDeleteTodo"
        @add="onOpenAddModal"
      />
    </div>

    <TodoEditorModal
      v-if="showAddModal"
      :date="modalDate"
      @save="onSaveTodo"
      @close="showAddModal = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import MonthView from '../components/Calendar/MonthView.vue'
import TodoList from '../components/Todo/TodoList.vue'
import TodoEditorModal from '../components/Todo/TodoEditorModal.vue'
import { chinaDateParts, getMonthTitle, nextMonth, prevMonth, today } from '../utils/dateUtils.js'
import { buildWeeklyRepeatDates } from '../utils/recurrence.js'
import { addTodo, deleteTodo, getAllTodos, getTodosByDate, toggleTodo } from '../services/todoService.js'

const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
const mode = ref(params.get('mode') === 'list' ? 'list' : 'calendar')

const now = chinaDateParts()
const currentYear = ref(now.year)
const currentMonth = ref(now.month)
const selectedDate = ref(today())
const currentToday = ref(selectedDate.value)
const todos = ref([])
const loading = ref(false)
const allTodosByDate = ref({})
const showAddModal = ref(false)
const modalDate = ref('')
const pinned = ref(localStorage.getItem('widget-pinned') === 'true')
const widgetOpacity = ref(localStorage.getItem('widget-opacity') || '0.82')
const showDetail = ref(localStorage.getItem('widget-show-detail') !== 'false')
let todayTimer = null
let removeThemeModeListener = null

const title = computed(() => getMonthTitle(currentYear.value, currentMonth.value))

function applyStoredTheme() {
  const themeMode = localStorage.getItem('theme-mode') || 'light'
  applyThemeMode(themeMode)
}

function applyThemeMode(themeMode) {
  document.documentElement.dataset.mode = themeMode
  document.body.dataset.mode = themeMode
  document.documentElement.style.background = 'transparent'
  document.body.style.background = 'transparent'
}

function refreshCurrentToday() {
  const nextToday = today()
  if (currentToday.value !== nextToday) {
    currentToday.value = nextToday
  }
  return nextToday
}

async function loadAllTodos() {
  const all = await getAllTodos()
  const grouped = {}
  all.forEach(todo => {
    if (!grouped[todo.date]) grouped[todo.date] = []
    grouped[todo.date].push(todo)
  })
  allTodosByDate.value = grouped
}

async function loadTodos(date) {
  loading.value = true
  todos.value = []
  try {
    todos.value = await getTodosByDate(date)
  } finally {
    loading.value = false
  }
}

function onSelectDate(dateStr) {
  selectedDate.value = dateStr
  const date = new Date(dateStr + 'T00:00:00')
  currentYear.value = date.getFullYear()
  currentMonth.value = date.getMonth()
}

function onPrevMonth() {
  const next = prevMonth(currentYear.value, currentMonth.value)
  currentYear.value = next.year
  currentMonth.value = next.month
}

function onNextMonth() {
  const next = nextMonth(currentYear.value, currentMonth.value)
  currentYear.value = next.year
  currentMonth.value = next.month
}

function onGoToday() {
  const date = chinaDateParts()
  currentYear.value = date.year
  currentMonth.value = date.month
  selectedDate.value = refreshCurrentToday()
}

function onOpenAddModal(dateStr) {
  modalDate.value = dateStr || selectedDate.value
  showAddModal.value = true
}

async function onSaveTodo(todoData) {
  const repeatDates = buildWeeklyRepeatDates(todoData.recurrence)
  const dates = repeatDates.length > 0 ? repeatDates : [todoData.date]
  for (const date of dates) {
    await addTodo({
      ...todoData,
      date,
      recurrence: undefined
    })
  }
  showAddModal.value = false
  await loadAllTodos()
  if (dates[0] !== selectedDate.value) {
    onSelectDate(dates[0])
  } else {
    await loadTodos(selectedDate.value)
  }
}

async function onDeleteTodo(id) {
  await deleteTodo(id)
  await loadTodos(selectedDate.value)
  await loadAllTodos()
}

async function onToggleTodo(id) {
  await toggleTodo(id)
  await loadTodos(selectedDate.value)
  await loadAllTodos()
}

function showContextMenu() {
  window.electronAPI?.showWidgetMenu?.()
}

watch(selectedDate, loadTodos, { immediate: true })
watch([currentYear, currentMonth], loadAllTodos)
watch(pinned, value => {
  localStorage.setItem('widget-pinned', String(value))
})
watch(widgetOpacity, value => {
  localStorage.setItem('widget-opacity', value)
})
watch(showDetail, value => {
  localStorage.setItem('widget-show-detail', String(value))
})

onMounted(() => {
  applyStoredTheme()
  removeThemeModeListener = window.electronAPI?.onThemeModeChanged?.((mode) => {
    localStorage.setItem('theme-mode', mode)
    applyThemeMode(mode)
  }) || null
  refreshCurrentToday()
  todayTimer = setInterval(refreshCurrentToday, 60 * 1000)
  loadAllTodos()
})

onUnmounted(() => {
  removeThemeModeListener?.()
  clearInterval(todayTimer)
})
</script>

<style scoped>
.widget-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-app);
  color: var(--text-primary);
  border: 1px solid var(--border);
  overflow: hidden;
  opacity: var(--widget-opacity);
}

:global(html),
:global(body),
:global(#app),
:global(.app-root) {
  background: transparent !important;
}

.widget-titlebar {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 10px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  -webkit-app-region: drag;
  flex-shrink: 0;
}

.widget-page.pinned .widget-titlebar {
  -webkit-app-region: no-drag;
}

.drag-handle {
  width: 44px;
  align-self: stretch;
  border-radius: 5px;
  -webkit-app-region: drag;
  flex-shrink: 0;
}

.drag-handle:hover {
  background: var(--bg-hover);
}

.widget-page.pinned .drag-handle {
  -webkit-app-region: no-drag;
}

.widget-nav,
.widget-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.widget-nav strong {
  min-width: 128px;
  text-align: center;
  font-size: 14px;
  color: var(--text-primary);
}

.icon-btn,
.today-btn,
.detail-btn,
.mode-btn,
.pin-btn,
.opacity-slider {
  -webkit-app-region: no-drag;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 20px;
  line-height: 1;
}

.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--primary);
}

.today-btn {
  height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 12px;
}

.today-btn:hover {
  background: var(--bg-hover);
  border-color: var(--primary);
  color: var(--primary);
}

.detail-btn {
  height: 28px;
  padding: 0 9px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
}

.detail-btn:hover,
.detail-btn.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

.opacity-slider {
  width: 74px;
  accent-color: var(--primary);
}

.pin-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pin-btn:hover,
.pin-btn.active {
  background: var(--primary-light);
  color: var(--primary);
}

.pin-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.mode-btn {
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
}

.mode-btn.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

.widget-body {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.calendar-area {
  flex: 1;
  min-width: 0;
  display: flex;
  overflow: hidden;
  background: var(--bg-surface);
}

.sidebar {
  width: 250px;
  flex-shrink: 0;
  overflow: hidden;
}

.list-only {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
