export type SystemState = 'LOCKED' | 'IDLE' | 'ACTIVE' | 'PAUSED' | 'ERROR'
export type MissionPipelineStageName =
  | 'RFID_AUTH'
  | 'ORDER_CREATED'
  | 'ROBOT_DEPLOYED'
  | 'PACKAGE_CONFIRMED'
  | 'DELIVERY_COMPLETE'

export interface LoadCellData {
  weight: number
  status: 'idle' | 'loaded' | 'overload'
  unit: string
}

export interface UltrasonicData {
  distance: number
  status: 'clear' | 'intrusion' | 'error'
  unit: string
}

export interface DHT22Data {
  temperature: number
  humidity: number
  status: 'normal' | 'warning' | 'critical'
}

export interface RFIDData {
  lastTag: string
  authenticated: boolean
  timestamp: string
}

export interface RobotData {
  battery: number
  speed: number
  position: { x: number; y: number }
  status: 'idle' | 'moving' | 'returning' | 'stopped' | 'error'
  online: boolean
  lastHeartbeat: string | null
}

export interface TelemetryData {
  loadCell: LoadCellData
  ultrasonic: UltrasonicData
  dht22: DHT22Data
  rfid: RFIDData
  robot: RobotData
  pipelineStage: MissionPipelineStageName
}

export interface TimelineEvent {
  id: string
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface BackendEvent {
  id: string
  timestamp: string
  source: string
  type: string
  severity: 'info' | 'success' | 'warning' | 'error'
  message: string
  data: Record<string, unknown>
}

export interface BackendWebSocketMessage {
  type: 'state' | 'event' | 'events' | 'telemetry' | string
  payload: { state: SystemState } | BackendEvent | BackendEvent[] | TelemetryData | null
}

export interface CommandResponse {
  accepted: boolean
  command: string
  state: SystemState
}

export interface MissionStage {
  id: string
  label: string
  status: 'pending' | 'active' | 'complete'
}
