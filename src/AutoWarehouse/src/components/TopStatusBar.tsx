import { motion } from 'framer-motion'
import { Wifi, Bot, CreditCard, Activity, Hash, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SystemState } from '../types'

interface StatusCardProps {
  label: string
  value: string
  status: 'operational' | 'warning' | 'error'
  icon: React.ElementType
}

function StatusCard({ label, value, status, icon: Icon }: StatusCardProps) {
  const statusColors = {
    operational: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-destructive'
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-card/50 rounded-lg border border-border/50">
      <div className="relative">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <motion.div
          className={cn('absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full', statusColors[status])}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono text-foreground">{value}</span>
      </div>
    </div>
  )
}

interface SystemStateBadgeProps {
  state: SystemState
}

function SystemStateBadge({ state }: SystemStateBadgeProps) {
  const stateConfig = {
    LOCKED: { color: 'bg-muted text-muted-foreground', glow: '' },
    IDLE: { color: 'bg-secondary text-secondary-foreground', glow: '' },
    ACTIVE: { color: 'bg-success/20 text-success', glow: 'glow-green' },
    PAUSED: { color: 'bg-warning/20 text-warning', glow: 'glow-amber' },
    ERROR: { color: 'bg-destructive/20 text-destructive', glow: 'glow-red' }
  }

  const config = stateConfig[state]

  return (
    <motion.div
      className={cn(
        'px-4 py-2 rounded-lg font-mono text-sm font-semibold tracking-wider flex items-center gap-2',
        config.color,
        config.glow
      )}
      animate={state === 'ERROR' ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.5, repeat: state === 'ERROR' ? Infinity : 0 }}
    >
      <Activity className="w-4 h-4" />
      {state}
    </motion.div>
  )
}

interface TopStatusBarProps {
  mqttStatus: 'connected' | 'disconnected' | 'error'
  robotStatus: 'online' | 'offline' | 'warning'
  rfidStatus: 'ready' | 'scanning' | 'error'
  systemState: SystemState
  missionId: string | null
  safetyStatus: 'safe' | 'warning' | 'critical'
}

export function TopStatusBar({
  mqttStatus,
  robotStatus,
  rfidStatus,
  systemState,
  missionId,
  safetyStatus
}: TopStatusBarProps) {
  const mqttStatusMap = {
    connected: 'operational' as const,
    disconnected: 'error' as const,
    error: 'error' as const
  }

  const robotStatusMap = {
    online: 'operational' as const,
    offline: 'error' as const,
    warning: 'warning' as const
  }

  const rfidStatusMap = {
    ready: 'operational' as const,
    scanning: 'warning' as const,
    error: 'error' as const
  }

  const safetyStatusMap = {
    safe: 'operational' as const,
    warning: 'warning' as const,
    critical: 'error' as const
  }

  return (
    <header className="h-16 border-b border-border bg-card/30 backdrop-blur-sm px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <StatusCard
          label="MQTT Broker"
          value={mqttStatus.toUpperCase()}
          status={mqttStatusMap[mqttStatus]}
          icon={Wifi}
        />
        <StatusCard
          label="Robot Telemetry"
          value={robotStatus.toUpperCase()}
          status={robotStatusMap[robotStatus]}
          icon={Bot}
        />
        <StatusCard
          label="RFID Auth"
          value={rfidStatus.toUpperCase()}
          status={rfidStatusMap[rfidStatus]}
          icon={CreditCard}
        />
      </div>

      <div className="flex items-center gap-3">
        <SystemStateBadge state={systemState} />
        
        {missionId && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/30">
            <Hash className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-primary">{missionId}</span>
          </div>
        )}

        <StatusCard
          label="Safety System"
          value={safetyStatus.toUpperCase()}
          status={safetyStatusMap[safetyStatus]}
          icon={Shield}
        />
      </div>
    </header>
  )
}
