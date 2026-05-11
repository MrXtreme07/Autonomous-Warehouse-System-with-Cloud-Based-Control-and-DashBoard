import { Sidebar } from './components/Sidebar'
import { TopStatusBar } from './components/TopStatusBar'
import { MissionPipeline } from './components/MissionPipeline'
import { EventTimeline } from './components/EventTimeline'
import { TelemetryPanel } from './components/TelemetryPanel'
import { RobotControlPanel } from './components/RobotControlPanel'
import { useWarehouseDashboard } from './hooks/useWarehouseDashboard'

export default function App() {
  const {
    systemState,
    telemetry,
    events,
    stages,
    mqttStatus,
    robotStatus,
    rfidStatus,
    safetyStatus,
    missionId,
    apiError,
    controls
  } = useWarehouseDashboard()

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

        {apiError && (
          <div className="px-4 py-2 border-b border-destructive/30 bg-destructive/10 text-sm text-destructive">
            {apiError}
          </div>
        )}

        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <MissionPipeline stages={stages} />
            <EventTimeline events={events} />
          </div>

          <div className="w-80 flex flex-col gap-4 flex-shrink-0">
            <TelemetryPanel telemetry={telemetry} />
            <RobotControlPanel
              systemState={systemState}
              onStartMission={controls.deploy}
              onPauseMission={controls.pause}
              onResumeMission={controls.resume}
              onReturnToBase={controls.returnToBase}
              onResetAlerts={controls.reset}
              onEmergencyStop={controls.emergencyStop}
              onClearEmergency={controls.clearEmergency}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
