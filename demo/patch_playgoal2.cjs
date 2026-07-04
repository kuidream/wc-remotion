const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');
const start = code.indexOf('  playGoal() {');
code = code.substring(0, start) + `  playGoal() {
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
`;

fs.writeFileSync('src/lib/audio.ts', code);
