import { isValidTimeRange, normalizeTime } from '../utils/todoTime.js'

/**
 * todoService.js - Todo 数据服务层
 * 
 * 封装所有与 Todo 相关的数据操作
 * Vue 组件通过这个服务访问数据，不直接调用 window.electronAPI
 */

/**
 * 获取指定日期的 Todo 列表
 * @param {string} date - 'YYYY-MM-DD' 格式
 */
export async function getTodosByDate(date) {
  return await window.electronAPI.getTodosByDate(date)
}

/**
 * 获取所有 Todo
 */
export async function getAllTodos() {
  return await window.electronAPI.getAllTodos()
}

/**
 * 添加新 Todo
 * @param {Object} todo - { title, date, description?, priority?, color? }
 */
export async function addTodo(todo) {
  if (!todo.title || !todo.title.trim()) {
    throw new Error('标题不能为空')
  }
  if (!todo.date) {
    throw new Error('日期不能为空')
  }
  const startTime = normalizeTime(todo.start_time)
  const endTime = normalizeTime(todo.end_time)
  if (!isValidTimeRange(startTime, endTime)) {
    throw new Error('开始时间不能晚于结束时间')
  }
  return await window.electronAPI.addTodo({
    ...todo,
    title: todo.title.trim(),
    start_time: startTime,
    end_time: endTime
  })
}

/**
 * 更新 Todo
 * @param {Object} todo - 必须包含 id
 */
export async function updateTodo(todo) {
  if (!todo.id) throw new Error('缺少 Todo ID')
  if (!todo.title || !todo.title.trim()) throw new Error('标题不能为空')
  const startTime = normalizeTime(todo.start_time)
  const endTime = normalizeTime(todo.end_time)
  if (!isValidTimeRange(startTime, endTime)) {
    throw new Error('开始时间不能晚于结束时间')
  }
  return await window.electronAPI.updateTodo({
    ...todo,
    title: todo.title.trim(),
    start_time: startTime,
    end_time: endTime
  })
}

/**
 * 删除 Todo
 * @param {string} id
 */
export async function deleteTodo(id) {
  return await window.electronAPI.deleteTodo(id)
}

/**
 * 切换 Todo 完成状态
 * @param {string} id
 */
export async function toggleTodo(id) {
  return await window.electronAPI.toggleTodo(id)
}

/**
 * 获取指定年月中有 Todo 的日期信息
 * @param {number} year
 * @param {number} month - 1-12
 * @returns {Object} { 'YYYY-MM-DD': { count, uncompleted } }
 */
export async function getTodoDates(year, month) {
  return await window.electronAPI.getTodoDates(year, month)
}
