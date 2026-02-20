const AMBER = '#F5AF28';
const BLUE = '#3c91e6';

/**
 * Draw a mini waveform graph for the path context-menu readout.
 * Left of playpoint is polarity-colored; right is dimmed gray.
 */
export function drawMiniWaveform(
  ctx: CanvasRenderingContext2D,
  samples: readonly number[],
  width: number,
  height: number,
  playpoint: number,
): void {
  ctx.clearRect(0, 0, width, height);

  const len = samples.length;
  if (len === 0) return;

  const centerY = height / 2;
  const halfH = height / 2 - 2; // 2px padding top/bottom

  // --- center line ---
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();

  // --- helper: sample index → pixel x ---
  const xOf = (i: number) => (i / (len - 1)) * width;
  const yOf = (v: number) => centerY - (v / 100) * halfH;

  const playX = xOf(playpoint);

  // --- polarity gradient for filled area ---
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, AMBER);
  grad.addColorStop(0.5, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, BLUE);

  // --- left of playpoint: colored fill + stroke ---
  if (playpoint > 0) {
    const endIdx = Math.min(playpoint + 1, len);

    // filled area
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, playX, height);
    ctx.clip();

    ctx.beginPath();
    ctx.moveTo(xOf(0), centerY);
    for (let i = 0; i < endIdx; i++) {
      ctx.lineTo(xOf(i), yOf(samples[i]));
    }
    ctx.lineTo(xOf(endIdx - 1), centerY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.15;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // stroke
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, playX, height);
    ctx.clip();

    ctx.beginPath();
    for (let i = 0; i < endIdx; i++) {
      if (i === 0) ctx.moveTo(xOf(i), yOf(samples[i]));
      else ctx.lineTo(xOf(i), yOf(samples[i]));
    }
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.9;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // --- right of playpoint: dimmed gray ---
  if (playpoint < len - 1) {
    const startIdx = Math.max(playpoint, 0);

    ctx.save();
    ctx.beginPath();
    ctx.rect(playX, 0, width - playX, height);
    ctx.clip();

    ctx.beginPath();
    for (let i = startIdx; i < len; i++) {
      if (i === startIdx) ctx.moveTo(xOf(i), yOf(samples[i]));
      else ctx.lineTo(xOf(i), yOf(samples[i]));
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // --- playpoint indicator ---
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(playX, 0);
  ctx.lineTo(playX, height);
  ctx.stroke();
}
