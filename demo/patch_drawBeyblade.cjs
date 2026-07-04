const fs = require('fs');
let code = fs.readFileSync('src/components/MatchSim.tsx', 'utf8');

// Find drawBeyblade
const start = code.indexOf('const drawBeyblade = (ctx: CanvasRenderingContext2D, b: Ball, frames: number) => {');
const end = code.indexOf('};', start) + 2;

const newCode = `const drawBeyblade = (ctx: CanvasRenderingContext2D, b: Ball, frames: number) => {
       ctx.save();
       ctx.translate(b.x, b.y);

       ctx.beginPath();
       ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
       ctx.clip();
       
       const flagImg = b.id === 'PRY' ? stateRef.current.flags.py : stateRef.current.flags.fr;
       if (flagImg && flagImg.complete && flagImg.naturalWidth > 0) {
          ctx.drawImage(flagImg, -b.radius, -b.radius, b.radius * 2, b.radius * 2);
       } else {
          ctx.fillStyle = b.id === 'PRY' ? '#d52b1e' : '#002654';
          ctx.fill();
       }
       ctx.restore();
       
       // Optional: thin stroke for edge definition if desired, but user said remove completely.
    };`;

code = code.substring(0, start) + newCode + code.substring(end);
fs.writeFileSync('src/components/MatchSim.tsx', code);
