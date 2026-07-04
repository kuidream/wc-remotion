const fs = require('fs');
let code = fs.readFileSync('src/lib/audio.ts', 'utf8');
const start = code.indexOf('playGoal() {');
const end = code.lastIndexOf('}') - 1; // wait, let's just replace the body

code = code.substring(0, start) + `playGoal() {
    if (this.cheerAudio) {
        this.cheerAudio.currentTime = 0;
        this.cheerAudio.play().catch(() => {});
    }
  }
}

export const audio = new AudioEngine();
`;

fs.writeFileSync('src/lib/audio.ts', code);
