<template>
  <div class="week-view">
    <!-- 周标题行：日期 + 星期 -->
    <div class="week-header">
      <div
        v-for="day in weekDays"
        :key="day.dateStr"
        class="week-header-cell"
        :class="{
          'is-today': day.isToday,
          'is-selected': day.dateStr === selectedDate,
          'is-weekend': day.isWeekend
        }"
        @click="$emit('select-date', day.dateStr)"
      >
        <span class="weekday-label">{{ day.weekLabel }}</span>
        <span
          class="day-num"
          :class="{
            'today-badge': day.isToday,
            'selected-badge': day.dateStr === selectedDate && !day.isToday
          }"
        >
          {{ day.dayNum }}
        </span>
      </div>
    </div>

    <!-- 内容区：每天一列 -->
    <div class="week-body">
      <div
        v-for="day in weekDays"
        :key="day.dateStr"
        class="week-col"
        :class="{
          'is-today': day.isToday,
          'is-selected': day.dateStr === selectedDate,
          'is-weekend': day.isWeekend
        }"
        @click="$emit('select-date', day.dateStr)"
        @dblclick="$emit('add-todo', day.dateStr)"
      >
        <!-- 该天的 todo 列表 -->
        <div class="col-todos">
          <div
            v-for="todo in (allTodosByDate[day.dateStr] || [])"
            :key="todo.id"
            class="week-todo-chip"
            :class="{ 'todo-done': todo.completed }"
            :style="chipStyle(todo)"
            :title="displayTitle(todo)"
            @click.stop="$emit('select-date', day.dateStr)"
          >
            <span class="chip-dot" :style="{ background: dotColor(todo) }"></span>
            <span v-if="formatTimeRange(todo)" class="chip-time">{{ formatTimeRange(todo) }}</span>
            <span class="chip-text">{{ todo.title }}</span>
          </div>
        </div>

        <!-- 空状态提示 -->
        <div
          v-if="!(allTodosByDate[day.dateStr] || []).length"
          class="col-empty"
        >
          双击添加
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDate, today } from '../../utils/dateUtils.js'
import { formatTimeRange } from '../../utils/todoTime.js'

const props = defineProps({
  // 当前选中日期，用于定位到所在周
  selectedDate: { type: String, default: '' },
  todayDate: { type: String, default: today },
  // 全部 todo，按日期分组 { 'YYYY-MM-DD': Todo[] }
  allTodosByDate: { type: Object, default: () => ({}) }
})

defineEmits(['select-date', 'add-todo'])

const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 根据 selectedDate 计算本周周一到周日
const weekDays = computed(() => {
  const base = props.selectedDate
    ? new Date(props.selectedDate + 'T00:00:00')
    : new Date()

  // 找到本周周一
  const dow = base.getDay() // 0=周日
  const diffToMonday = dow === 0 ? -6 : 1 - dow
  const monday = new Date(base)
  monday.setDate(base.getDate() + diffToMonday)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = formatDate(d)
    return {
      dateStr,
      dayNum: d.getDate(),
      weekLabel: weekLabels[i],
      isToday: dateStr === props.todayDate,
      isWeekend: i >= 5 // 周六、周日
    }
  })
})

// 颜色映射
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

function chipStyle(todo) {
  if (todo.completed) return { background: '#f0f0f0', color: '#999' }
  const c = colorMap[todo.color] || colorMap.blue
  return { background: c.bg, color: c.text }
}

function dotColor(todo) {
  if (todo.completed) return '#bbbbbb'
  const c = colorMap[todo.color] || colorMap.blue
  return c.dot
}

function displayTitle(todo) {
  const time = formatTimeRange(todo)
  return time ? `${time} ${todo.title}` : todo.title
}
</script>

<style scoped>
.week-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background: #ffffff;
}

/* 顶部日期标题行 */
.week-header {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-bottom: 1px solid var(--border);
  background: var(--bg-surface);
  flex-shrink: 0;
}

.week-header-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0 10px;
  cursor: pointer;
  border-right: 1px solid var(--border-light);
  transition: background 0.12s;
  gap: 4px;
  min-width: 0;
}
.week-header-cell:last-child { border-right: none; }
.week-header-cell:hover { background: var(--bg-hover); }
.week-header-cell.is-weekend .weekday-label { color: var(--primary); }
.week-header-cell.is-selected {
  background: var(--primary-light);
  box-shadow: inset 0 -2px 0 var(--primary);
}
.week-header-cell.is-selected .weekday-label {
  color: var(--primary-dark);
}

.weekday-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.4px;
}

.day-num {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.today-badge {
  background: var(--primary);
  color: var(--text-on-primary);
  font-weight: 700;
}
.selected-badge {
  background: var(--primary-light);
  color: var(--primary-dark);
  font-weight: 700;
}

/* 内容列区域 */
.week-body {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  border-left: 1px solid var(--border-light);
}

.week-col {
  border-right: 1px solid var(--border-light);
  padding: 8px 6px;
  cursor: pointer;
  transition: background 0.12s;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}
.week-col:last-child { border-right: none; }
.week-col:hover { background: var(--bg-hover); }
.week-col.is-today { background: var(--bg-surface); }
.week-col.is-weekend { background: var(--bg-app); }
.week-col.is-weekend:hover { background: var(--bg-hover); }
.week-col.is-selected,
.week-col.is-selected.is-today,
.week-col.is-selected.is-weekend {
  background: var(--primary-light);
  box-shadow: inset 0 0 0 2px rgba(0, 120, 212, 0.18);
}
.week-col.is-selected:hover {
  background: var(--primary-light);
}

/* Todo chip */
.col-todos {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.week-todo-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.1s;
  max-width: 100%;
  min-width: 0;
}
.week-todo-chip:hover { opacity: 0.85; }
.week-todo-chip.todo-done .chip-text {
  text-decoration: line-through;
  opacity: 0.6;
}

.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chip-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.chip-time {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
}

/* 空状态提示 */
.col-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--text-muted);
  user-select: none;
}
</style>
