<template>
  <div class="modal-overlay" @click.self="onClose">
    <div class="modal-box" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2 class="modal-title">添加待办</h2>
        <button class="btn-close" title="关闭" @click="onClose">×</button>
      </div>

      <div class="modal-body">
        <div class="form-row">
          <label class="form-label">日期</label>
          <div class="form-date">{{ displayDate }}</div>
        </div>

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

        <div class="form-row">
          <label class="form-label">时间段 <span class="optional">可选</span></label>
          <div class="time-row">
            <input v-model="form.start_time" class="form-input time-input" type="time" aria-label="开始时间" />
            <span class="time-separator">到</span>
            <input v-model="form.end_time" class="form-input time-input" type="time" aria-label="结束时间" />
          </div>
          <span v-if="timeError" class="error-msg">开始时间不能晚于结束时间</span>
        </div>

        <div class="form-row repeat-panel">
          <label class="toggle-row">
            <input v-model="repeat.enabled" type="checkbox" />
            <span>每周重复</span>
          </label>

          <div v-if="repeat.enabled" class="repeat-options">
            <div class="date-range-row">
              <label>
                <span>开始</span>
                <input v-model="repeat.startDate" class="form-input" type="date" />
              </label>
              <label>
                <span>结束</span>
                <input v-model="repeat.endDate" class="form-input" type="date" />
              </label>
            </div>

            <div class="weekday-grid">
              <button
                v-for="day in weekOptions"
                :key="day.value"
                type="button"
                class="weekday-btn"
                :class="{ active: repeat.weekdays.includes(day.value) }"
                @click="toggleWeekday(day.value)"
              >
                {{ day.label.replace('周', '') }}
              </button>
            </div>

            <span v-if="repeatError" class="error-msg">{{ repeatError }}</span>
            <span v-else-if="repeatPreview" class="repeat-preview">{{ repeatPreview }}</span>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">颜色标签</label>
          <div class="color-picker">
            <button
              v-for="c in colorOptions"
              :key="c.value"
              type="button"
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

      <div class="modal-footer">
        <div class="color-preview" :style="chipStyle">
          <span class="preview-dot" :style="{ background: selectedColor.dot }"></span>
          <span v-if="previewTime" class="preview-time">{{ previewTime }}</span>
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
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { formatTimeRange, isValidTimeRange, normalizeTime } from '../../utils/todoTime.js'
import { buildWeeklyRepeatDates, repeatSummary, weekdayOf, weekOptions } from '../../utils/recurrence.js'

const props = defineProps({
  date: { type: String, required: true }
})
const emit = defineEmits(['save', 'close'])

const colorOptions = [
  { value: 'blue', label: '蓝色', bg: '#dbeafe', dot: '#2563eb' },
  { value: 'green', label: '绿色', bg: '#dcfce7', dot: '#16a34a' },
  { value: 'red', label: '红色', bg: '#fee2e2', dot: '#dc2626' },
  { value: 'orange', label: '橙色', bg: '#ffedd5', dot: '#ea580c' },
  { value: 'purple', label: '紫色', bg: '#ede9fe', dot: '#7c3aed' },
  { value: 'pink', label: '粉色', bg: '#fce7f3', dot: '#db2777' },
  { value: 'yellow', label: '黄色', bg: '#fef9c3', dot: '#ca8a04' },
  { value: 'gray', label: '灰色', bg: '#f3f4f6', dot: '#6b7280' },
]

const form = reactive({ title: '', color: 'blue', start_time: '', end_time: '' })
const repeat = reactive({
  enabled: false,
  startDate: props.date,
  endDate: props.date,
  weekdays: [weekdayOf(props.date)]
})
const titleError = ref(false)
const timeError = ref(false)
const repeatError = ref('')
const saving = ref(false)
const titleInput = ref(null)

const selectedColor = computed(() =>
  colorOptions.find(c => c.value === form.color) || colorOptions[0]
)

const chipStyle = computed(() => ({
  background: selectedColor.value.bg,
  color: selectedColor.value.dot,
}))

const previewTime = computed(() => formatTimeRange(form))
const repeatPreview = computed(() => repeatSummary(repeat))

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

