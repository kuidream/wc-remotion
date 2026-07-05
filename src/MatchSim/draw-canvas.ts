import { hashFrame, mulberry32 } from "./random";
import { getRingArcs } from "./team-stats";
import type { Ball, GameState } from "./types";

export const drawArena = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
) => {
  const { x: cx, y: cy, radius: r } = state.arena;
  const frames = state.frames;

  ctx.lineWidth = 6;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const baseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  baseGrad.addColorStop(0, "#040b17");
  baseGrad.addColorStop(0.8, "#061326");
  baseGrad.addColorStop(1, "#02050a");
  ctx.fillStyle = baseGrad;
  ctx.fill();

  ctx.shadowBlur = 40;
  ctx.shadowColor = "rgba(0, 150, 255, 0.4)";
  ctx.strokeStyle = "rgba(20, 40, 80, 0.8)";
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.lineCap = "round";
  ctx.globalCompositeOperation = "screen";

  const drawRing = (
    radius: number,
    color: string,
    startAngle: number,
    endAngle: number,
    width: number,
    blur: number,
  ) => {
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
  const arcs = getRingArcs(state.teamStats, slowSpin, state.ringBonuses);

  drawRing(r - 10, "#006847", arcs.mexOuterStart, arcs.mexOuterEnd, 3, 15);
  drawRing(r - 10, "#cf081f", arcs.engOuterStart, arcs.engOuterEnd, 3, 15);
  drawRing(
    r - 30,
    "#22c55e",
    arcs.mexInnerStart,
    arcs.mexInnerEnd,
    2,
    10,
  );
  drawRing(
    r - 30,
    "#fca5a5",
    arcs.engInnerStart,
    arcs.engInnerEnd,
    2,
    10,
  );

  ctx.globalCompositeOperation = "source-over";

  const pAngle = state.arena.pocketAngle;
  const pWidth = state.arena.pocketWidth;
  const goalDepth = 25;

  const p1Angle = pAngle - pWidth / 2;
  const p2Angle = pAngle + pWidth / 2;

  const start1X = cx + Math.cos(p1Angle) * r;
  const start1Y = cy + Math.sin(p1Angle) * r;
  const start2X = cx + Math.cos(p2Angle) * r;
  const start2Y = cy + Math.sin(p2Angle) * r;
  const end1X = cx + Math.cos(p1Angle) * (r + goalDepth);
  const end1Y = cy + Math.sin(p1Angle) * (r + goalDepth);

  ctx.save();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  const radialLines = 8;
  for (let i = 1; i < radialLines; i++) {
    const t = i / radialLines;
    ctx.moveTo(
      cx + Math.cos(p1Angle + pWidth * t) * r,
      cy + Math.sin(p1Angle + pWidth * t) * r,
    );
    ctx.lineTo(
      cx + Math.cos(p1Angle + pWidth * t) * (r + goalDepth),
      cy + Math.sin(p1Angle + pWidth * t) * (r + goalDepth),
    );
  }
  const arcLines = 4;
  for (let i = 1; i <= arcLines; i++) {
    const t = i / arcLines;
    ctx.moveTo(
      cx + Math.cos(p1Angle) * (r + goalDepth * t),
      cy + Math.sin(p1Angle) * (r + goalDepth * t),
    );
    ctx.arc(cx, cy, r + goalDepth * t, p1Angle, p2Angle);
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(start1X, start1Y);
  ctx.lineTo(end1X, end1Y);
  ctx.arc(cx, cy, r + goalDepth, p1Angle, p2Angle);
  ctx.lineTo(start2X, start2Y);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#00ffff";
  ctx.lineCap = "square";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r, p1Angle - 0.04, p1Angle + 0.01);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r, p2Angle - 0.01, p2Angle + 0.04);
  ctx.stroke();

  ctx.restore();
};

export const drawBeyblade = (
  ctx: CanvasRenderingContext2D,
  b: Ball,
  flags: { mx: HTMLImageElement | null; eng: HTMLImageElement | null },
) => {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.rotation);

  ctx.shadowBlur = 10;
  ctx.shadowColor = b.glowColor;

  const segments = 4;
  const ringWidth = b.radius * 0.2;
  ctx.lineWidth = ringWidth;

  for (let i = 0; i < segments; i++) {
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      b.radius - ringWidth / 2,
      (i * Math.PI * 2) / segments,
      ((i + 1) * Math.PI * 2) / segments,
    );
    ctx.strokeStyle = i % 2 === 0 ? b.color : b.coreColor;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(0, 0, b.radius - ringWidth, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#111";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, b.radius - ringWidth - 1, 0, Math.PI * 2);
  const metalGrad = ctx.createLinearGradient(
    -b.radius,
    -b.radius,
    b.radius,
    b.radius,
  );
  if (b.id === "MEX") {
    metalGrad.addColorStop(0, "#ce1126");
    metalGrad.addColorStop(0.5, "#006847");
    metalGrad.addColorStop(1, "#ffffff");
  } else {
    metalGrad.addColorStop(0, "#cf081f");
    metalGrad.addColorStop(0.5, "#ffffff");
    metalGrad.addColorStop(1, "#00247d");
  }
  ctx.fillStyle = metalGrad;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, b.radius * 0.55, 0, Math.PI * 2);
  ctx.clip();

  const flagImg = b.id === "MEX" ? flags.mx : flags.eng;
  if (flagImg && flagImg.complete && flagImg.naturalWidth > 0) {
    ctx.rotate(-b.rotation);
    ctx.drawImage(
      flagImg,
      -b.radius * 0.55,
      -b.radius * 0.55,
      b.radius * 1.1,
      b.radius * 1.1,
    );
  } else {
    ctx.fillStyle = b.id === "MEX" ? "#006847" : "#cf081f";
    ctx.fill();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(0, 0, b.radius * 0.55, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(0, 0, b.radius * 0.58, -0.3, 0.3);
  ctx.arc(0, 0, b.radius * 0.4, 0.3, -0.3, true);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, b.radius * 0.58, Math.PI - 0.3, Math.PI + 0.3);
  ctx.arc(0, 0, b.radius * 0.4, Math.PI + 0.3, Math.PI - 0.3, true);
  ctx.fill();
  ctx.restore();
};

