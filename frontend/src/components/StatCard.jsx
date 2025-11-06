import { motion } from 'framer-motion'

function StatCard({ icon, title, value, unit, trend, trendValue, color, source }) {
  // Convert color to gradient class
  const getGradientClass = () => {
    if (color === '#f59e0b') return 'gradient-bg-electricity'
    if (color === '#3b82f6') return 'gradient-bg-water'
    if (color === '#10b981') return 'gradient-bg-food'
    return 'gradient-bg-primary'
  }

  const getGradientTextClass = () => {
    if (color === '#f59e0b') return 'gradient-electricity-text'
    if (color === '#3b82f6') return 'gradient-water-text'
    if (color === '#10b981') return 'gradient-food-text'
    return 'gradient-text'
  }

  return (
    <motion.div 
      className="modern-card p-4 sm:p-6 overflow-hidden relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated ambient glow effect */}
      <motion.div 
        className={`absolute -top-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 ${getGradientClass()} rounded-full blur-3xl`}
        animate={{ 
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <motion.div 
            className={`text-2xl sm:text-3xl w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center ${getGradientClass()} text-white shadow-lg`}
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
          <h3 className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex-1">
            {title}
          </h3>
        </div>
        
        <motion.div 
          className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 sm:mb-3"
          style={{ color: 'var(--text-primary)' }}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
          <span className="text-base sm:text-lg lg:text-xl font-semibold ml-2" style={{ color: 'var(--text-secondary)' }}>
            {unit}
          </span>
        </motion.div>
        
        {source && (
          <motion.div 
            className="flex items-center gap-2 text-xs sm:text-sm font-medium stats-badge mb-2 w-fit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-sm sm:text-base">📍</span>
            <span style={{ color: 'var(--text-secondary)' }}>from</span>
            <span className={`font-bold ${getGradientTextClass()}`}>
              {source}
            </span>
          </motion.div>
        )}
        
        {trend && (
          <motion.div 
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold stats-badge w-fit ${
              trend === 'up' 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.span 
              className="text-sm sm:text-base"
              animate={{ y: trend === 'up' ? [-2, 0, -2] : [2, 0, 2] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {trend === 'up' ? '↑' : '↓'}
            </motion.span>
            <span>{trendValue}</span>
            <span className="text-xs font-normal hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
              vs last period
            </span>
          </motion.div>
        )}
      </div>

      {/* Bottom decorative gradient line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${getGradientClass()} opacity-50`} />
    </motion.div>
  )
}

export default StatCard
