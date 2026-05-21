<template>
  <div
    class="todo-item"
    :class="{ completed: todo.completed }"
    :style="itemStyle"
    @dblclick="$emit('open', todo)"
  >
    <!-- 完成复选框 -->
    <button
      class="checkbox"
      :class="{ checked: todo.completed }"
      @click="$emit('toggle', todo.id)"
      @dblclick.stop
      :title="todo.completed ? '标记为未完成' : '标记为完成'"
    >
      <span v-if="todo.completed" class="check-icon">✓</span>
    </button>

    <!-- Todo 标题 -->
    <span v-if="timeRange" class="todo-time" :style="timeStyle">{{ timeRange }}</span>
    <span class="todo-title" :title="displayTitle">{{ todo.title }}</span>

    <!-- 删除按钮 -->
    <button
      class="btn-delete"
      @click="onDelete"
      @dblclick.stop
      title="删除"
    >
      ✕
    </button>
  </div>
</template>

<script setup>
/**
 * TodoItem.vue - 单条 Todo 显示组件
 *
 * Props:
 *   todo {Object} - Todo 数据对象
 *
 * Emits:
 *   toggle (id) - 切换完成状态
 *   delete (id) - 删除（已在内部确认）
 */
import { computed } from 'vue'
import { formatTimeRange } from '../../utils/todoTime.js'

const props = defineProps({
  todo: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['toggle', 'delete', 'open'])

const timeRange = computed(() => formatTimeRange(props.todo))
const displayTitle = computed(() =>
  timeRange.value ? `${timeRange.value} ${props.todo.title}` : props.todo.title
)

const colorMap = {
  blue:   { accent: '#2563eb', soft: '#dbeafe', text: '#1e40af' },
  green:  { accent: '#16a34a', soft: '#dcfce7', text: '#15803d' },
  red:    { accent: '#dc2626', soft: '#fee2e2', text: '#b91c1c' },
  orange: { accent: '#ea580c', soft: '#ffedd5', text: '#c2410c' },
  purple: { accent: '#7c3aed', soft: '#ede9fe', text: '#6d28d9' },
  pink:   { accent: '#db2777', soft: '#fce7f3', text: '#be185d' },
  yellow: { accent: '#ca8a04', soft: '#fef9c3', text: '#a16207' },
  gray:   { accent: '#6b7280', soft: '#f3f4f6', text: '#4b5563' },
}

const itemColor = computed(() => {
  if (props.todo.completed) return colorMap.gray
  return colorMap[props.todo.color] || colorMap.blue
})

const itemStyle = computed(() => ({
  '--todo-accent': itemColor.value.accent,
  '--todo-soft': itemColor.value.soft,
  '--todo-text': itemColor.value.text
}))

const timeStyle = computed(() => ({
  background: itemColor.value.soft,
  color: itemColor.value.text
}))

function onDelete() {
  // 删除前确认
  if (window.confirm(`确定要删除「${props.todo.title}」吗？`)) {
    emit('delete', props.todo.id)
  }
}
</script>

<style scoped>
.todo-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 11px 8px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: background var(--transition), border-color var(--transition), transform var(--transition);
}
.todo-item::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 9px;
  bottom: 9px;
  width: 3px;
  border-radius: 999px;
  background: var(--todo-accent, var(--primary));
}
.todo-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-light);
}

/* 完成状态：标题加删除线 */
.todo-item.completed .todo-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* 复选框 */
.checkbox {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--todo-accent, var(--border));
  background: transparent;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--transition), background var(--transition), box-shadow var(--transition);
  padding: 0;
}
.checkbox:hover {
  border-color: var(--todo-accent, var(--primary));
  box-shadow: 0 0 0 3px var(--todo-soft, var(--primary-light));
}
.checkbox.checked {
  background: var(--todo-accent, var(--primary));
  border-color: var(--todo-accent, var(--primary));
}
.check-icon {
  color: white;
  font-size: 11px;
  line-height: 1;
}

/* 标题 */
.todo-title {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-time {
  flex-shrink: 0;
  padding: 2px 5px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

/* 删除按钮：默认隐藏，hover 时显示 */
.btn-delete {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition), background var(--transition), color var(--transition);
  flex-shrink: 0;
  padding: 0;
}
.todo-item:hover .btn-delete {
  opacity: 1;
}
.btn-delete:hover {
  background: #fde7e9;
  color: var(--priority-high);
}
</style>
