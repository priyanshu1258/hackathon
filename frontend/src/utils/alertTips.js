// Friendly tips and actionable suggestions for different alert types
// Helps users understand what actions they can take

export const alertTips = {
  electricity: {
    critical: [
      "Turn off unused lights and equipment immediately",
      "Switch to energy-saving mode on all devices",
      "Defer high-power tasks like laundry or charging",
      "Check for equipment left running unnecessarily"
    ],
    warning: [
      "Consider reducing AC/heating by 2°C",
      "Unplug devices not in use (phantom power drain)",
      "Use natural light where possible",
      "Schedule heavy tasks for off-peak hours"
    ],
    success: [
      "Keep up the great habits! 🌟",
      "Share your energy-saving tips with others",
      "You're contributing to a sustainable campus",
      "Small actions = Big impact!"
    ]
  },
  water: {
    critical: [
      "Check for leaks in faucets and toilets",
      "Take shorter showers (5 minutes or less)",
      "Turn off taps while brushing teeth/soaping",
      "Report any running water immediately"
    ],
    warning: [
      "Use full loads for washing machines/dishwashers",
      "Consider a bucket while showering (catch water)",
      "Fix dripping taps - 1 drip/sec = 3000L/year!",
      "Use water-efficient fixtures when available"
    ],
    success: [
      "You're a water conservation champion! 💧",
      "Your efforts are preserving precious resources",
      "Keep inspiring others with your actions",
      "Every drop saved makes a difference!"
    ]
  },
  food: {
    critical: [
      "Review portion sizes - serve smaller amounts first",
      "Check food storage temperatures",
      "Donate extra food to local organizations",
      "Start a composting program for unavoidable waste"
    ],
    warning: [
      "Plan meals better to reduce over-preparation",
      "Use 'first in, first out' for perishables",
      "Get creative with leftovers",
      "Educate diners about taking only what they'll eat"
    ],
    success: [
      "Incredible waste reduction! 🎉",
      "You're helping fight hunger and climate change",
      "Your kitchen management is world-class",
      "Keep setting the standard for others!"
    ]
  }
}

// Get a random tip for a specific category and alert type
export const getRandomTip = (category, type) => {
  const categoryTips = alertTips[category]
  if (!categoryTips) return null

  const typeTips = categoryTips[type]
  if (!typeTips || typeTips.length === 0) return null

  return typeTips[Math.floor(Math.random() * typeTips.length)]
}

// Get all tips for a category and type
export const getTips = (category, type) => {
  return alertTips[category]?.[type] || []
}

// Fun motivational messages for achievements
export const motivationalMessages = [
  "You're a sustainability superstar! ⭐",
  "Small changes, massive impact! 🌍",
  "Together we're building a better future! 🌱",
  "Your actions inspire others! ✨",
  "Proof that every effort counts! 💪",
  "You're making campus greener every day! 🌿",
  "Champions are made of actions like yours! 🏆",
  "Keep the momentum going! 🚀",
  "You're part of the solution! 💡",
  "Sustainability hero detected! 🦸"
]

export const getMotivationalMessage = () => {
  return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
}

// Convert alert severity to friendly user guidance
export const getFriendlyGuidance = (type) => {
  switch (type) {
    case 'critical':
      return {
        tone: 'urgent but supportive',
        prefix: '🚨 Quick Action Needed:',
        suffix: 'We can fix this together!'
      }
    case 'warning':
      return {
        tone: 'gentle reminder',
        prefix: '💡 Friendly Reminder:',
        suffix: 'Small steps make big differences!'
      }
    case 'success':
      return {
        tone: 'celebratory',
        prefix: '🌟 Awesome Job:',
        suffix: 'Keep up the fantastic work!'
      }
    case 'achievement':
      return {
        tone: 'highly celebratory',
        prefix: '🎉 Amazing Achievement:',
        suffix: 'You\'re making history!'
      }
    case 'info':
      return {
        tone: 'informative',
        prefix: 'ℹ️ Good to Know:',
        suffix: 'Knowledge is power!'
      }
    default:
      return {
        tone: 'neutral',
        prefix: '📢 Update:',
        suffix: 'Thank you for being aware!'
      }
  }
}
