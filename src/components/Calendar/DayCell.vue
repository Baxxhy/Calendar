<template>
  <div
    ref="dayCellRef"
    class="day-cell"
    :class="{
      'other-month': !day.isCurrentMonth,
      'is-today': day.isToday,
      'is-selected': isSelected
    }"
    @click="$emit('select', day.dateStr)"
    @dblclick="$emit('dblclick', day.dateStr)"
  >
    <!-- 日期数字 -->
    <div class="day-number">
      <span class="day-num-inner">{{ dayNumber }}</span>
      <span
        v-if="calendarInfo.badge"
        class="day-status"
        :class="calendarInfo.badgeType"
      >
        {{ calendarInfo.badge }}
      </span>
    </div>

    <div
      class="calendar-note"
      :class="{ highlight: calendarInfo.label }"
      :title="calendarInfo.label || calendarInfo.lunarText"
    >
      {{ calendarInfo.label || calendarInfo.lunarText }}
    </div>

    <!-- 当天 Todo 列表（直接显示在格子里） -->
    <div
      class="todo-items"
      v-if="todos && todos.length > 0"
    >
      <div
        v-for="todo in visibleTodos"
        :key="todo.id"
        class="todo-chip"
        :class="{ 'todo-done': todo.completed }"
        :style="chipStyle(todo)"
        :title="displayTitle(todo)"
      >
        <span class="todo-chip-dot" :style="{ background: dotColor(todo) }"></span>
        <span v-if="formatTimeRange(todo)" class="todo-chip-time">{{ formatTimeRange(todo) }}</span>
        <span class="todo-chip-text">{{ todo.title }}</span>
      </div>
      <!-- 超出3条显示 +N -->
      <div v-if="hiddenTodoCount > 0" class="todo-more">
        +{{ hiddenTodoCount }} 项
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatTimeRange } from '../../utils/todoTime.js'
import { getCalendarInfo } from '../../utils/calendarInfo.js'

/**
 * DayCell.vue - 月视图中的单个日期格子
 * 直接在格子里显示当天的 Todo 列表
 */
