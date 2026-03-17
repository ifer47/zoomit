# 绘制性能优化

## 性能瓶颈分析

原来的 `draw()` 函数在**每次 mousemove 事件**都执行 `redrawAll()`，即清空整个画布后重绘**所有历史操作**。随着历史记录增多，快速绘制时性能急剧下降。

## 优化措施

### 1. 离屏缓存画布（最大提升）

- 新增一个不可见的 `cacheCanvas`，用于缓存所有已完成的绘制操作
- 实时绘制时只需 `drawImage` 复制缓存位图（GPU 加速，极快）+ 绘制当前笔画
- 笔画完成时增量更新缓存，无需全量重建。关键顺序：先 `ensureCache()` → `drawActionOn(cacheCtx)` 增量绘制 → 再 `history.push(action)`，确保缓存重建时不会包含新 action 导致双重绘制
- 仅在 undo/redo/删除 等操作时才通过 `invalidateCache()` 标记失效并全量重建

### 2. requestAnimationFrame 批处理

- 用 `scheduleRender()` 替代直接渲染，确保每帧最多渲染一次（~60fps）
- 多个 mousemove 事件之间的点照常收集，但只在下一帧统一绘制
- 关键操作（endDraw、undo 等）使用 `flushRender()` 立即渲染

### 3. 最小距离过滤

- 自由绘制工具（画笔/荧光笔/橡皮擦）跳过距离 < 2px 的冗余点
- 减少路径点数量，降低 `quadraticCurveTo` 调用次数

### 4. Pointer Events + getCoalescedEvents

- 从 `mousedown/mousemove/mouseup` 切换到 `pointerdown/pointermove/pointerup`
- 利用 `getCoalescedEvents()` 获取浏览器合并的中间输入点，提升线条平滑度
- 添加 `touch-action: none` 防止触摸干扰

### 5. Shape 工具仅保留首尾两点

- 矩形/椭圆/直线/箭头渲染只使用起点和终点
- 原实现在每次 mousemove 时 `push` 新点，数组无限增长（拖拽 2 秒可积累 120+ 无用点）
- 优化后 `draw()` 对 shape 工具仅保留 2 个点：`pts[0]`（起点）和 `pts[1]`（当前鼠标位置，原地替换）

### 6. 消除 Vue 响应式代理开销

- `history` / `redoStack`：从 `reactive<DrawAction[]>` 改为普通数组，避免 `push`/`pop`/`splice`/遍历时的 Proxy 代理成本
- `currentAction`：从 `ref()` 改为 `shallowRef()`，避免对 `DrawAction` 对象的深度代理。原先 `ref()` 会递归包裹内部属性，导致绘制热路径中的 `points.push()` 也经过 Proxy
- 所有渲染由显式调用 `scheduleRender()` / `flushRender()` 驱动，不依赖 Vue 的深度响应式追踪

### 7. 模板层微优化

- `getCursorStyle()` 普通函数 → `cursorStyle` computed 属性，Vue 仅在 `currentTool` 变化时重新计算，避免每次渲染重复调用
- 内联 `getPoint()` 辅助函数，减少函数调用开销，并清理不再使用的 `Point` 类型导入
