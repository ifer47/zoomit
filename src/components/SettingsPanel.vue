<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Tool } from '../composables/useDrawing'
import Icon from './Icons.vue'

const props = defineProps<{
  currentTool: Tool
  currentColor: string
  lineWidth: number
  x: number
  y: number
}>()

const emit = defineEmits<{
  selectTool: [tool: Tool]
  selectColor: [color: string]
  updateLineWidth: [width: number]
  close: []
}>()

const tools: { id: Tool; icon: string; label: string; key: string }[] = [
  { id: 'pen', icon: 'pen', label: '画笔', key: '1' },
  { id: 'highlighter', icon: 'highlighter', label: '荧光笔', key: '2' },
  { id: 'arrow', icon: 'arrow', label: '箭头', key: '3' },
  { id: 'rect', icon: 'rect', label: '矩形', key: '4' },
  { id: 'ellipse', icon: 'ellipse', label: '椭圆', key: '5' },
  { id: 'line', icon: 'line', label: '直线', key: '6' },
  { id: 'eraser', icon: 'eraser', label: '橡皮擦', key: '7' },
  { id: 'text', icon: 'text', label: '文字', key: '8' },
]

const colors = [
  ['#FF3B30', '#FF6B35', '#FFCC02', '#34C759', '#007AFF', '#5856D6', '#FFFFFF'],
  ['#AF52DE', '#FF2D55', '#00C7BE', '#8E8E93', '#636366', '#3A3A3C', '#000000'],
]

const widths = [
  { value: 1, label: '极细' },
  { value: 2, label: '细' },
  { value: 3, label: '中' },
  { value: 5, label: '粗' },
  { value: 8, label: '极粗' },
]

const panelW = 272
const panelH = 380
const panelLeft = ref(0)
const panelTop = ref(0)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

function initPosition() {
  let left = props.x - panelW / 2
  let top = props.y - panelH / 2
  left = Math.max(12, Math.min(left, window.innerWidth - panelW - 12))
  top = Math.max(12, Math.min(top, window.innerHeight - panelH - 12))
  panelLeft.value = left
  panelTop.value = top
}

function startDrag(e: MouseEvent) {
  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - panelLeft.value,
    y: e.clientY - panelTop.value,
  }
  e.preventDefault()
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return
  panelLeft.value = Math.max(0, Math.min(e.clientX - dragOffset.value.x, window.innerWidth - panelW))
  panelTop.value = Math.max(0, Math.min(e.clientY - dragOffset.value.y, window.innerHeight - panelH))
}

function stopDrag() {
  isDragging.value = false
}

onMounted(() => {
  initPosition()
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
})
</script>

<template>
  <div class="panel-backdrop" @mousedown.self="emit('close')">
    <div class="panel" :style="{ left: panelLeft + 'px', top: panelTop + 'px' }" @mousedown.stop>
      <div class="drag-bar" @mousedown="startDrag" />
      <!-- 工具区 -->
      <div class="section section-first">
        <div class="section-header drag-handle" @mousedown="startDrag">
          <span class="section-title">工具</span>
          <span class="section-hint">按 1-8 切换</span>
        </div>
        <div class="tool-grid">
          <button
            v-for="tool in tools"
            :key="tool.id"
            class="tool-btn"
            :class="{ active: currentTool === tool.id }"
            :title="`${tool.label} (${tool.key})`"
            @click="emit('selectTool', tool.id); emit('close')"
          >
            <Icon :name="tool.icon" :size="18" />
            <span class="tool-label">{{ tool.label }}</span>
            <span class="tool-key">{{ tool.key }}</span>
          </button>
        </div>
      </div>

      <!-- 颜色区 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">颜色</span>
        </div>
        <div class="color-grid">
          <div v-for="(row, ri) in colors" :key="ri" class="color-row">
            <button
              v-for="color in row"
              :key="color"
              class="color-btn"
              :class="{ active: currentColor === color }"
              @click="emit('selectColor', color); emit('close')"
            >
              <span class="color-swatch" :style="{ backgroundColor: color }" />
              <span v-if="currentColor === color" class="color-check">✓</span>
            </button>
          </div>
        </div>
        <label class="color-custom-btn">
          <input
            type="color"
            class="color-custom-input"
            :value="currentColor"
            @input="emit('selectColor', ($event.target as HTMLInputElement).value)"
          />
          <span class="color-custom-swatch" :style="{ backgroundColor: currentColor }" />
          <span class="color-custom-label">自定义颜色</span>
        </label>
      </div>

      <!-- 线宽区 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">线宽</span>
        </div>
        <div class="width-row">
          <button
            v-for="w in widths"
            :key="w.value"
            class="width-btn"
            :class="{ active: lineWidth === w.value }"
            :title="w.label"
            @click="emit('updateLineWidth', w.value); emit('close')"
          >
            <span
              class="width-line"
              :style="{
                height: Math.max(1.5, w.value * 1.2) + 'px',
                backgroundColor: currentColor,
              }"
            />
          </button>
        </div>
      </div>

      <!-- 底部快捷键提示 -->
      <div class="shortcuts">
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-sep">+</span>拖动</span>
          <span class="shortcut-desc">矩形</span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>Shift</kbd><span class="shortcut-sep">+</span>拖动</span>
          <span class="shortcut-desc">椭圆</span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-keys"><kbd>Ctrl</kbd><span class="shortcut-sep">+</span><kbd>Shift</kbd><span class="shortcut-sep">+</span>拖动</span>
          <span class="shortcut-desc">箭头</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 100001;
}

