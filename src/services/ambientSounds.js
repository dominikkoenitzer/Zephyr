// Ambient sound service using Web Audio API for generating sounds
// These are simple generated sounds - in production, you'd use actual audio files

export const SOUND_OPTIONS = [
  {
    id: 'rain',
    name: 'Rain',
    description: 'Gentle rain sounds',
    icon: '🌧️',
    color: '#4A90E2',
    theme: 'rain',
    generateSound: (audioContext) => {
      // Generate rain-like white noise
      const bufferSize = audioContext.sampleRate * 2;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.1;
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;
      
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.3;
      
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      return { source, gainNode };
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Nature sounds',
    icon: '🌲',
    color: '#2D5016',
    theme: 'forest',
    generateSound: (audioContext) => {
      // Generate forest-like ambient noise
      const bufferSize = audioContext.sampleRate * 2;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.08;
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.25;
      
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      return { source, gainNode };
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Waves and water',
    icon: '🌊',
    color: '#1E88E5',
    theme: 'ocean',
    generateSound: (audioContext) => {
      // Generate ocean-like wave sounds
      const bufferSize = audioContext.sampleRate * 2;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioContext.sampleRate;
        data[i] = (Math.random() * 2 - 1) * 0.12 * Math.sin(t * 0.5);
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1500;
      filter.Q.value = 0.8;
      
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.3;
      
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      return { source, gainNode };
    }
  },
  {
    id: 'coffee',
    name: 'Coffee Shop',
    description: 'Ambient cafe sounds',
    icon: '☕',
    color: '#6F4E37',
    theme: 'coffee',
    generateSound: (audioContext) => {
      // Generate coffee shop-like ambient noise
      const bufferSize = audioContext.sampleRate * 2;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.1;
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3000;
      filter.Q.value = 1;
      
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.2;
      
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      return { source, gainNode };
    }
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    description: 'Crackling fire',
    icon: '🔥',
    color: '#FF6B35',
    theme: 'fireplace',
    generateSound: (audioContext) => {
      // Generate fireplace-like crackling
      const bufferSize = audioContext.sampleRate * 2;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        const t = i / audioContext.sampleRate;
        data[i] = (Math.random() * 2 - 1) * 0.15 * (0.5 + 0.5 * Math.sin(t * 2));
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 2;
      
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.25;
      
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      return { source, gainNode };
    }
  },
  {
    id: 'silence',
    name: 'Silence',
    description: 'No ambient sound',
    icon: '🔇',
    color: '#9E9E9E',
    theme: 'default',
    generateSound: () => null
  }
];

class AmbientSoundService {
  constructor() {
    this.audioContext = null;
    this.currentSound = null;
    this.currentSource = null;
    this.currentGain = null;
    this.isPlaying = false;
    this.volume = 0.5;
  }

  async init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async playSound(soundId) {
    await this.init();
    
    // Stop current sound
    this.stop();
    
    if (soundId === 'silence') {
      return;
    }
    
    const sound = SOUND_OPTIONS.find(s => s.id === soundId);
    if (!sound || !sound.generateSound) {
      return;
    }
    
    try {
      const { source, gainNode } = sound.generateSound(this.audioContext);
      this.currentSource = source;
      this.currentGain = gainNode;
      this.currentSound = sound;
      
      gainNode.gain.value = this.volume;
      source.start(0);
      this.isPlaying = true;
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (error) {
        // Source might already be stopped
      }
      this.currentSource = null;
      this.currentGain = null;
      this.isPlaying = false;
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentGain) {
      this.currentGain.gain.value = this.volume;
    }
  }

  getCurrentSound() {
    return this.currentSound;
  }
}

export const ambientSoundService = new AmbientSoundService();
export default ambientSoundService;

