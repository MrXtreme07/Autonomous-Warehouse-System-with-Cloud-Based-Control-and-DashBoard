import { BackendEvent, CommandResponse, SystemState, TelemetryData } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  })

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

export const warehouseApi = {
  getState: () => request<{ state: SystemState }>('/state'),
  getEvents: () => request<BackendEvent[]>('/events'),
  getTelemetry: () => request<TelemetryData>('/telemetry'),
  deployRobot: () => request<CommandResponse>('/robot/deploy', { method: 'POST' }),
  pauseRobot: () => request<CommandResponse>('/robot/pause', { method: 'POST' }),
  resumeRobot: () => request<CommandResponse>('/robot/resume', { method: 'POST' }),
  returnRobot: () => request<CommandResponse>('/robot/return', { method: 'POST' }),
  resetSystem: () => request<CommandResponse>('/system/reset', { method: 'POST' }),
  emergencyStop: () => request<CommandResponse>('/system/emergency-stop', { method: 'POST' })
}
