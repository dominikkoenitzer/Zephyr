// Achievement sound service for focus timer completions

class AchievementSoundService {
  constructor() {
    this.audioContext = null;
  }

  async init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.error('Failed to resume audio context:', error);
        throw error;
      }
    }
    
    return this.audioContext;
  }

  async playAchievementSound() {
    try {
      const context = await this.init();
      
      // Create a pleasant achievement sound using multiple oscillators
      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0.3, context.currentTime);
      masterGain.connect(context.destination);

      // Main success tone (ascending)
      const osc1 = context.createOscillator();
      const gain1 = context.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, context.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, context.currentTime + 0.15); // C6
      gain1.gain.setValueAtTime(0.4, context.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(context.currentTime);
      osc1.stop(context.currentTime + 0.3);

      // Harmony tone (higher)
      const osc2 = context.createOscillator();
      const gain2 = context.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, context.currentTime); // E5
      osc2.frequency.exponentialRampToValueAtTime(1318.51, context.currentTime + 0.15); // E6
      gain2.gain.setValueAtTime(0.3, context.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(context.currentTime + 0.05);
      osc2.stop(context.currentTime + 0.35);

      // Final chime (sustained)
      const osc3 = context.createOscillator();
      const gain3 = context.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(783.99, context.currentTime + 0.2); // G5
      gain3.gain.setValueAtTime(0, context.currentTime + 0.2);
      gain3.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.25);
      gain3.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.6);
      osc3.connect(gain3);
      gain3.connect(masterGain);
      osc3.start(context.currentTime + 0.2);
      osc3.stop(context.currentTime + 0.6);

      // Low frequency "whoosh" for impact
      const osc4 = context.createOscillator();
      const gain4 = context.createGain();
      const filter4 = context.createBiquadFilter();
      osc4.type = 'sawtooth';
      osc4.frequency.setValueAtTime(100, context.currentTime);
      osc4.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.1);
      filter4.type = 'lowpass';
      filter4.frequency.value = 800;
      gain4.gain.setValueAtTime(0.2, context.currentTime);
      gain4.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
      osc4.connect(filter4);
      filter4.connect(gain4);
      gain4.connect(masterGain);
      osc4.start(context.currentTime);
      osc4.stop(context.currentTime + 0.2);

    } catch (error) {
      console.error('Error playing achievement sound:', error);
    }
  }
}

export const achievementSoundService = new AchievementSoundService();
export default achievementSoundService;

