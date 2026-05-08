import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Home, AlertTriangle, OctagonX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SystemState } from '../types'

interface ControlButtonProps {
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'warning' | 'danger'
  icon: React.ElementType
  label: string
}

function ControlButton({ onClick, disabled, variant = 'default', icon: Icon, label }: ControlButtonProps) {
  const variants = {
    default: 'bg-secondary hover:bg-secondary/80 text-foreground border-border',
    warning: 'bg-warning/20 hover:bg-warning/30 text-warning border-warning/50',
    danger: 'bg-destructive/20 hover:bg-destructive/30 text-destructive border-destructive/50'
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 font-medium text-sm',
        variants[variant],
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </motion.button>
  )
}

interface RobotControlPanelProps {
  systemState: SystemState
  onStartMission: () => void
  onPauseMission: () => void
  onResumeMission: () => void
  onReturnToBase: () => void
  onResetAlerts: () => void
  onEmergencyStop: () => void
  onClearEmergency: () => void
}

export function RobotControlPanel({
  systemState,
  onStartMission,
  onPauseMission,
  onResumeMission,
  onReturnToBase,
  onResetAlerts,
  onEmergencyStop,
  onClearEmergency
}: RobotControlPanelProps) {
  const isError = systemState === 'ERROR'

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-primary pulse-indicator" />
        <h2 className="text-sm font-semibold text-foreground tracking-wide">ROBOT CONTROL</h2>
      </div>

      <div className="space-y-3">
        {/* Mission Controls */}
        <div className="grid grid-cols-2 gap-2">
          {systemState === 'IDLE' && (
            <ControlButton
              onClick={onStartMission}
              icon={Play}
              label="Deploy"
            />
          )}
          
          {systemState === 'ACTIVE' && (
            <ControlButton
              onClick={onPauseMission}
              icon={Pause}
              label="Pause"
              variant="warning"
            />
          )}
          
          {systemState === 'PAUSED' && (
            <ControlButton
              onClick={onResumeMission}
              icon={Play}
              label="Resume"
            />
          )}

          {systemState !== 'IDLE' && !isError && (
            <ControlButton
              onClick={onReturnToBase}
              icon={Home}
              label="Return"
            />
          )}

          {systemState === 'IDLE' && (
            <ControlButton
              onClick={onReturnToBase}
              icon={Home}
              label="Return"
              disabled
            />
          )}
        </div>

        {/* Alert Controls */}
        <ControlButton
          onClick={onResetAlerts}
          icon={RotateCcw}
          label="Reset Alerts"
          variant="warning"
          disabled={isError}
        />

        {/* Clear Emergency */}
        {isError && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClearEmergency}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-warning/20 hover:bg-warning/30 text-warning border border-warning/50 font-semibold text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            CLEAR EMERGENCY
          </motion.button>
        )}

        {/* Emergency Stop */}
        <div className="pt-3 border-t border-border">
          <motion.button
            whileHover={{ scale: isError ? 1 : 1.02 }}
            whileTap={{ scale: isError ? 1 : 0.95 }}
            onClick={onEmergencyStop}
            disabled={isError}
            className={cn(
              'w-full relative overflow-hidden rounded-xl transition-all duration-200',
              isError && 'opacity-50 cursor-not-allowed'
            )}
          >
            <motion.div
              className="absolute inset-0 bg-destructive"
              animate={!isError ? { 
                boxShadow: [
                  '0 0 20px rgba(239, 68, 68, 0.3)',
                  '0 0 40px rgba(239, 68, 68, 0.5)',
                  '0 0 20px rgba(239, 68, 68, 0.3)'
                ]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            <div className="relative flex flex-col items-center gap-1 py-6">
              <OctagonX className="w-10 h-10 text-destructive-foreground" />
              <span className="text-lg font-bold text-destructive-foreground tracking-wider">
                EMERGENCY STOP
              </span>
              <span className="text-xs text-destructive-foreground/70 font-mono">
                PRESS TO HALT ALL SYSTEMS
              </span>
            </div>

            {/* Industrial stripe pattern */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-full bg-black -skew-x-12"
                  style={{ left: `${i * 30}px` }}
                />
              ))}
            </div>
          </motion.button>
        </div>

        {/* Warning Label */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Manual override controls - use with caution</span>
        </div>
      </div>
    </div>
  )
}