.panel {
  position: absolute;
  width: 272px;
  background: rgba(30, 30, 32, 0.94);
  backdrop-filter: blur(24px) saturate(180%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.45),
    0 4px 16px rgba(0, 0, 0, 0.25),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.08);
  user-select: none;
  overflow: hidden;
}

.section {
  padding: 10px 14px;
}

.section-first {
  padding-top: 4px;
}

.section + .section {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.5px;
  font-family: system-ui, -apple-system, sans-serif;
}

.section-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.2);
  font-family: system-ui, sans-serif;
}

.drag-bar {
  height: 10px;
  cursor: default;
}

.drag-handle {
  cursor: default;
}

/* ---- 工具 ---- */
.tool-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px 6px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.tool-btn.active {
  background: rgba(10, 132, 255, 0.3);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(10, 132, 255, 0.45);
}

.tool-label {
  font-size: 10px;
  line-height: 1;
  font-family: system-ui, sans-serif;
}

.tool-key {
  position: absolute;
  top: 3px;
  right: 5px;
  font-size: 8px;
  color: rgba(255, 255, 255, 0.18);
  font-family: system-ui, sans-serif;
}

.tool-btn.active .tool-key {
  color: rgba(255, 255, 255, 0.4);
}

/* ---- 颜色 ---- */
.color-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.color-row {
  display: flex;
  justify-content: space-between;
}

.color-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease;
}

.color-btn:hover {
  transform: scale(1.18);
}

.color-btn.active {
  transform: scale(1.18);
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: border-color 0.12s;
}

.color-btn.active .color-swatch {
  border-color: rgba(255, 255, 255, 0.75);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.12);
}

.color-check {
  position: absolute;
  font-size: 11px;
  font-weight: 700;
  color: #000;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

.color-btn:nth-child(n+6) .color-check,
.color-row:last-child .color-btn:nth-child(n+4) .color-check {
  color: #fff;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.color-custom-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 10px 6px 6px;
  border-radius: 8px;
  margin-top: 6px;
  transition: background 0.12s;
}

.color-custom-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.color-custom-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.color-custom-swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  transition: border-color 0.12s;
  pointer-events: none;
}

.color-custom-btn:hover .color-custom-swatch {
  border-color: rgba(255, 255, 255, 0.35);
}

.color-custom-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  font-family: system-ui, sans-serif;
}

/* ---- 线宽 ---- */
.width-row {
  display: flex;
  gap: 4px;
}

.width-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.12s ease;
}

.width-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.width-btn.active {
  background: rgba(10, 132, 255, 0.3);
  box-shadow: inset 0 0 0 1px rgba(10, 132, 255, 0.45);
}

.width-line {
  width: 70%;
  border-radius: 99px;
  transition: transform 0.12s;
}

.width-btn:hover .width-line {
  transform: scaleX(1.1);
}

/* ---- 快捷键提示 ---- */
.shortcuts {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 14px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  font-family: system-ui, sans-serif;
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 3px;
  color: rgba(255, 255, 255, 0.25);
}

.shortcut-sep {
  color: rgba(255, 255, 255, 0.12);
  font-size: 9px;
}

.shortcut-item kbd {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 9px;
  font-family: system-ui, sans-serif;
  color: rgba(255, 255, 255, 0.35);
  line-height: 1.3;
}

.shortcut-desc {
  color: rgba(255, 255, 255, 0.2);
  font-size: 10px;
}
</style>
