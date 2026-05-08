import { motion } from 'framer-motion'
import { CreditCard, FileText, Bot, Package, CheckCircle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MissionStage } from '../types'

const stageIcons = {
  rfid: CreditCard,
  order: FileText,
  deploy: Bot,
  confirm: Package,
  complete: CheckCircle
}

interface MissionPipelineProps {
  stages: MissionStage[]
}

export function MissionPipeline({ stages }: MissionPipelineProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-primary pulse-indicator" />
        <h2 className="text-sm font-semibold text-foreground tracking-wide">MISSION PIPELINE</h2>
      </div>

      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const Icon = stageIcons[stage.id as keyof typeof stageIcons]
          const isLast = index === stages.length - 1

          return (
            <div key={stage.id} className="flex items-center flex-1">
              <motion.div
                className={cn(
                  'flex flex-col items-center gap-3 flex-1',
                  stage.status === 'pending' && 'opacity-40'
                )}
                animate={stage.status === 'active' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1.5, repeat: stage.status === 'active' ? Infinity : 0 }}
              >
                {/* Stage Circle */}
                <div className="relative">
                  <motion.div
                    className={cn(
                      'w-16 h-16 rounded-xl flex items-center justify-center border-2 transition-all duration-500',
                      stage.status === 'complete' && 'bg-success/20 border-success',
                      stage.status === 'active' && 'bg-primary/20 border-primary glow-cyan',
                      stage.status === 'pending' && 'bg-secondary border-border'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-7 h-7 transition-colors duration-500',
                        stage.status === 'complete' && 'text-success',
                        stage.status === 'active' && 'text-primary',
                        stage.status === 'pending' && 'text-muted-foreground'
                      )}
                    />
                  </motion.div>

                  {/* Active Pulse Ring */}
                  {stage.status === 'active' && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-primary"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  {/* Scanning Line */}
                  {stage.status === 'active' && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      <motion.div
                        className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                        animate={{ y: [0, 64, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                  )}
                </div>

                {/* Stage Label */}
                <span
                  className={cn(
                    'text-xs font-mono tracking-wider text-center',
                    stage.status === 'complete' && 'text-success',
                    stage.status === 'active' && 'text-primary',
                    stage.status === 'pending' && 'text-muted-foreground'
                  )}
                >
                  {stage.label}
                </span>
              </motion.div>

              {/* Connector Arrow */}
              {!isLast && (
                <div className="flex items-center px-2 -mt-6">
                  <motion.div
                    className={cn(
                      'h-0.5 flex-1 min-w-8 transition-colors duration-500',
                      stages[index + 1].status !== 'pending' ? 'bg-success' : 'bg-border'
                    )}
                  />
                  <ChevronRight
                    className={cn(
                      'w-5 h-5 -ml-1 transition-colors duration-500',
                      stages[index + 1].status !== 'pending' ? 'text-success' : 'text-muted-foreground'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
