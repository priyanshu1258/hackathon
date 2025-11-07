import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import StatCard from '../components/StatCard'
import AlertSystem from '../components/AlertSystem'
import { fetchLatestByCategory, fetchReadings, setupSocketListeners } from '../services/api'
import { calculateCost, calculateCO2, calculateEquivalents } from '../utils/costCalculations'

function FoodWaste() {
  const [selectedPeriod, setSelectedPeriod] = useState('Today')
  const [selectedBuilding, setSelectedBuilding] = useState('Cafeteria')
  const [stats, setStats] = useState({ 
    current: 0, 
    peak: 0, 
    peakSource: '', 
    average: 0, 
    reduction: 18,
    reductionTrend: 'down',
    trendValue: 'from baseline'
  })
  const [buildingData, setBuildingData] = useState([
    { name: 'Cafeteria', waste: 0, meals: 450, wastePerMeal: 0, status: 'normal' },
    { name: 'Hostel-A', waste: 0, meals: 200, wastePerMeal: 0, status: 'normal' },
    { name: 'Labs', waste: 0, meals: 50, wastePerMeal: 0, status: 'normal' }
  ])
  const [chartData, setChartData] = useState([])
  const [alerts, setAlerts] = useState([])
  const [costData, setCostData] = useState({ cost: '₹0', co2: '0 kg', meals: 0 })
  const [weeklyTrendData, setWeeklyTrendData] = useState([])

  const periods = ['Today', 'This Week', 'This Month']
  const buildings = ['Cafeteria', 'Hostel-A', 'Labs']

  useEffect(() => {
    loadFoodWasteData()
    loadWeeklyTrend()
    const cleanup = setupSocketListeners((update) => {
      if (update.category === 'food') {
        loadFoodWasteData()
        loadWeeklyTrend()
      }
    })
    return cleanup
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      loadBuildingHistory(selectedBuilding)
    }
  }, [selectedBuilding])

  const loadFoodWasteData = async () => {
    try {
      const data = await fetchLatestByCategory('food')
      console.log('Food data received:', data) // Debug log
      
      if (!data) {
        console.error('No food data received from API')
        return
      }

      const buildings = ['Cafeteria', 'Hostel-A', 'Labs']
      const mealCounts = { 'Cafeteria': 450, 'Hostel-A': 200, 'Labs': 50 }
      
      let total = 0
      let peak = 0
      let peakSource = ''
      
      const updatedBuildings = buildings.map(building => {
        const buildingData = data[building]
        console.log(`Processing ${building}:`, buildingData)
        
        const waste = buildingData?.value ? Math.round(buildingData.value * 10) / 10 : 0
        const meals = mealCounts[building]
        const wastePerMeal = waste > 0 ? Math.round((waste / meals) * 1000) / 1000 : 0
        const status = wastePerMeal > 0.07 ? 'warning' : 'good'
        
        total += waste
        if (waste > peak) {
          peak = waste
          peakSource = building
        }
        
        return { name: building, waste, meals, wastePerMeal, status }
      })

      console.log('Updated buildings:', updatedBuildings) // Debug log
      console.log('Total waste:', total)

      // Calculate waste reduced vs the immediately previous reading (last cycle)
      try {
        // Fetch only the last two readings per building to compare previous vs latest
  const historyPromises = buildings.map(b => fetchReadings('food', b, 2))
  const histories = await Promise.all(historyPromises)

        let prevTotal = 0
        let latestTotal = 0
        let counted = 0

        const perBuildingDeltas = {}
        histories.forEach((history, idx) => {
          const bName = buildings[idx]
          if (history && history.length >= 2) {
            const prev = Number(history[history.length - 2]?.value || 0)
            const latest = Number(history[history.length - 1]?.value || 0)
            prevTotal += prev
            latestTotal += latest
            counted++
            perBuildingDeltas[bName] = {
              prev,
              latest,
              delta: latest - prev,
              pctChange: prev ? ((latest - prev) / prev) * 100 : 0
            }
          } else if (history && history.length === 1) {
            const single = Number(history[0]?.value || 0)
            prevTotal += single
            latestTotal += single
            counted++
            perBuildingDeltas[bName] = {
              prev: single,
              latest: single,
              delta: 0,
              pctChange: 0
            }
          }
        })

        if (counted === 0) {
          prevTotal = total
          latestTotal = total
        }

        const reductionPercent = prevTotal > 0 
          ? Math.round(((prevTotal - latestTotal) / prevTotal) * 100)
          : 0
        const reductionTrend = latestTotal <= prevTotal ? 'down' : 'up'
        const trendValue = `${Math.abs(reductionPercent)}% ${reductionTrend === 'down' ? 'less' : 'more'}`

        setBuildingData(updatedBuildings)
        setStats({
          current: Math.round(total * 10) / 10,
          peak: Math.round(peak * 10) / 10,
          peakSource: peakSource,
          average: Math.round((total / buildings.length) * 10) / 10,
          reduction: reductionPercent,
          reductionTrend,
          trendValue
        })

        // Calculate cost and environmental impact
        const costResult = calculateCost('food', total)
        const co2Result = calculateCO2('food', total)
        const equivalents = calculateEquivalents('food', total)
        
        setCostData({
          cost: costResult.formatted,
          co2: co2Result.formatted,
          meals: equivalents.meals?.value || 0,
          people: equivalents.people?.value || 0
        })

        // Generate alert for highest waste building
        const highestWaste = updatedBuildings.reduce((max, building) => 
          building.waste > max.waste ? building : max
        , updatedBuildings[0])
        
        const wasteThreshold = highestWaste.name === 'Cafeteria' ? 35 : 10
        
        const newAlerts = [{
          id: `food-peak-${Date.now()}`,
          type: highestWaste.waste >= wasteThreshold * 1.2 ? 'critical' : highestWaste.waste >= wasteThreshold ? 'warning' : 'info',
          title: '🍽️ Highest Food Waste Source',
          message: `${highestWaste.name} has the most food waste at ${highestWaste.waste.toFixed(1)} kg (${(highestWaste.waste / highestWaste.meals * 1000).toFixed(0)}g per meal). ${highestWaste.waste >= wasteThreshold * 1.2 ? 'Critical waste levels! Immediate action needed.' : highestWaste.waste >= wasteThreshold ? 'High waste detected. Review portion sizes.' : 'Waste within acceptable range.'}`,
          building: highestWaste.name,
          value: highestWaste.waste.toFixed(1),
          unit: 'kg',
          category: 'food',
          categoryColor: '#10b981',
          autoDismiss: true,
          duration: 10
        }]
        
        setAlerts(newAlerts)
      } catch (error) {
        console.error('Error calculating waste reduction:', error)
        setBuildingData(updatedBuildings)
        setStats({
          current: Math.round(total * 10) / 10,
          peak: Math.round(peak * 10) / 10,
          peakSource: peakSource,
          average: Math.round((total / buildings.length) * 10) / 10,
          reduction: 18 // Default fallback
        })
      }
    } catch (error) {
      console.error('Error in loadFoodWasteData:', error)
    }
  }

  const loadWeeklyTrend = async () => {
    try {
      const buildings = ['Cafeteria', 'Hostel-A', 'Labs']
      
      // Fetch historical data (50 readings per building is sufficient)
      const historyPromises = buildings.map(b => fetchReadings('food', b, 50))
      const histories = await Promise.all(historyPromises)
      
      // Initialize day map with structure
      const dayWasteMap = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].reduce((map, day) => {
        map[day] = { total: 0, count: 0 }
        return map
      }, {})
      
      // Single pass aggregation across all readings
      let totalReadings = 0
      histories.forEach(history => {
        if (!history || history.length === 0) return
        
        history.forEach(reading => {
          if (!reading.ts || !reading.value) return
          
          const date = new Date(reading.ts)
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
          
          dayWasteMap[dayName].total += reading.value
          dayWasteMap[dayName].count++
          totalReadings++
        })
      })
      
      console.log(`📅 Weekly Trend: ${totalReadings} readings across ${histories.length} buildings`)
      
      // Build weekly trend array with calculated averages
      const weeklyTrend = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
        const data = dayWasteMap[day]
        return {
          day,
          waste: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
          count: data.count
        }
      })
      
      // Log summary
      const activeDays = weeklyTrend.filter(d => d.count > 0).length
      if (activeDays > 0) {
        console.log(`  └─ Data available for ${activeDays} days`)
      } else {
        console.log('  └─ No historical data yet')
      }
      
      setWeeklyTrendData(weeklyTrend)
      
    } catch (error) {
      console.error('❌ Error loading weekly trend:', error)
      // Fallback: empty weekly data
      setWeeklyTrendData(
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
          day, waste: 0, count: 0
        }))
      )
    }
  }

  const loadBuildingHistory = async (building) => {
    try {
      const history = await fetchReadings('food', building, 50)
      console.log('Food history for', building, ':', history) // Debug log
      
      if (!history || history.length === 0) {
        console.log('No history data for', building)
        setChartData([])
        return
      }

      // Bucket readings into 30-minute intervals (oldest -> newest)
  const BUCKET_MS = 5 * 60 * 1000
      const buckets = new Map()

      history.forEach(reading => {
        const ts = Number(reading.ts || Date.now())
        const bucketTs = Math.floor(ts / BUCKET_MS) * BUCKET_MS
        const key = String(bucketTs)
        const val = Number(reading.value) || 0
        if (!buckets.has(key)) {
          buckets.set(key, { ts: bucketTs, sum: val, count: 1 })
        } else {
          const b = buckets.get(key)
          b.sum += val
          b.count += 1
        }
      })

      const toTime = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      const formatted = Array.from(buckets.values())
        .sort((a, b) => a.ts - b.ts)
        .map(b => {
          const avg = b.count > 0 ? b.sum / b.count : 0
          const rounded = Math.round(avg * 10) / 10
          return {
            time: toTime(b.ts),
            waste: rounded,
            rawWaste: avg,
            building,
            timestamp: b.ts
          }
        })

      console.log('Formatted 30-min bucketed data:', formatted) // Debug log
      setChartData(formatted)
    } catch (error) {
      console.error('Error in loadBuildingHistory:', error)
    }
  }

  const wasteBreakdown = [
    { category: 'Plate Waste', amount: 18, percentage: 40, color: '#ef4444' },
    { category: 'Preparation Waste', amount: 12, percentage: 27, color: '#f59e0b' },
    { category: 'Spoilage', amount: 10, percentage: 22, color: '#8b5cf6' },
    { category: 'Other', amount: 5, percentage: 11, color: '#64748b' }
  ]

  // Use actual weekly trend data from database
  // If all days are empty except one (all data on same day), show the latest 7 data points instead
  const hasMultipleDays = weeklyTrendData.filter(d => d.waste > 0).length > 1
  
  const weeklyTrend = weeklyTrendData.length > 0 && hasMultipleDays
    ? weeklyTrendData 
    : weeklyTrendData.length > 0 && !hasMultipleDays
    ? weeklyTrendData // Still show it even if only one day has data
    : [
        { day: 'Mon', waste: 0 },
        { day: 'Tue', waste: 0 },
        { day: 'Wed', waste: 0 },
        { day: 'Thu', waste: 0 },
        { day: 'Fri', waste: 0 },
        { day: 'Sat', waste: 0 },
        { day: 'Sun', waste: 0 }
      ]

  const insights = [
    { icon: '📉', text: 'Food waste decreased by 18% this month', type: 'positive' },
    { icon: '⚠️', text: 'Lunch service shows highest waste', type: 'warning' },
    { icon: '🎯', text: 'On track to meet monthly reduction goal', type: 'info' },
  ]

  const tips = [
    '🍽️ Take only what you can eat - you can always get more',
    '📏 Start with smaller portions',
    '♻️ Compost food waste when possible',
    '🥗 Choose items you know you will eat',
    '⏰ Proper meal timing reduces waste'
  ]

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen">
      {/* Alert System */}
      <AlertSystem 
        alerts={alerts} 
        onDismiss={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
      />
      
      <div className="mb-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">🍽️ Food Waste Monitoring</h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Track and reduce cafeteria food waste across campus</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard
          icon="🍴"
          title="Total Waste"
          value={stats.current}
          unit="kg"
          color="#f59e0b"
        />
        <StatCard
          icon="�"
          title="Waste Value"
          value={costData.cost}
          unit=""
          color="#ef4444"
        />
        <StatCard
          icon="🌱"
          title="Waste Reduced"
          value={stats.reduction}
          unit="%"
          trend={stats.reductionTrend}
          trendValue={stats.trendValue}
          color="#10b981"
        />
      </div>

      {/* Cost & Environmental Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="modern-card p-6 animate-fade-in hover-glow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-red-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg">
              �
            </div>
            <div>
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Peak Waste</h3>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.peak} kg</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            from {stats.peakSource} • Review portions
          </p>
        </div>

        <div className="modern-card p-6 animate-fade-in hover-glow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl shadow-lg">
              �️
            </div>
            <div>
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Meals Wasted</h3>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{costData.meals?.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Could have fed people • Reduce portions
          </p>
        </div>
      </div>

      {/* Waste Trend Chart */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold gradient-text">🍽️ Waste Trend</h2>
          <select 
            aria-label="Select building"
            className="w-full sm:w-auto modern-card px-4 py-2 rounded-lg font-medium cursor-pointer hover:shadow-lg focus:outline-none transition-all duration-200"
            style={{ color: 'var(--text-primary)' }}
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            {buildings.map(building => (
              <option key={building} value={building}>{building}</option>
            ))}
          </select>
        </div>
        <div className="modern-card p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[450px] text-slate-500 dark:text-slate-400">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-pulse">🍽️</div>
                <p className="text-xl font-semibold">No data available yet</p>
                <p className="text-sm mt-2 text-slate-400">Historical data will appear here once readings are collected</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <defs>
                  <linearGradient id="foodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.1}/>
                  </linearGradient>
                  <filter id="foodShadow" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dx="0" dy="3" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.4"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="5 5" stroke="#cbd5e1" opacity={0.3} />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b"
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#64748b"
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                  label={{ 
                    value: 'Food Waste (kg)', 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { fill: '#10b981', fontSize: 13, fontWeight: 600 } 
                  }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                    border: '2px solid #10b981', 
                    borderRadius: '12px',
                    color: '#f1f5f9',
                    padding: '14px 18px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                  formatter={(value, name, props) => {
                    const rawWaste = props.payload.rawWaste;
                    const displayValue = rawWaste ? rawWaste.toFixed(2) : value;
                    return [`${displayValue} kg`, '🍽️ Food Waste'];
                  }}
                  labelFormatter={(label) => `🕐 ${label}`}
                  labelStyle={{ color: '#34d399', fontWeight: 700, fontSize: 13, marginBottom: '8px', borderBottom: '1px solid #10b981', paddingBottom: '6px' }}
                  itemStyle={{ color: '#fff', fontWeight: 600, fontSize: 14 }}
                  cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '25px', fontSize: '13px', fontWeight: 600 }}
                  iconType="square"
                  iconSize={12}
                />
                <Bar 
                  dataKey="waste" 
                  fill="url(#foodGradient)"
                  radius={[10, 10, 0, 0]}
                  name="🍽️ Food Waste (kg)"
                  animationDuration={1200}
                  animationBegin={0}
                  maxBarSize={60}
                />
                <Line 
                  type="monotone" 
                  dataKey="waste" 
                  stroke="#059669" 
                  strokeWidth={2.5} 
                  dot={{ fill: '#10b981', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2.5, filter: 'url(#foodShadow)' }}
                  name="Trend Line"
                  animationDuration={1500}
                  animationBegin={400}
                  strokeDasharray="5 5"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Building/Location Data */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold gradient-text mb-6">Location-wise Food Waste</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {buildingData.map((location) => (
            <div key={location.name} className="modern-card p-6 hover-glow animate-scale-in border-t-4 border-green-500">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{location.name}</h3>
                <span className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  location.status === 'good' 
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-orange-100 dark:bg-amber-900 text-orange-700 dark:text-amber-300'
                }`}>
                  {location.status === 'good' ? '✓ Efficient' : '⚠ Needs Attention'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Total Waste</div>
                  <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{location.waste} kg</div>
                </div>
                <div className="text-center">
                  <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Meals Served</div>
                  <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{location.meals}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Waste per Meal</div>
                  <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{location.wastePerMeal.toFixed(3)} kg</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {/* Waste Breakdown */}
        <div>
          <h2 className="text-2xl font-bold gradient-text mb-6">Waste Breakdown</h2>
          <div className="modern-card p-6 space-y-4">
            {wasteBreakdown.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.category}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.amount} kg</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden mb-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${item.percentage}%`,
                      background: item.color
                    }}
                  ></div>
                </div>
                <div className="text-sm text-right" style={{ color: 'var(--text-secondary)' }}>{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Trend */}
        <div>
          <h2 className="text-2xl font-bold gradient-text mb-6">
            Weekly Trend
            {weeklyTrendData.length > 0 && weeklyTrendData.some(d => d.count > 0) && (
              <span className="text-sm font-normal ml-3 text-gray-500">
                ({weeklyTrendData.reduce((sum, d) => sum + d.count, 0)} readings)
              </span>
            )}
          </h2>
          <div className="modern-card p-6">
            {weeklyTrend.every(d => d.waste === 0) ? (
              <div className="flex items-center justify-center h-48 text-slate-500 dark:text-slate-400">
                <div className="text-center">
                  <div className="text-4xl mb-3 animate-pulse">📊</div>
                  <p className="text-lg font-semibold">No weekly data yet</p>
                  <p className="text-sm mt-2">Weekly patterns will appear as data is collected over time</p>
                  <p className="text-xs mt-1 text-gray-400">Data updates every 30 minutes</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between h-48 gap-3">
                  {weeklyTrend.map((data, index) => {
                    const maxWaste = Math.max(...weeklyTrend.map(d => d.waste), 1);
                    const heightPercent = data.waste > 0 ? (data.waste / maxWaste) * 100 : 0;
                    const isWeekend = data.day === 'Sat' || data.day === 'Sun';
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group">
                        <div className="w-full flex items-end justify-center h-full">
                          {data.waste > 0 ? (
                            <div 
                              className={`w-full rounded-t-lg relative flex items-start justify-center pt-2 transition-all duration-500 hover:scale-105 cursor-pointer ${
                                isWeekend 
                                  ? 'bg-linear-to-t from-emerald-400 to-green-500' 
                                  : 'bg-linear-to-t from-green-400 to-emerald-500'
                              }`}
                              style={{ 
                                height: `${heightPercent}%`, 
                                minHeight: '45px',
                                animation: `slideUp 0.6s ease-out ${index * 0.1}s both`
                              }}
                            >
                              <span className="text-white text-xs font-bold group-hover:scale-110 transition-transform">
                                {data.waste}kg
                              </span>
                            </div>
                          ) : (
                            <div className="w-full h-10 rounded-t-lg bg-gray-200 dark:bg-gray-700 opacity-30 flex items-center justify-center">
                              <span className="text-xs text-gray-400">-</span>
                            </div>
                          )}
                        </div>
                        <div className={`text-xs mt-2 font-semibold transition-colors ${
                          isWeekend 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {data.day}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm" style={{ borderColor: 'var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }} className="font-medium">
                    📊 Weekly Average: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {weeklyTrend.filter(d => d.waste > 0).length > 0 
                        ? Math.round(weeklyTrend.reduce((sum, d) => sum + d.waste, 0) / weeklyTrend.filter(d => d.waste > 0).length * 10) / 10
                        : 0}kg
                    </span>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }} className="text-xs">
                    🎯 Based on actual readings
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold gradient-text mb-6">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <div key={index} className={`modern-card flex items-center gap-3 p-4 font-medium hover:shadow-lg transition-all duration-200 ${
              insight.type === 'positive' ? 'border-l-4 border-green-500' : 
              insight.type === 'warning' ? 'border-l-4 border-orange-500' :
              'border-l-4 border-blue-500'
            }`}>
              <span className="text-2xl">{insight.icon}</span>
              <span style={{ color: 'var(--text-primary)' }}>{insight.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reduction Tips */}
      <div>
        <h2 className="text-2xl font-bold gradient-text mb-6">Food Waste Reduction Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="modern-card px-5 py-4 font-medium hover:shadow-lg transition-shadow duration-200 border-l-4 border-green-500"
              style={{ color: 'var(--text-primary)' }}
            >
              {tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FoodWaste
