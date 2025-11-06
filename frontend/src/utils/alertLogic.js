// Alert Logic for Campus Resource Monitoring
// Generates alerts based on resource usage patterns

export const generateAlerts = (category, buildingData, stats, historicalData = null) => {
  const alerts = []
  const timestamp = Date.now()

  // More conservative thresholds - only alert on truly problematic situations
  const thresholds = {
    electricity: {
      critical: 95, // % of capacity (was 90)
      warning: 85, // % (was 75)
      excellent: 50, // % (was 60)
      spike: 30 // % increase from average (was 20)
    },
    water: {
      critical: 120, // % of target (was 110)
      warning: 105, // % (was 95)
      excellent: 60, // % (was 70)
      spike: 35 // % (was 25)
    },
    food: {
      critical: 40, // kg for cafeteria (was 35)
      warning: 32, // kg (was 28)
      excellent: 15, // kg (was 18)
      spike: 40 // % (was 30)
    }
  }

  const categoryConfig = {
    electricity: {
      unit: 'kWh',
      icon: '⚡',
      name: 'Electricity'
    },
    water: {
      unit: 'L',
      icon: '💧',
      name: 'Water'
    },
    food: {
      unit: 'kg',
      icon: '🍽️',
      name: 'Food Waste'
    }
  }

  const config = categoryConfig[category] || categoryConfig.electricity
  const threshold = thresholds[category] || thresholds.electricity

  // Only show 1 alert per building per category to avoid spam
  const alertedBuildings = new Set()

  // Check each building for alerts
  buildingData.forEach(building => {
    const buildingId = `${category}-${building.name}-${timestamp}`
    
    // Skip if already alerted for this building
    if (alertedBuildings.has(building.name)) return
    
    if (category === 'electricity') {
      // Critical: Usage > 95% of capacity (truly dangerous)
      if (building.percentage > threshold.critical) {
        alerts.push({
          id: `critical-${buildingId}`,
          type: 'critical',
          title: '⚡ Power Alert',
          message: `${building.name} is running at ${building.percentage}% capacity! Let's reduce load to prevent issues.`,
          building: building.name,
          value: building.usage,
          unit: config.unit,
          category,
          autoDismiss: false,
          action: {
            label: 'View Details',
            onClick: () => console.log(`Viewing ${building.name} details`)
          }
        })
        alertedBuildings.add(building.name)
      }
      // Warning: Usage > 85% of capacity (only show for sustained high usage)
      else if (building.percentage > threshold.warning && building.percentage <= threshold.critical) {
        alerts.push({
          id: `warning-${buildingId}`,
          type: 'warning',
          title: '🔋 High Usage Detected',
          message: `${building.name} is at ${building.percentage}% capacity. Consider turning off non-essential equipment.`,
          building: building.name,
          category,
          autoDismiss: true,
          duration: 10
        })
        alertedBuildings.add(building.name)
      }
      // Success: Excellent efficiency (only occasionally celebrate)
      else if (building.percentage < threshold.excellent && Math.random() < 0.3) {
        alerts.push({
          id: `success-${buildingId}`,
          type: 'success',
          title: '🌟 Excellent Work',
          message: `${building.name} is running super efficiently at ${building.percentage}%! You're making a real difference!`,
          building: building.name,
          category,
          autoDismiss: true,
          duration: 8
        })
        alertedBuildings.add(building.name)
      }
    }

    if (category === 'water') {
      // Critical: Usage > 120% of target (truly over limit)
      if (building.percentage > threshold.critical) {
        alerts.push({
          id: `critical-${buildingId}`,
          type: 'critical',
          title: '💧 Water Limit Exceeded',
          message: `${building.name} has used ${building.percentage}% of daily target. Let's find and fix any leaks!`,
          building: building.name,
          value: building.usage,
          unit: config.unit,
          category,
          autoDismiss: false,
          action: {
            label: 'Check System',
            onClick: () => console.log(`Checking ${building.name} water system`)
          }
        })
        alertedBuildings.add(building.name)
      }
      // Warning: Usage > 105% of recommended level
      else if (building.percentage > threshold.warning && building.percentage <= threshold.critical) {
        alerts.push({
          id: `warning-${buildingId}`,
          type: 'warning',
          title: '💦 Water Usage High',
          message: `${building.name} is at ${building.percentage}% of target. Small changes can make a big impact!`,
          building: building.name,
          category,
          autoDismiss: true,
          duration: 10
        })
        alertedBuildings.add(building.name)
      }
      // Success: Excellent efficiency (only occasionally)
      else if (building.percentage < threshold.excellent && Math.random() < 0.3) {
        alerts.push({
          id: `success-${buildingId}`,
          type: 'success',
          title: '🌊 Water Champion',
          message: `Amazing! ${building.name} is only using ${building.percentage}% of target. Every drop counts!`,
          building: building.name,
          category,
          autoDismiss: true,
          duration: 8
        })
        alertedBuildings.add(building.name)
      }
    }

    if (category === 'food') {
      const wasteValue = building.food || building.usage || building.waste || 0
      
      // Critical: High food waste (cafeteria specific)
      if (building.name.includes('Cafeteria') && wasteValue > threshold.critical) {
        alerts.push({
          id: `critical-${buildingId}`,
          type: 'critical',
          title: '🍽️ Food Waste Alert',
          message: `${wasteValue}kg of food wasted today in ${building.name}. Let's review portion sizes and storage!`,
          building: building.name,
          value: wasteValue,
          unit: config.unit,
          category,
          autoDismiss: false,
          action: {
            label: 'See Solutions',
            onClick: () => console.log(`Showing waste reduction tips for ${building.name}`)
          }
        })
        alertedBuildings.add(building.name)
      }
      // Warning: Moderate waste
      else if (building.name.includes('Cafeteria') && wasteValue > threshold.warning && wasteValue <= threshold.critical) {
        alerts.push({
          id: `warning-${buildingId}`,
          type: 'warning',
          title: '🥗 Reduce Food Waste',
          message: `${wasteValue}kg wasted today. Target is under ${threshold.warning}kg. You're close to the goal!`,
          building: building.name,
          category,
          autoDismiss: true,
          duration: 10
        })
        alertedBuildings.add(building.name)
      }
      // Achievement: Excellent waste management (only occasionally)
      else if (building.name.includes('Cafeteria') && wasteValue < threshold.excellent && Math.random() < 0.3) {
        alerts.push({
          id: `achievement-${buildingId}`,
          type: 'achievement',
          title: '🎉 Zero Waste Hero',
          message: `Incredible! Only ${wasteValue}kg wasted in ${building.name}. You're a sustainability champion!`,
          building: building.name,
          category,
          autoDismiss: true,
          duration: 8
        })
        alertedBuildings.add(building.name)
      }
    }
  })

  // Campus-wide alerts (only show significant achievements, less frequently)
  if (stats && alerts.length < 2) { // Don't overwhelm with alerts
    // High savings achievement (only for very high savings)
    if (stats.savings && stats.savings > 25 && Math.random() < 0.2) {
      alerts.push({
        id: `achievement-campus-savings-${timestamp}`,
        type: 'achievement',
        title: '🏆 Campus Achievement Unlocked',
        message: `Incredible! Campus has saved ${stats.savings}% on ${config.name.toLowerCase()}. Together we're changing the world!`,
        category,
        autoDismiss: true,
        duration: 12
      })
    }
  }

  return alerts
}

