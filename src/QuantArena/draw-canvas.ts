import { hashFrame, mulberry32 } from "../MatchSim/random";
import { COIN_RADIUS } from "./constants";
import type { Ball, GameState } from "./types";

export const drawArena = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
) => {
  const { x: cx, y: cy, radius: r } = state.arena;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const baseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  baseGrad.addColorStop(0, "#040b17");
  baseGrad.addColorStop(0.75, "#061326");
  baseGrad.addColorStop(1, "#02050a");
  ctx.fillStyle = baseGrad;
  ctx.fill();

  ctx.shadowBlur = 36;
  ctx.shadowColor = "rgba(0, 150, 255, 0.35)";
  ctx.strokeStyle = "rgba(20, 40, 80, 0.85)";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 雷达网格（保留原设计氛围，无玩法环）
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "rgba(100, 180, 255, 0.5)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (r * i) / 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
};

const drawIndexField = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
) => {
  const { x, y, radius } = state.indexField;
  const pulse = 0.85 + Math.sin(state.frames * 0.05) * 0.15;

  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.2);
  glow.addColorStop(0, "rgba(239, 68, 68, 0.35)");
  glow.addColorStop(0.55, "rgba(239, 68, 68, 0.12)");
  glow.addColorStop(1, "rgba(239, 68, 68, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.2 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
  const core = ctx.createRadialGradient(x, y, 0, x, y, radius);
  core.addColorStop(0, "rgba(127, 29, 29, 0.95)");
  core.addColorStop(0.65, "rgba(185, 28, 28, 0.85)");
  core.addColorStop(1, "rgba(239, 68, 68, 0.55)");
  ctx.fillStyle = core;
  ctx.fill();

  ctx.strokeStyle = "rgba(252, 165, 165, 0.9)";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#ef4444";
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("大盘引力场", x, y);
  ctx.restore();
};

const drawHazards = (ctx: CanvasRenderingContext2D, state: GameState) => {
  state.hazards.forEach((h) => {
    const fade = Math.min(1, h.life / 40, (h.maxLife - h.life) / 30);
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    ctx.globalAlpha = 0.55 + fade * 0.45;

    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ef4444";
    ctx.strokeRect(-h.w / 2, -h.h / 2, h.w, h.h);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(127, 29, 29, 0.35)";
    ctx.fillRect(-h.w / 2, -h.h / 2, h.w, h.h);

    ctx.fillStyle = "rgba(254, 202, 202, 0.95)";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(h.label, 0, 0);
    ctx.restore();
  });
};

const drawCoins = (ctx: CanvasRenderingContext2D, state: GameState) => {
  state.coins.forEach((c) => {
    const pulse = 1 + Math.sin(c.pulse) * 0.12;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(pulse, pulse);

    ctx.beginPath();
    ctx.arc(0, 0, COIN_RADIUS + 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(16, 185, 129, 0.18)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, COIN_RADIUS, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(-2, -2, 1, 0, 0, COIN_RADIUS);
    grad.addColorStop(0, "#d1fae5");
    grad.addColorStop(0.45, "#10b981");
    grad.addColorStop(1, "#047857");
    ctx.fillStyle = grad;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#10b981";
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, COIN_RADIUS * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();
    ctx.restore();
  });
};

export const drawAssetBall = (ctx: CanvasRenderingContext2D, b: Ball) => {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.rotation);

  if (b.stun > 0) {
    ctx.globalAlpha = 0.7 + Math.sin(b.stun * 0.4) * 0.2;
  }

  ctx.shadowBlur = 12;
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
  if (b.id === "BTC") {
    metalGrad.addColorStop(0, "#fbbf24");
    metalGrad.addColorStop(0.5, "#f7931a");
    metalGrad.addColorStop(1, "#fff7ed");
  } else {
    metalGrad.addColorStop(0, "#a5b4fc");
    metalGrad.addColorStop(0.5, "#627eea");
    metalGrad.addColorStop(1, "#eef2ff");
  }
  ctx.fillStyle = metalGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, b.radius * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = b.id === "BTC" ? "#92400e" : "#312e81";
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(b.radius * 0.55)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.rotate(-b.rotation);
  ctx.fillText(b.id === "BTC" ? "B" : "E", 0, 1);

  ctx.beginPath();
  ctx.arc(0, 0, b.radius * 0.52, 0, Math.PI * 2);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.restore();

  if (b.stun > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(239,68,68,${0.35 + (b.stun / b.stunFrames) * 0.45})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
};

export const drawGameCanvas = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  shakeOffset: { x: number; y: number },
) => {
  const { width, height, balls, particles } = state;

  ctx.save();
  ctx.translate(shakeOffset.x, shakeOffset.y);
  ctx.clearRect(0, 0, width, height);

  drawArena(ctx, state);
  drawIndexField(ctx, state);
  drawHazards(ctx, state);
  drawCoins(ctx, state);

  ctx.globalCompositeOperation = "screen";
  particles.forEach((p) => {
    if (p.type === "spore") {
      const pulse = (Math.sin(p.life * 0.05) + 1) * 0.5;
      ctx.globalAlpha = 0.1 + pulse * 0.4;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "spark" || p.type === "coinBurst") {
      const progress = p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, 1 - Math.pow(progress, 1.5));
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 7, p.y - p.vy * 7);
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
      ctx.shadowBlur = 18;
      ctx.shadowColor = p.color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  });
  ctx.globalAlpha = 1;

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
          ctx.lineTo(
            b.tail[i].x + perpX * progress,
            b.tail[i].y + perpY * progress,
          );
        }
        const gradient = ctx.createLinearGradient(
          b.x,
          b.y,
          b.tail[b.tail.length - 1].x,
          b.tail[b.tail.length - 1].y,
        );
        gradient.addColorStop(0, "rgba(255,255,255,0.75)");
        gradient.addColorStop(0.15, b.glowColor);
        gradient.addColorStop(0.65, b.color);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = trailNum === 1 ? 3 : 1.4;
        ctx.lineCap = "round";
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.glowColor;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
    }
    drawAssetBall(ctx, b);
  });

  if (state.collectFlash > 0) {
    ctx.fillStyle = `rgba(16, 185, 129, ${state.collectFlash * 0.3})`;
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
