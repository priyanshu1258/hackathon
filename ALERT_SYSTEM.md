# 🚨 Alert System Documentation

## Overview
The Alert System is a real-time notification component designed to motivate behavioral change and resource reduction by providing instant feedback on campus resource usage patterns.

## Features

### ✨ Visual Effects
- **Smooth Animations**: Spring-based animations using Framer Motion
- **Auto-dismiss Progress Bar**: Visual countdown for timed alerts
- **Pulse Effects**: Critical alerts pulse and shake to grab attention
- **Gradient Backgrounds**: Color-coded by severity/type
- **Backdrop Blur**: Modern glass-morphism design
- **Shimmer Effect**: Animated shine across alerts

### 🎨 Alert Types

#### 1. **Critical Alerts** 🚨
- **Color**: Red gradient
- **Behavior**: Does NOT auto-dismiss, pulse animation
- **Triggers**:
  - Electricity usage > 90% capacity
  - Water usage > 110% of target
  - Food waste > 35kg (cafeteria)

#### 2. **Warning Alerts** ⚠️
- **Color**: Orange/Amber gradient
- **Behavior**: Auto-dismiss after 8 seconds
- **Triggers**:
  - Electricity usage > 75% capacity
  - Water usage > 95% of target
  - Food waste > 28kg (cafeteria)
  - Usage spike >20-30% above average

#### 3. **Success Alerts** ✅
- **Color**: Green/Emerald gradient
- **Behavior**: Auto-dismiss after 6 seconds
- **Triggers**:
  - Electricity usage < 60% capacity (excellent efficiency)
  - Water usage < 70% of target (excellent conservation)
  - Low resource consumption achievements

#### 4. **Achievement Alerts** 🎉
- **Color**: Purple/Pink gradient
- **Behavior**: Auto-dismiss after 7 seconds
- **Triggers**:
  - Food waste < 18kg (outstanding management)
  - Campus-wide savings > 20%
  - Meeting reduction goals

#### 5. **Info Alerts** ℹ️
- **Color**: Blue/Cyan gradient
- **Behavior**: Auto-dismiss after 6-15 seconds
- **Triggers**:
  - Peak usage updates
  - Time-based reminders (peak hours, off-peak periods)
  - Weekly summaries

## Alert Logic

### Electricity Monitoring
```javascript
// Critical: > 90% capacity
// Warning: > 75% capacity
// Success: < 60% capacity
// Spike Detection: > 20% increase from average
```

### Water Monitoring
```javascript
// Critical: > 110% of target
// Warning: > 95% of target
// Success: < 70% of target
// Spike Detection: > 25% increase from average
```

### Food Waste Monitoring
```javascript
// Critical (Cafeteria): > 35kg
// Warning (Cafeteria): > 28kg
// Achievement (Cafeteria): < 18kg
// Spike Detection: > 30% increase from average
```

## Implementation

### Component Structure
```
src/
├── components/
│   └── AlertSystem.jsx          # Main alert display component
├── utils/
│   └── alertLogic.js            # Alert generation logic
└── pages/
    ├── Electricity.jsx          # Integrated with alerts
    ├── Water.jsx                # Integrated with alerts
    └── FoodWaste.jsx            # Integrated with alerts
```

### Usage Example
```jsx
import AlertSystem from '../components/AlertSystem'
import { generateAlerts } from '../utils/alertLogic'

function MyPage() {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    // Generate alerts when data changes
    const newAlerts = generateAlerts('electricity', buildingData, stats)
    setAlerts(newAlerts)
  }, [buildingData])

  return (
    <div>
      <AlertSystem 
        alerts={alerts} 
        onDismiss={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
      />
      {/* Your page content */}
    </div>
  )
}
```

## Alert Data Structure
```javascript
{
  id: 'unique-identifier',
  type: 'critical' | 'warning' | 'success' | 'achievement' | 'info',
  title: 'Alert Title',
  message: 'Detailed message',
  building: 'Building Name' (optional),
  value: 123 (optional),
  unit: 'kWh' | 'L' | 'kg' (optional),
  category: 'electricity' | 'water' | 'food',
  autoDismiss: true | false,
  duration: 5-15, // seconds
  action: { // optional
    label: 'Button Text',
    onClick: () => {}
  }
}
```