const props = defineProps({
  day: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  // 当天的 Todo 数组（完整列表，不只是统计）
  todos: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select', 'dblclick'])

const dayCellRef = ref(null)
const maxVisibleTodos = ref(3)
let resizeObserver = null

const dayNumber = computed(() => props.day.date.getDate())
const calendarInfo = computed(() => getCalendarInfo(props.day.dateStr))

// 根据格子剩余空间决定显示条数，标题始终保持单行省略。
const visibleTodos = computed(() => props.todos.slice(0, maxVisibleTodos.value))
const hiddenTodoCount = computed(() => Math.max(0, props.todos.length - visibleTodos.value.length))

// 颜色映射表，与 TodoEditorModal 中的 colorOptions 保持一致
const colorMap = {
  blue:   { bg: '#dbeafe', dot: '#2563eb', text: '#1e40af' },
  green:  { bg: '#dcfce7', dot: '#16a34a', text: '#15803d' },
  red:    { bg: '#fee2e2', dot: '#dc2626', text: '#b91c1c' },
  orange: { bg: '#ffedd5', dot: '#ea580c', text: '#c2410c' },
  purple: { bg: '#ede9fe', dot: '#7c3aed', text: '#6d28d9' },
  pink:   { bg: '#fce7f3', dot: '#db2777', text: '#be185d' },
  yellow: { bg: '#fef9c3', dot: '#ca8a04', text: '#a16207' },
  gray:   { bg: '#f3f4f6', dot: '#6b7280', text: '#4b5563' },
}

// 根据 todo.color 返回 chip 的内联样式
function chipStyle(todo) {
  if (todo.completed) return {}
  const c = colorMap[todo.color] || colorMap.blue
  return { background: c.bg, color: c.text }
}

// 根据 todo.color 返回圆点颜色
function dotColor(todo) {
  if (todo.completed) return '#bbbbbb'
  const c = colorMap[todo.color] || colorMap.blue
  return c.dot
}

function displayTitle(todo) {
  const time = formatTimeRange(todo)
  return time ? `${time} ${todo.title}` : todo.title
}

function updateVisibleTodoLimit() {
  const cell = dayCellRef.value
  if (!cell) return

  const width = cell.clientWidth
  const height = cell.clientHeight
  const chipLineHeight = 19
  const moreLineHeight = 17
  const visibleLimit = width < 170 ? 1 : width < 240 ? 2 : 4
  const total = props.todos.length

  if (total === 0) {
    maxVisibleTodos.value = 0
    return
  }

  const reservedHeight = 72
  const availableHeight = Math.max(0, height - reservedHeight)
  const linesWithoutMore = Math.floor(availableHeight / chipLineHeight)
  if (total <= linesWithoutMore) {
    maxVisibleTodos.value = Math.min(total, visibleLimit)
    return
  }

  const linesWithMore = Math.floor((availableHeight - moreLineHeight) / chipLineHeight)
  const visibleCount = Math.min(linesWithMore, visibleLimit)
  maxVisibleTodos.value = Math.max(1, visibleCount)
}

async function scheduleVisibleTodoLimitUpdate() {
  await nextTick()
  updateVisibleTodoLimit()
}

onMounted(() => {
  resizeObserver = new ResizeObserver(updateVisibleTodoLimit)
  if (dayCellRef.value) resizeObserver.observe(dayCellRef.value)
  scheduleVisibleTodoLimitUpdate()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(
  () => [props.todos.length, calendarInfo.value.label, calendarInfo.value.lunarText, calendarInfo.value.badge],
  scheduleVisibleTodoLimitUpdate
)
</script>

<style scoped>
.day-cell {
  position: relative;
  height: 100%;
  min-height: 90px;
  overflow: hidden;
  padding: 7px 7px 5px;
  border-right: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: background 0.12s ease, box-shadow 0.12s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: var(--bg-surface);
  box-sizing: border-box;
}

.day-cell:hover {
  background: var(--bg-hover);
  box-shadow: inset 0 0 0 1px rgba(0, 120, 212, 0.1);
}

/* 非当前月：背景和文字都弱化 */
.day-cell.other-month {
  background: var(--bg-app);
}
.day-cell.other-month .day-number {
  color: var(--text-muted);
}

/* 今天：日期数字用蓝色圆形高亮 */
.day-cell.is-today .day-num-inner {
  background: var(--primary);
  color: var(--text-on-primary);
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

/* 选中：浅蓝背景 */
.day-cell.is-selected {
  background: var(--primary-light);
  box-shadow: inset 0 0 0 2px rgba(0, 120, 212, 0.22);
}
.day-cell.is-selected .day-number {
  color: var(--primary);
  font-weight: 600;
}

/* 日期数字 */
.day-number {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 2px;
}
.day-num-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
}

.day-status {
  margin-left: auto;
  min-width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
}

.day-status.rest {
  background: #fee2e2;
  color: #b91c1c;
}

.day-status.work {
  background: #e0f2fe;
  color: #0369a1;
}

.calendar-note {
  width: 100%;
  min-height: 15px;
  margin-bottom: 4px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-note.highlight {
  color: var(--priority-high);
  font-weight: 700;
}

/* Todo 列表区域 */
.todo-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding-bottom: 18px;
  box-sizing: border-box;
}

/* 单条 Todo 标签 */
.todo-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 17px;
  padding: 3px 6px;
  border-radius: 5px;
  background: #dbeafe; /* 默认蓝色，会被内联样式覆盖 */
  font-size: 11px;
  line-height: 11px;
  color: #1e40af;      /* 默认蓝色，会被内联样式覆盖 */
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}

/* 已完成的 Todo：灰色 + 删除线 */
.todo-chip.todo-done {
  background: #f0f0f0;
  color: #999999;
  text-decoration: line-through;
}

.todo-chip-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.todo-chip.todo-done .todo-chip-dot {
  background: #bbbbbb;
}

.todo-chip-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.todo-chip-time {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
}

/* 超出条数提示 */
.todo-more {
  position: absolute;
  left: 12px;
  bottom: 6px;
  max-width: calc(100% - 24px);
  font-size: 11px;
  line-height: 15px;
  color: var(--primary);
  padding: 0 5px;
  font-weight: 500;
  border-radius: 4px;
  background: var(--bg-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-cell.is-selected .todo-more {
  background: var(--primary-light);
}
</style>
