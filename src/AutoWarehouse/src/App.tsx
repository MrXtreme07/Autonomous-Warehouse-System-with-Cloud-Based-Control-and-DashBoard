import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopStatusBar } from './components/TopStatusBar'
import { MissionPipeline } from './components/MissionPipeline'
import { EventTimeline } from './components/EventTimeline'
import { TelemetryPanel } from './components/TelemetryPanel'
import { RobotControlPanel } from './components/RobotControlPanel'
import { SystemState, TelemetryData, TimelineEvent, MissionStage } from './types'

const initialTelemetry: TelemetryData = {
  loadCell: { weight: 0, status: 'idle', unit: 'kg' },
  ultrasonic: { distance: 150, status: 'clear', unit: 'cm' },
  dht22: { temperature: 22.5, humidity: 45, status: 'normal' },
  rfid: { lastTag: '', authenticated: false, timestamp: '' },
  robot: { battery: 85, speed: 0, position: { x: 0, y: 0 }, status: 'idle' }
}

const missionStages: MissionStage[] = [
  { id: 'rfid', label: 'RFID AUTH', status: 'pending' },
  { id: 'order', label: 'ORDER CREATED', status: 'pending' },
  { id: 'deploy', label: 'ROBOT DEPLOYED', status: 'pending' },
  { id: 'confirm', label: 'PACKAGE CONFIRMED', status: 'pending' },
  { id: 'complete', label: 'DELIVERY COMPLETE', status: 'pending' }
]

