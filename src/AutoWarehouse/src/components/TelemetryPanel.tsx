import { motion } from 'framer-motion'
import { Scale, Radar, Thermometer, CreditCard, Bot, Battery, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TelemetryData } from '../types'

interface TelemetryCardProps {
  title: string
  icon: React.ElementType
  status: string
  statusType: 'normal' | 'warning' | 'error'
  children: React.ReactNode
}

function TelemetryCard({ title, icon: Icon, status, statusType, children }: TelemetryCardProps) {
  const statusColors = {
    normal: 'text-success',
    warning: 'text-warning',
    error: 'text-destructive'
  }

  return (
    <div className="bg-card rounded-lg border border-border p-3 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground tracking-wide">{title}</span>
        </div>
        <span className={cn('text-[10px] font-mono uppercase', statusColors[statusType])}>
          {status}
        </span>
      </div>

      {/* Content */}
      {children}

      {/* Subtle corner accent */}
      <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-0.5 bg-gradient-to-l from-primary/30 to-transparent rotate-45 translate-x-4 -translate-y-4" />
      </div>
    </div>
  )
}

interface TelemetryPanelProps {
  telemetry: TelemetryData
}

export function TelemetryPanel({ telemetry }: TelemetryPanelProps) {
  const loadCellStatus = telemetry.loadCell.status === 'overload' ? 'error' : telemetry.loadCell.status === 'loaded' ? 'warning' : 'normal'
  const ultrasonicStatus = telemetry.ultrasonic.status === 'intrusion' ? 'error' : 'normal'
  const dht22Status = telemetry.dht22.status === 'critical' ? 'error' : telemetry.dht22.status === 'warning' ? 'warning' : 'normal'
  const rfidStatus = telemetry.rfid.authenticated ? 'normal' : 'warning'
  const robotStatus = telemetry.robot.status === 'error' ? 'error' : telemetry.robot.battery < 20 ? 'warning' : 'normal'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-2 h-2 rounded-full bg-primary pulse-indicator" />
        <h2 className="text-sm font-semibold text-foreground tracking-wide">TELEMETRY</h2>
      </div>

      {/* Load Cell */}
      <TelemetryCard
        title="LOAD CELL"
        icon={Scale}
        status={telemetry.loadCell.status.toUpperCase()}
        statusType={loadCellStatus}
      >
        <div className="flex items-end gap-1">
          <motion.span
            key={telemetry.loadCell.weight.toFixed(2)}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-mono font-bold text-foreground"
          >
            {telemetry.loadCell.weight.toFixed(2)}
          </motion.span>
          <span className="text-xs text-muted-foreground mb-1">{telemetry.loadCell.unit}</span>
        </div>
        <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              loadCellStatus === 'error' ? 'bg-destructive' : loadCellStatus === 'warning' ? 'bg-warning' : 'bg-success'
            )}
            animate={{ width: `${Math.min(100, (telemetry.loadCell.weight / 10) * 100)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </TelemetryCard>

      {/* Ultrasonic */}
      <TelemetryCard
        title="INTRUSION DETECT"
        icon={Radar}
        status={telemetry.ultrasonic.status.toUpperCase()}
        statusType={ultrasonicStatus}
      >
        <div className="flex items-end gap-1">
          <motion.span
            key={telemetry.ultrasonic.distance.toFixed(0)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-mono font-bold text-foreground"
          >
            {telemetry.ultrasonic.distance.toFixed(0)}
          </motion.span>
          <span className="text-xs text-muted-foreground mb-1">{telemetry.ultrasonic.unit}</span>
        </div>
        {telemetry.ultrasonic.status === 'intrusion' && (
          <motion.div
            className="mt-2 text-xs text-destructive font-mono"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            ⚠ PROXIMITY ALERT
          </motion.div>
        )}
      </TelemetryCard>

      {/* DHT22 Environment */}
      <TelemetryCard
        title="ENVIRONMENT"
        icon={Thermometer}
        status={telemetry.dht22.status.toUpperCase()}
        statusType={dht22Status}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Temp</span>
            <div className="flex items-end gap-0.5">
              <span className="text-lg font-mono font-bold text-foreground">
                {telemetry.dht22.temperature.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground mb-0.5">°C</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase">Humidity</span>
            <div className="flex items-end gap-0.5">
              <span className="text-lg font-mono font-bold text-foreground">
                {telemetry.dht22.humidity.toFixed(0)}
              </span>
              <span className="text-xs text-muted-foreground mb-0.5">%</span>
            </div>
          </div>
        </div>
      </TelemetryCard>

      {/* RFID */}
      <TelemetryCard
        title="RFID ACCESS"
        icon={CreditCard}
        status={telemetry.rfid.authenticated ? 'AUTHENTICATED' : 'WAITING'}
        statusType={rfidStatus}
      >
        <div className="flex items-center gap-2">
          <motion.div
            className={cn(
              'w-3 h-3 rounded-full',
              telemetry.rfid.authenticated ? 'bg-success' : 'bg-muted'
            )}
            animate={!telemetry.rfid.authenticated ? { opacity: [0.3, 1, 0.3] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs font-mono text-muted-foreground">
            {telemetry.rfid.lastTag || 'Awaiting scan...'}
          </span>
        </div>
      </TelemetryCard>

      {/* Robot Telemetry */}
      <TelemetryCard
        title="ROBOT AGV-01"
        icon={Bot}
        status={telemetry.robot.status.toUpperCase()}
        statusType={robotStatus}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Battery</span>
            </div>
            <span className={cn(
              'text-sm font-mono font-semibold',
              telemetry.robot.battery < 20 ? 'text-destructive' : telemetry.robot.battery < 50 ? 'text-warning' : 'text-success'
            )}>
              {telemetry.robot.battery.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Speed</span>
            </div>
            <span className="text-sm font-mono font-semibold text-foreground">
              {telemetry.robot.speed.toFixed(2)} m/s
            </span>
          </div>
        </div>
      </TelemetryCard>
    </div>
  )
}
