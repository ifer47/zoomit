export interface AppConfig {
  shortcuts: {
    toggleDrawing: string
    clearDrawing: string
  }
  general: {
    enableDragging: boolean
  }
}

export interface SaveResult {
  ok: boolean
  failed?: string[]
}
