<template>
  <div class="todo-list">
    <div class="list-header">
      <div class="list-title-group">
        <span class="list-title">
          {{ selectedDate ? formatDisplayDate(selectedDate) : '请选择日期' }}
        </span>
        <span v-if="todos.length > 0" class="todo-count">
          {{ uncompletedCount }}/{{ todos.length }}
        </span>
      </div>
      <button
        v-if="todos.length > 0"
        class="filter-btn"
        :class="{ active: hideCompleted }"
        title="只看未完成"
        @click="hideCompleted = !hideCompleted"
      >
        未完成
      </button>
    </div>

    <div v-if="loading" class="state-loading">
      <span>加载中...</span>
    </div>

    <div v-else-if="todos.length === 0 && selectedDate" class="state-empty">
      <div class="empty-icon">□</div>
      <p>今天还没有待办</p>
      <p class="empty-hint">双击日历中的日期来添加</p>
    </div>

    <div v-else class="list-body">
      <TodoItem
        v-for="todo in visibleTodos"
        :key="todo.id"
        :todo="todo"
        @toggle="$emit('toggle', $event)"
        @delete="$emit('delete', $event)"
        @open="openTodoDetail"
      />
      <div v-if="visibleTodos.length === 0" class="state-filter-empty">
        已完成的都藏起来了
      </div>
    </div>

    <div v-if="selectedDate" class="list-footer">
      <button class="btn-add" @click="$emit('add', selectedDate)">
        + 添加待办
      </button>
    </div>

    <div
      v-if="detailTodo"
      class="detail-overlay"
      @click.self="closeTodoDetail"
    >
      <div class="detail-dialog">
        <div class="detail-dialog-header">
          <span>待办详情</span>
          <button class="detail-close" title="关闭" @click="closeTodoDetail">×</button>
        </div>
        <div v-if="detailTime" class="detail-time">
          {{ detailTime }}
        </div>
        <div class="detail-content">
          {{ detailTodo.title }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import TodoItem from './TodoItem.vue'
import { formatTimeRange } from '../../utils/todoTime.js'

const props = defineProps({
  todos: { type: Array, default: () => [] },
  selectedDate: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})

defineEmits(['toggle', 'delete', 'add'])

const detailTodo = ref(null)
const hideCompleted = ref(false)

const uncompletedCount = computed(() =>
  props.todos.filter(t => !t.completed).length
)

const visibleTodos = computed(() =>
  hideCompleted.value ? props.todos.filter(t => !t.completed) : props.todos
)

const detailTime = computed(() => formatTimeRange(detailTodo.value))

function openTodoDetail(todo) {
  detailTodo.value = todo
}

function closeTodoDetail() {
  detailTodo.value = null
}

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日（周${weekdays[d.getDay()]}）`
}
</script>

<style scoped>
.todo-list {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-surface);
  border-left: 1px solid var(--border);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--border-light);
}

.list-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.list-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-count {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-app);
  padding: 2px 8px;
  border-radius: 999px;
}

.filter-btn {
  flex-shrink: 0;
  padding: 5px 9px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 12px;
}

.filter-btn:hover,
.filter-btn.active {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
}

.state-loading,
.state-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.state-loading {
  font-size: 13px;
}

.state-empty {
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  text-align: center;
}

.empty-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px dashed var(--border);
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 18px;
  margin-bottom: 4px;
}

.state-empty p {
  font-size: 13px;
}

.empty-hint,
.state-filter-empty {
  font-size: 12px;
  color: var(--text-muted);
}

.state-filter-empty {
  padding: 28px 12px;
  text-align: center;
}

.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 5px;
}

.list-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-light);
}

.btn-add {
  width: 100%;
  padding: 9px;
  border-radius: 8px;
  background: transparent;
  border: 1px dashed var(--border);
  color: var(--text-secondary);
  font-size: 13px;
  transition: all var(--transition);
}

.btn-add:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

.detail-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.28);
}

.detail-dialog {
  width: min(420px, 100%);
  max-height: min(70vh, 520px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface);
  box-shadow: var(--shadow-lg);
}

.detail-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
}

.detail-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 20px;
  line-height: 1;
}

.detail-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.detail-time {
  padding: 12px 14px 0;
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
}

.detail-content {
  padding: 14px;
  overflow: auto;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
