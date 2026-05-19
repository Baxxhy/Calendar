<template>
  <div class="calendar-header">
    <!-- 左侧：导航区域 -->
    <div class="header-left">
      <!-- 今天按钮 -->
      <button class="btn-today" @click="$emit('go-today')" title="回到今天 (Ctrl+T)">
        今天
      </button>

      <!-- 上一月 / 下一月 -->
      <div class="nav-arrows">
        <button class="btn-arrow" @click="$emit('prev')" title="上一月">
          ‹
        </button>
        <button class="btn-arrow" @click="$emit('next')" title="下一月">
          ›
        </button>
      </div>

      <!-- 当前年月标题 -->
      <h1 class="month-title">{{ title }}</h1>
    </div>

    <!-- 右侧：视图切换 + 工具按钮 -->
    <div class="header-right">
      <!-- 视图切换按钮组 -->
      <div class="view-switcher">
        <button
          class="btn-view"
          :class="{ active: currentView === 'month' }"
          @click="$emit('change-view', 'month')"
          title="月视图"
        >
          月
        </button>
        <button
          class="btn-view"
          :class="{ active: currentView === 'week' }"
          @click="$emit('change-view', 'week')"
          title="周视图"
        >
          周
        </button>
        <button
          class="btn-view"
          :class="{ active: currentView === 'list' }"
          @click="$emit('change-view', 'list')"
          title="清单视图"
        >
          清单
        </button>
      </div>

      <!-- 分隔线 -->
      <div class="divider"></div>

      <!-- 设置按钮 -->
      <button class="btn-icon" @click="$emit('open-settings')" title="设置 (Ctrl+,)">
        ⚙
      </button>

      <!-- 小组件模式按钮 -->
      <button class="btn-icon" @click="$emit('open-widget')" title="桌面小组件模式">
        ⊞
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * CalendarHeader.vue - 日历顶部工具栏
 *
 * Props:
 *   title       {string} - 显示的年月标题，如 '2026年5月'
 *   currentView {string} - 当前视图：'month' | 'week' | 'list'
 *
 * Emits:
 *   prev          - 点击上一月
 *   next          - 点击下一月
 *   go-today      - 点击今天
 *   change-view   - 切换视图，参数为视图名称字符串
 *   open-settings - 点击设置
 *   open-widget   - 点击小组件模式
 */
defineProps({
  title: {
    type: String,
    required: true
  },
  currentView: {
    type: String,
    default: 'month'
  }
})

defineEmits(['prev', 'next', 'go-today', 'change-view', 'open-settings', 'open-widget'])
</script>

<style scoped>
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  height: 60px;
  flex-shrink: 0;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.02);
}

/* 左侧导航区 */
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 今天按钮 */
.btn-today {
  padding: 7px 15px;
  border-radius: 8px;
  background: var(--primary);
  border: 1px solid var(--primary);
  color: var(--text-on-primary);
  font-size: 13px;
  font-weight: 500;
  transition: background var(--transition), border-color var(--transition);
}
.btn-today:hover {
  background: var(--primary-dark);
  border-color: var(--primary-dark);
  color: var(--text-on-primary);
}

/* 上一月/下一月箭头 */
.nav-arrows {
  display: flex;
  gap: 2px;
}
.btn-arrow {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition), color var(--transition);
}
.btn-arrow:hover {
  background: var(--bg-hover);
  color: var(--primary);
}

/* 年月标题 */
.month-title {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-primary);
  margin-left: 4px;
  letter-spacing: 0;
}

/* 右侧工具区 */
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 视图切换按钮组 */
.view-switcher {
  display: flex;
  background: var(--bg-app);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}
.btn-view {
  padding: 6px 13px;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: background var(--transition), color var(--transition);
}
.btn-view:hover {
  background: var(--bg-surface);
  color: var(--text-primary);
}
.btn-view.active {
  background: var(--bg-surface);
  color: var(--primary);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

/* 分隔线 */
.divider {
  width: 1px;
  height: 20px;
  background: var(--border);
  margin: 0 4px;
}

/* 图标按钮（设置、小组件） */
.btn-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition), color var(--transition);
}
.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--primary);
}
</style>
