<template>
  <div class="todo-list">
    <!-- 标题栏 -->
    <div class="list-header">
      <span class="list-title">
        {{ selectedDate ? formatDisplayDate(selectedDate) : '请选择日期' }}
      </span>
      <span v-if="todos.length > 0" class="todo-count">
        {{ uncompletedCount }}/{{ todos.length }}
      </span>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="state-loading">
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="todos.length === 0 && selectedDate" class="state-empty">
      <div class="empty-icon">📋</div>
      <p>今天还没有待办</p>
      <p class="empty-hint">双击日历中的日期来添加</p>
    </div>

    <!-- Todo 列表 -->
    <div v-else class="list-body">
      <TodoItem
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        @toggle="$emit('toggle', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>

    <!-- 底部快速添加按钮 -->
    <div v-if="selectedDate" class="list-footer">
      <button class="btn-add" @click="$emit('add', selectedDate)">
        + 添加待办
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TodoItem from './TodoItem.vue'

/**
 * TodoList.vue - 侧边栏 Todo 列表
 *
 * Props:
 *   todos        {Array}  - Todo 数组
 *   selectedDate {string} - 当前选中日期
 *   loading      {boolean}
 *
 * Emits:
 *   toggle (id)       - 切换完成状态
 *   delete (id)       - 删除
 *   add    (dateStr)  - 添加新 Todo
 */
const props = defineProps({
  todos: { type: Array, default: () => [] },
  selectedDate: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})

defineEmits(['toggle', 'delete', 'add'])

const uncompletedCount = computed(() =>
  props.todos.filter(t => !t.completed).length
)

// 将 'YYYY-MM-DD' 格式化为 'M月D日（周X）'
function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00') // 加时间避免时区偏移
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日（周${weekdays[d.getDay()]}）`
}
</script>

<style scoped>
.todo-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-surface);
  border-left: 1px solid var(--border);
}

/* 标题栏 */
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--border-light);
}
.list-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.todo-count {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-app);
  padding: 2px 8px;
  border-radius: 10px;
}

/* 加载状态 */
.state-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 13px;
}

/* 空状态 */
.state-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  padding: 20px;
  text-align: center;
}
.empty-icon {
  font-size: 32px;
  margin-bottom: 4px;
}
.state-empty p {
  font-size: 13px;
}
.empty-hint {
  font-size: 12px;
  color: var(--text-muted);
}

/* 列表主体 */
.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 4px;
}

/* 底部添加按钮 */
.list-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-light);
}
.btn-add {
  width: 100%;
  padding: 8px;
  border-radius: var(--radius-sm);
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
</style>
