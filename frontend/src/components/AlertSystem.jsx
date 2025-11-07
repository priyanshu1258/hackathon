import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import notificationSound from '../utils/notificationSound'

function AlertSystem({ alerts, onDismiss }) {
  const [visibleAlerts, setVisibleAlerts] = useState([])

  useEffect(() => {
    // Play sound for new alerts
    if (alerts.length > visibleAlerts.length) {
      const newAlert = alerts[alerts.length - 1]
      if (newAlert) {
        notificationSound.play(newAlert.type)
      }
    }
    
    // Limit to 3 alerts max for better UX
    setVisibleAlerts(alerts.slice(0, 3))
  }, [alerts, visibleAlerts.length])

  const getAlertStyle = (type, categoryColor) => {
    // Use category color for all alert types to match the page theme
    const isElectricity = categoryColor === '#f59e0b'
    const isWater = categoryColor === '#3b82f6'
    const isFood = categoryColor === '#10b981'
    
    switch (type) {
      case 'critical':
        return {
          bg: isElectricity 
            ? 'bg-amber-50 dark:bg-amber-900/20' 
            : isWater 
            ? 'bg-blue-50 dark:bg-blue-900/20'
            : 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-2',
          textColor: isElectricity 
            ? 'text-amber-900 dark:text-amber-100'
            : isWater 
            ? 'text-blue-900 dark:text-blue-100'
            : 'text-emerald-900 dark:text-emerald-100',
          icon: '🚨',
          iconBg: isElectricity ? 'bg-amber-600' : isWater ? 'bg-blue-600' : 'bg-emerald-600',
          accentColor: categoryColor
        }
      case 'warning':
        return {
          bg: isElectricity 
            ? 'bg-amber-50 dark:bg-amber-900/20' 
            : isWater 
            ? 'bg-blue-50 dark:bg-blue-900/20'
            : 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-2',
          textColor: isElectricity 
            ? 'text-amber-900 dark:text-amber-100'
            : isWater 
            ? 'text-blue-900 dark:text-blue-100'
            : 'text-emerald-900 dark:text-emerald-100',
          icon: '⚠️',
          iconBg: isElectricity ? 'bg-amber-500' : isWater ? 'bg-blue-500' : 'bg-emerald-500',
          accentColor: categoryColor
        }
      case 'success':
        return {
          bg: isElectricity 
            ? 'bg-amber-50 dark:bg-amber-900/20' 
            : isWater 
            ? 'bg-blue-50 dark:bg-blue-900/20'
            : 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-2',
          textColor: isElectricity 
            ? 'text-amber-900 dark:text-amber-100'
            : isWater 
            ? 'text-blue-900 dark:text-blue-100'
            : 'text-emerald-900 dark:text-emerald-100',
          icon: '✅',
          iconBg: isElectricity ? 'bg-amber-500' : isWater ? 'bg-blue-500' : 'bg-emerald-500',
          accentColor: categoryColor
        }
      case 'achievement':
        return {
          bg: isElectricity 
            ? 'bg-amber-50 dark:bg-amber-900/20' 
            : isWater 
            ? 'bg-blue-50 dark:bg-blue-900/20'
            : 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-2',
          textColor: isElectricity 
            ? 'text-amber-900 dark:text-amber-100'
            : isWater 
            ? 'text-blue-900 dark:text-blue-100'
            : 'text-emerald-900 dark:text-emerald-100',
          icon: '🎉',
          iconBg: isElectricity ? 'bg-amber-500' : isWater ? 'bg-blue-500' : 'bg-emerald-500',
          accentColor: categoryColor
        }
      case 'info':
        return {
          bg: isElectricity 
            ? 'bg-amber-50 dark:bg-amber-900/20' 
            : isWater 
            ? 'bg-blue-50 dark:bg-blue-900/20'
            : 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-2',
          textColor: isElectricity 
            ? 'text-amber-900 dark:text-amber-100'
            : isWater 
            ? 'text-blue-900 dark:text-blue-100'
            : 'text-emerald-900 dark:text-emerald-100',
          icon: 'ℹ️',
          iconBg: isElectricity ? 'bg-amber-400' : isWater ? 'bg-blue-400' : 'bg-emerald-400',
          accentColor: categoryColor
        }
      default:
        return {
          bg: isElectricity 
            ? 'bg-amber-50 dark:bg-amber-900/20' 
            : isWater 
            ? 'bg-blue-50 dark:bg-blue-900/20'
            : 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-2',
          textColor: isElectricity 
            ? 'text-amber-900 dark:text-amber-100'
            : isWater 
            ? 'text-blue-900 dark:text-blue-100'
            : 'text-emerald-900 dark:text-emerald-100',
          icon: '📢',
          iconBg: isElectricity ? 'bg-amber-500' : isWater ? 'bg-blue-500' : 'bg-emerald-500',
          accentColor: categoryColor || '#64748b'
        }
    }
  }

  const handleDismiss = (id) => {
    setVisibleAlerts(prev => prev.filter(alert => alert.id !== id))
    if (onDismiss) onDismiss(id)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {visibleAlerts.map((alert, index) => {
          const style = getAlertStyle(alert.type, alert.categoryColor)
          const borderStyle = alert.categoryColor 
            ? { borderColor: alert.categoryColor, borderWidth: '3px' }
            : {}
          return (
            <motion.div
              key={alert.id}
              layout
              initial={{ 
                opacity: 0, 
                y: 50, 
                x: 100,
                scale: 0.3
              }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                x: 0,
                scale: 1
              }}
              exit={{ 
                opacity: 0, 
                x: 100,
                scale: 0.5,
                transition: { 
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1]
                }
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 500, 
                damping: 30,
                mass: 0.5
              }}
              className="pointer-events-auto"
            >
              <motion.div 
                layout
                className={`${style.bg} ${style.textColor} rounded-xl ${style.border} shadow-2xl backdrop-blur-md overflow-hidden relative`}
                style={borderStyle}
                whileHover={{ 
                  scale: 1.02,
                  y: -3,
                  transition: { duration: 0.2 }
                }}
              >
                {/* Animated gradient overlay */}
                <motion.div
                  className="absolute inset-0 opacity-10"
                  animate={{
                    background: [
                      'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                      'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)'
                    ],
                    backgroundPosition: ['-200% 0', '200% 0']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  style={{
                    backgroundSize: '200% 100%'
                  }}
                />

                <div className="p-4 relative z-10">
                  <div className="flex items-start gap-3">
                    {/* Icon with pulse effect */}
                    <motion.div 
                      className="text-2xl shrink-0 mt-0.5 relative"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ 
                        scale: 1, 
                        rotate: 0
                      }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 500, 
                        damping: 15,
                        delay: 0.1 
                      }}
                    >
                      <motion.div
                        animate={alert.type === 'critical' || alert.type === 'warning' ? {
                          scale: [1, 1.2, 1],
                        } : {}}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      >
                        {style.icon}
                      </motion.div>
                      
                      {/* Glow effect for critical/warning - use category color */}
                      {(alert.type === 'critical' || alert.type === 'warning') && (
                        <motion.div
                          className="absolute inset-0 rounded-full blur-md"
                          style={{ backgroundColor: alert.categoryColor || style.accentColor }}
                          animate={{
                            opacity: [0.3, 0.6, 0.3],
                            scale: [0.8, 1.2, 0.8]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        />
                      )}
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <motion.div 
                        className="flex items-start justify-between gap-2 mb-1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                      >
                        <h4 className="font-bold text-sm leading-tight">
                          {alert.title}
                        </h4>
                        
                        {/* Enhanced close button */}
                        <motion.button
                          onClick={() => handleDismiss(alert.id)}
                          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                          aria-label="Dismiss alert"
                          whileHover={{ 
                            scale: 1.2, 
                            rotate: 90,
                            backgroundColor: 'rgba(0,0,0,0.1)'
                          }}
                          whileTap={{ scale: 0.8, rotate: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </motion.button>
                      </motion.div>

                      {alert.building && (
                        <motion.span 
                          className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 mb-1"
                          initial={{ opacity: 0, scale: 0.8, x: -10 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          transition={{ 
                            delay: 0.2, 
                            type: 'spring',
                            stiffness: 300,
                            damping: 20
                          }}
                        >
                          {alert.building}
                        </motion.span>
                      )}
                      
                      <motion.p 
                        className="text-sm opacity-90 leading-snug"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 0.9, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.3 }}
                      >
                        {alert.message}
                      </motion.p>

                      {alert.value && (
                        <motion.div 
                          className="mt-2 text-lg font-bold flex items-baseline gap-1"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            delay: 0.3, 
                            type: 'spring',
                            stiffness: 400,
                            damping: 15
                          }}
                        >
                          <motion.span
                            animate={{ 
                              textShadow: alert.type === 'critical' 
                                ? ['0 0 0px currentColor', '0 0 8px currentColor', '0 0 0px currentColor']
                                : '0 0 0px currentColor'
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                          >
                            {alert.value}
                          </motion.span>
                          <span className="text-sm opacity-70">{alert.unit}</span>
                        </motion.div>
                      )}

                      {alert.action && (
                        <motion.button 
                          className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors shadow-sm"
                          onClick={() => alert.action.onClick()}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 }}
                          whileHover={{ 
                            scale: 1.05,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {alert.action.label}
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Enhanced progress bar for auto-dismiss */}
                  {alert.autoDismiss && (
                    <div className="mt-3 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: alert.categoryColor || style.accentColor || '#10b981' }}
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: alert.duration || 5, ease: 'linear' }}
                        onAnimationComplete={() => handleDismiss(alert.id)}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default AlertSystem
