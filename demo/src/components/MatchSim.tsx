import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../lib/audio';

// --- Types & Interfaces ---
interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  angularVelocity: number;
  color: string;
  glowColor: string;
  coreColor: string;
  team: string;
  tail: { x: number; y: number }[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'spark' | 'spore' | 'flash' | 'shockwave';
}

const ARENA_MARGIN = 40;
const MAX_SPEED = 6.5;
const MIN_SPEED = 1.5;
const BALL_RADIUS = 20;
const BASE_SPEED = 3.0;

export default function MatchSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // React State for UI
  const [matchMinute, setMatchMinute] = useState(0);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [status, setStatus] = useState<'pre' | 'sim' | 'post'>('pre');
  
  // Mutable game state
  const stateRef = useRef({
    status: 'pre' as 'pre' | 'sim' | 'post',
    timeTicker: 0,
    scoreA: 0,
    scoreB: 0,
    matchLength: 90,
    balls: [] as Ball[],
    particles: [] as Particle[],
    arena: { x: 0, y: 0, radius: 0, pocketAngle: 0, pocketWidth: 0 },
    width: 0,
    height: 0,
    frames: 0,
    shake: 0,
    hitStop: 0,
    goalFlash: 0,
    flags: { py: null as HTMLImageElement | null, fr: null as HTMLImageElement | null },
    ringBonuses: { PRY: { inner: 0, outer: 0 }, FRA: { inner: 0, outer: 0 } },
    players: [] as any[],
    lightnings: [] as any[]
  });

  useEffect(() => {
    const imgPy = new Image();
    imgPy.src = 'https://flagcdn.com/w160/py.png';
    imgPy.onload = () => { stateRef.current.flags.py = imgPy; };
    
    const imgFr = new Image();
    imgFr.src = 'https://flagcdn.com/w160/fr.png';
    imgFr.onload = () => { stateRef.current.flags.fr = imgFr; };
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const initGame = () => {
      const { width, height } = stateRef.current;
      const arenaCenter = { x: width / 2, y: height / 2 - 10 };
      const arenaRadius = Math.min(width, height) / 2 - ARENA_MARGIN;
      
      stateRef.current.matchLength = 90 + Math.floor(Math.random() * 6);

      stateRef.current.arena = { 
         ...arenaCenter, 
         radius: arenaRadius,
         pocketAngle: -Math.PI / 2, // Top pocket
         pocketWidth: Math.PI / 8, 
      };
      
      stateRef.current.balls = [
        {
          id: 'PRY', 
          team: 'Paraguay',
          x: arenaCenter.x - BALL_RADIUS,
          y: arenaCenter.y,
          vx: 2.0,
          vy: -1.0,
          radius: BALL_RADIUS,
          rotation: 0,
          angularVelocity: 0.05,
          color: '#e62e2e', // Red
          glowColor: '#ffcc00', // Yellow glow in the middle
          coreColor: '#ffffff', // White
          tail: [],
        },
        {
          id: 'FRA',
          team: 'France',
          x: arenaCenter.x + BALL_RADIUS,
          y: arenaCenter.y,
          vx: -2.0,
          vy: 1.0,
          radius: BALL_RADIUS,
          rotation: 0,
          angularVelocity: -0.05,
          color: '#1e3a8a', // Dark blue
          glowColor: '#ff3366', // Red/pink glow
          coreColor: '#ffffff', 
          tail: [],
        }
      ];

      // Ambient ethereal spores (Ori style)
      stateRef.current.particles = [];
      const count = (width * height) / 8000;
      for (let i = 0; i < count; i++) {
        stateRef.current.particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3 - 0.2, // Drifting upwards
          life: Math.random() * 100,
          maxLife: 200 + Math.random() * 200,
          size: Math.random() * 2 + 0.5,
          color: Math.random() > 0.5 ? '#a5f3fc' : '#bfdbfe',
          type: 'spore',
        });
      }

      stateRef.current.ringBonuses = { PRY: { inner: 0, outer: 0 }, FRA: { inner: 0, outer: 0 } };
      stateRef.current.lightnings = [];
      
      const addTeam = (team: 'PRY'|'FRA', baseX: number, baseY: number, dir: number) => {
          const p = [];
          const spacingX = 22;
          const spacingY = 18;
          
          p.push({ id: `${team}-GK`, team, type: 'goalkeeper', x: baseX - dir * spacingX * 2, y: baseY, charge: 0, cooldown: Math.random() * 120 });
          for(let i=0; i<4; i++) p.push({ id: `${team}-DEF${i}`, team, type: 'defender', x: baseX - dir * spacingX, y: baseY - spacingY * 1.5 + i * spacingY, charge: 0, cooldown: Math.random() * 120 });
          for(let i=0; i<3; i++) p.push({ id: `${team}-MID${i}`, team, type: 'midfielder', x: baseX, y: baseY - spacingY + i * spacingY, charge: 0, cooldown: Math.random() * 120 });
          for(let i=0; i<3; i++) p.push({ id: `${team}-FWD${i}`, team, type: 'forward', x: baseX + dir * spacingX, y: baseY - spacingY + i * spacingY, charge: 0, cooldown: Math.random() * 120 });
          return p;
      };

      stateRef.current.players = [
          ...addTeam('PRY', width / 2 - 120, 35, 1),
          ...addTeam('FRA', width / 2 + 120, 35, -1)
      ];
    };

    const handleResize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent?.clientWidth || window.innerWidth;
      canvas.height = parent?.clientHeight || window.innerHeight;
      stateRef.current.width = canvas.width;
      stateRef.current.height = canvas.height;
      if (stateRef.current.status === 'pre') {
         initGame();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    initGame();

    const spawnSparks = (x: number, y: number, color1: string, color2: string, big = false) => {
      const count = big ? 25 : 6; // More sparks for impact
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        // Faster sparks for sharp lines
        const speed = big ? Math.random() * 10 + 4 : Math.random() * 4 + 2;
        stateRef.current.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: big ? 20 + Math.random() * 10 : 10 + Math.random() * 10,
          size: Math.random() * 1.5 + 0.5,
          color: Math.random() > 0.5 ? color1 : color2,
          type: 'spark',
        });
      }
      
      if (big) {
         stateRef.current.particles.push({
            x, y, vx: 0, vy: 0, life: 0, maxLife: 15, size: 40,
            color: color1, type: 'shockwave'
         });
      }
    };

    const triggerGoal = (scorerId: string) => {
      audio.playGoal();
      stateRef.current.shake = 40;
      stateRef.current.hitStop = 20; // Freeze frame for dramatic effect
      stateRef.current.goalFlash = 1.0;
      
      const b1 = stateRef.current.balls[0];
      const b2 = stateRef.current.balls[1];
      
      spawnSparks(stateRef.current.arena.x, stateRef.current.arena.y, b1.glowColor, b2.glowColor, true);
      
      if (scorerId === 'PRY') {
        stateRef.current.scoreA += 1;
        setScoreA(stateRef.current.scoreA);
      } else {
        stateRef.current.scoreB += 1;
        setScoreB(stateRef.current.scoreB);
      }
      
      // Reset positions after a short delay
      setTimeout(() => {
         if (stateRef.current.status === 'sim') {
            const { width, height } = stateRef.current;
            const arenaCenter = { x: width / 2, y: height / 2 - 10 };
            const arenaRadius = Math.min(width, height) / 2 - ARENA_MARGIN;
            
            if (stateRef.current.balls[0]) {
               stateRef.current.balls[0].x = arenaCenter.x - BALL_RADIUS;
               stateRef.current.balls[0].y = arenaCenter.y;
               stateRef.current.balls[0].vx = 2.0;
               stateRef.current.balls[0].vy = -1.0;
               stateRef.current.balls[0].angularVelocity = 0.05;
               stateRef.current.balls[0].tail = [];
            }
            if (stateRef.current.balls[1]) {
               stateRef.current.balls[1].x = arenaCenter.x + BALL_RADIUS;
               stateRef.current.balls[1].y = arenaCenter.y;
               stateRef.current.balls[1].vx = -2.0;
               stateRef.current.balls[1].vy = 1.0;
               stateRef.current.balls[1].angularVelocity = -0.05;
               stateRef.current.balls[1].tail = [];
            }
         }
      }, 1000);
    };

    const updatePhysics = () => {
      const state = stateRef.current;
      if (state.status !== 'sim') return;

      if (state.hitStop > 0) {
         state.hitStop--;
         return; // Skip physics update during hitstop
      }

      state.arena.pocketAngle += 0.005; // Uniform rotation
      if (state.arena.pocketAngle > Math.PI * 2) state.arena.pocketAngle -= Math.PI * 2;

      state.timeTicker += 1;
      const simulatedMinute = Math.floor(state.timeTicker / 30); 
      
      if (simulatedMinute > matchMinute && simulatedMinute <= state.matchLength) {
         setMatchMinute(simulatedMinute);
      }
      
      if (simulatedMinute >= state.matchLength) {
         state.status = 'post';
         setStatus('post');
      }

      const { arena, balls, ringBonuses, players, lightnings } = state;

      const isAngleInRing = (angle: number, start: number, end: number) => {
         const a = (angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
         const s = (start % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
         const e = (end % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
         if (s <= e) return a >= s && a <= e;
         return a >= s || a <= e;
      };

      const slowSpin = state.frames * 0.005;

      const pryInnerStart = slowSpin * 1.5 + Math.PI/2;
      const pryInnerEnd = slowSpin * 1.5 + Math.PI + ringBonuses.PRY.inner;
      const fraInnerStart = -slowSpin * 1.5 + Math.PI * 1.5;
      const fraInnerEnd = -slowSpin * 1.5 + Math.PI * 2 + ringBonuses.FRA.inner;
      
      const pryOuterStart = slowSpin;
      const pryOuterEnd = slowSpin + Math.PI * 0.8 + ringBonuses.PRY.outer;
      const fraOuterStart = -slowSpin + Math.PI;
      const fraOuterEnd = -slowSpin + Math.PI * 1.8 + ringBonuses.FRA.outer;

      ringBonuses.PRY.inner *= 0.995;
      ringBonuses.PRY.outer *= 0.995;
      ringBonuses.FRA.inner *= 0.995;
      ringBonuses.FRA.outer *= 0.995;

      players.forEach(p => {
         if (p.cooldown > 0) {
            p.cooldown--;
         } else if (Math.random() < 0.005) { // Trigger discharge
            p.cooldown = 120 + Math.random() * 180;
            let targetRing = arena.radius - 10;
            let color = p.team === 'PRY' ? '#ffcc00' : '#ff3366';
            
            if (p.type === 'forward') {
               targetRing = arena.radius - 30;
               color = p.team === 'PRY' ? '#a3e635' : '#fca5a5';
               ringBonuses[p.team as 'PRY'|'FRA'].inner += (Math.PI * 0.6 - ringBonuses[p.team as 'PRY'|'FRA'].inner) * 0.25;
            } else if (p.type === 'defender' || p.type === 'goalkeeper') {
               ringBonuses[p.team as 'PRY'|'FRA'].outer += (Math.PI * 0.6 - ringBonuses[p.team as 'PRY'|'FRA'].outer) * 0.25;
            } else {
               ringBonuses[p.team as 'PRY'|'FRA'].inner += (Math.PI * 0.6 - ringBonuses[p.team as 'PRY'|'FRA'].inner) * 0.12;
               ringBonuses[p.team as 'PRY'|'FRA'].outer += (Math.PI * 0.6 - ringBonuses[p.team as 'PRY'|'FRA'].outer) * 0.12;
            }
            
            const angleToCenter = Math.atan2(arena.y - p.y, arena.x - p.x);
            lightnings.push({
               startX: p.x, startY: p.y,
               endX: arena.x - Math.cos(angleToCenter) * targetRing,
               endY: arena.y - Math.sin(angleToCenter) * targetRing,
               life: 15, maxLife: 15, color
            });
         }
      });
      
      state.lightnings = lightnings.filter((l: any) => l.life-- > 0);

      balls.forEach((b) => {
        b.rotation += b.angularVelocity;

        // Very tiny noise and pull to prevent endless perfect loops
        const centerPullX = (arena.x - b.x) * 0.0002;
        const centerPullY = (arena.y - b.y) * 0.0002;
        b.vx += centerPullX + (Math.random() - 0.5) * 0.05;
        b.vy += centerPullY + (Math.random() - 0.5) * 0.05;

        // Normalize speed gently towards base speed to maintain momentum without looking forced
        const speed = Math.hypot(b.vx, b.vy);
        if (speed > 0) {
           const speedDiff = BASE_SPEED - speed;
           b.vx += (b.vx / speed) * speedDiff * 0.02;
           b.vy += (b.vy / speed) * speedDiff * 0.02;
        }

        // Inner Ring Acceleration/Deceleration Logic
        const distToCenterForRings = Math.hypot(b.x - arena.x, b.y - arena.y);
        if (distToCenterForRings > arena.radius - 50 && distToCenterForRings < arena.radius - 10) {
           const angleToCenter = Math.atan2(b.y - arena.y, b.x - arena.x);
           
           const inA = isAngleInRing(angleToCenter, pryInnerStart, pryInnerEnd);
           const inB = isAngleInRing(angleToCenter, fraInnerStart, fraInnerEnd);
           
           if (inA && !inB) {
              if (b.id === 'PRY') { b.vx *= 1.05; b.vy *= 1.05; }
              else { b.vx *= 0.95; b.vy *= 0.95; }
           } else if (inB && !inA) {
              if (b.id === 'FRA') { b.vx *= 1.05; b.vy *= 1.05; }
              else { b.vx *= 0.95; b.vy *= 0.95; }
           }
        }

        // Hard limits
        const newSpeed = Math.hypot(b.vx, b.vy);
        if (newSpeed > MAX_SPEED) {
          b.vx = (b.vx / newSpeed) * MAX_SPEED;
          b.vy = (b.vy / newSpeed) * MAX_SPEED;
        } else if (newSpeed < MIN_SPEED) {
          b.vx = (b.vx / newSpeed) * MIN_SPEED;
          b.vy = (b.vy / newSpeed) * MIN_SPEED;
        }

        b.x += b.vx;
        b.y += b.vy;

        b.tail.unshift({ x: b.x, y: b.y });
        if (b.tail.length > 30) b.tail.pop(); // Long sweeping tail

        // Circular Arena Boundary Collision
        const distToCenter = Math.hypot(b.x - arena.x, b.y - arena.y);
        if (distToCenter + b.radius > arena.radius) {
          const angleToCenter = Math.atan2(b.y - arena.y, b.x - arena.x);
          
          let inPocket = false;
          let normAngle = angleToCenter;
          let pAngle = arena.pocketAngle;
          let angleDiff = Math.abs(normAngle - pAngle) % (Math.PI * 2);
          if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
          
          if (angleDiff < arena.pocketWidth / 2) {
             inPocket = true;
          }

          if (inPocket) {
             // Check if blocked by defense ring
             let blocked = false;
             if (b.id === 'PRY') {
                // Opposing ring is FRA (Ring 2)
                if (isAngleInRing(normAngle, fraOuterStart, fraOuterEnd)) {
                   blocked = true;
                }
             } else if (b.id === 'FRA') {
                // Opposing ring is PRY (Ring 1)
                if (isAngleInRing(normAngle, pryOuterStart, pryOuterEnd)) {
                   blocked = true;
                }
             }

             if (blocked) {
                inPocket = false;
                audio.playBlock();
                spawnSparks(b.x, b.y, b.glowColor, '#ffffff');
             }
          }

          if (inPocket) {
             if (distToCenter > arena.radius + b.radius) {
                // Ball fell completely in
                b.vx = 0; b.vy = 0;
                const scorerId = b.id; // whoever enters scores
                triggerGoal(scorerId);
                // Move ball far away temporarily until reset
                b.x = -1000; b.y = -1000;
             }
          } else {
            // True normal for correct positional push out
            const trueNx = (b.x - arena.x) / distToCenter;
            const trueNy = (b.y - arena.y) / distToCenter;
            
            const overlap = distToCenter + b.radius - arena.radius;
            b.x -= trueNx * overlap;
            b.y -= trueNy * overlap;
            
            // Introduce a tiny random angle variation to the normal to prevent repeating perfect polygons
            const angle = Math.atan2(trueNy, trueNx) + (Math.random() - 0.5) * 0.1;
            const nx = Math.cos(angle);
            const ny = Math.sin(angle);
            
            const dot = b.vx * nx + b.vy * ny;
            b.vx = b.vx - 2 * dot * nx; // Pure elastic reflection (restitution = 1)
            b.vy = b.vy - 2 * dot * ny;
            
            audio.playHit(0.5);
            spawnSparks(b.x + nx * b.radius, b.y + ny * b.radius, b.glowColor, '#ffffff');
            state.shake = 1; // Very subtle shake for wall hits
          }
        }
      });

      const b1 = balls[0];
      const b2 = balls[1];
      const dx = b2.x - b1.x;
      const dy = b2.y - b1.y;
      const dist = Math.hypot(dx, dy);

      // Rigid Body Collision
      if (dist < b1.radius + b2.radius) {
        const overlap = (b1.radius + b2.radius - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        
        // Push out so they don't stick
        b1.x -= nx * overlap;
        b1.y -= ny * overlap;
        b2.x += nx * overlap;
        b2.y += ny * overlap;

        const dvx = b2.vx - b1.vx;
        const dvy = b2.vy - b1.vy;
        const nv = dvx * nx + dvy * ny;

        if (nv < 0) {
          audio.playHit(Math.abs(nv) * 0.2);
          const restitution = 1.0; // Perfect rigid elastic collision
          const impulse = -(1 + restitution) * nv / 2;
          
          b1.vx -= impulse * nx;
          b1.vy -= impulse * ny;
          b2.vx += impulse * nx;
          b2.vy += impulse * ny;
          
          // Transfer some spin organically
          b1.angularVelocity = (b1.angularVelocity + (Math.random() - 0.5) * 0.1) * 0.95;
          b2.angularVelocity = (b2.angularVelocity + (Math.random() - 0.5) * 0.1) * 0.95;
          
          spawnSparks(b1.x + nx * b1.radius, b1.y + ny * b1.radius, b1.glowColor, b2.glowColor, true);
          
          const impactForce = Math.abs(impulse);
          state.shake = Math.min(8, impactForce * 1.5);
          
          // Small hitstop only on very direct hard hits
          if (impactForce > 6) {
             state.hitStop = 2;
          }
          
          // Knock out pocket handles scoring now
        }
      }
    };

    const updateParticles = () => {
      const state = stateRef.current;
      
      state.particles.forEach(p => {
        if (state.hitStop > 0 && p.type !== 'shockwave') return; // Particles freeze during hitstop (except shockwave)
        
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        
        if (p.type === 'spark') {
           p.vx *= 0.96; // Slower deceleration for longer streaks
           p.vy *= 0.96;
        } else if (p.type === 'spore') {
           p.x += Math.sin(state.frames * 0.02 + p.life * 0.1) * 0.5;
           if (p.life > p.maxLife) {
              p.y = state.height + 10;
              p.x = Math.random() * state.width;
              p.life = 0;
           }
        }
      });
      state.particles = state.particles.filter(p => p.type === 'spore' || p.life < p.maxLife);
    };

    const drawArena = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, frames: number) => {
       ctx.lineWidth = 6;
       
       // Deep hazy base
       ctx.beginPath();
       ctx.arc(cx, cy, r, 0, Math.PI * 2);
       const baseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
       baseGrad.addColorStop(0, '#040b17');
       baseGrad.addColorStop(0.8, '#061326');
       baseGrad.addColorStop(1, '#02050a');
       ctx.fillStyle = baseGrad;
       ctx.fill();

       // Dreamy outer rim glow
       ctx.shadowBlur = 40;
       ctx.shadowColor = 'rgba(0, 150, 255, 0.4)';
       ctx.strokeStyle = 'rgba(20, 40, 80, 0.8)';
       ctx.stroke();
       ctx.shadowBlur = 0;

       // Ethereal rings (Ori style)
       ctx.lineCap = 'round';
       ctx.globalCompositeOperation = 'screen';
       
       const drawRing = (radius: number, color: string, startAngle: number, endAngle: number, width: number, blur: number) => {
          ctx.beginPath();
          ctx.arc(cx, cy, radius, startAngle, endAngle);
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.shadowBlur = blur;
          ctx.shadowColor = color;
          ctx.stroke();
          ctx.shadowBlur = 0;
       };

       const slowSpin = frames * 0.005;
       
       const pryInnerEnd = slowSpin * 1.5 + Math.PI + stateRef.current.ringBonuses.PRY.inner;
       const fraInnerEnd = -slowSpin * 1.5 + Math.PI * 2 + stateRef.current.ringBonuses.FRA.inner;
       const pryOuterEnd = slowSpin + Math.PI * 0.8 + stateRef.current.ringBonuses.PRY.outer;
       const fraOuterEnd = -slowSpin + Math.PI * 1.8 + stateRef.current.ringBonuses.FRA.outer;

       drawRing(r - 10, '#ffcc00', slowSpin, pryOuterEnd, 3, 15); // PRY (Home)
       drawRing(r - 10, '#ff3366', -slowSpin + Math.PI, fraOuterEnd, 3, 15); // FRA (Away)
       
       drawRing(r - 30, '#a3e635', slowSpin * 1.5 + Math.PI/2, pryInnerEnd, 2, 10);
       drawRing(r - 30, '#fca5a5', -slowSpin * 1.5 + Math.PI * 1.5, fraInnerEnd, 2, 10);

       ctx.globalCompositeOperation = 'source-over';

       // Draw Rotating Neon Goal
       const pAngle = stateRef.current.arena.pocketAngle;
       const pWidth = stateRef.current.arena.pocketWidth;
       const goalDepth = 25; 
       
       const p1Angle = pAngle - pWidth/2;
       const p2Angle = pAngle + pWidth/2;
       
       const start1X = cx + Math.cos(p1Angle) * r;
       const start1Y = cy + Math.sin(p1Angle) * r;
       
       const start2X = cx + Math.cos(p2Angle) * r;
       const start2Y = cy + Math.sin(p2Angle) * r;
       
       const end1X = cx + Math.cos(p1Angle) * (r + goalDepth);
       const end1Y = cy + Math.sin(p1Angle) * (r + goalDepth);
       
       const end2X = cx + Math.cos(p2Angle) * (r + goalDepth);
       const end2Y = cy + Math.sin(p2Angle) * (r + goalDepth);

       ctx.save();
       
       // Draw the net grid
       ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
       ctx.lineWidth = 1;
       ctx.beginPath();
       const radialLines = 8;
       for (let i = 1; i < radialLines; i++) {
          const t = i / radialLines;
          ctx.moveTo(cx + Math.cos(p1Angle + pWidth * t) * r, cy + Math.sin(p1Angle + pWidth * t) * r);
          ctx.lineTo(cx + Math.cos(p1Angle + pWidth * t) * (r + goalDepth), cy + Math.sin(p1Angle + pWidth * t) * (r + goalDepth));
       }
       const arcLines = 4;
       for (let i = 1; i <= arcLines; i++) {
          const t = i / arcLines;
          ctx.moveTo(cx + Math.cos(p1Angle) * (r + goalDepth * t), cy + Math.sin(p1Angle) * (r + goalDepth * t));
          ctx.arc(cx, cy, r + goalDepth * t, p1Angle, p2Angle);
       }
       ctx.stroke();
       
       // Goal Frame (White Neon)
       ctx.beginPath();
       ctx.moveTo(start1X, start1Y);
       ctx.lineTo(end1X, end1Y);
       ctx.arc(cx, cy, r + goalDepth, p1Angle, p2Angle);
       ctx.lineTo(start2X, start2Y);
       
       ctx.strokeStyle = '#ffffff'; 
       ctx.lineWidth = 6;
       ctx.shadowBlur = 12;
       ctx.shadowColor = '#00ffff'; 
       ctx.lineCap = 'square';
       ctx.stroke();
       
       // Thicker base for the frame posts on the circle
       ctx.beginPath();
       ctx.arc(cx, cy, r, p1Angle - 0.04, p1Angle + 0.01);
       ctx.stroke();
       ctx.beginPath();
       ctx.arc(cx, cy, r, p2Angle - 0.01, p2Angle + 0.04);
       ctx.stroke();

       ctx.restore();
    };

    const drawBeyblade = (ctx: CanvasRenderingContext2D, b: Ball, frames: number) => {
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

    let animationFrameId: number;

    const render = () => {
      const state = stateRef.current;
      const { width, height, arena, balls, particles, frames } = state;
      
      updatePhysics();
      updateParticles();
      
      if (state.shake > 0) {
        ctx.save();
        const dx = (Math.random() - 0.5) * state.shake;
        const dy = (Math.random() - 0.5) * state.shake;
        ctx.translate(dx, dy);
        state.shake *= 0.85; // Faster shake decay
        if (state.shake < 0.5) state.shake = 0;
      }

      // Very dark dreamy background
      ctx.fillStyle = '#010308';
      ctx.fillRect(0, 0, width, height);

      drawArena(ctx, arena.x, arena.y, arena.radius, frames);

      // Draw Players
      state.players.forEach((p: any) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = p.team === 'PRY' ? (p.type === 'forward' ? '#a3e635' : '#ffcc00') : (p.type === 'forward' ? '#fca5a5' : '#ff3366');
          
          if (p.cooldown < 30) {
              ctx.shadowBlur = 10;
              ctx.shadowColor = ctx.fillStyle;
          } else {
              ctx.shadowBlur = 0;
          }
          ctx.fill();
          ctx.shadowBlur = 0;
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 1;
          ctx.stroke();
      });

      // Draw Lightnings
      state.lightnings.forEach((l: any) => {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(l.startX, l.startY);
          
          const steps = 4;
          const dx = (l.endX - l.startX) / steps;
          const dy = (l.endY - l.startY) / steps;
          let curX = l.startX;
          let curY = l.startY;
          
          for(let i = 1; i < steps; i++) {
              curX += dx + (Math.random() - 0.5) * 30;
              curY += dy + (Math.random() - 0.5) * 30;
              ctx.lineTo(curX, curY);
          }
          ctx.lineTo(l.endX, l.endY);
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = l.color;
          ctx.stroke();
          
          ctx.strokeStyle = l.color;
          ctx.lineWidth = 4;
          ctx.globalAlpha = l.life / l.maxLife;
          ctx.shadowBlur = 0;
          ctx.stroke();
          ctx.restore();
      });

      ctx.globalCompositeOperation = 'screen';

      // Draw Particles
      particles.forEach(p => {
        if (p.type === 'spore') {
           const pulse = (Math.sin(p.life * 0.05) + 1) * 0.5;
           ctx.globalAlpha = 0.1 + pulse * 0.4;
           ctx.fillStyle = p.color;
           ctx.beginPath();
           ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
           ctx.fill();
           if (p.size > 1.5) {
               ctx.shadowBlur = 10;
               ctx.shadowColor = p.color;
               ctx.fill();
               ctx.shadowBlur = 0;
           }
        } else if (p.type === 'spark') {
           const progress = p.life / p.maxLife;
           ctx.globalAlpha = Math.max(0, 1 - Math.pow(progress, 1.5));
           ctx.beginPath();
           ctx.moveTo(p.x, p.y);
           // Much longer tail for sparks to look like sharp energy lines
           ctx.lineTo(p.x - p.vx * 8, p.y - p.vy * 8);
           
           // Glow layer
           ctx.lineWidth = p.size * 2;
           ctx.lineCap = 'round';
           ctx.strokeStyle = p.color;
           ctx.shadowBlur = 10;
           ctx.shadowColor = p.color;
           ctx.stroke();
           
           // Core white line
           ctx.lineWidth = p.size * 0.8;
           ctx.strokeStyle = '#ffffff';
           ctx.shadowBlur = 0;
           ctx.stroke();
        } else if (p.type === 'shockwave') {
           const progress = p.life / p.maxLife;
           ctx.globalAlpha = Math.max(0, 1 - Math.pow(progress, 1.2));
           ctx.beginPath();
           ctx.arc(p.x, p.y, p.size * progress, 0, Math.PI * 2);
           ctx.strokeStyle = p.color;
           ctx.lineWidth = 4 * (1 - progress);
           ctx.shadowBlur = 20;
           ctx.shadowColor = p.color;
           ctx.stroke();
           ctx.shadowBlur = 0;
        }
      });
      ctx.globalAlpha = 1.0;

      balls.forEach(b => {
        if (b.tail.length > 2) {
          ctx.globalCompositeOperation = 'screen';
          
          // Outer sweeping energy arcs
          for (let trailNum = 0; trailNum < 3; trailNum++) {
              ctx.beginPath();
              
              // Calculate width of this specific trail arc
              const arcOffset = (trailNum - 1) * 0.8; // -0.8, 0, 0.8
              const perpX = -b.vy * arcOffset;
              const perpY = b.vx * arcOffset;
              
              ctx.moveTo(b.tail[0].x + perpX, b.tail[0].y + perpY);
              for (let i = 1; i < b.tail.length; i++) {
                 const progress = 1 - (i / b.tail.length);
                 // The trail converges towards the center line at the end
                 const offX = perpX * progress;
                 const offY = perpY * progress;
                 
                 // Smooth curve slightly outward
                 const curvePushX = -b.vy * Math.sin(progress * Math.PI) * 0.2 * (trailNum === 1 ? 0 : (trailNum === 0 ? 1 : -1));
                 const curvePushY = b.vx * Math.sin(progress * Math.PI) * 0.2 * (trailNum === 1 ? 0 : (trailNum === 0 ? 1 : -1));
                 
                 ctx.lineTo(b.tail[i].x + offX + curvePushX, b.tail[i].y + offY + curvePushY);
              }
              
              const gradient = ctx.createLinearGradient(b.x, b.y, b.tail[b.tail.length - 1].x, b.tail[b.tail.length - 1].y);
              gradient.addColorStop(0, 'rgba(255,255,255,0.8)'); // Hot white core
              gradient.addColorStop(0.1, b.glowColor);
              gradient.addColorStop(0.6, b.color);
              gradient.addColorStop(1, 'rgba(0,0,0,0)');
              
              ctx.strokeStyle = gradient;
              ctx.lineWidth = trailNum === 1 ? 3 : 1.5;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.shadowBlur = 10;
              ctx.shadowColor = b.glowColor;
              ctx.stroke();
          }
          ctx.shadowBlur = 0;
          ctx.globalCompositeOperation = 'source-over';
        }

        drawBeyblade(ctx, b, frames);
      });

      ctx.globalCompositeOperation = 'source-over';

      if (state.goalFlash > 0) {
         ctx.fillStyle = `rgba(255, 255, 255, ${state.goalFlash})`;
         ctx.fillRect(0, 0, width, height);
         state.goalFlash -= 0.03;
      }

      if (state.shake > 0) {
        ctx.restore();
      }

      state.frames++;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleStart = () => {
    audio.init();
    stateRef.current.status = 'sim';
    setStatus('sim');
    setMatchMinute(0);
    setScoreA(0);
    setScoreB(0);
    stateRef.current.scoreA = 0;
    stateRef.current.scoreB = 0;
    stateRef.current.timeTicker = 0;
    stateRef.current.hitStop = 0;
  };

  return (
    <div className="relative w-full h-full bg-[#010308] font-sans flex flex-col overflow-hidden select-none">
      
      {/* Top Header - Dreamy Stadium */}
      <div className="relative w-full h-[144px] shrink-0 flex shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-20 overflow-hidden">
         
         {/* Deep hazy background */}
         <div className="absolute inset-0 bg-gradient-to-b from-[#061530] to-[#02050a]"></div>
         
         {/* Floodlights (Radial Gradients) */}
         <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-400/20 blur-[40px] rounded-full mix-blend-screen"></div>
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-400/20 blur-[40px] rounded-full mix-blend-screen"></div>
         
         {/* Subtle cyber grid */}
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
         
         {/* Center Typography (Removed to make space) */}
         <div className="absolute inset-0 flex flex-col items-center justify-start z-30 pt-2 text-center pointer-events-none">
            {/* Subtle Ring Legends */}
            <div className="flex items-center justify-center gap-10 mt-1 opacity-60">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-[#ffcc00] shadow-[0_0_5px_#ffcc00]"></div>
                  <span className="text-[9px] text-white/80 uppercase tracking-wider">PRY DEFENSE</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/80 uppercase tracking-wider">FRA DEFENSE</span>
                  <div className="w-3 h-0.5 bg-[#ff3366] shadow-[0_0_5px_#ff3366]"></div>
               </div>
            </div>
         </div>

         {/* Left Character Silhouette - Hidden */}
         <div className="absolute bottom-0 left-[-20px] w-48 h-48 z-20 pointer-events-none opacity-0 drop-shadow-[5px_0_15px_rgba(0,0,0,1)]">
            <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Neymar&backgroundColor=transparent&skinColor=c0a392&hair=short16&hairColor=000000" className="w-full h-full object-cover object-bottom filter contrast-125 saturate-50 brightness-75 hue-rotate-15" alt="Player 1" />
         </div>
         
         {/* Right Character Silhouette - Hidden */}
         <div className="absolute bottom-0 right-[-20px] w-48 h-48 z-20 pointer-events-none opacity-0 drop-shadow-[-5px_0_15px_rgba(0,0,0,1)]">
            <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Tsubasa&backgroundColor=transparent&skinColor=f9c9b6&hair=short02&hairColor=000000" className="w-full h-full object-cover object-bottom transform -scale-x-100 filter contrast-125 saturate-50 brightness-75 hue-rotate-[-15deg]" alt="Player 2" />
         </div>
      </div>

      {/* Glossy Score Bar */}
      <div className="w-full h-16 bg-gradient-to-b from-[#0a0a0a] to-[#050505] border-b border-gray-800 flex items-center justify-center z-30 shrink-0 shadow-[0_5px_20px_rgba(0,0,0,0.8)] relative">
         
         <div className="flex items-center gap-8 z-10">
            {/* PRY Flag */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
               <img src="https://flagcdn.com/w160/py.png" className="w-full h-full object-cover scale-[1.3]" alt="Paraguay" />
               <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 to-transparent mix-blend-overlay"></div>
               <div className="absolute inset-0 rounded-full shadow-[inset_0_-3px_6px_rgba(0,0,0,0.6)]"></div>
               <div className="absolute top-[5%] left-[15%] w-1/2 h-1/3 bg-gradient-to-b from-white/60 to-transparent rounded-full blur-[1px]"></div>
            </div>
            
            <span className="text-4xl font-black text-white w-10 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{scoreA}</span>
            
            <span className="text-3xl font-black text-[#ff6600] drop-shadow-[0_0_12px_rgba(255,100,0,0.8)] w-16 text-center tracking-tighter">
               {matchMinute}'
            </span>
            
            <span className="text-4xl font-black text-white w-10 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{scoreB}</span>
            
            {/* FRA Flag */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
               <img src="https://flagcdn.com/w160/fr.png" className="w-full h-full object-cover scale-[1.3]" alt="France" />
               <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 to-transparent mix-blend-overlay"></div>
               <div className="absolute inset-0 rounded-full shadow-[inset_0_-3px_6px_rgba(0,0,0,0.6)]"></div>
               <div className="absolute top-[5%] left-[15%] w-1/2 h-1/3 bg-gradient-to-b from-white/60 to-transparent rounded-full blur-[1px]"></div>
            </div>
         </div>
         
         {/* Subtle center glow behind scores */}
         <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <div className="w-48 h-full bg-gradient-to-r from-transparent via-orange-500/10 to-transparent"></div>
         </div>
      </div>

      {/* Arena Canvas Container */}
      <div className="relative flex-grow w-full bg-[#010308] overflow-hidden">
         <canvas ref={canvasRef} className="block w-full h-full" />
         
         {/* Overlay Screens */}
         {status === 'pre' && (
           <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
             <button 
               onClick={handleStart}
               className="px-12 py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white font-black tracking-widest uppercase rounded-sm shadow-[0_0_30px_rgba(0,255,255,0.4)] active:scale-95 transition-all border border-cyan-300 transform -skew-x-12 hover:shadow-[0_0_40px_rgba(0,255,255,0.6)] group"
             >
               <span className="inline-block transform skew-x-12 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:scale-105 transition-transform">Simulate Match</span>
             </button>
           </div>
         )}

         {status === 'post' && (
           <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl">
             <h2 className="text-4xl font-black tracking-[0.3em] uppercase mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">Full Time</h2>
             <button 
               onClick={handleStart}
               className="px-10 py-3 bg-[#0a0a0a] text-gray-300 font-bold tracking-[0.2em] uppercase rounded-sm hover:text-white active:scale-95 transition-all border border-gray-600 transform -skew-x-12 shadow-[0_0_15px_rgba(0,0,0,1)]"
             >
               <span className="inline-block transform skew-x-12">Rematch</span>
             </button>
           </div>
         )}
      </div>

    </div>
  );
}
