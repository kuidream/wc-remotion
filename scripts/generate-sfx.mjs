import fs from "node:fs";
import path from "node:path";

const sampleRate = 44100;

const writeWav = (filePath, options) => {
  const sampleCount = Math.floor(options.duration * sampleRate);
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < sampleCount; i++) {
    const t = i / sampleRate;
    const progress = t / options.duration;
    const freq =
      options.freqStart *
      Math.pow(options.freqEnd / options.freqStart, progress);
    const phase = 2 * Math.PI * freq * t;
    const wave =
      options.wave === "square"
        ? Math.sin(phase) >= 0
          ? 1
          : -1
        : Math.sin(phase);
    const envelope = Math.exp(-t * options.decay);
    const sample = Math.max(
      -1,
      Math.min(1, wave * options.volume * envelope),
    );
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
};

const root = path.join(process.cwd(), "public", "sfx");

writeWav(path.join(root, "hit.wav"), {
  duration: 0.1,
  wave: "square",
  freqStart: 150,
  freqEnd: 40,
  volume: 0.9,
  decay: 24,
});

writeWav(path.join(root, "block.wav"), {
  duration: 0.15,
  wave: "sine",
  freqStart: 600,
  freqEnd: 200,
  volume: 0.8,
  decay: 18,
});

console.log("Generated public/sfx/hit.wav and public/sfx/block.wav");
