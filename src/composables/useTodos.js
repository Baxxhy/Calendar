import { ref, computed } from 'vue'
import * as todoService from '../services/todoService.js'

export function useTodos() {
  const todos = ref([])
  const loading = ref(false)
  const error = ref(null)
  let loadSeq = 0

  async function loadTodosByDate(date) {
    const seq = ++loadSeq

    if (!date) {
      todos.value = []
      return
    }

    loading.value = true
    error.value = null
    todos.value = []

    try {
      const result = await todoService.getTodosByDate(date)
      if (seq === loadSeq) {
        todos.value = result
      }
    } catch (err) {
      if (seq === loadSeq) {
        todos.value = []
        error.value = err.message
      }
      console.error('Failed to load todos:', err)
    } finally {
      if (seq === loadSeq) {
        loading.value = false
      }
    }
  }

  async function addTodo(todoData) {
    try {
      const newTodo = await todoService.addTodo(todoData)
      todos.value.push(newTodo)
      return newTodo
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function deleteTodo(id) {
    try {
      await todoService.deleteTodo(id)
      todos.value = todos.value.filter(t => t.id !== id)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function toggleTodo(id) {
    try {
      const updated = await todoService.toggleTodo(id)
      const index = todos.value.findIndex(t => t.id === id)
      if (index !== -1) {
        todos.value[index] = updated
      }
      return updated
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const uncompletedCount = computed(() =>
    todos.value.filter(t => !t.completed).length
  )

  return {
    todos,
    loading,
    error,
    uncompletedCount,
    loadTodosByDate,
    addTodo,
    deleteTodo,
    toggleTodo
  }
}