export default function App() {
  const [systemState, setSystemState] = useState<SystemState>('IDLE')
  const [telemetry, setTelemetry] = useState<TelemetryData>(initialTelemetry)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [missionId, setMissionId] = useState<string | null>(null)
  const [stages, setStages] = useState<MissionStage[]>(missionStages)
  const [mqttStatus, setMqttStatus] = useState<'connected' | 'disconnected' | 'error'>('connected')
  const [robotStatus, setRobotStatus] = useState<'online' | 'offline' | 'warning'>('online')
  const [rfidStatus, setRfidStatus] = useState<'ready' | 'scanning' | 'error'>('ready')
  const [safetyStatus, setSafetyStatus] = useState<'safe' | 'warning' | 'critical'>('safe')

  const addEvent = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const now = new Date()
    const timestamp = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setEvents(prev => [...prev.slice(-49), { id: Date.now().toString(), timestamp, message, type }])
  }, [])

  // Simulate telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        loadCell: {
          ...prev.loadCell,
          weight: prev.loadCell.weight + (Math.random() - 0.5) * 0.1,
          status: prev.loadCell.weight > 5 ? 'loaded' : 'idle'
        },
        ultrasonic: {
          ...prev.ultrasonic,
          distance: Math.max(10, Math.min(200, prev.ultrasonic.distance + (Math.random() - 0.5) * 5)),
          status: prev.ultrasonic.distance < 30 ? 'intrusion' : 'clear'
        },
        dht22: {
          ...prev.dht22,
          temperature: 22 + (Math.random() - 0.5) * 2,
          humidity: 45 + (Math.random() - 0.5) * 5,
          status: prev.dht22.temperature > 30 ? 'warning' : 'normal'
        },
        robot: {
          ...prev.robot,
          battery: Math.max(0, prev.robot.battery - 0.01),
          speed: systemState === 'ACTIVE' ? 0.5 + Math.random() * 0.3 : 0
        }
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [systemState])

  // Initial events
  useEffect(() => {
    addEvent('System initialized', 'info')
    addEvent('MQTT broker connected', 'success')
    addEvent('Robot telemetry online', 'success')
    addEvent('RFID reader ready', 'info')
    addEvent('All sensors calibrated', 'success')
  }, [addEvent])

  const handleStartMission = useCallback(() => {
    if (systemState !== 'IDLE') return
    
    const newMissionId = `WH-${Date.now().toString(36).toUpperCase()}`
    setMissionId(newMissionId)
    setSystemState('ACTIVE')
    addEvent(`Mission ${newMissionId} initiated`, 'info')
    
    // Simulate mission progression
    const progressMission = async () => {
      const stageUpdates = [
        { index: 0, delay: 1000, event: 'RFID Authentication Success', eventType: 'success' as const },
        { index: 1, delay: 2000, event: 'Order Created - SKU-2847', eventType: 'info' as const },
        { index: 2, delay: 3000, event: 'Robot AGV-01 Deployed', eventType: 'info' as const },
        { index: 3, delay: 5000, event: 'Package Confirmed by Load Cell (2.5kg)', eventType: 'success' as const },
        { index: 4, delay: 7000, event: 'Delivery Complete - Bay A3', eventType: 'success' as const }
      ]

      for (const update of stageUpdates) {
        await new Promise(resolve => setTimeout(resolve, update.delay))
        setStages(prev => prev.map((stage, i) => ({
          ...stage,
          status: i < update.index ? 'complete' : i === update.index ? 'active' : 'pending'
        })))
        addEvent(update.event, update.eventType)
        
        if (update.index === 3) {
          setTelemetry(prev => ({
            ...prev,
            loadCell: { ...prev.loadCell, weight: 2.5, status: 'loaded' }
          }))
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
      setStages(prev => prev.map(stage => ({ ...stage, status: 'complete' })))
      setSystemState('IDLE')
      addEvent(`Mission ${newMissionId} completed successfully`, 'success')
    }

    progressMission()
  }, [systemState, addEvent])

  const handlePauseMission = useCallback(() => {
    if (systemState !== 'ACTIVE') return
    setSystemState('PAUSED')
    addEvent('Mission paused by operator', 'warning')
  }, [systemState, addEvent])

  const handleResumeMission = useCallback(() => {
    if (systemState !== 'PAUSED') return
    setSystemState('ACTIVE')
    addEvent('Mission resumed', 'info')
  }, [systemState, addEvent])

  const handleReturnToBase = useCallback(() => {
    addEvent('Robot returning to base', 'info')
    setTelemetry(prev => ({
      ...prev,
      robot: { ...prev.robot, status: 'returning' }
    }))
  }, [addEvent])

  const handleResetAlerts = useCallback(() => {
    addEvent('Alerts reset by operator', 'info')
    setSafetyStatus('safe')
  }, [addEvent])

  const handleEmergencyStop = useCallback(() => {
    setSystemState('ERROR')
    addEvent('EMERGENCY STOP ACTIVATED', 'error')
    setStages(missionStages)
    setTelemetry(prev => ({
      ...prev,
      robot: { ...prev.robot, speed: 0, status: 'stopped' }
    }))
    setSafetyStatus('critical')
  }, [addEvent])

  const handleClearEmergency = useCallback(() => {
    setSystemState('IDLE')
    setStages(missionStages)
    setMissionId(null)
    setSafetyStatus('safe')
    addEvent('Emergency cleared - System reset', 'info')
  }, [addEvent])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopStatusBar
          mqttStatus={mqttStatus}
          robotStatus={robotStatus}
          rfidStatus={rfidStatus}
          systemState={systemState}
          missionId={missionId}
          safetyStatus={safetyStatus}
        />
        
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Main Center Panel */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <MissionPipeline stages={stages} />
            <EventTimeline events={events} />
          </div>
          
          {/* Right Panel */}
          <div className="w-80 flex flex-col gap-4 flex-shrink-0">
            <TelemetryPanel telemetry={telemetry} />
            <RobotControlPanel
              systemState={systemState}
              onStartMission={handleStartMission}
              onPauseMission={handlePauseMission}
              onResumeMission={handleResumeMission}
              onReturnToBase={handleReturnToBase}
              onResetAlerts={handleResetAlerts}
              onEmergencyStop={handleEmergencyStop}
              onClearEmergency={handleClearEmergency}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