// Check for anomalies (sudden spikes)
export const detectAnomalies = (currentValue, historicalAverage, category, building) => {
  if (!historicalAverage || historicalAverage === 0) return null

  const percentChange = ((currentValue - historicalAverage) / historicalAverage) * 100

  const thresholds = {
    electricity: 20,
    water: 25,
    food: 30
  }

  const threshold = thresholds[category] || 20

  if (percentChange > threshold) {
    return {
      id: `anomaly-${category}-${building}-${Date.now()}`,
      type: 'warning',
      title: '📈 Unusual Pattern Detected',
      message: `${building}'s ${category} usage jumped ${Math.round(percentChange)}% above normal. Something might need attention!`,
      building,
      value: currentValue,
      category,
      autoDismiss: false,
      action: {
        label: 'Investigate Now',
        onClick: () => console.log(`Investigating ${building} ${category} spike`)
      }
    }
  }

  return null
}

// Time-based alerts (off-peak usage reminders)
export const getTimeBasedAlerts = () => {
  const hour = new Date().getHours()
  const alerts = []

  // Peak hours reminder (12-2 PM, 6-8 PM)
  if ((hour >= 12 && hour < 14) || (hour >= 18 && hour < 20)) {
    alerts.push({
      id: `time-peak-${Date.now()}`,
      type: 'info',
      title: '⏰ Peak Hours Notice',
      message: 'We\'re in peak usage time! Every little bit helps - consider delaying heavy tasks if possible.',
      autoDismiss: true,
      duration: 15
    })
  }

  // Off-peak optimization (11 PM - 6 AM)
  if (hour >= 23 || hour < 6) {
    alerts.push({
      id: `time-offpeak-${Date.now()}`,
      type: 'info',
      title: '🌙 Smart Energy Tip',
      message: 'It\'s off-peak time! Perfect for energy-intensive tasks at lower rates and reduced grid stress.',
      autoDismiss: true,
      duration: 20
    })
  }

  return alerts
}

// Weekly summary alert
export const getWeeklySummaryAlert = (stats) => {
  return {
    id: `weekly-summary-${Date.now()}`,
    type: 'info',
    title: '📊 Your Weekly Impact',
    message: `Amazing week! You've saved ${stats.totalSavings}% on resources and hit ${stats.achievements} goals. Keep up the momentum!`,
    autoDismiss: true,
    duration: 12
  }
}