function toggleWeekday(day) {
  const index = repeat.weekdays.indexOf(day)
  if (index >= 0) {
    repeat.weekdays.splice(index, 1)
  } else {
    repeat.weekdays.push(day)
    repeat.weekdays.sort((a, b) => weekOptions.findIndex(x => x.value === a) - weekOptions.findIndex(x => x.value === b))
  }
}

function validateRepeat() {
  repeatError.value = ''
  if (!repeat.enabled) return true
  if (!repeat.startDate || !repeat.endDate) {
    repeatError.value = '请选择开始和结束日期'
    return false
  }
  if (repeat.startDate > repeat.endDate) {
    repeatError.value = '开始日期不能晚于结束日期'
    return false
  }
  if (repeat.weekdays.length === 0) {
    repeatError.value = '至少选择一个周几'
    return false
  }
  if (buildWeeklyRepeatDates(repeat).length === 0) {
    repeatError.value = '这个日期范围里没有匹配的周几'
    return false
  }
  return true
}

async function onSave() {
  if (!form.title.trim()) {
    titleError.value = true
    titleInput.value?.focus()
    return
  }
  titleError.value = false

  const startTime = normalizeTime(form.start_time)
  const endTime = normalizeTime(form.end_time)
  if (!isValidTimeRange(startTime, endTime)) {
    timeError.value = true
    return
  }
  timeError.value = false

  if (!validateRepeat()) return

  saving.value = true
  try {
    emit('save', {
      title: form.title.trim(),
      date: props.date,
      start_time: startTime,
      end_time: endTime,
      color: form.color,
      recurrence: repeat.enabled
        ? {
            enabled: true,
            startDate: repeat.startDate,
            endDate: repeat.endDate,
            weekdays: [...repeat.weekdays],
          }
        : null,
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
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0 }
  to { opacity: 1 }
}

.modal-box {
  width: 460px;
  max-width: 92vw;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.15s ease;
}

@keyframes slideUp {
  from { transform: translateY(14px); opacity: 0 }
  to { transform: translateY(0); opacity: 1 }
}

.modal-header,
.modal-footer {
  flex-shrink: 0;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.btn-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  overflow-y: auto;
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
  font-weight: 700;
  color: var(--text-secondary);
}

.required { color: #dc2626; }

.optional {
  color: var(--text-muted);
  font-weight: 400;
}

.form-date {
  font-size: 13px;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-surface);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-input.error { border-color: #dc2626; }
.error-msg { font-size: 12px; color: #dc2626; }

.time-row,
.date-range-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
}

.date-range-row {
  grid-template-columns: 1fr 1fr;
}

.date-range-row label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.time-separator {
  font-size: 12px;
  color: var(--text-muted);
}

.repeat-panel {
  padding: 12px;
  border: 1px solid var(--border-light);
  border-radius: 10px;
  background: var(--bg-app);
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
}

.repeat-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.weekday-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}

.weekday-btn {
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: 12px;
}

.weekday-btn:hover,
.weekday-btn.active {
  border-color: var(--primary);
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 700;
}

.repeat-preview {
  font-size: 12px;
  color: var(--text-muted);
}

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
  border-radius: 999px;
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: border-color 0.12s, transform 0.1s;
}

.color-btn:hover { transform: scale(1.04); }
.color-btn.active { box-shadow: var(--shadow-sm); }

.color-dot,
.preview-dot {
  border-radius: 50%;
  flex-shrink: 0;
}

.color-dot {
  width: 8px;
  height: 8px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px 18px;
  border-top: 1px solid var(--border-light);
}

.color-preview {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  max-width: 180px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
}

.preview-dot {
  width: 6px;
  height: 6px;
}

.preview-time {
  flex-shrink: 0;
  font-weight: 800;
}

.footer-btns {
  display: flex;
  gap: 8px;
}

.btn-cancel,
.btn-save {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.btn-cancel:hover { background: var(--bg-hover); }

.btn-save {
  background: var(--primary);
  color: var(--text-on-primary);
  font-weight: 700;
}

.btn-save:hover:not(:disabled) { background: var(--primary-dark); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
