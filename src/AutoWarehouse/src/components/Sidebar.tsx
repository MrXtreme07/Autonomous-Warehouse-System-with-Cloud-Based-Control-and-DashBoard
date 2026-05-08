import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  Bot,
  Cpu,
  ShieldAlert,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
  { id: 'orders', label: 'Orders', icon: Package, active: false },
  { id: 'robot', label: 'Robot Control', icon: Bot, active: false },
  { id: 'nodes', label: 'Smart Nodes', icon: Cpu, active: false },
  { id: 'safety', label: 'Safety System', icon: ShieldAlert, active: false },
  { id: 'logs', label: 'System Logs', icon: FileText, active: false },
  { id: 'settings', label: 'Settings', icon: Settings, active: false }
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState('dashboard')

  return (
    <motion.aside
      initial={{ width: 240 }}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full bg-card border-r border-border flex flex-col relative"
    >
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: collapsed ? 0 : 1 }}
          className="flex items-center gap-3 overflow-hidden"
        >
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground tracking-tight">AWMS</span>
            <span className="text-[10px] text-muted-foreground font-mono">v2.4.1</span>
          </div>
        </motion.div>
        {collapsed && (
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center mx-auto">
            <Bot className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id

          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'drop-shadow-[0_0_8px_var(--primary)]')} />
                {isActive && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute inset-0 bg-primary/20 blur-lg rounded-full"
                  />
                )}
              </div>
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: collapsed ? 0 : 1 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* System Status Footer */}
      <div className="p-4 border-t border-border">
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: collapsed ? 0 : 1 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">System Load</span>
            <span className="text-foreground font-mono">23%</span>
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '23%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      </div>
    </motion.aside>
  )
}
