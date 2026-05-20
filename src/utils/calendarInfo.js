import chineseDays from 'chinese-days'

const {
  getDayDetail,
  getLunarDate,
  getLunarFestivals,
  getSolarTerms,
  isHoliday,
  isWorkday,
} = chineseDays

const weekdayNames = new Set([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
])

const majorLunarFestivals = new Set([
  '春节',
  '元宵节',
  '端午节',
  '七夕',
  '中秋节',
  '重阳节',
  '腊八节',
  '小年',
  '除夕',
])

const cache = new Map()

function parseHolidayName(name) {
  if (!name || weekdayNames.has(name)) return ''
  const parts = String(name).split(',').map(part => part.trim()).filter(Boolean)
  return parts.find(part => /[\u4e00-\u9fa5]/.test(part)) || parts[0] || ''
}

function getMajorLunarFestival(dateStr) {
  const festivals = getLunarFestivals(dateStr, dateStr)[0]?.name || []
  return festivals.find(name => majorLunarFestivals.has(name)) || ''
}

function getSolarTermName(dateStr) {
  return getSolarTerms(dateStr, dateStr)[0]?.name || ''
}

export function getCalendarInfo(dateStr) {
  if (cache.has(dateStr)) return cache.get(dateStr)

  const lunar = getLunarDate(dateStr)
  const dayDetail = getDayDetail(dateStr)
  const holidayName = parseHolidayName(dayDetail.name)
  const lunarFestival = getMajorLunarFestival(dateStr)
  const solarTerm = getSolarTermName(dateStr)
  const holiday = isHoliday(dateStr)
  const adjustedWorkday = isWorkday(dateStr) && Boolean(holidayName)

  const info = {
    lunarText: lunar.lunarDay === 1 ? lunar.lunarMonCN : lunar.lunarDayCN,
    label: holidayName || lunarFestival || solarTerm || '',
    badge: holiday ? '休' : adjustedWorkday ? '班' : '',
    badgeType: holiday ? 'rest' : adjustedWorkday ? 'work' : '',
  }

  cache.set(dateStr, info)
  return info
}
