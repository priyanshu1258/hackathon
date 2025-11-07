import { useState, useEffect } from 'react'
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import StatCard from '../components/StatCard'
import AlertSystem from '../components/AlertSystem'
import { fetchLatestByCategory, fetchReadings, setupSocketListeners } from '../services/api'
import { calculateCost, calculateCO2, calculateSavings, calculateEquivalents } from '../utils/costCalculations'

function Electricity() {
  const [selectedBuilding, setSelectedBuilding] = useState('Hostel-A')
  const [stats, setStats] = useState({ 
    current: 0, 
    peak: 0, 
    average: 0, 
    savings: 15,
    savingsTrend: 'down',
    trendValue: 'from baseline'
  })
  const [buildingData, setBuildingData] = useState([
    { name: 'Hostel-A', usage: 0, capacity: 200, percentage: 0, status: 'normal' },
    { name: 'Library', usage: 0, capacity: 150, percentage: 0, status: 'normal' },
    { name: 'Cafeteria', usage: 0, capacity: 250, percentage: 0, status: 'normal' },
    { name: 'Labs', usage: 0, capacity: 180, percentage: 0, status: 'normal' }
  ])
  const [recentReadings, setRecentReadings] = useState([])
  const [chartData, setChartData] = useState([])
  const [alerts, setAlerts] = useState([])
  const [costData, setCostData] = useState({ cost: '₹0', co2: '0 kg', savings: '₹0' })

  const buildings = ['Hostel-A', 'Library', 'Cafeteria', 'Labs']

  useEffect(() => {
    loadElectricityData()
    const cleanup = setupSocketListeners((update) => {
      if (update.category === 'electricity') {
        loadElectricityData()
      }
    })
    return cleanup
  }, [])

  useEffect(() => {
    if (selectedBuilding) {
      loadBuildingHistory(selectedBuilding)
    }
  }, [selectedBuilding])

  const loadElectricityData = async () => {
    const data = await fetchLatestByCategory('electricity')
    if (data) {
      const buildings = ['Hostel-A', 'Library', 'Cafeteria', 'Labs']
      const capacities = { 'Hostel-A': 200, 'Library': 150, 'Cafeteria': 250, 'Labs': 180 }
      
      let total = 0
      let peak = 0
      let peakSource = ''
      
      const updatedBuildings = buildings.map(building => {
        const usage = Math.round(data[building]?.value || 0)
        const capacity = capacities[building]
        const percentage = Math.round((usage / capacity) * 100)
        const status = percentage > 75 ? 'warning' : 'normal'
        
        total += usage
        if (usage > peak) {
          peak = usage
          peakSource = building
        }
        
        return { name: building, usage, capacity, percentage, status }
      })

      // Calculate energy saved vs the immediately previous reading (last cycle)
      try {
        // Fetch only the last two readings per building to compare previous vs latest
  const historyPromises = buildings.map(b => fetchReadings('electricity', b, 2))
  const histories = await Promise.all(historyPromises)

        let prevTotal = 0
        let latestTotal = 0
        let counted = 0

        const perBuildingDeltas = {}
        histories.forEach((history, idx) => {
          const bName = buildings[idx]
          if (history && history.length >= 2) {
            // Backend returns chronological order (oldest -> newest)
            const prev = Number(history[history.length - 2]?.value || 0)
            const latest = Number(history[history.length - 1]?.value || 0)
            prevTotal += prev
            latestTotal += latest
            counted++
            const capacity = capacities[bName] || 1
            const percentageLatest = Math.round((latest / capacity) * 100)
            perBuildingDeltas[bName] = {
              prev,
              latest,
              delta: latest - prev,
              pctChange: prev ? ((latest - prev) / prev) * 100 : 0,
              percentageLatest
            }
          } else if (history && history.length === 1) {
            const single = Number(history[0]?.value || 0)
            prevTotal += single
            latestTotal += single
            counted++
            const capacity = capacities[bName] || 1
            const percentageLatest = Math.round((single / capacity) * 100)
            perBuildingDeltas[bName] = {
              prev: single,
              latest: single,
              delta: 0,
              pctChange: 0,
              percentageLatest
            }
          }
        })

        // Default to totals computed from latest snapshot if we couldn't build both sums
        if (counted === 0) {
          prevTotal = total
          latestTotal = total
        }

        const savingsPercent = prevTotal > 0 
          ? Math.round(((prevTotal - latestTotal) / prevTotal) * 100)
          : 0
        const savingsTrend = latestTotal <= prevTotal ? 'down' : 'up'
        const trendValue = `${Math.abs(savingsPercent)}% ${savingsTrend === 'down' ? 'less' : 'more'}`

        setBuildingData(updatedBuildings)
        setStats({
          current: total,
          peak: Math.round(peak),
          peakSource: peakSource,
          average: Math.round(total / buildings.length),
          savings: savingsPercent,
          savingsTrend,
          trendValue
        })

        // Calculate cost and environmental impact
        const costResult = calculateCost('electricity', total)
        const co2Result = calculateCO2('electricity', total)
        const savingsResult = calculateSavings('electricity', total, savingsPercent)
        
        setCostData({
          cost: costResult.formatted,
          co2: co2Result.formatted,
          savings: savingsResult.formatted,
          savingsPercent: savingsPercent
        })

        // Generate alert for highest consumption building
        const highestConsumption = updatedBuildings.reduce((max, building) => 
          building.usage > max.usage ? building : max
        , updatedBuildings[0])
        
        const newAlerts = [{
          id: `electricity-peak-${Date.now()}`,
          type: highestConsumption.percentage >= 90 ? 'critical' : highestConsumption.percentage >= 75 ? 'warning' : 'info',
          title: '⚡ Highest Electricity Consumer',
          message: `${highestConsumption.name} is consuming the most electricity at ${highestConsumption.usage} kWh (${highestConsumption.percentage}% of capacity). ${highestConsumption.percentage >= 90 ? 'Critical level! Take immediate action.' : highestConsumption.percentage >= 75 ? 'High usage detected. Monitor closely.' : 'Usage within normal range.'}`,
          building: highestConsumption.name,
          value: highestConsumption.usage,
          unit: 'kWh',
          category: 'electricity',
          categoryColor: '#f59e0b',
          autoDismiss: true,
          duration: 10
        }]
        
        setAlerts(newAlerts)
      } catch (error) {
        console.error('Error calculating savings:', error)
        
        // Fallback calculation based on usage efficiency
        const avgUtilization = updatedBuildings.reduce((sum, b) => sum + b.percentage, 0) / updatedBuildings.length
        const fallbackSavings = avgUtilization < 60 ? 18 : avgUtilization < 75 ? 12 : 8
        
        setBuildingData(updatedBuildings)
        setStats({
          current: total,
          peak: Math.round(peak),
          peakSource: peakSource,
          average: Math.round(total / buildings.length),
          savings: fallbackSavings
        })

        // Calculate cost and environmental impact
        const costResult = calculateCost('electricity', total)
        const co2Result = calculateCO2('electricity', total)
        const savingsResult = calculateSavings('electricity', total, fallbackSavings)
        
        setCostData({
          cost: costResult.formatted,
          co2: co2Result.formatted,
          savings: savingsResult.formatted,
          savingsPercent: fallbackSavings
        })
      }

      // Update recent readings
      const readings = buildings.map(building => ({
        time: data[building]?.time || '00:00',
        value: Math.round(data[building]?.value || 0),
        building: building
      }))
      setRecentReadings(readings)
    }
  }

  const loadBuildingHistory = async (building) => {
    try {
      const history = await fetchReadings('electricity', building, 50) // Increased from 20 to 50 for more detailed graph
      console.log('Electricity history for', building, ':', history) // Debug log
      
      if (history && history.length > 0) {
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
            return {
              time: toTime(b.ts),
              value: +avg.toFixed(2),
              rawValue: avg,
              building,
              timestamp: b.ts
            }
          })

        console.log('Formatted 30-min bucketed data:', formatted) // Debug log
        setChartData(formatted)
      } else {
        console.log('No history data for', building)
        setChartData([])
      }
    } catch (error) {
      console.error('Error loading building history:', error)
      setChartData([])
    }
  }

  const tips = [
    '💡 Switch off lights when leaving rooms',
    '🌡️ Set AC temperature to 24°C for optimal efficiency',
    '🖥️ Enable power-saving mode on computers',
    '⏰ Schedule equipment usage during off-peak hours'
  ]

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Alert System */}
      <AlertSystem 
        alerts={alerts} 
        onDismiss={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
      />
      
      <div className="mb-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-2">⚡ Electricity Monitoring</h1>
          <p className="text-slate-600 dark:text-slate-400">Track and analyze electricity consumption across campus</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon="⚡"
          title="Total Usage"
          value={stats.current}
          unit="kWh"
          color="#f59e0b"
        />
        <StatCard
          icon="�"
          title="Current Cost"
          value={costData.cost}
          unit=""
          color="#3b82f6"
        />
        <StatCard
          icon="🌱"
          title="Energy Saved"
          value={stats.savings}
          unit="%"
          trend={stats.savingsTrend}
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
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Peak Demand</h3>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.peak} kWh</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            from {stats.peakSource} • Monitor high usage
          </p>
        </div>

        <div className="modern-card p-6 animate-fade-in hover-glow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl shadow-lg">
              🌍
            </div>
            <div>
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Carbon Footprint</h3>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{costData.co2}</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            0.82kg CO₂/kWh • Money saved: {costData.savings}
          </p>
        </div>
      </div>

      {/* Historical Chart */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            ⚡ Usage Trend - {selectedBuilding}
          </h2>
          <select 
            aria-label="Select building"
            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium cursor-pointer hover:border-amber-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
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
                <div className="text-6xl mb-4 animate-pulse">📊</div>
                <p className="text-xl font-semibold">No data available yet</p>
                <p className="text-sm mt-2 text-slate-400">Historical data will appear here once readings are collected</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <defs>
                  <linearGradient id="electricityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.05}/>
                  </linearGradient>
                  <filter id="electricityShadow" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dx="0" dy="2" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3"/>
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
                    value: 'Electricity Usage (kWh)', 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { fill: '#f59e0b', fontSize: 13, fontWeight: 600 } 
                  }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                    border: '2px solid #f59e0b', 
                    borderRadius: '12px',
                    color: '#f1f5f9',
                    padding: '14px 18px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                  formatter={(value) => [`${Number(value).toFixed(2)} kWh`, '⚡ Electricity']}
                  labelFormatter={(label) => `🕐 ${label}`}
                  labelStyle={{ color: '#fbbf24', fontWeight: 700, fontSize: 13, marginBottom: '8px', borderBottom: '1px solid #f59e0b', paddingBottom: '6px' }}
                  itemStyle={{ color: '#fff', fontWeight: 600, fontSize: 14 }}
                  cursor={{ stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '25px', fontSize: '13px', fontWeight: 600 }}
                  iconType="circle"
                  iconSize={10}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  fill="url(#electricityGradient)"
                  stroke="none"
                  name="Usage Range"
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#f59e0b" 
                  strokeWidth={3.5} 
                  dot={{ fill: '#fff', stroke: '#f59e0b', strokeWidth: 2.5, r: 4.5 }}
                  activeDot={{ r: 7, fill: '#f59e0b', stroke: '#fff', strokeWidth: 3, filter: 'url(#electricityShadow)' }}
                  name="⚡ Electricity Usage (kWh)"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Building Usage */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Building-wise Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {buildingData.map((building) => (
            <div key={building.name} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-amber-500 hover:scale-[1.02]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{building.name}</h3>
                <span className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  building.status === 'normal' 
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-orange-100 dark:bg-amber-900 text-orange-700 dark:text-amber-300'
                }`}>
                  {building.status === 'normal' ? '✓ Normal' : '⚠ High'}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                {building.usage} <span className="text-lg font-medium text-slate-500 dark:text-slate-400">/ {building.capacity} kWh</span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    building.status === 'normal' 
                      ? 'bg-linear-to-r from-green-400 to-emerald-500' 
                      : 'bg-linear-to-r from-amber-400 to-orange-500'
                  }`}
                  style={{ width: `${building.percentage}%` }}
                ></div>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{building.percentage}% of capacity</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Readings */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Recent Readings</h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            {recentReadings.map((reading, index) => (
              <div key={index} className={`flex justify-between items-center px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${index !== recentReadings.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{reading.time}</div>
                <div className="text-base font-medium text-slate-700 dark:text-slate-300">{reading.building}</div>
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{reading.value} kWh</div>
              </div>
            ))}
          </div>
        </div>

        {/* Energy Saving Tips */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Energy Saving Tips</h2>
          <div className="space-y-3">
            {tips.map((tip, index) => (
              <div key={index} className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg px-5 py-4 text-slate-700 dark:text-slate-300 font-medium hover:shadow-md transition-shadow duration-200">
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Electricity
