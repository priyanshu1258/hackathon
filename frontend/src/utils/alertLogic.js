// Alert Logic for Campus Resource Monitoring
// Generates alerts based on resource usage patterns

export const generateAlerts = (category, buildingData, stats, historicalData = null) => {
  const alerts = []
  const timestamp = Date.now()

  // Deterministic thresholds (no randomness)
  const thresholds = {
    electricity: {
      criticalPctOfCapacity: 95,
      warningPctOfCapacity: 85,
      spikePctChange: 25, // vs previous reading
      recoveryPctDrop: -15 // % drop vs previous reading
    },
    water: {
      criticalPctOfTarget: 120,
      warningPctOfTarget: 105,
      spikePctChange: 30,
      recoveryPctDrop: -15
    },
    food: {
      cafeteriaCriticalKg: 40,
      cafeteriaWarningKg: 32,
      spikePctChange: 35,
      recoveryPctDrop: -20
    }
  }

  const categoryConfig = {
    electricity: { unit: 'kWh', icon: '⚡', name: 'Electricity' },
    water: { unit: 'L', icon: '💧', name: 'Water' },
    food: { unit: 'kg', icon: '🍽️', name: 'Food Waste' }
  }

  const config = categoryConfig[category] || categoryConfig.electricity
  const threshold = thresholds[category] || thresholds.electricity

  const alertedBuildings = new Set()

  const fmt = (num, digits = 1) => {
    if (typeof num !== 'number' || isNaN(num)) return '0'
    return Number(num.toFixed(digits)).toString()
  }

  // Check each building using last-two-readings deltas if available
  buildingData.forEach(building => {
    const bName = building.name || building.building || 'Unknown'
    const bHist = historicalData?.[bName]
    const prev = Number(bHist?.prev ?? NaN)
    const latest = Number(bHist?.latest ?? NaN)
    const hasDelta = !isNaN(prev) && !isNaN(latest)
    const delta = hasDelta ? latest - prev : 0
    const pctChange = hasDelta && prev !== 0 ? (delta / prev) * 100 : 0

    if (alertedBuildings.has(bName)) return

    if (category === 'electricity') {
      const pctOfCapacity = building.percentage ?? bHist?.percentageLatest ?? 0
      const deltaAbs = Math.abs(delta)
      const capacity = building.capacity || 200

      // Critical: near capacity and rising vs previous reading
      if (pctOfCapacity >= threshold.criticalPctOfCapacity && (pctChange > 5 || latest > prev)) {
        const extraUsage = deltaAbs
        const equivalent = Math.round((extraUsage / 1.5) * 10) / 10 // ~1.5 kWh per AC/hour
        alerts.push({
          id: `critical-electricity-${bName}-${timestamp}`,
          type: 'critical',
          title: '⚡ Power Overload Alert!',
          message: `${bName} consumed ${fmt(latest,1)} kWh (up from ${fmt(prev,1)} kWh). You're using ${extraUsage > 0 ? fmt(extraUsage,1) + ' kWh MORE' : 'max power'}! That's ${equivalent} extra ACs running. Turn off non-essential equipment NOW!`,
          building: bName,
          value: fmt(latest,1),
          unit: config.unit,
          category,
          autoDismiss: false,
          action: {
            label: 'Check Systems',
            onClick: () => console.log(`Checking ${bName} electrical systems`)
          }
        })
        alertedBuildings.add(bName)
      }
      // Warning: high capacity or sharp spike
      else if (pctOfCapacity >= threshold.warningPctOfCapacity || pctChange >= threshold.spikePctChange) {
        const extraUsage = delta > 0 ? fmt(delta,1) : '0'
        const costPerKwh = 8 // ₹8 per kWh average
        const extraCost = delta > 0 ? Math.round(delta * costPerKwh) : 0
        alerts.push({
          id: `warning-electricity-${bName}-${timestamp}`,
          type: 'warning',
          title: '🔋 High Power Consumption',
          message: `${bName} is consuming ${fmt(latest,1)} kWh (was ${fmt(prev,1)} kWh). That's ${extraUsage} kWh more than last cycle! Extra cost: ₹${extraCost}. Consider switching off lights & ACs in unused areas.`,
          building: bName,
          category,
          autoDismiss: true,
          duration: 12
        })
        alertedBuildings.add(bName)
      }
      // Success: meaningful drop vs previous or strong campus savings
      else if (pctChange <= threshold.recoveryPctDrop || (stats?.savings ?? 0) >= 10) {
        const savedKwh = Math.abs(delta)
        const savedCost = Math.round(savedKwh * 8)
        const co2Saved = Math.round(savedKwh * 0.82 * 10) / 10 // 0.82 kg CO2 per kWh
        alerts.push({
          id: `success-electricity-${bName}-${timestamp}`,
          type: 'success',
          title: '🌟 Excellent Energy Savings!',
          message: `${bName} consumed only ${fmt(latest,1)} kWh (down from ${fmt(prev,1)} kWh)! You saved ${fmt(savedKwh,1)} kWh, ₹${savedCost}, and ${co2Saved} kg CO₂. Amazing work! 🎉`,
          building: bName,
          category,
          autoDismiss: true,
          duration: 10
        })
        alertedBuildings.add(bName)
      }
    }

    if (category === 'water') {
      const pctOfTarget = building.percentage ?? bHist?.percentageLatest ?? 0
      const deltaAbs = Math.abs(delta)

      if (pctOfTarget >= threshold.criticalPctOfTarget && (pctChange > 10 || latest > prev)) {
        const extraWater = deltaAbs
        const bottles = Math.round(extraWater / 1) // 1L bottles
        const showers = Math.round(extraWater / 75) // ~75L per shower
        alerts.push({
          id: `critical-water-${bName}-${timestamp}`,
          type: 'critical',
          title: '💧 Water Usage Critical!',
          message: `${bName} consumed ${fmt(latest,0)} L (up from ${fmt(prev,0)} L). That's ${fmt(extraWater,0)} L MORE water! Equivalent to ${bottles} bottles or ${showers} showers wasted! Check for leaks immediately!`,
          building: bName,
          value: fmt(latest,0),
          unit: config.unit,
          category,
          autoDismiss: false,
          action: {
            label: 'Inspect Now',
            onClick: () => console.log(`Inspecting ${bName} water system`)
          }
        })
        alertedBuildings.add(bName)
      }
      else if (pctOfTarget >= threshold.warningPctOfTarget || pctChange >= threshold.spikePctChange) {
        const extraWater = delta > 0 ? Math.round(delta) : 0
        const buckets = Math.round(extraWater / 10) // 10L buckets
        const costPerL = 0.05 // ₹0.05 per liter
        const extraCost = Math.round(extraWater * costPerL)
        alerts.push({
          id: `warning-water-${bName}-${timestamp}`,
          type: 'warning',
          title: '💦 High Water Usage Detected',
          message: `${bName} used ${fmt(latest,0)} L (was ${fmt(prev,0)} L). That's ${extraWater} L more—enough to fill ${buckets} buckets! Extra cost: ₹${extraCost}. Fix any dripping taps and use water wisely.`,
          building: bName,
          category,
          autoDismiss: true,
          duration: 12
        })
        alertedBuildings.add(bName)
      }
      else if (pctChange <= thresholds.water.recoveryPctDrop || (stats?.savings ?? 0) >= 10) {
        const savedWater = Math.abs(delta)
        const savedBottles = Math.round(savedWater / 1)
        const savedCost = Math.round(savedWater * 0.05)
        alerts.push({
          id: `success-water-${bName}-${timestamp}`,
          type: 'success',
          title: '🌊 Amazing Water Conservation!',
          message: `${bName} used only ${fmt(latest,0)} L (down from ${fmt(prev,0)} L)! You saved ${fmt(savedWater,0)} L—that's ${savedBottles} water bottles! Saved ₹${savedCost}. Every drop counts! 💙`,
          building: bName,
          category,
          autoDismiss: true,
          duration: 10
        })
        alertedBuildings.add(bName)
      }
    }

    if (category === 'food') {
      const latestWaste = Number(building.waste ?? building.usage ?? building.food ?? latest ?? 0)
      const prevWaste = Number(prev ?? 0)
      const isCafeteria = /Cafeteria/i.test(bName)
      const deltaWaste = latestWaste - prevWaste

      if (isCafeteria && (latestWaste >= threshold.cafeteriaCriticalKg && pctChange >= 10)) {
        const mealsWasted = Math.round(latestWaste / 0.4) // ~400g per meal
        const peopleCanFeed = Math.round(latestWaste / 0.5) // ~500g per person
        const costPerKg = 150 // ₹150 per kg of food
        const moneyWasted = Math.round(latestWaste * costPerKg)
        alerts.push({
          id: `critical-food-${bName}-${timestamp}`,
          type: 'critical',
          title: '🍽️ Excessive Food Waste!',
          message: `${bName} wasted ${fmt(latestWaste,1)} kg today (up from ${fmt(prevWaste,1)} kg). That's ${fmt(deltaWaste,1)} kg MORE! Could have fed ${peopleCanFeed} people or saved ${mealsWasted} meals. Money lost: ₹${moneyWasted}! Review portion sizes NOW!`,
          building: bName,
          value: fmt(latestWaste,1),
          unit: config.unit,
          category,
          autoDismiss: false,
          action: {
            label: 'View Solutions',
            onClick: () => console.log(`Opening waste reduction tips for ${bName}`)
          }
        })
        alertedBuildings.add(bName)
      }
      else if (isCafeteria && (latestWaste >= threshold.cafeteriaWarningKg || pctChange >= threshold.spikePctChange)) {
        const extraWaste = deltaWaste > 0 ? deltaWaste : 0
        const mealsLost = Math.round(extraWaste / 0.4)
        const targetWaste = threshold.cafeteriaWarningKg
        const overTarget = latestWaste - targetWaste
        alerts.push({
          id: `warning-food-${bName}-${timestamp}`,
          type: 'warning',
          title: '🥗 Food Waste Rising',
          message: `${bName} wasted ${fmt(latestWaste,1)} kg (was ${fmt(prevWaste,1)} kg). That's ${mealsLost} meals wasted! You're ${fmt(overTarget,1)} kg over the target. Small portions = less waste. Let's do better!`,
          building: bName,
          category,
          autoDismiss: true,
          duration: 12
        })
        alertedBuildings.add(bName)
      }
      else if (pctChange <= thresholds.food.recoveryPctDrop || (stats?.reduction ?? 0) >= 10) {
        const wasteReduced = Math.abs(deltaWaste)
        const mealsSaved = Math.round(wasteReduced / 0.4)
        const moneySaved = Math.round(wasteReduced * 150)
        alerts.push({
          id: `success-food-${bName}-${timestamp}`,
          type: 'success',
          title: '🌱 Outstanding Waste Reduction!',
          message: `${bName} wasted only ${fmt(latestWaste,1)} kg (down from ${fmt(prevWaste,1)} kg)! You reduced waste by ${fmt(wasteReduced,1)} kg, saved ${mealsSaved} meals worth ₹${moneySaved}! You're a sustainability hero! 🎉`,
          building: bName,
          category,
          autoDismiss: true,
          duration: 10
        })
        alertedBuildings.add(bName)
      }
    }
  })

  // Campus-wide alerts (only show significant achievements, less frequently)
  if (stats && alerts.length < 2) { // Don't overwhelm with alerts
    const isFood = category === 'food'
    const metricValue = isFood ? stats.reduction : stats.savings
    const metricLabel = isFood ? 'reduction in food waste' : `saved on ${config.name.toLowerCase()}`
    const titleByCategory = isFood
      ? '🏆 Food Waste Milestone'
      : category === 'water'
        ? '🏆 Water Savings Milestone'
        : '🏆 Electricity Savings Milestone'

    // High achievement (only for very high improvements)
    if (metricValue && metricValue > 25 && Math.random() < 0.2) {
      alerts.push({
        id: `achievement-${category}-summary-${timestamp}`,
        type: 'achievement',
        title: titleByCategory,
        message: `Incredible! Campus achieved ${metricValue}% ${metricLabel}. Together we're changing the world!`,
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
