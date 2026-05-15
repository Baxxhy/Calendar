<template>
  <div class="todo-item" :class="{ completed: todo.completed }">
    <!-- 完成复选框 -->
    <button
      class="checkbox"
      :class="{ checked: todo.completed }"
      @click="$emit('toggle', todo.id)"
      :title="todo.completed ? '标记为未完成' : '标记为完成'"
    >
      <span v-if="todo.completed" class="check-icon">✓</span>
    </button>

    <!-- Todo 标题 -->
    <span class="todo-title">{{ todo.title }}</span>

    <!-- 删除按钮 -->
    <button
      class="btn-delete"
      @click="onDelete"
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
const props = defineProps({
  todo: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['toggle', 'delete'])

function onDelete() {
  // 删除前确认
  if (window.confirm(`确定要删除「${props.todo.title}」吗？`)) {
    emit('delete', props.todo.id)
  }
}
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  transition: background var(--transition);
  group: true;
}
.todo-item:hover {
  background: var(--bg-hover);
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
  border: 2px solid var(--border);
  background: transparent;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--transition), background var(--transition);
  padding: 0;
}
.checkbox:hover {
  border-color: var(--primary);
}
.checkbox.checked {
  background: var(--primary);
  border-color: var(--primary);
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
