<template>
  <div
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
    </div>

    <!-- 当天 Todo 列表（直接显示在格子里） -->
    <div class="todo-items" v-if="todos && todos.length > 0">
      <div
        v-for="todo in visibleTodos"
        :key="todo.id"
        class="todo-chip"
        :class="{ 'todo-done': todo.completed }"
        :style="chipStyle(todo)"
        :title="todo.title"
      >
        <span class="todo-chip-dot" :style="{ background: dotColor(todo) }"></span>
        <span class="todo-chip-text">{{ todo.title }}</span>
      </div>
      <!-- 超出3条显示 +N -->
      <div v-if="todos.length > 3" class="todo-more">
        +{{ todos.length - 3 }} 项
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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

const dayNumber = computed(() => props.day.date.getDate())

// 最多显示3条，避免格子太满
const visibleTodos = computed(() => props.todos.slice(0, 3))

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
</script>

<style scoped>
.day-cell {
  position: relative;
  height: 100%;
  min-height: 90px;
  overflow: hidden;
  padding: 6px 6px 4px;
  border-right: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: background 0.12s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: var(--bg-surface);
  box-sizing: border-box;
}

.day-cell:hover {
  background: var(--bg-hover);
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
}
.day-cell.is-selected .day-number {
  color: var(--primary);
  font-weight: 600;
}

/* 日期数字 */
.day-number {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 4px;
}
.day-num-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
}

/* Todo 列表区域 */
.todo-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

/* 单条 Todo 标签 */
.todo-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 5px;
  border-radius: 3px;
  background: #dbeafe; /* 默认蓝色，会被内联样式覆盖 */
  font-size: 11px;
  color: #1e40af;      /* 默认蓝色，会被内联样式覆盖 */
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
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
}

/* 超出条数提示 */
.todo-more {
  font-size: 11px;
  color: var(--primary);
  padding: 1px 5px;
  font-weight: 500;
}
</style>
