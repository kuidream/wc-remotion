const fs = require('fs');
let code = fs.readFileSync('src/components/MatchSim.tsx', 'utf8');

const start = code.indexOf('const drawBeyblade = (ctx: CanvasRenderingContext2D, b: Ball, frames: number) => {');
const end = code.indexOf('    let animationFrameId: number;');

const newCode = `const drawBeyblade = (ctx: CanvasRenderingContext2D, b: Ball, frames: number) => {
       ctx.save();
       ctx.translate(b.x, b.y);
       ctx.rotate(b.rotation);
       
       // 1. Smooth Outer Ring (Segmented Colors)
       ctx.shadowBlur = 10;
       ctx.shadowColor = b.glowColor;
       
       const segments = 4;
       const ringWidth = b.radius * 0.2;
       ctx.lineWidth = ringWidth;
       
       for (let i = 0; i < segments; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, b.radius - ringWidth/2, (i * Math.PI * 2) / segments, ((i + 1) * Math.PI * 2) / segments);
          ctx.strokeStyle = i % 2 === 0 ? b.color : b.coreColor;
          ctx.stroke();
       }
       ctx.shadowBlur = 0;
       
       // Thin dark separator line
       ctx.beginPath();
       ctx.arc(0, 0, b.radius - ringWidth, 0, Math.PI * 2);
       ctx.lineWidth = 2;
       ctx.strokeStyle = '#111';
       ctx.stroke();
       
       // 2. Inner Metallic Base
       ctx.beginPath();
       ctx.arc(0, 0, b.radius - ringWidth - 1, 0, Math.PI * 2);
       const metalGrad = ctx.createLinearGradient(-b.radius, -b.radius, b.radius, b.radius);
       if (b.id === 'PRY') {
          metalGrad.addColorStop(0, '#f9d423'); // Gold/Bronze
          metalGrad.addColorStop(0.5, '#ff4e50'); 
          metalGrad.addColorStop(1, '#f9d423');
       } else {
          metalGrad.addColorStop(0, '#e0e0e0'); // Silver
          metalGrad.addColorStop(0.5, '#888888');
          metalGrad.addColorStop(1, '#e0e0e0');
       }
       ctx.fillStyle = metalGrad;
       ctx.fill();
       
       // 3. Central Flag 
       ctx.save();
       ctx.beginPath();
       ctx.arc(0, 0, b.radius * 0.55, 0, Math.PI * 2);
       ctx.clip();
       
       const flagImg = b.id === 'PRY' ? stateRef.current.flags.py : stateRef.current.flags.fr;
       if (flagImg && flagImg.complete && flagImg.naturalWidth > 0) {
          ctx.rotate(-b.rotation); // Keep upright
          ctx.drawImage(flagImg, -b.radius * 0.55, -b.radius * 0.55, b.radius * 1.1, b.radius * 1.1);
       } else {
          ctx.fillStyle = b.id === 'PRY' ? '#d52b1e' : '#002654';
          ctx.fill();
       }
       ctx.restore(); // Undo flag clip
       
       // 4. Center White Border
       ctx.beginPath();
       ctx.arc(0, 0, b.radius * 0.55, 0, Math.PI * 2);
       ctx.lineWidth = 3;
       ctx.strokeStyle = '#ffffff';
       ctx.stroke();
       
       // 5. Metallic Bracket Overlays (the two side indents over the flag)
       ctx.fillStyle = '#222';
       ctx.beginPath();
       ctx.arc(0, 0, b.radius * 0.58, -0.3, 0.3);
       ctx.arc(0, 0, b.radius * 0.40, 0.3, -0.3, true);
       ctx.fill();
       
       ctx.beginPath();
       ctx.arc(0, 0, b.radius * 0.58, Math.PI - 0.3, Math.PI + 0.3);
       ctx.arc(0, 0, b.radius * 0.40, Math.PI + 0.3, Math.PI - 0.3, true);
       ctx.fill();
       ctx.restore(); // Undo all rotation & translation
    };

`;

code = code.substring(0, start) + newCode + code.substring(end);
fs.writeFileSync('src/components/MatchSim.tsx', code);
