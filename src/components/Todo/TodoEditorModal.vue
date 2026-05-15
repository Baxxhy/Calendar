<template>
  <div class="modal-overlay" @click.self="onClose">
    <div class="modal-box" role="dialog" aria-modal="true">
      <!-- 头部 -->
      <div class="modal-header">
        <h2 class="modal-title">添加待办</h2>
        <button class="btn-close" @click="onClose">✕</button>
      </div>

      <!-- 表单 -->
      <div class="modal-body">
        <!-- 日期（只读） -->
        <div class="form-row">
          <label class="form-label">日期</label>
          <div class="form-date">{{ displayDate }}</div>
        </div>

        <!-- 标题（必填） -->
        <div class="form-row">
          <label class="form-label">标题 <span class="required">*</span></label>
          <input
            ref="titleInput"
            v-model="form.title"
            class="form-input"
            :class="{ error: titleError }"
            placeholder="输入待办标题..."
            maxlength="100"
            @keydown.enter="onSave"
          />
          <span v-if="titleError" class="error-msg">标题不能为空</span>
        </div>

        <!-- 颜色选择 -->
        <div class="form-row">
          <label class="form-label">颜色标签</label>
          <div class="color-picker">
            <button
              v-for="c in colorOptions"
              :key="c.value"
              class="color-btn"
              :class="{ active: form.color === c.value }"
              :style="{ background: c.bg, borderColor: form.color === c.value ? c.dot : 'transparent' }"
              :title="c.label"
              @click="form.color = c.value"
            >
              <span class="color-dot" :style="{ background: c.dot }"></span>
              <span class="color-label">{{ c.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <!-- 预览当前选色效果 -->
        <div class="color-preview" :style="chipStyle">
          <span class="preview-dot" :style="{ background: selectedColor.dot }"></span>
          <span>{{ form.title || '待办预览' }}</span>
        </div>
        <div class="footer-btns">
          <button class="btn-cancel" @click="onClose">取消</button>
          <button class="btn-save" @click="onSave" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

const props = defineProps({
  date: { type: String, required: true }
})
const emit = defineEmits(['save', 'close'])

// 预设颜色选项：{ value, label, bg（浅色背景）, dot（深色圆点/文字） }
const colorOptions = [
  { value: 'blue',   label: '蓝色', bg: '#dbeafe', dot: '#2563eb' },
  { value: 'green',  label: '绿色', bg: '#dcfce7', dot: '#16a34a' },
  { value: 'red',    label: '红色', bg: '#fee2e2', dot: '#dc2626' },
  { value: 'orange', label: '橙色', bg: '#ffedd5', dot: '#ea580c' },
  { value: 'purple', label: '紫色', bg: '#ede9fe', dot: '#7c3aed' },
  { value: 'pink',   label: '粉色', bg: '#fce7f3', dot: '#db2777' },
  { value: 'yellow', label: '黄色', bg: '#fef9c3', dot: '#ca8a04' },
  { value: 'gray',   label: '灰色', bg: '#f3f4f6', dot: '#6b7280' },
]

const form = ref({ title: '', color: 'blue' })
const titleError = ref(false)
const saving = ref(false)
const titleInput = ref(null)

// 当前选中颜色的完整配置
const selectedColor = computed(() =>
  colorOptions.find(c => c.value === form.value.color) || colorOptions[0]
)

// 预览标签的内联样式
const chipStyle = computed(() => ({
  background: selectedColor.value.bg,
  color: selectedColor.value.dot,
}))

const displayDate = computed(() => {
  const d = new Date(props.date + 'T00:00:00')
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（周${weekdays[d.getDay()]}）`
})

onMounted(async () => {
  await nextTick()
  titleInput.value?.focus()
})

function onClose() {
  emit('close')
}

async function onSave() {
  if (!form.value.title.trim()) {
    titleError.value = true
    titleInput.value?.focus()
    return
  }
  titleError.value = false
  saving.value = true
  try {
    emit('save', {
      title: form.value.title.trim(),
      date: props.date,
      color: form.value.color   // 把颜色一起传出去
    })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.modal-box {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  width: 420px;
  max-width: 92vw;
  animation: slideUp 0.15s ease;
  overflow: hidden;
}
@keyframes slideUp {
  from { transform: translateY(14px); opacity: 0 }
  to   { transform: translateY(0);    opacity: 1 }
}

/* 头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f0f0f0;
}
.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}
.btn-close {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: transparent;
  color: #999;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-close:hover { background: #f0f0f0; color: #333; }

/* 表单 */
.modal-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  letter-spacing: 0.4px;
}
.required { color: #dc2626; }
.form-date {
  font-size: 13px;
  color: #333;
}
.form-input {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  color: #1a1a1a;
  background: #fff;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-input:focus {
  border-color: #0078d4;
  box-shadow: 0 0 0 3px rgba(0,120,212,0.1);
}
.form-input.error { border-color: #dc2626; }
.error-msg { font-size: 12px; color: #dc2626; }

/* 颜色选择器 */
.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.color-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 20px;
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: border-color 0.12s, transform 0.1s;
}
.color-btn:hover {
  transform: scale(1.05);
}
.color-btn.active {
  border-width: 2px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}
.color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.color-label {
  /* 颜色由父元素 background 决定，文字颜色用 dot 色 */
}

/* 底部 */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px 18px;
  border-top: 1px solid #f0f0f0;
}

/* 颜色预览标签 */
.color-preview {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  max-width: 160px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
}
.preview-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.footer-btns {
  display: flex;
  gap: 8px;
}
.btn-cancel {
  padding: 7px 18px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid #e0e0e0;
  color: #666;
  font-size: 13px;
}
.btn-cancel:hover { background: #f5f5f5; }
.btn-save {
  padding: 7px 20px;
  border-radius: 6px;
  background: #0078d4;
  color: white;
  font-size: 13px;
  font-weight: 500;
}
.btn-save:hover:not(:disabled) { background: #005a9e; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
