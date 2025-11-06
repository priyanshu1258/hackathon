import { motion } from 'framer-motion'

export function StatCardSkeleton() {
  return (
    <div className="modern-card p-4 sm:p-6 overflow-hidden">
      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="skeleton w-12 h-12 sm:w-14 sm:h-14 rounded-xl" />
        <div className="skeleton h-4 w-24 rounded" />
      </div>
      <div className="skeleton h-8 sm:h-10 w-32 rounded mb-2" />
      <div className="skeleton h-6 w-20 rounded" />
    </div>
  )
}

export function ChartSkeleton({ height = 300 }) {
  return (
    <div className="modern-card p-4 sm:p-6">
      <div className="skeleton h-6 w-48 rounded mb-6" />
      <div className="skeleton rounded" style={{ height: `${height}px` }} />
    </div>
  )
}

export function BuildingCardSkeleton() {
  return (
    <div className="modern-card p-4 sm:p-6">
      <div className="skeleton h-6 w-32 rounded mb-6" />
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-xl" />
            <div className="flex-1">
              <div className="skeleton h-5 w-20 rounded mb-1" />
              <div className="skeleton h-4 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <motion.div
      className="flex items-center justify-center p-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-transparent"
        style={{ borderTopColor: 'transparent' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-full h-full rounded-full border-4 border-transparent gradient-bg-primary" />
      </motion.div>
    </motion.div>
  )
}

export default { StatCardSkeleton, ChartSkeleton, BuildingCardSkeleton, LoadingSpinner }
