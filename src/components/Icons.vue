<script setup lang="ts">
defineProps<{
  name: string
  size?: number
  color?: string
}>()
</script>

<template>
  <svg
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color ?? 'currentColor'"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- 画笔 pen -->
    <template v-if="name === 'pen'">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </template>

    <!-- 荧光笔 highlighter -->
    <template v-else-if="name === 'highlighter'">
      <path d="m9 11-6 6v3h9l3-3" />
      <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
    </template>

    <!-- 箭头 arrow -->
    <template v-else-if="name === 'arrow'">
      <path d="M5 19 19 5" />
      <path d="M10 5h9v9" />
    </template>

    <!-- 矩形 rect -->
    <template v-else-if="name === 'rect'">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </template>

    <!-- 椭圆 ellipse -->
    <template v-else-if="name === 'ellipse'">
      <ellipse cx="12" cy="12" rx="10" ry="7" />
    </template>

    <!-- 直线 line -->
    <template v-else-if="name === 'line'">
      <path d="M4 20 20 4" />
    </template>

    <!-- 橡皮擦 eraser -->
    <template v-else-if="name === 'eraser'">
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </template>

    <!-- 撤销 undo -->
    <template v-else-if="name === 'undo'">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </template>

    <!-- 重做 redo -->
    <template v-else-if="name === 'redo'">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </template>

    <!-- 清除 trash -->
    <template v-else-if="name === 'trash'">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </template>

    <!-- 设置 settings -->
    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </template>

    <!-- 关闭 close -->
    <template v-else-if="name === 'close'">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </template>
  </svg>
</template>
