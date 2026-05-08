import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TimelineEvent } from '../types'

interface EventTimelineProps {
  events: TimelineEvent[]
}

export function EventTimeline({ events }: EventTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events])

  const typeConfig = {
    info: { color: 'text-foreground', dot: 'bg-muted-foreground', border: 'border-muted' },
    success: { color: 'text-success', dot: 'bg-success', border: 'border-success/30' },
    warning: { color: 'text-warning', dot: 'bg-warning', border: 'border-warning/30' },
    error: { color: 'text-destructive', dot: 'bg-destructive', border: 'border-destructive/30' }
  }

  return (
    <div className="flex-1 bg-card rounded-xl border border-border flex flex-col min-h-0">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary pulse-indicator" />
          <h2 className="text-sm font-semibold text-foreground tracking-wide">LIVE EVENT TIMELINE</h2>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{events.length} events</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        <AnimatePresence initial={false}>
          {events.map((event) => {
            const config = typeConfig[event.type]

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'flex items-start gap-3 px-3 py-2 rounded-lg border bg-secondary/30',
                  config.border
                )}
              >
                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap pt-0.5">
                  [{event.timestamp}]
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <motion.div
                    className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)}
                    animate={event.type === 'error' ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.5, repeat: event.type === 'error' ? Infinity : 0 }}
                  />
                  <span className={cn('text-sm truncate', config.color)}>
                    {event.message}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {events.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Waiting for events...
          </div>
        )}
      </div>

      {/* Decorative scanning line */}
      <div className="relative h-0.5 bg-border overflow-hidden">
        <motion.div
          className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          animate={{ x: ['-100%', '500%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  )
}
