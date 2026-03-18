import { ref, shallowRef, type Ref } from 'vue'

export type Tool = 'pen' | 'highlighter' | 'arrow' | 'rect' | 'ellipse' | 'line' | 'eraser' | 'text'

export interface Point {
  x: number
  y: number
}

export interface DrawAction {
  tool: Tool
  color: string
  lineWidth: number
  opacity: number
  points: Point[]
  text?: string
  fontSize?: number
}

const MIN_DIST_SQ = 4

export function useDrawing(canvasRef: Ref<HTMLCanvasElement | null>) {
  const currentTool = ref<Tool>('pen')
  const currentColor = ref('#FF0000')
  const lineWidth = ref(3)
  const isDrawing = ref(false)
  const history: DrawAction[] = []
  const redoStack: DrawAction[] = []
  const currentAction = shallowRef<DrawAction | null>(null)

  let cacheCanvas: HTMLCanvasElement | null = null
  let cacheCtx: CanvasRenderingContext2D | null = null
  let cacheValid = false
  let rafId: number | null = null

  function getCtx(): CanvasRenderingContext2D | null {
    return canvasRef.value?.getContext('2d') ?? null
  }

  function ensureCache() {
    const canvas = canvasRef.value
    if (!canvas) return

    if (!cacheCanvas) {
      cacheCanvas = document.createElement('canvas')
    }

    if (cacheCanvas.width !== canvas.width || cacheCanvas.height !== canvas.height) {
      cacheCanvas.width = canvas.width
      cacheCanvas.height = canvas.height
      cacheCtx = cacheCanvas.getContext('2d')
      const dpr = window.devicePixelRatio || 1
      if (cacheCtx) cacheCtx.scale(dpr, dpr)
      cacheValid = false
    }

    if (!cacheValid && cacheCtx) {
      cacheCtx.clearRect(0, 0, cacheCanvas.width, cacheCanvas.height)
      for (let i = 0; i < history.length; i++) {
        drawActionOn(cacheCtx, history[i])
      }
      cacheValid = true
    }
  }

  function invalidateCache() {
    cacheValid = false
  }

  function renderFrame() {
    const ctx = getCtx()
    const canvas = canvasRef.value
    if (!ctx || !canvas) return

    ensureCache()

    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (cacheCanvas) {
      ctx.drawImage(cacheCanvas, 0, 0)
    }
    ctx.restore()

    const action = currentAction.value
    if (action) {
      drawActionOn(ctx, action)
    }
  }

  function scheduleRender() {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      renderFrame()
    })
  }

  function flushRender() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    renderFrame()
  }

  function addTextAction(text: string, x: number, y: number, width: number, fontSize: number, color?: string) {
    const action: DrawAction = {
      tool: 'text',
      color: color ?? currentColor.value,
      lineWidth: lineWidth.value,
      opacity: 1,
      points: [{ x, y }],
      text,
      fontSize,
    }
    redoStack.length = 0

    ensureCache()
    if (cacheCtx) drawActionOn(cacheCtx, action)
    history.push(action)
    flushRender()
  }

  function startDraw(point: Point) {
    if (currentTool.value === 'text') return
    isDrawing.value = true
    redoStack.length = 0

    const opacity = currentTool.value === 'highlighter' ? 0.35 : 1
    const width = currentTool.value === 'highlighter' ? 20 :
                  currentTool.value === 'eraser' ? 25 : lineWidth.value

    currentAction.value = {
      tool: currentTool.value,
      color: currentTool.value === 'eraser' ? 'rgba(0,0,0,1)' : currentColor.value,
      lineWidth: width,
      opacity,
      points: [point],
    }
  }

  function draw(point: Point, isPerfect = false) {
    if (!isDrawing.value) return
    const action = currentAction.value
    if (!action) return

    const pts = action.points
    const isFreehand = action.tool === 'pen' || action.tool === 'highlighter' || action.tool === 'eraser'

    if (isFreehand) {
      const last = pts[pts.length - 1]
      const dx = point.x - last.x
      const dy = point.y - last.y
      if (dx * dx + dy * dy < MIN_DIST_SQ) return
      pts.push(point)
    } else {
      let finalPoint = point
      if (isPerfect && pts.length > 0 && (action.tool === 'rect' || action.tool === 'ellipse')) {
        const start = pts[0]
        const dx = point.x - start.x
        const dy = point.y - start.y
        const maxDist = Math.max(Math.abs(dx), Math.abs(dy))
        finalPoint = {
          x: start.x + (dx < 0 ? -maxDist : maxDist),
          y: start.y + (dy < 0 ? -maxDist : maxDist)
        }
      }

      if (pts.length === 1) {
        pts.push(finalPoint)
      } else {
        pts[1] = finalPoint
      }
    }

    scheduleRender()
  }

  function endDraw() {
    if (!isDrawing.value) return
    const action = currentAction.value
    if (!action) return
    isDrawing.value = false

    ensureCache()
    if (cacheCtx) drawActionOn(cacheCtx, action)
    history.push(action)

    currentAction.value = null
    flushRender()
  }

  function drawActionOn(ctx: CanvasRenderingContext2D, action: DrawAction) {
    ctx.save()
    ctx.globalAlpha = action.opacity

    if (action.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
    } else {
      ctx.globalCompositeOperation = 'source-over'
    }

    ctx.strokeStyle = action.color
    ctx.fillStyle = action.color
    ctx.lineWidth = action.lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (action.tool === 'text') {
      const fs = action.fontSize ?? 24
      ctx.font = `${fs}px "Microsoft YaHei", "PingFang SC", system-ui, sans-serif`
      ctx.globalAlpha = 1
      ctx.fillStyle = action.color
      ctx.textBaseline = 'alphabetic'
      const lines = (action.text ?? '').split('\n')
      // HTML textarea 的 padding 为 0 2px，所以 x 偏移 2px
      const x = action.points[0].x + 2
      // DOM 中 textarea 的 top 为 y - lh / 2，每行高度为 lh
      // CSS 渲染时，文本在 line-height 内垂直居中。
      // 居中时，基线 (baseline) 距离行垂直中心的偏移量：(ascender + descender) / 2
      // 对于微软雅黑 (YaHei) 和苹方 (PingFang)，该偏移量约为字号的 0.398 倍
      const lh = Math.round(fs * 1.3)
      const baselineOffsetY = fs * 0.398
      for (let i = 0; i < lines.length; i++) {
        const lineCenterY = action.points[0].y + i * lh
        ctx.fillText(lines[i], x, lineCenterY + baselineOffsetY)
      }
      ctx.restore()
      return
    }

    const pts = action.points
    if (pts.length < 2) {
      ctx.beginPath()
      ctx.arc(pts[0].x, pts[0].y, action.lineWidth / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      return
    }

    switch (action.tool) {
      case 'pen':
      case 'highlighter':
      case 'eraser':
        drawFreehand(ctx, pts)
        break
      case 'line':
        drawLine(ctx, pts[0], pts[1])
        break
      case 'arrow':
        drawArrow(ctx, pts[0], pts[1])
        break
      case 'rect':
        drawRect(ctx, pts[0], pts[1])
        break
      case 'ellipse':
        drawEllipse(ctx, pts[0], pts[1])
        break
    }

    ctx.restore()
  }

  function drawFreehand(ctx: CanvasRenderingContext2D, points: Point[]) {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y)
    } else {
      for (let i = 1; i < points.length - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2
        const midY = (points[i].y + points[i + 1].y) / 2
        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY)
      }
      const last = points[points.length - 1]
      ctx.lineTo(last.x, last.y)
    }
    ctx.stroke()
  }

  function drawLine(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
  }

  function drawArrow(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
    const headLen = Math.max(15, ctx.lineWidth * 4)
    const angle = Math.atan2(end.y - start.y, end.x - start.x)

    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(end.x, end.y)
    ctx.lineTo(
      end.x - headLen * Math.cos(angle - Math.PI / 6),
      end.y - headLen * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      end.x - headLen * Math.cos(angle + Math.PI / 6),
      end.y - headLen * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fill()
  }

  function drawRect(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
    ctx.beginPath()
    ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y)
    ctx.stroke()
  }

  function drawEllipse(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
    const cx = (start.x + end.x) / 2
    const cy = (start.y + end.y) / 2
    const rx = Math.abs(end.x - start.x) / 2
    const ry = Math.abs(end.y - start.y) / 2

    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  function redrawAll() {
    invalidateCache()
    flushRender()
  }

  function undo() {
    if (history.length === 0) return
    const last = history.pop()!
    redoStack.push(last)
    invalidateCache()
    flushRender()
  }

  function redo() {
    if (redoStack.length === 0) return
    const action = redoStack.pop()!
    history.push(action)
    invalidateCache()
    flushRender()
  }

  function clearAll() {
    history.length = 0
    redoStack.length = 0
    invalidateCache()
    const ctx = getCtx()
    const canvas = canvasRef.value
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  function findTextAt(p: Point): { action: DrawAction, index: number } | null {
    const ctx = getCtx()
    if (!ctx) return null
    for (let i = history.length - 1; i >= 0; i--) {
      const action = history[i]
      if (action.tool === 'text' && action.text) {
        const fs = action.fontSize ?? 24
        ctx.font = `${fs}px "Microsoft YaHei", "PingFang SC", system-ui, sans-serif`
        const lines = action.text.split('\n')
        let maxWidth = 0
        for (const line of lines) {
          const w = ctx.measureText(line).width
          if (w > maxWidth) maxWidth = w
        }
        const lh = Math.round(fs * 1.3)
        const h = lines.length * lh
        const boxX = action.points[0].x - 10
        const boxY = action.points[0].y - lh / 2 - 10
        if (p.x >= boxX && p.x <= boxX + maxWidth + 20 && p.y >= boxY && p.y <= boxY + h + 20) {
          return { action, index: i }
        }
      }
    }
    return null
  }

  function removeAction(index: number) {
    if (index >= 0 && index < history.length) {
      history.splice(index, 1)
      invalidateCache()
      flushRender()
    }
  }

  function destroy() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    cacheCanvas = null
    cacheCtx = null
  }

  return {
    currentTool,
    currentColor,
    lineWidth,
    isDrawing,
    history,
    startDraw,
    draw,
    endDraw,
    findTextAt,
    removeAction,
    addTextAction,
    undo,
    redo,
    clearAll,
    redrawAll,
    destroy,
  }
}
