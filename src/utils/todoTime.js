export function formatTimeRange(todo) {
  const start = todo?.start_time || ''
  const end = todo?.end_time || ''
  if (start && end) return `${start}-${end}`
  if (start) return `${start}开始`
  if (end) return `${end}结束`
  return ''
}

export function normalizeTime(value) {
  return value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : ''
}

export function isValidTimeRange(start, end) {
  return !start || !end || start <= end
}
