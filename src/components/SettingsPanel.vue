<script setup lang="ts">
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
]

const colors = [
  ['#FF3B30', '#FF6B35', '#FFCC02', '#34C759', '#00C7BE'],
  ['#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#FFFFFF'],
  ['#8E8E93', '#636366', '#3A3A3C', '#1C1C1E', '#000000'],
]

const widths = [
  { value: 1, label: '极细' },
  { value: 2, label: '细' },
  { value: 3, label: '中' },
  { value: 5, label: '粗' },
  { value: 8, label: '极粗' },
]

function getPanelStyle() {
  const panelW = 264
  const panelH = 340
  let left = props.x - panelW / 2
  let top = props.y - panelH / 2
  left = Math.max(12, Math.min(left, window.innerWidth - panelW - 12))
  top = Math.max(12, Math.min(top, window.innerHeight - panelH - 12))
  return { left: left + 'px', top: top + 'px' }
}
</script>

<template>
  <div class="panel-backdrop" @mousedown.self="emit('close')">
    <div class="panel" :style="getPanelStyle()" @mousedown.stop>
      <!-- 工具区 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">工具</span>
          <span class="section-hint">按 1-7 切换</span>
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
          <div
            class="current-color-preview"
            :style="{ backgroundColor: currentColor }"
          />
        </div>
        <div class="color-grid">
          <div v-for="(row, ri) in colors" :key="ri" class="color-row">
            <button
              v-for="color in row"
              :key="color"
              class="color-btn"
              :class="{ active: currentColor === color }"
              :style="{ '--c': color }"
              @click="emit('selectColor', color); emit('close')"
            >
              <span class="color-swatch" :style="{ backgroundColor: color }" />
              <span v-if="currentColor === color" class="color-check">
                <Icon name="close" :size="10" :color="color === '#000000' || color === '#1C1C1E' || color === '#3A3A3C' ? '#fff' : '#000'" />
              </span>
            </button>
          </div>
        </div>
        <div class="color-custom-row">
          <label class="color-custom-btn">
            <input
              type="color"
              class="color-custom-input"
              :value="currentColor"
              @input="emit('selectColor', ($event.target as HTMLInputElement).value)"
            />
            <span class="color-custom-label">自定义</span>
          </label>
        </div>
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
              class="width-indicator"
              :style="{
                width: w.value * 1.5 + 4 + 'px',
                height: w.value * 1.5 + 4 + 'px',
                backgroundColor: currentColor,
              }"
            />
            <span class="width-label">{{ w.value }}px</span>
          </button>
        </div>
      </div>

      <!-- 底部快捷键提示 -->
      <div class="shortcuts">
        <div class="shortcut-item">
          <kbd>Ctrl</kbd>+拖动 <span class="shortcut-desc">矩形</span>
        </div>
        <div class="shortcut-item">
          <kbd>Shift</kbd>+拖动 <span class="shortcut-desc">椭圆</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+拖动 <span class="shortcut-desc">箭头</span>
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
  width: 264px;
  background: rgba(28, 28, 30, 0.96);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.4),
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  user-select: none;
  overflow: hidden;
}

.section {
  padding: 12px 14px 8px;
}

.section + .section {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
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
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: system-ui, -apple-system, sans-serif;
}

.section-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.25);
  font-family: system-ui, sans-serif;
}

.current-color-preview {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
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
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.tool-btn.active {
  background: rgba(10, 132, 255, 0.35);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(10, 132, 255, 0.5);
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
  color: rgba(255, 255, 255, 0.2);
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
  gap: 6px;
  justify-content: flex-start;
}

.color-btn {
  width: 28px;
  height: 28px;
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
  transform: scale(1.15);
}

.color-btn.active {
  transform: scale(1.15);
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.12);
  transition: border-color 0.12s;
}

.color-btn.active .color-swatch {
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.15);
}

.color-check {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-custom-row {
  margin-top: 8px;
}

.color-custom-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 10px 4px 4px;
  border-radius: 8px;
  transition: background 0.12s;
}

.color-custom-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.color-custom-input {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  cursor: pointer;
  padding: 0;
  background: none;
  -webkit-appearance: none;
  appearance: none;
}

.color-custom-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-custom-input::-webkit-color-swatch {
  border: none;
  border-radius: 50%;
}

.color-custom-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
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
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px 4px 6px;
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

.width-indicator {
  display: block;
  border-radius: 50%;
  transition: transform 0.12s;
}

.width-btn:hover .width-indicator {
  transform: scale(1.15);
}

.width-label {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.3);
  font-family: system-ui, sans-serif;
}

.width-btn.active .width-label {
  color: rgba(255, 255, 255, 0.6);
}

/* ---- 快捷键提示 ---- */
.shortcuts {
  display: flex;
  gap: 4px;
  padding: 8px 14px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-wrap: wrap;
}

.shortcut-item {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.2);
  font-family: system-ui, sans-serif;
  display: flex;
  align-items: center;
  gap: 2px;
}

.shortcut-item kbd {
  display: inline-block;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 9px;
  font-family: system-ui, sans-serif;
  color: rgba(255, 255, 255, 0.35);
  line-height: 1.3;
}

.shortcut-desc {
  color: rgba(255, 255, 255, 0.3);
  margin-right: 6px;
}
</style>
