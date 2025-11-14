// Ambient sound service using Web Audio API for generating pleasant ambient sounds
import { CloudRain, Trees, Waves, Coffee, Flame, VolumeX } from 'lucide-react';

export const SOUND_OPTIONS = [
  {
    id: 'rain',
    name: 'Rain',
    description: 'Gentle rain sounds',
    icon: CloudRain,
    color: '#93C5FD',
    theme: 'rain',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Nature sounds',
    icon: Trees,
    color: '#4ADE80',
    theme: 'forest',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Waves and water',
    icon: Waves,
    color: '#38BDF8',
    theme: 'ocean',
  },
  {
    id: 'coffee',
    name: 'Coffee Shop',
    description: 'Ambient cafe sounds',
    icon: Coffee,
    color: '#A78B5B',
    theme: 'coffee',
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    description: 'Crackling fire',
    icon: Flame,
    color: '#FB923C',
    theme: 'fireplace',
  },
  {
    id: 'silence',
    name: 'Silence',
    description: 'No ambient sound',
    icon: VolumeX,
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
    this.intervals = []; // Store intervals for cleanup
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

  // Generate white noise buffer
  generateNoiseBuffer(audioContext, duration = 2) {
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = Math.random() * 2 - 1; // White noise
    }
    
    return buffer;
  }

  generateRainSound(audioContext) {
    const sources = [];
    const masterGain = audioContext.createGain();
    masterGain.gain.value = this.volume * 0.3;
    
    // Create multiple rain layers using filtered noise
    for (let i = 0; i < 6; i++) {
      const noiseBuffer = this.generateNoiseBuffer(audioContext, 2);
      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      
      // Low-pass filter for rain-like sound
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800 + Math.random() * 400; // 800-1200 Hz
      filter.Q.value = 1;
      
      // Gain with gentle envelope
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.04, audioContext.currentTime + 0.5);
      
      // Slight variation in timing
      noiseSource.start(audioContext.currentTime + Math.random() * 0.3);
      
      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      sources.push({ osc: noiseSource, gain, filter });
    }
    
    return { sources, masterGain };
  }

  generateForestSound(audioContext) {
    const sources = [];
    const masterGain = audioContext.createGain();
    masterGain.gain.value = this.volume * 0.25;
    
    // Very low, soft tones for forest ambience
    for (let i = 0; i < 3; i++) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      // Very low frequencies (40-80 Hz) for deep forest sound
      osc.frequency.value = 40 + i * 15 + Math.random() * 10;
      osc.type = 'sine'; // Pure sine for smooth sound
      
      // Gentle low-pass filter
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      filter.Q.value = 0.5;
      
      // Very soft gain
      gain.gain.value = 0.08 + Math.random() * 0.04;
      
      // Slow, gentle LFO for natural variation
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      lfo.frequency.value = 0.05 + Math.random() * 0.05; // Very slow
      lfo.type = 'sine';
      lfoGain.gain.value = 5; // Small frequency variation
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      osc.start(audioContext.currentTime + Math.random() * 0.5);
      lfo.start(audioContext.currentTime);
      
      sources.push({ osc, lfo, gain, filter });
    }
    
    return { sources, masterGain };
  }

  generateOceanSound(audioContext) {
    const sources = [];
    const masterGain = audioContext.createGain();
    masterGain.gain.value = this.volume * 0.3;
    
    // Ocean waves using filtered noise with slow modulation
    for (let i = 0; i < 4; i++) {
      const noiseBuffer = this.generateNoiseBuffer(audioContext, 2);
      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      
      // Low-pass filter
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600 + Math.random() * 200;
      filter.Q.value = 1;
      
      // LFO for wave-like modulation
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      lfo.frequency.value = 0.08 + i * 0.03; // Slow wave frequency
      lfo.type = 'sine';
      lfoGain.gain.value = 200; // Modulate filter frequency
      
      // Gain with wave envelope
      const gain = audioContext.createGain();
      gain.gain.value = 0.1 + Math.random() * 0.05;
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      noiseSource.start(audioContext.currentTime + Math.random() * 0.2);
      lfo.start(audioContext.currentTime);
      
      sources.push({ osc: noiseSource, lfo, gain, filter });
    }
    
    return { sources, masterGain };
  }

  generateCoffeeSound(audioContext) {
    const sources = [];
    const masterGain = audioContext.createGain();
    masterGain.gain.value = this.volume * 0.2;
    
    // Warm, soft tones for coffee shop ambience
    for (let i = 0; i < 4; i++) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      // Mid-range frequencies (150-300 Hz) for warmth
      osc.frequency.value = 150 + i * 30 + Math.random() * 20;
      osc.type = 'triangle'; // Softer than square
      
      // Gentle low-pass for warmth
      filter.type = 'lowpass';
      filter.frequency.value = 1500 + Math.random() * 500;
      filter.Q.value = 0.7;
      
      // Very soft gain
      gain.gain.value = 0.06 + Math.random() * 0.03;
      
      // Slow, gentle modulation
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      lfo.frequency.value = 0.1 + Math.random() * 0.1;
      lfo.type = 'sine';
      lfoGain.gain.value = 10; // Small variation
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      osc.start(audioContext.currentTime + Math.random() * 0.4);
      lfo.start(audioContext.currentTime);
      
      sources.push({ osc, lfo, gain, filter });
    }
    
    return { sources, masterGain };
  }

  generateFireplaceSound(audioContext) {
    const sources = [];
    const masterGain = audioContext.createGain();
    masterGain.gain.value = this.volume * 0.3; // Increased but still pleasant
    
    // Soft low rumble for fire warmth (main sound)
    for (let i = 0; i < 3; i++) {
      const rumble = audioContext.createOscillator();
      const rumbleGain = audioContext.createGain();
      const rumbleFilter = audioContext.createBiquadFilter();
      
      // Very low frequencies for warmth
      rumble.frequency.value = 40 + i * 10 + Math.random() * 5;
      rumble.type = 'sine'; // Pure sine for smoothness
      
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.value = 120; // Slightly higher for more presence
      rumbleFilter.Q.value = 0.3; // Gentle filter
      
      // Reduced rumble gain
      rumbleGain.gain.value = 0.06 + Math.random() * 0.02;
      
      // Gentle slow modulation
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      lfo.frequency.value = 0.05 + Math.random() * 0.03; // Very slow
      lfo.type = 'sine';
      lfoGain.gain.value = 3; // Tiny frequency variation
      
      lfo.connect(lfoGain);
      lfoGain.connect(rumble.frequency);
      rumble.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(masterGain);
      
      rumble.start(audioContext.currentTime + Math.random() * 0.3);
      lfo.start(audioContext.currentTime);
      
      sources.push({ osc: rumble, lfo, gain: rumbleGain, filter: rumbleFilter });
    }
    
    // Soft crackling using heavily filtered noise
    const noiseBuffer = this.generateNoiseBuffer(audioContext, 2);
    const crackleNoise = audioContext.createBufferSource();
    crackleNoise.buffer = noiseBuffer;
    crackleNoise.loop = true;
    
    // Low-pass filter to remove harsh high frequencies but keep some texture
    const crackleFilter = audioContext.createBiquadFilter();
    crackleFilter.type = 'lowpass';
    crackleFilter.frequency.value = 1200; // Higher than before but still filtered
    crackleFilter.Q.value = 0.5; // Gentle
    
    // Increased gain but still soft
    const crackleGain = audioContext.createGain();
    crackleGain.gain.value = 0.08; // Louder but still pleasant
    
    crackleNoise.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(masterGain);
    crackleNoise.start(audioContext.currentTime);
    
    sources.push({ osc: crackleNoise, gain: crackleGain, filter: crackleFilter });
    
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
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    
    if (this.currentSources && this.currentSources.length > 0) {
      this.currentSources.forEach(({ osc, lfo }) => {
        try {
          if (osc) {
            if (osc.stop) {
              osc.stop();
            } else if (osc.stopNode) {
              osc.stopNode(0);
            }
          }
          if (lfo) {
            if (lfo.stop) {
              lfo.stop();
            } else if (lfo.stopNode) {
              lfo.stopNode(0);
            }
          }
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
      // Apply volume multipliers based on sound type
      const multipliers = {
        'rain': 0.3,
        'forest': 0.25,
        'ocean': 0.3,
        'coffee': 0.2,
        'fireplace': 0.3
      };
      const multiplier = multipliers[this.currentSound?.id] || 0.3;
      this.currentGain.gain.value = this.volume * multiplier;
    }
  }

  getCurrentSound() {
    return this.currentSound;
  }
}

export const ambientSoundService = new AmbientSoundService();
export default ambientSoundService;
