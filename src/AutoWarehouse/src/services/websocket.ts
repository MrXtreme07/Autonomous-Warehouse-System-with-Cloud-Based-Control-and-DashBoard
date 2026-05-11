import { BackendWebSocketMessage } from '../types'

const DEFAULT_WS_URL = 'ws://localhost:8000/ws'

export type WebSocketStatus = 'connected' | 'disconnected' | 'error'

interface WarehouseWebSocketOptions {
  onMessage: (message: BackendWebSocketMessage) => void
  onStatusChange: (status: WebSocketStatus) => void
}

export class WarehouseWebSocket {
  private socket: WebSocket | null = null
  private reconnectTimer: number | null = null
  private reconnectAttempts = 0
  private closedByClient = false

  constructor(
    private readonly options: WarehouseWebSocketOptions,
    private readonly url = import.meta.env.VITE_WS_URL ?? DEFAULT_WS_URL
  ) {}

  connect() {
    this.closedByClient = false
    this.clearReconnectTimer()

    this.socket = new WebSocket(this.url)

    this.socket.onopen = () => {
      this.reconnectAttempts = 0
      this.options.onStatusChange('connected')
    }

    this.socket.onmessage = (event) => {
      try {
        this.options.onMessage(JSON.parse(event.data) as BackendWebSocketMessage)
      } catch (error) {
        console.error('Invalid WebSocket message', error)
      }
    }

    this.socket.onerror = () => {
      this.options.onStatusChange('error')
    }

    this.socket.onclose = () => {
      this.socket = null
      if (this.closedByClient) return
      this.options.onStatusChange('disconnected')
      this.scheduleReconnect()
    }
  }

  close() {
    this.closedByClient = true
    this.clearReconnectTimer()
    this.socket?.close()
    this.socket = null
  }

  private scheduleReconnect() {
    this.clearReconnectTimer()
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 10000)
    this.reconnectAttempts += 1
    this.reconnectTimer = window.setTimeout(() => this.connect(), delay)
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer === null) return
    window.clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }
}
