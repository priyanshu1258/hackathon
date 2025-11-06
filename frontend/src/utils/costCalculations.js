// Cost and Environmental Impact Calculations
// Convert resource consumption to monetary and environmental metrics

// Regional pricing (adjust based on your location)
export const costConfig = {
  electricity: {
    pricePerUnit: 8, // ₹8 per kWh (India average)
    co2PerUnit: 0.82, // 0.82 kg CO2 per kWh
    currency: '₹',
    unit: 'kWh'
  },
  water: {
    pricePerUnit: 0.05, // ₹0.05 per liter
    co2PerUnit: 0.0003, // 0.3g CO2 per liter (water treatment/pumping)
    currency: '₹',
    unit: 'L'
  },
  food: {
    pricePerUnit: 150, // ₹150 per kg (average food cost)
    co2PerUnit: 2.5, // 2.5 kg CO2 per kg food waste (decomposition + production)
    currency: '₹',
    unit: 'kg'
  }
}

// Calculate cost for a given resource and value
export const calculateCost = (category, value) => {
  const config = costConfig[category]
  if (!config) return { cost: 0, currency: '₹', formatted: '₹0' }
  
  const cost = value * config.pricePerUnit
  const formatted = `${config.currency}${cost.toLocaleString('en-IN', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  })}`
  
  return { cost, currency: config.currency, formatted }
}

// Calculate CO2 emissions
export const calculateCO2 = (category, value) => {
  const config = costConfig[category]
  if (!config) return { co2: 0, formatted: '0 kg' }
  
  const co2Kg = value * config.co2PerUnit
  
  // Format appropriately based on magnitude
  let formatted
  if (co2Kg < 1) {
    formatted = `${(co2Kg * 1000).toFixed(0)} g`
  } else if (co2Kg < 1000) {
    formatted = `${co2Kg.toFixed(1)} kg`
  } else {
    formatted = `${(co2Kg / 1000).toFixed(2)} tonnes`
  }
  
  return { co2: co2Kg, formatted }
}

// Calculate environmental equivalents for better understanding
export const calculateEquivalents = (category, value) => {
  const co2Result = calculateCO2(category, value)
  const co2Kg = co2Result.co2
  
  const equivalents = {
    trees: {
      value: Math.round(co2Kg / 20), // 1 tree absorbs ~20kg CO2/year
      label: 'trees needed yearly',
      icon: '🌳'
    },
    cars: {
      value: Math.round(co2Kg / 4.6), // Average car emits 4.6kg CO2/day
      label: 'car-days of emissions',
      icon: '🚗'
    },
    bulbs: {
      value: Math.round((value * (category === 'electricity' ? 1 : 0)) / 0.1), // 100W bulb uses 0.1kWh/hour
      label: 'hours of 100W bulb',
      icon: '💡'
    }
  }
  
  // Category-specific equivalents
  if (category === 'water') {
    equivalents.bottles = {
      value: Math.round(value / 1), // 1L = 1 bottle
      label: 'water bottles',
      icon: '🍶'
    }
    equivalents.showers = {
      value: Math.round(value / 75), // Average shower uses ~75L
      label: 'showers',
      icon: '🚿'
    }
  }
  
  if (category === 'food') {
    equivalents.meals = {
      value: Math.round(value * 3), // 1kg waste ≈ 3 meals
      label: 'meals wasted',
      icon: '🍽️'
    }
    equivalents.people = {
      value: Math.round(value / 0.4), // Average person wastes 0.4kg/day
      label: 'person-days of waste',
      icon: '👤'
    }
  }
  
  return equivalents
}

// Calculate savings (cost avoided)
export const calculateSavings = (category, currentValue, savingsPercent) => {
  if (!savingsPercent || savingsPercent <= 0) {
    return {
      amount: 0,
      formatted: '₹0',
      co2Avoided: '0 kg',
      message: 'No savings yet'
    }
  }
  
  // Calculate what was saved
  const savedValue = (currentValue * savingsPercent) / (100 - savingsPercent)
  
  const costSaved = calculateCost(category, savedValue)
  const co2Saved = calculateCO2(category, savedValue)
  
  return {
    amount: costSaved.cost,
    formatted: costSaved.formatted,
    co2Avoided: co2Saved.formatted,
    savedValue: savedValue.toFixed(category === 'food' ? 1 : 0),
    message: `Saved ${costSaved.formatted} this period`
  }
}

// Calculate daily/monthly/yearly projections
export const calculateProjections = (category, currentValue, periodType = 'day') => {
  const multipliers = {
    day: { daily: 1, monthly: 30, yearly: 365 },
    week: { daily: 1/7, monthly: 4.3, yearly: 52 },
    month: { daily: 1/30, monthly: 1, yearly: 12 }
  }
  
  const multiplier = multipliers[periodType] || multipliers.day
  
  const daily = currentValue * multiplier.daily
  const monthly = currentValue * multiplier.monthly
  const yearly = currentValue * multiplier.yearly
  
  return {
    daily: {
      value: daily,
      cost: calculateCost(category, daily),
      co2: calculateCO2(category, daily)
    },
    monthly: {
      value: monthly,
      cost: calculateCost(category, monthly),
      co2: calculateCO2(category, monthly)
    },
    yearly: {
      value: yearly,
      cost: calculateCost(category, yearly),
      co2: calculateCO2(category, yearly)
    }
  }
}

// Format large numbers for display
export const formatNumber = (num, decimals = 0) => {
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// Get cost comparison message
export const getCostComparison = (category, cost) => {
  const comparisons = {
    electricity: [
      { threshold: 10000, message: 'Equivalent to 50+ households monthly bill' },
      { threshold: 5000, message: 'Equivalent to 25+ households monthly bill' },
      { threshold: 1000, message: 'Equivalent to 5 households monthly bill' },
      { threshold: 500, message: 'Equivalent to 2-3 households monthly bill' },
      { threshold: 0, message: 'Less than 1 household monthly bill' }
    ],
    water: [
      { threshold: 5000, message: 'Equivalent to 100+ households daily usage' },
      { threshold: 1000, message: 'Equivalent to 20+ households daily usage' },
      { threshold: 500, message: 'Equivalent to 10 households daily usage' },
      { threshold: 100, message: 'Equivalent to 2-3 households daily usage' },
      { threshold: 0, message: 'Less than 1 household daily usage' }
    ],
    food: [
      { threshold: 10000, message: 'Could feed 200+ meals' },
      { threshold: 5000, message: 'Could feed 100+ meals' },
      { threshold: 1000, message: 'Could feed 20+ meals' },
      { threshold: 500, message: 'Could feed 10+ meals' },
      { threshold: 0, message: 'Could feed a few meals' }
    ]
  }
  
  const categoryComparisons = comparisons[category] || comparisons.electricity
  const comparison = categoryComparisons.find(c => cost >= c.threshold)
  
  return comparison ? comparison.message : 'Minimal cost'
}
