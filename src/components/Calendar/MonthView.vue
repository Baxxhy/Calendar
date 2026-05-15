<template>
  <div class="month-view">
    <!-- 星期标题行：周一到周日 -->
    <div class="weekday-header">
      <div
        v-for="day in weekdays"
        :key="day"
        class="weekday-label"
        :class="{ weekend: day === '六' || day === '日' }"
      >
        周{{ day }}
      </div>
    </div>

    <!-- 日期格子网格（6行 × 7列 = 42格） -->
    <div class="days-grid">
      <DayCell
        v-for="day in calendarDays"
        :key="day.dateStr"
        :day="day"
        :is-selected="day.dateStr === selectedDate"
        :todos="allTodosByDate[day.dateStr] || []"
        @select="onSelectDate"
        @dblclick="onDblClickDate"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DayCell from './DayCell.vue'
import { getCalendarDays } from '../../utils/dateUtils.js'

/**
 * MonthView.vue - 月视图日历网格
 *
 * Props:
 *   year            {number} - 当前年份
 *   month           {number} - 当前月份（0-11）
 *   selectedDate    {string} - 选中的日期字符串 'YYYY-MM-DD'
 *   allTodosByDate  {Object} - { 'YYYY-MM-DD': Todo[] } 每天的完整 Todo 列表
 */
const props = defineProps({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  selectedDate: { type: String, default: '' },
  allTodosByDate: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['select-date', 'add-todo'])

// 星期标题（周一到周日）
const weekdays = ['一', '二', '三', '四', '五', '六', '日']

// 计算当前月的所有日期格子
const calendarDays = computed(() =>
  getCalendarDays(props.year, props.month)
)

function onSelectDate(dateStr) {
  emit('select-date', dateStr)
}

function onDblClickDate(dateStr) {
  emit('add-todo', dateStr)
}
</script>

<style scoped>
.month-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* 星期标题行 */
.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
}
.weekday-label {
  text-align: center;
  padding: 10px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}
.weekday-label.weekend {
  color: var(--primary);
}

/* 日期格子网格 */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-template-rows: repeat(6, 1fr);
  flex: 1;
  overflow: hidden;
  border-left: 1px solid var(--border-light);
  border-top: 1px solid var(--border-light);
  align-items: stretch;
}
</style>