export const drawGameCanvas = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  flags: { mx: HTMLImageElement | null; eng: HTMLImageElement | null },
  shakeOffset: { x: number; y: number },
) => {
  const { width, height, balls, particles } = state;

  ctx.save();
  ctx.translate(shakeOffset.x, shakeOffset.y);

  ctx.clearRect(0, 0, width, height);

  drawArena(ctx, state);

  state.players.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle =
      p.team === "MEX"
        ? p.type === "forward"
          ? "#22c55e"
          : "#006847"
        : p.type === "forward"
          ? "#fca5a5"
          : "#cf081f";

    if (p.cooldown < 30) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.fillStyle as string;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  state.lightnings.forEach((l) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(l.startX, l.startY);

    const steps = 4;
    const dx = (l.endX - l.startX) / steps;
    const dy = (l.endY - l.startY) / steps;
    let curX = l.startX;
    let curY = l.startY;
    const rand = mulberry32(l.jitterSeed);

    for (let i = 1; i < steps; i++) {
      curX += dx + (rand() - 0.5) * 30;
      curY += dy + (rand() - 0.5) * 30;
      ctx.lineTo(curX, curY);
    }
    ctx.lineTo(l.endX, l.endY);

    ctx.strokeStyle = "#ffffff";
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

  ctx.globalCompositeOperation = "screen";

  particles.forEach((p) => {
    if (p.type === "spore") {
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
    } else if (p.type === "spark") {
      const progress = p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, 1 - Math.pow(progress, 1.5));
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 8, p.y - p.vy * 8);

      ctx.lineWidth = p.size * 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.stroke();

      ctx.lineWidth = p.size * 0.8;
      ctx.strokeStyle = "#ffffff";
      ctx.shadowBlur = 0;
      ctx.stroke();
    } else if (p.type === "shockwave") {
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

  balls.forEach((b) => {
    if (b.tail.length > 2) {
      ctx.globalCompositeOperation = "screen";

      for (let trailNum = 0; trailNum < 3; trailNum++) {
        ctx.beginPath();

        const arcOffset = (trailNum - 1) * 0.8;
        const perpX = -b.vy * arcOffset;
        const perpY = b.vx * arcOffset;

        ctx.moveTo(b.tail[0].x + perpX, b.tail[0].y + perpY);
        for (let i = 1; i < b.tail.length; i++) {
          const progress = 1 - i / b.tail.length;
          const offX = perpX * progress;
          const offY = perpY * progress;

          const curvePushX =
            -b.vy *
            Math.sin(progress * Math.PI) *
            0.2 *
            (trailNum === 1 ? 0 : trailNum === 0 ? 1 : -1);
          const curvePushY =
            b.vx *
            Math.sin(progress * Math.PI) *
            0.2 *
            (trailNum === 1 ? 0 : trailNum === 0 ? 1 : -1);

          ctx.lineTo(
            b.tail[i].x + offX + curvePushX,
            b.tail[i].y + offY + curvePushY,
          );
        }

        const gradient = ctx.createLinearGradient(
          b.x,
          b.y,
          b.tail[b.tail.length - 1].x,
          b.tail[b.tail.length - 1].y,
        );
        gradient.addColorStop(0, "rgba(255,255,255,0.8)");
        gradient.addColorStop(0.1, b.glowColor);
        gradient.addColorStop(0.6, b.color);
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = trailNum === 1 ? 3 : 1.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.glowColor;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
    }

    drawBeyblade(ctx, b, flags);
  });

  ctx.globalCompositeOperation = "source-over";

  if (state.goalFlash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${state.goalFlash})`;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
};

export const getShakeOffset = (
  state: GameState,
  frame: number,
): { x: number; y: number } => {
  if (state.shake <= 0) return { x: 0, y: 0 };
  const rand = mulberry32(hashFrame(777, frame));
  return {
    x: (rand() - 0.5) * state.shake,
    y: (rand() - 0.5) * state.shake,
  };
};
