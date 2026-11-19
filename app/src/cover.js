// Draws the Most Wanted cover: an aged-paper wanted board with three tall
// lineup panels, a red WANTED stamp, a bold editable headline and a reward line.
// Everything is drawn with the canvas 2D API — no fonts, logos or artwork files.

const SIZES = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  landscape: [1920, 1080],
};

export function exportSize(name) {
  return SIZES[name] ?? SIZES.square;
}

/** Deterministic speckle random, so the paper grain looks the same every draw. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPaper(ctx, w, h) {
  ctx.fillStyle = '#e9d6a4';
  ctx.fillRect(0, 0, w, h);
  const warm = ctx.createLinearGradient(0, 0, w, h);
  warm.addColorStop(0, 'rgba(255, 214, 130, 0.25)');
  warm.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  warm.addColorStop(1, 'rgba(120, 72, 20, 0.28)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, w, h);
  const rnd = mulberry32(20261119);
  for (let i = 0; i < Math.floor((w * h) / 900); i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 0.6 + rnd() * 2.2;
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(90, 55, 15, 0.10)' : 'rgba(255, 248, 220, 0.16)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Coffee-ring style stains, faint, for the aged-board feel.
  for (const [cx, cy, cr] of [[0.12, 0.86, 0.09], [0.9, 0.1, 0.07], [0.82, 0.94, 0.05]]) {
    ctx.strokeStyle = 'rgba(120, 75, 20, 0.10)';
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.beginPath();
    ctx.arc(w * cx, h * cy, w * cr, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Torn-paper edge: a darker frame line just inside the border.
  ctx.strokeStyle = 'rgba(70, 40, 10, 0.55)';
  ctx.lineWidth = Math.max(3, w * 0.006);
  ctx.strokeRect(w * 0.015, h * 0.015, w * 0.97, h * 0.97);
}

function fitCaption(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  }
  return size;
}

function drawStamp(ctx, w, y, height, tilt) {
  const text = 'WANTED';
  ctx.save();
  ctx.translate(w / 2, y + height / 2);
  if (tilt) ctx.rotate(-0.035);
  const size = fitCaption(ctx, text, w * 0.82, height * 0.82);
  ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  const tw = ctx.measureText(text).width;
  const padX = size * 0.28;
  const padY = size * 0.16;
  ctx.strokeStyle = '#a30f16';
  ctx.lineWidth = Math.max(4, size * 0.045);
  ctx.strokeRect(-tw / 2 - padX, -size * 0.62 - padY * 0.4, tw + padX * 2, size * 1.24 + padY * 0.8);
  ctx.strokeStyle = 'rgba(163, 15, 22, 0.75)';
  ctx.lineWidth = Math.max(2, size * 0.02);
  ctx.strokeRect(-tw / 2 - padX * 0.7, -size * 0.62 - padY * 0.1, tw + padX * 1.4, size * 1.24 + padY * 0.2);
  ctx.fillStyle = '#a30f16';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // A faint offset re-print, like a rubber stamp pressed twice.
  ctx.fillStyle = 'rgba(163, 15, 22, 0.35)';
  ctx.fillText(text, size * 0.03, size * 0.07);
  ctx.fillStyle = '#a30f16';
  ctx.fillText(text, 0, size * 0.04);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

function drawPanel(ctx, panel, x, y, pw, ph, index) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();
  ctx.fillStyle = '#241a12';
  ctx.fillRect(x, y, pw, ph);
  const img = panel && panel.img;
  if (img) {
    const zoom = panel.zoom || 1.15;
    const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * base;
    const dh = img.naturalHeight * base;
    const dx = x + (pw - dw) / 2 + (panel.ox || 0);
    const dy = y + (ph - dh) / 2 + (panel.oy || 0);
    ctx.drawImage(img, dx, dy, dw, dh);
    // Sunset / neon grade: warm orange from the top, magenta from the foot.
    const grade = ctx.createLinearGradient(0, y, 0, y + ph);
    grade.addColorStop(0, 'rgba(255, 140, 40, 0.16)');
    grade.addColorStop(0.55, 'rgba(255, 80, 120, 0.05)');
    grade.addColorStop(1, 'rgba(190, 30, 110, 0.28)');
    ctx.fillStyle = grade;
    ctx.fillRect(x, y, pw, ph);
    const vig = ctx.createRadialGradient(x + pw / 2, y + ph / 2, Math.min(pw, ph) * 0.35, x + pw / 2, y + ph / 2, Math.max(pw, ph) * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.32)');
    ctx.fillStyle = vig;
    ctx.fillRect(x, y, pw, ph);
  } else {
    ctx.fillStyle = '#3a2c1c';
    ctx.fillRect(x, y, pw, ph);
    ctx.fillStyle = 'rgba(243, 234, 210, 0.75)';
    ctx.font = `700 ${Math.max(14, pw * 0.07)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD PHOTO', x + pw / 2, y + ph / 2);
  }
  ctx.restore();
  // Heavy board frame + corner number tag.
  ctx.strokeStyle = '#1c130a';
  ctx.lineWidth = Math.max(4, pw * 0.02);
  ctx.strokeRect(x, y, pw, ph);
  const tag = `0${index + 1}`;
  const tagSize = Math.max(16, pw * 0.09);
  ctx.fillStyle = '#1c130a';
  ctx.fillRect(x, y, tagSize * 1.7, tagSize * 1.35);
  ctx.fillStyle = '#f3ead2';
  ctx.font = `900 ${tagSize}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, x + tagSize * 0.85, y + tagSize * 0.7);
  ctx.textBaseline = 'alphabetic';
}

function drawHeightMarks(ctx, x, y, ph, w) {
  // Short lineup ticks in the left margin only — no text, so nothing can
  // collide with the first panel.
  ctx.save();
  ctx.strokeStyle = 'rgba(60, 35, 10, 0.5)';
  ctx.lineWidth = Math.max(1, w * 0.0015);
  for (let i = 0; i < 3; i++) {
    const my = y + ph * (0.12 + i * 0.36);
    ctx.beginPath();
    ctx.moveTo(x, my);
    ctx.lineTo(x + w * 0.018, my);
    ctx.stroke();
  }
  ctx.restore();
}

/** Draws the whole wanted-board cover onto `canvas` from the editor `state`. */
export function drawWantedCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const panels = state.panels || [{}, {}, {}];
  drawPaper(ctx, w, h);

  const margin = w * 0.045;
  const headerH = h * 0.16;
  const footerTop = h * 0.80;
  drawStamp(ctx, w, h * 0.015, headerH, state.stamp !== false);

  // Lineup panels row.
  const gap = w * 0.018;
  const panelTop = h * 0.20;
  const panelH = footerTop - panelTop - h * 0.015;
  const panelW = (w - margin * 2 - gap * 2) / 3;
  for (let i = 0; i < 3; i++) {
    drawPanel(ctx, panels[i], margin + i * (panelW + gap), panelTop, panelW, panelH, i);
  }
  drawHeightMarks(ctx, margin * 0.35, panelTop, panelH, w);

  // Headline + reward line under the panels.
  const headline = (state.caption || 'MOST WANTED').trim().toUpperCase() || 'MOST WANTED';
  const baseSize = h * 0.085 * (state.captionSize || 1);
  const size = fitCaption(ctx, headline, w * 0.92, baseSize);
  const hy = footerTop + h * 0.075;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  if (state.shadow !== false) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = size * 0.14;
    ctx.shadowOffsetY = size * 0.06;
  }
  if (state.outline !== false) {
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = '#fff8e0';
    ctx.lineJoin = 'round';
    ctx.strokeText(headline, w / 2, hy);
  }
  ctx.fillStyle = state.captionColor || '#8f0f1e';
  ctx.fillText(headline, w / 2, hy);
  ctx.restore();

  const sub = (state.subcaption || '').trim().toUpperCase();
  if (sub) {
    const subSize = Math.max(13, h * 0.026);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `800 ${subSize}px Arial, sans-serif`;
    const sw = ctx.measureText(sub).width;
    ctx.fillStyle = '#1c130a';
    ctx.fillRect(w / 2 - sw / 2 - subSize * 0.7, hy + h * 0.018, sw + subSize * 1.4, subSize * 1.9);
    ctx.fillStyle = '#ffd970';
    ctx.fillText(sub, w / 2, hy + h * 0.018 + subSize * 1.38);
    ctx.restore();
  }

  // Footer strip.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(60, 35, 10, 0.8)';
  ctx.font = `700 ${Math.max(11, h * 0.016)}px Arial, sans-serif`;
  ctx.fillText('VICE CITY  •  POST NO BILLS  •  MADE WITH MOST WANTED', w / 2, h * 0.975);
  ctx.restore();
}
