export type SystemState = 'LOCKED' | 'IDLE' | 'ACTIVE' | 'PAUSED' | 'ERROR'

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
}

export interface TelemetryData {
  loadCell: LoadCellData
  ultrasonic: UltrasonicData
  dht22: DHT22Data
  rfid: RFIDData
  robot: RobotData
}

export interface TimelineEvent {
  id: string
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface MissionStage {
  id: string
  label: string
  status: 'pending' | 'active' | 'complete'
}
