// Demo component to showcase all alert types
// Import this in Dashboard to test alerts

export const demoAlerts = [
  {
    id: 'demo-critical-1',
    type: 'critical',
    title: '⚡ Power Alert',
    message: 'Cafeteria is running at 95% capacity! Let\'s reduce load to prevent issues.',
    building: 'Cafeteria',
    value: 238,
    unit: 'kWh',
    category: 'electricity',
    autoDismiss: false,
    action: {
      label: 'View Details',
      onClick: () => console.log('Navigate to Electricity page')
    }
  },
  {
    id: 'demo-warning-1',
    type: 'warning',
    title: '💦 Water Usage High',
    message: 'Hostel-A is at 105% of target. Small changes can make a big impact!',
    building: 'Hostel-A',
    value: 2310,
    unit: 'L',
    category: 'water',
    autoDismiss: true,
    duration: 8
  },
  {
    id: 'demo-success-1',
    type: 'success',
    title: '🌟 Excellent Work',
    message: 'Library is running super efficiently at 55%! You\'re making a real difference!',
    building: 'Library',
    category: 'electricity',
    autoDismiss: true,
    duration: 6
  },
  {
    id: 'demo-achievement-1',
    type: 'achievement',
    title: '🎉 Zero Waste Hero',
    message: 'Incredible! Only 16.5kg wasted in Cafeteria. You\'re a sustainability champion!',
    building: 'Cafeteria',
    value: 16.5,
    unit: 'kg',
    category: 'food',
    autoDismiss: true,
    duration: 7
  },
  {
    id: 'demo-info-1',
    type: 'info',
    title: '⏰ Peak Hours Notice',
    message: 'We\'re in peak usage time! Every little bit helps - consider delaying heavy tasks if possible.',
    category: 'general',
    autoDismiss: true,
    duration: 10
  },
  {
    id: 'demo-achievement-2',
    type: 'achievement',
    title: '🏆 Campus Achievement Unlocked',
    message: 'Incredible! Campus saved 22% on electricity this week. Together we\'re changing the world!',
    category: 'electricity',
    autoDismiss: true,
    duration: 10
  }
]

// Function to trigger demo alerts one by one
export const triggerDemoAlerts = (setAlerts) => {
  demoAlerts.forEach((alert, index) => {
    setTimeout(() => {
      setAlerts(prev => [...prev, alert])
    }, index * 2000) // 2 seconds between each alert
  })
}

// Function to trigger a specific alert type for testing
export const triggerTestAlert = (type, setAlerts) => {
  const alert = demoAlerts.find(a => a.type === type)
  if (alert) {
    setAlerts(prev => [...prev, { ...alert, id: `${alert.id}-${Date.now()}` }])
  }
}
