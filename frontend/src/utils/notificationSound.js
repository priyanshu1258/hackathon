// Friendly notification sound system using Web Audio API
// Creates pleasant, non-intrusive notification sounds

class NotificationSound {
  constructor() {
    this.audioContext = null
    this.enabled = true
    this.volume = 0.3 // Keep it subtle (30% volume)
  }

  // Initialize audio context (required for most browsers)
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
  }

  // Play a pleasant notification sound based on alert type
  play(type = 'info') {
    if (!this.enabled) return

    try {
      this.init()

      const now = this.audioContext.currentTime
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Different sounds for different alert types
      switch (type) {
        case 'critical':
          // Urgent but not harsh: quick descending tone
          oscillator.frequency.setValueAtTime(800, now)
          oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1)
          gainNode.gain.setValueAtTime(this.volume, now)
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
          oscillator.start(now)
          oscillator.stop(now + 0.15)
          break

        case 'warning':
          // Gentle reminder: soft double beep
          oscillator.frequency.setValueAtTime(600, now)
          gainNode.gain.setValueAtTime(this.volume * 0.8, now)
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
          oscillator.start(now)
          oscillator.stop(now + 0.08)
          
          // Second beep
          setTimeout(() => {
            const osc2 = this.audioContext.createOscillator()
            const gain2 = this.audioContext.createGain()
            osc2.connect(gain2)
            gain2.connect(this.audioContext.destination)
            const t = this.audioContext.currentTime
            osc2.frequency.setValueAtTime(650, t)
            gain2.gain.setValueAtTime(this.volume * 0.8, t)
            gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.08)
            osc2.start(t)
            osc2.stop(t + 0.08)
          }, 100)
          break

        case 'success':
          // Cheerful ascending tone
          oscillator.frequency.setValueAtTime(500, now)
          oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.15)
          gainNode.gain.setValueAtTime(this.volume * 0.7, now)
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
          oscillator.start(now)
          oscillator.stop(now + 0.2)
          break

        case 'achievement':
          // Celebratory: three ascending notes
          const notes = [
            { freq: 523, time: 0 },      // C5
            { freq: 659, time: 0.08 },   // E5
            { freq: 784, time: 0.16 }    // G5
          ]
          
          notes.forEach(note => {
            setTimeout(() => {
              const osc = this.audioContext.createOscillator()
              const gain = this.audioContext.createGain()
              osc.connect(gain)
              gain.connect(this.audioContext.destination)
              const t = this.audioContext.currentTime
              osc.frequency.setValueAtTime(note.freq, t)
              gain.gain.setValueAtTime(this.volume * 0.6, t)
              gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12)
              osc.start(t)
              osc.stop(t + 0.12)
            }, note.time * 1000)
          })
          break

        case 'info':
        default:
          // Gentle single tone
          oscillator.frequency.setValueAtTime(550, now)
          gainNode.gain.setValueAtTime(this.volume * 0.5, now)
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
          oscillator.start(now)
          oscillator.stop(now + 0.1)
          break
      }
    } catch (error) {
      // Silently fail if audio not supported
      console.debug('Notification sound not available:', error)
    }
  }

  // Toggle sound on/off
  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }

  // Set volume (0.0 to 1.0)
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol))
  }

  // Check if audio is supported
  isSupported() {
    return !!(window.AudioContext || window.webkitAudioContext)
  }
}

// Create singleton instance
const notificationSound = new NotificationSound()

export default notificationSound
