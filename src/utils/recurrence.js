import { addDays } from './dateUtils.js'

export const weekOptions = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' },
]

export function weekdayOf(dateStr) {
  return new Date(dateStr + 'T00:00:00').getDay()
}

export function buildWeeklyRepeatDates(recurrence) {
  if (!recurrence?.enabled) return []

  const startDate = recurrence.startDate
  const endDate = recurrence.endDate
  const weekdays = new Set(recurrence.weekdays || [])

  if (!startDate || !endDate || startDate > endDate || weekdays.size === 0) {
    return []
  }

  const dates = []
  let current = startDate
  let guard = 0

  while (current <= endDate && guard < 370) {
    if (weekdays.has(weekdayOf(current))) {
      dates.push(current)
    }
    current = addDays(current, 1)
    guard += 1
  }

  return dates
}

export function repeatSummary(recurrence) {
  if (!recurrence?.enabled) return ''
  const labels = weekOptions
    .filter(option => recurrence.weekdays?.includes(option.value))
    .map(option => option.label)
    .join('、')
  if (!labels || !recurrence.startDate || !recurrence.endDate) return ''
  return `${recurrence.startDate} 至 ${recurrence.endDate}，每${labels}`
}