## Behavioral Change Strategies

### 1. **Immediate Feedback**
- Alerts appear within seconds of threshold breach
- Real-time validation of actions taken

### 2. **Visual Hierarchy**
- Critical alerts demand immediate attention
- Success alerts reinforce positive behavior
- Info alerts educate without overwhelming

### 3. **Actionable Insights**
- Specific building identification
- Exact values shown
- Optional action buttons for detailed views

### 4. **Positive Reinforcement**
- Celebrate efficiency achievements
- Highlight campus-wide successes
- Show reduction progress

### 5. **Social Proof**
- Building-specific alerts create peer pressure
- Campus-wide achievements build community pride
- Comparative feedback motivates improvement

## Time-Based Alerts

### Peak Hours (12-2 PM, 6-8 PM)
```
ℹ️ Peak Hours
This is a peak usage period. Consider deferring non-essential tasks.
```

### Off-Peak Period (11 PM - 6 AM)
```
ℹ️ Off-Peak Period
Great time for energy-intensive tasks at lower rates!
```

### Weekly Summary
```
📊 Weekly Summary
This week: 15% resources saved, 3 goals met!
```

## Anomaly Detection

The system automatically detects unusual spikes:
- Compares current usage with historical average
- Triggers warning if spike > threshold (20-30%)
- Provides investigation button for detailed analysis

## Customization

### Adjusting Thresholds
Edit `src/utils/alertLogic.js`:
```javascript
const thresholds = {
  electricity: {
    critical: 90,  // % of capacity
    warning: 75,
    efficiency: 60,
    spike: 20      // % increase
  },
  // ... customize as needed
}
```

### Adding New Alert Types
1. Add style in `AlertSystem.jsx`:
```javascript
case 'custom':
  return {
    bg: 'bg-gradient-to-r from-color1 to-color2',
    icon: '🎯',
    border: 'border-color',
    shadow: 'shadow-color/50'
  }
```

2. Add logic in `alertLogic.js`:
```javascript
if (customCondition) {
  alerts.push({
    id: `custom-${timestamp}`,
    type: 'custom',
    title: 'Custom Alert',
    message: 'Custom message',
    // ... other fields
  })
}
```

## Dependencies
- **framer-motion**: ^11.x - For smooth animations
- **React**: ^18.x - Component framework
- **Recharts**: ^2.x - For data visualization (context)

## Performance Considerations
- Alerts are generated only when data changes
- Auto-dismiss prevents alert accumulation
- Maximum 5 visible alerts recommended
- Animations optimized with GPU acceleration

## Future Enhancements
- [ ] Push notifications for critical alerts
- [ ] Email summaries for weekly achievements
- [ ] Sound effects for different alert types
- [ ] User preferences for alert frequency
- [ ] Historical alert log/archive
- [ ] Machine learning for predictive alerts

## Testing Scenarios

### Test Critical Alert
Set electricity usage to 95% capacity:
```javascript
setBuildingData([{ name: 'Test', usage: 190, capacity: 200, percentage: 95 }])
```

### Test Achievement Alert
Set food waste below threshold:
```javascript
setBuildingData([{ name: 'Cafeteria', food: 15 }]) // < 18kg triggers achievement
```

### Test Spike Detection
Simulate sudden usage increase:
```javascript
// Historical average: 100 kWh
// Current value: 130 kWh
// Spike: 30% → Triggers warning
```

## Troubleshooting

### Alerts Not Appearing
- Check if `generateAlerts()` is called after data updates
- Verify alert state is initialized: `const [alerts, setAlerts] = useState([])`
- Ensure AlertSystem component is rendered

### Alerts Not Auto-Dismissing
- Verify `autoDismiss: true` in alert object
- Check `duration` property is set (default: 5 seconds)
- Ensure Framer Motion is installed

### Animation Issues
- Install framer-motion: `npm install framer-motion`
- Check for CSS conflicts with `fixed` positioning
- Verify z-index (default: 50) isn't overridden

## Contributing
When adding new alert types:
1. Update thresholds in `alertLogic.js`
2. Add visual style in `AlertSystem.jsx`
3. Document the new type in this file
4. Test with realistic data scenarios

---

**Last Updated**: November 7, 2025
**Version**: 1.0.0
**Maintainer**: Campus Resource Monitoring Team
