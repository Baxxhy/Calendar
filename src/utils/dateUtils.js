/**
 * dateUtils.js - 日期处理工具函数
 * 
 * 重要：所有日期操作都使用本地时间，避免时区问题
 * 日期格式统一为 'YYYY-MM-DD' 字符串
 */

/**
 * 将 Date 对象格式化为 'YYYY-MM-DD' 字符串（本地时间）
 */
export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 获取今天的日期字符串 'YYYY-MM-DD'
 */
export function today() {
  return formatDate(new Date())
}

/**
 * 获取某月的所有日期格子（包含上月末尾和下月开头补齐）
 * 周一为第一天
 * 
 * @param {number} year - 年份
 * @param {number} month - 月份（0-11，JavaScript 标准）
 * @returns {Array} 日期对象数组，每个对象包含 { date, dateStr, isCurrentMonth, isToday }
 */
export function getCalendarDays(year, month) {
  const days = []
  const todayStr = today()

  // 当月第一天
  const firstDay = new Date(year, month, 1)
  // 当月最后一天
  const lastDay = new Date(year, month + 1, 0)

  // 计算第一天是周几（0=周日，1=周一...6=周六）
  // 转换为周一为起点（0=周一，6=周日）
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1 // 周日(0) -> 6，其他减1

  // 填充上个月的日期
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({
      date: d,
      dateStr: formatDate(d),
      isCurrentMonth: false,
      isToday: formatDate(d) === todayStr
    })
  }

  // 填充当月日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i)
    days.push({
      date: d,
      dateStr: formatDate(d),
      isCurrentMonth: true,
      isToday: formatDate(d) === todayStr
    })
  }

  // 填充下个月的日期，补齐到 6 行（42 格）
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({
      date: d,
      dateStr: formatDate(d),
      isCurrentMonth: false,
      isToday: formatDate(d) === todayStr
    })
  }

  return days
}

/**
 * 获取月份显示名称，如 '2024年5月'
 */
export function getMonthTitle(year, month) {
  return `${year}年${month + 1}月`
}

/**
 * 上一个月
 * @returns {{ year, month }} 新的年月
 */
export function prevMonth(year, month) {
  if (month === 0) return { year: year - 1, month: 11 }
  return { year, month: month - 1 }
}

/**
 * 下一个月
 * @returns {{ year, month }} 新的年月
 */
export function nextMonth(year, month) {
  if (month === 11) return { year: year + 1, month: 0 }
  return { year, month: month + 1 }
}

export function addDays(dateStr, days) {
  const date = new Date(dateStr + 'T00:00:00')
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

export function getWeekRangeTitle(dateStr) {
  const base = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()
  const dow = base.getDay()
  const diffToMonday = dow === 0 ? -6 : 1 - dow
  const monday = new Date(base)
  monday.setDate(base.getDate() + diffToMonday)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const sameYear = monday.getFullYear() === sunday.getFullYear()
  const sameMonth = sameYear && monday.getMonth() === sunday.getMonth()

  if (sameMonth) {
    return `${monday.getFullYear()}年${monday.getMonth() + 1}月${monday.getDate()}日 - ${sunday.getDate()}日`
  }

  if (sameYear) {
    return `${monday.getFullYear()}年${monday.getMonth() + 1}月${monday.getDate()}日 - ${sunday.getMonth() + 1}月${sunday.getDate()}日`
  }

  return `${monday.getFullYear()}年${monday.getMonth() + 1}月${monday.getDate()}日 - ${sunday.getFullYear()}年${sunday.getMonth() + 1}月${sunday.getDate()}日`
}
