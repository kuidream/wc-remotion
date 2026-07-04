class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private cheerAudio: HTMLAudioElement | null = null;
  private initialized: boolean = false;

  init() {
    if (this.initialized) return;
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.4;
            this.masterGain.connect(this.ctx.destination);
        }
        
        this.cheerAudio = new Audio('https://actions.google.com/sounds/v1/crowds/battle_crowd_celebrate_stutter.ogg');
        this.cheerAudio.volume = 0.8;

        this.initialized = true;
    } catch (e) {
        console.warn('AudioContext not supported', e);
    }
  }

  playHit(intensity: number = 1) {
    if (!this.ctx || !this.masterGain) return;
    
    try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(Math.max(0.01, 0.3 * Math.min(intensity, 2)), this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  playBlock() {
    if (!this.ctx || !this.masterGain) return;
    
    try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }
  
  playLightning() {
      if (!this.ctx || !this.masterGain) return;
      try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);
          
          gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
          
          osc.connect(gain);
          gain.connect(this.masterGain);
          
          osc.start();
          osc.stop(this.ctx.currentTime + 0.15);
      } catch (e) {}
  }

  playGoal() {
    if (this.cheerAudio) {
        this.cheerAudio.currentTime = 0;
        this.cheerAudio.volume = 0.8;
        this.cheerAudio.play().catch(() => {});
        
        setTimeout(() => {
            let vol = 0.8;
            const fade = setInterval(() => {
                vol -= 0.1;
                if (vol <= 0) {
                    if (this.cheerAudio) {
                        this.cheerAudio.pause();
                        this.cheerAudio.currentTime = 0;
                    }
                    clearInterval(fade);
                } else {
                    if (this.cheerAudio) this.cheerAudio.volume = vol;
                }
            }, 100);
        }, 1500); // Wait 1.5 seconds, then fade out over 0.8 seconds.
    }
  }
}

export const audio = new AudioEngine();
