import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BackendEvent,
  BackendWebSocketMessage,
  MissionStage,
  MissionPipelineStageName,
  SystemState,
  TelemetryData,
  TimelineEvent
} from '../types'
import { warehouseApi } from '../services/api'
import { WarehouseWebSocket, WebSocketStatus } from '../services/websocket'

const initialTelemetry: TelemetryData = {
  loadCell: { weight: 0, status: 'idle', unit: 'kg' },
  ultrasonic: { distance: 150, status: 'clear', unit: 'cm' },
  dht22: { temperature: 22.5, humidity: 45, status: 'normal' },
  rfid: { lastTag: '', authenticated: false, timestamp: '' },
  robot: { battery: 85, speed: 0, position: { x: 0, y: 0 }, status: 'idle', online: false, lastHeartbeat: null },
  pipelineStage: 'RFID_AUTH'
}

const initialMissionStages: MissionStage[] = [
  { id: 'rfid', label: 'RFID AUTH', status: 'pending' },
  { id: 'order', label: 'ORDER CREATED', status: 'pending' },
  { id: 'deploy', label: 'ROBOT DEPLOYED', status: 'pending' },
  { id: 'confirm', label: 'PACKAGE CONFIRMED', status: 'pending' },
  { id: 'complete', label: 'DELIVERY COMPLETE', status: 'pending' }
]

function toTimelineEvent(event: BackendEvent): TimelineEvent {
  return {
    id: event.id,
    timestamp: event.timestamp,
    message: event.message,
    type: event.severity === 'success' ? 'success' : event.severity
  }
}

function buildMissionStages(currentStage: MissionPipelineStageName): MissionStage[] {
  const stageOrder: MissionPipelineStageName[] = [
    'RFID_AUTH',
    'ORDER_CREATED',
    'ROBOT_DEPLOYED',
    'PACKAGE_CONFIRMED',
    'DELIVERY_COMPLETE'
  ]
  const currentIndex = Math.max(0, stageOrder.indexOf(currentStage))
  const stageNameById: Record<string, MissionPipelineStageName> = {
    rfid: 'RFID_AUTH',
    order: 'ORDER_CREATED',
    deploy: 'ROBOT_DEPLOYED',
    confirm: 'PACKAGE_CONFIRMED',
    complete: 'DELIVERY_COMPLETE'
  }

  return initialMissionStages.map((stage) => {
    const stageIndex = stageOrder.indexOf(stageNameById[stage.id])
    const status = stageIndex < currentIndex ? 'complete' : stageIndex === currentIndex ? 'active' : 'pending'
    return { ...stage, status }
  })
}

export function useWarehouseDashboard() {
  const [systemState, setSystemState] = useState<SystemState>('LOCKED')
  const [telemetry, setTelemetry] = useState<TelemetryData>(initialTelemetry)
  const [backendEvents, setBackendEvents] = useState<BackendEvent[]>([])
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('disconnected')
  const [apiError, setApiError] = useState<string | null>(null)

  const refreshEvents = useCallback(async () => {
    const events = await warehouseApi.getEvents()
    setBackendEvents(events)
  }, [])

  const refreshSnapshot = useCallback(async () => {
    const [stateResponse, eventsResponse, telemetryResponse] = await Promise.all([
      warehouseApi.getState(),
      warehouseApi.getEvents(),
      warehouseApi.getTelemetry()
    ])
    setSystemState(stateResponse.state)
    setBackendEvents(eventsResponse)
    setTelemetry(telemetryResponse)
  }, [])

  useEffect(() => {
    refreshSnapshot().catch((error) => {
      console.error(error)
      setApiError('Backend unavailable')
    })
  }, [refreshSnapshot])

  const handleWebSocketMessage = useCallback((message: BackendWebSocketMessage) => {
    if (message.type === 'state' && !Array.isArray(message.payload) && message.payload && 'state' in message.payload) {
      setSystemState(message.payload.state)
      return
    }

    if (message.type === 'telemetry' && !Array.isArray(message.payload)) {
      setTelemetry(message.payload as TelemetryData)
      return
    }

    if (message.type === 'events' && Array.isArray(message.payload)) {
      setBackendEvents(message.payload)
      return
    }

    if (message.type === 'event' && !Array.isArray(message.payload)) {
      setBackendEvents((previous) => [...previous.slice(-99), message.payload as BackendEvent])
    }
  }, [])

  useEffect(() => {
    const socket = new WarehouseWebSocket({
      onMessage: handleWebSocketMessage,
      onStatusChange: (status) => {
        setWsStatus(status)
        if (status === 'connected') {
          setApiError(null)
          refreshSnapshot().catch((error) => {
            console.error(error)
            setApiError('Backend unavailable')
          })
        }
      }
    })

    socket.connect()
    return () => socket.close()
  }, [handleWebSocketMessage, refreshSnapshot])

  const runCommand = useCallback(
    async (command: () => Promise<unknown>) => {
      try {
        setApiError(null)
        await command()
        await refreshSnapshot()
      } catch (error) {
        console.error(error)
        setApiError('Command failed')
      }
    },
    [refreshSnapshot]
  )

  const controls = useMemo(
    () => ({
      deploy: () => runCommand(warehouseApi.deployRobot),
      pause: () => runCommand(warehouseApi.pauseRobot),
      resume: () => runCommand(warehouseApi.resumeRobot),
      returnToBase: () => runCommand(warehouseApi.returnRobot),
      reset: () => runCommand(warehouseApi.resetSystem),
      emergencyStop: () => runCommand(warehouseApi.emergencyStop),
      clearEmergency: () => runCommand(warehouseApi.resetSystem)
    }),
    [runCommand]
  )

  const events = useMemo<TimelineEvent[]>(() => backendEvents.map(toTimelineEvent), [backendEvents])
  const stages = useMemo(() => buildMissionStages(telemetry.pipelineStage), [telemetry.pipelineStage])

  const robotStatus = telemetry.robot.online ? (telemetry.robot.battery < 20 ? 'warning' : 'online') : 'offline'
  const rfidStatus = telemetry.rfid.authenticated ? 'ready' : telemetry.rfid.lastTag ? 'error' : 'scanning'
  const safetyStatus = systemState === 'ERROR' ? 'critical' : telemetry.ultrasonic.status === 'intrusion' ? 'warning' : 'safe'

  return {
    systemState,
    telemetry,
    events,
    stages,
    mqttStatus: wsStatus === 'connected' ? 'connected' : wsStatus,
    robotStatus,
    rfidStatus,
    safetyStatus,
    missionId: null,
    apiError,
    controls,
    refreshEvents
  }
}
