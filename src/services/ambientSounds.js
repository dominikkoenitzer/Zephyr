// Ambient sound service using Web Audio API for generating pleasant ambient sounds

export const SOUND_OPTIONS = [
  {
    id: 'rain',
    name: 'Rain',
    description: 'Gentle rain sounds',
    icon: '🌧️',
    color: '#4A90E2',
    theme: 'rain',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Nature sounds',
    icon: '🌲',
    color: '#2D5016',
    theme: 'forest',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Waves and water',
    icon: '🌊',
    color: '#1E88E5',
    theme: 'ocean',
  },
  {
    id: 'coffee',
    name: 'Coffee Shop',
    description: 'Ambient cafe sounds',
    icon: '☕',
    color: '#6F4E37',
    theme: 'coffee',
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    description: 'Crackling fire',
    icon: '🔥',
    color: '#FF6B35',
    theme: 'fireplace',
  },
  {
    id: 'silence',
    name: 'Silence',
    description: 'No ambient sound',
    icon: '🔇',
    color: '#9E9E9E',
    theme: 'default',
  }
];

class AmbientSoundService {
  constructor() {
    this.audioContext = null;
    this.currentSources = [];
    this.currentGain = null;
    this.currentSound = null;
    this.isPlaying = false;
    this.volume = 0.5;
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

  generateRainSound(audioContext) {
    const sources = [];
    const masterGain = audioContext.createGain();
    masterGain.gain.value = this.volume * 0.4;
    
    // Multiple oscillators for rain-like sound
    for (let i = 0; i < 8; i++) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      // Random frequencies in the rain range
      osc.frequency.value = 200 + Math.random() * 300;
      osc.type = 'sawtooth';
      
      filter.type = 'lowpass';
      filter.frequency.value = 2000 + Math.random() * 1000;
      filter.Q.value = 1;
      
      // Envelope for natural variation
      gain.gain.setValueAtTime(0, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.1 + Math.random() * 0.1, audioContext.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.05, audioContext.currentTime + 0.5);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      osc.start(audioContext.currentTime + Math.random() * 0.5);
      sources.push({ osc, gain });
    }
    
    return { sources, masterGain };
  }

  generateForestSound(audioContext) {
    const sources = [];
    const masterGain = audioContext.createGain();
    masterGain.gain.value = this.volume * 0.3;
    
    // Low frequency nature tones
    for (let i = 0; i < 4; i++) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      osc.frequency.value = 80 + Math.random() * 40;
      osc.type = 'sine';
      
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      filter.Q.value = 0.5;
      
      gain.gain.value = 0.15;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      osc.start(audioContext.currentTime);
      sources.push({ osc, gain });
    }
    
    return { sources, masterGain };
  }

  generateOceanSound(audioContext) {
    const sources = [];
    const masterGain = audioContext.createGain();
    masterGain.gain.value = this.volume * 0.35;
    
    // Wave-like oscillating tones
    for (let i = 0; i < 3; i++) {
      const osc = audioContext.createOscillator();
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      osc.frequency.value = 100 + i * 50;
      osc.type = 'sine';
      
      lfo.frequency.value = 0.1 + i * 0.05; // Slow wave modulation
      lfo.type = 'sine';
      lfoGain.gain.value = 20; // Frequency modulation amount
      
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 1;
      
      gain.gain.value = 0.2;
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      osc.start(audioContext.currentTime);
      lfo.start(audioContext.currentTime);
      sources.push({ osc, lfo, gain });
    }
    
    return { sources, masterGain };
  }

  generateCoffeeSound(audioContext) {
    const sources = [];
    const masterGain = audioContext.createGain();
    masterGain.gain.value = this.volume * 0.25;
    
    // Soft ambient tones
    for (let i = 0; i < 5; i++) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      osc.frequency.value = 200 + Math.random() * 200;
      osc.type = 'triangle';
      
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 0.7;
      
      gain.gain.value = 0.1;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      osc.start(audioContext.currentTime + Math.random() * 0.3);
      sources.push({ osc, gain });
    }
    
    return { sources, masterGain };
  }

  generateFireplaceSound(audioContext) {
    const sources = [];
    const masterGain = audioContext.createGain();
    masterGain.gain.value = this.volume * 0.3;
    
    // Crackling-like sounds with rapid variations
    for (let i = 0; i < 6; i++) {
      const osc = audioContext.createOscillator();
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      osc.frequency.value = 400 + Math.random() * 300;
      osc.type = 'square';
      
      lfo.frequency.value = 5 + Math.random() * 10; // Fast modulation for crackling
      lfo.type = 'sawtooth';
      lfoGain.gain.value = 100;
      
      filter.type = 'bandpass';
      filter.frequency.value = 1000 + Math.random() * 500;
      filter.Q.value = 2;
      
      gain.gain.value = 0.12;
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      osc.start(audioContext.currentTime + Math.random() * 0.2);
      lfo.start(audioContext.currentTime);
      sources.push({ osc, lfo, gain });
    }
    
    return { sources, masterGain };
  }

  async playSound(soundId) {
    try {
      await this.init();
      
      this.stop();
      
      if (soundId === 'silence') {
        return;
      }
      
      let soundGen;
      switch(soundId) {
        case 'rain':
          soundGen = this.generateRainSound(this.audioContext);
          break;
        case 'forest':
          soundGen = this.generateForestSound(this.audioContext);
          break;
        case 'ocean':
          soundGen = this.generateOceanSound(this.audioContext);
          break;
        case 'coffee':
          soundGen = this.generateCoffeeSound(this.audioContext);
          break;
        case 'fireplace':
          soundGen = this.generateFireplaceSound(this.audioContext);
          break;
        default:
          return;
      }
      
      this.currentSources = soundGen.sources;
      this.currentGain = soundGen.masterGain;
      this.currentSound = SOUND_OPTIONS.find(s => s.id === soundId);
      this.currentGain.connect(this.audioContext.destination);
      this.isPlaying = true;
      
      console.log('Playing ambient sound:', soundId);
    } catch (error) {
      console.error('Error playing sound:', error);
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
          setTimeout(() => this.playSound(soundId), 100);
        } catch (retryError) {
          console.error('Failed to resume and retry:', retryError);
        }
      }
    }
  }

  stop() {
    if (this.currentSources && this.currentSources.length > 0) {
      this.currentSources.forEach(({ osc, lfo }) => {
        try {
          if (osc) osc.stop();
          if (lfo) lfo.stop();
        } catch (error) {
          // Already stopped
        }
      });
      this.currentSources = [];
    }
    
    if (this.currentGain) {
      try {
        this.currentGain.disconnect();
      } catch (error) {
        // Already disconnected
      }
      this.currentGain = null;
    }
    
    this.isPlaying = false;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentGain) {
      this.currentGain.gain.value = this.volume * (this.currentSound?.id === 'rain' ? 0.4 : 
                                                    this.currentSound?.id === 'forest' ? 0.3 :
                                                    this.currentSound?.id === 'ocean' ? 0.35 :
                                                    this.currentSound?.id === 'coffee' ? 0.25 : 0.3);
    }
  }

  getCurrentSound() {
    return this.currentSound;
  }
}

export const ambientSoundService = new AmbientSoundService();
export default ambientSoundService;
