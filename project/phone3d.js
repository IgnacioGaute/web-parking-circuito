// <phone-3d> — real three.js iPhone with drag-to-orbit, idle float and
// canvas-texture app screens. No import map needed: three is pulled in by
// full URL, and the orbit interaction is hand-rolled (~40 lines) instead of
// loading the OrbitControls addon, which resolves a bare "three" specifier.
const THREE_URL = 'https://unpkg.com/three@0.184.0/build/three.module.js';

const C = {
  bg: '#0a0b0d', card: '#121317', input: '#151619', inputAlt: '#17181d',
  border: 'rgba(255,255,255,0.08)', dash: 'rgba(255,255,255,0.16)',
  text: '#e6e7ea', muted: '#8b8d97', dim: '#5b5d66',
  accent: '#d9a441', accentSoft: 'rgba(217,164,65,0.18)', accentSofter: 'rgba(217,164,65,0.09)',
  green: '#34d399', greenSoft: 'rgba(52,211,153,0.14)',
  error: '#f0616e', errorSoft: 'rgba(240,97,110,0.14)',
};
const SANS = 'Manrope, system-ui, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const W = 452, H = 980;

function pen(ctx) {
  const api = {
    rr(x, y, w, h, r, fill, stroke, dashed) {
      ctx.beginPath();
      const rad = Math.min(r, w / 2, h / 2);
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + w, y, x + w, y + h, rad);
      ctx.arcTo(x + w, y + h, x, y + h, rad);
      ctx.arcTo(x, y + h, x, y, rad);
      ctx.arcTo(x, y, x + w, y, rad);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) {
        ctx.strokeStyle = stroke; ctx.lineWidth = 2;
        ctx.setLineDash(dashed ? [5, 5] : []);
        ctx.stroke(); ctx.setLineDash([]);
      }
      return api;
    },
    card(x, y, w, h, opts) {
      const o = opts || {};
      return api.rr(x, y, w, h, o.r || 20, o.fill || C.card, o.stroke || C.border, o.dashed);
    },
    t(str, x, y, o) {
      const s = o || {};
      ctx.fillStyle = s.color || C.text;
      ctx.textAlign = s.align || 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = (s.weight || 600) + ' ' + (s.size || 15) + 'px ' + (s.font || SANS);
      if (s.track) {
        // manual letter-spacing for plates / eyebrow labels
        const chars = String(str).split('');
        let total = 0;
        chars.forEach((ch) => { total += ctx.measureText(ch).width + s.track; });
        total -= s.track;
        let cx = s.align === 'right' ? x - total : s.align === 'center' ? x - total / 2 : x;
        ctx.textAlign = 'left';
        chars.forEach((ch) => { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + s.track; });
      } else {
        ctx.fillText(str, x, y);
      }
      return api;
    },
    dot(x, y, r, fill) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill(); return api;
    },
    ring(x, y, r, color, width) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = color; ctx.lineWidth = width || 2; ctx.stroke(); return api;
    },
    pill(x, y, label, color, bg) {
      ctx.font = '700 13px ' + SANS;
      const w = ctx.measureText(label).width + 24;
      api.rr(x, y, w, 26, 13, bg);
      api.t(label, x + 12, y + 18, { size: 13, weight: 700, color });
      return w;
    },
  };
  return api;
}

function statusBar(p) {
  p.t('9:41', 26, 42, { size: 15, weight: 700, font: MONO });
  p.rr(W - 74, 30, 20, 13, 2, 'rgba(255,255,255,.55)');
  p.rr(W - 48, 28, 24, 15, 4, 'rgba(255,255,255,.28)');
  p.rr(W - 46, 30, 17, 11, 3, C.text);
}

function navBar(p, active) {
  const items = ['Registrar', 'Dentro', 'Frecuentes', 'Historial', 'Stats', 'Usuarios'];
  const map = [0, 1, 2, 3, 4, 5];
  p.rr(0, H - 92, W, 92, 0, C.bg);
  p.rr(0, H - 92, W, 1, 0, C.border);
  const slot = W / items.length;
  items.forEach((label, i) => {
    const on = map[i] === active;
    const cx = slot * i + slot / 2;
    const col = on ? C.accent : C.dim;
    if (on) p.rr(cx - 20, H - 88, 40, 3, 2, C.accent);
    if (i === 0) p.rr(cx - 9, H - 74, 18, 18, 5, null, col);
    else if (i === 1) { const c = p; c.dot(cx, H - 65, 9, 'rgba(0,0,0,0)'); ctxRing(p, cx, H - 65, 9, col); }
    else if (i === 2) star(p, cx, H - 65, 10, col);
    else if (i === 3) p.rr(cx - 8, H - 73, 16, 16, 3, null, col);
    else if (i === 4) bars(p, cx, H - 65, col);
    else people(p, cx, H - 65, col);
    p.t(label, cx, H - 40, { size: 11, weight: 700, color: col, align: 'center' });
  });
  p.rr(W / 2 - 60, H - 16, 120, 5, 3, 'rgba(255,255,255,.22)');
}

let CTX = null;
function ctxRing(p, x, y, r, color) {
  CTX.beginPath(); CTX.arc(x, y, r, 0, Math.PI * 2);
  CTX.strokeStyle = color; CTX.lineWidth = 2.2; CTX.stroke();
}
function star(p, x, y, r, color) {
  CTX.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.45 : r;
    CTX[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  CTX.closePath(); CTX.strokeStyle = color; CTX.lineWidth = 2; CTX.stroke();
}
function bars(p, x, y, color) {
  [[-8, 6], [-1, 12], [6, 18]].forEach(([dx, h]) => p.rr(x + dx, y + 8 - h, 5, h, 2, color));
}
function people(p, x, y, color) {
  ctxRing(p, x - 4, y - 4, 4.5, color);
  CTX.beginPath(); CTX.arc(x - 4, y + 8, 8, Math.PI, 0); CTX.strokeStyle = color; CTX.lineWidth = 2; CTX.stroke();
  ctxRing(p, x + 7, y - 5, 3.5, color);
}

// ---- 00 · Login (operator picker → PIN pad) ------------------------------
// The one screen in the tour that isn't behind the bottom tab bar — matches
// how the real app looks before an operator has signed in for their shift.
function screenLogin(p) {
  // Brand — same mark/wordmark as the header, centered like the real
  // pre-login screen (LoginBrand.tsx).
  p.rr(W / 2 - 34, 70, 68, 68, 19, C.accent);
  p.rr(W / 2 - 20, 100, 40, 8, 4, C.bg);
  CTX.save();
  CTX.translate(W / 2, 104);
  CTX.rotate((-24 * Math.PI) / 180);
  CTX.fillStyle = C.bg;
  CTX.fillRect(-20, -4, 40, 8);
  CTX.restore();
  p.t('Control de Estacionamiento', W / 2, 178, { size: 22, weight: 800, align: 'center' });
  const sysW = p.pill(W / 2 - 62, 196, 'Sistema activo', C.green, C.greenSoft);
  void sysW;
  p.dot(W / 2 - 62 + 20, 209, 3, C.green);

  // Back link + selected operator, same header PinPad.tsx shows once a
  // turno is chosen — depicts the PIN step, the more distinctive of the
  // two login screens (the operator list is plain text rows, already
  // implied by "Seleccioná tu turno").
  p.pill(20, 250, '‹  Cambiar turno', C.dim, C.card);
  p.rr(W / 2 - 96, 300, 52, 52, 15, C.accentSoft);
  p.t('IG', W / 2 - 70, 333, { size: 16, weight: 700, font: MONO, color: C.accent, align: 'center' });
  p.t('Ignacio G.', W / 2 - 30, 332, { size: 20, weight: 800, align: 'left' });

  // 4-digit PIN dots — two filled, mid-entry.
  const dotsY = 400;
  for (let i = 0; i < 4; i++) {
    const cx = W / 2 - 42 + i * 28;
    if (i < 2) p.dot(cx, dotsY, 8, C.accent);
    else p.ring(cx, dotsY, 8, C.dash, 1.6);
  }
  p.t('PIN de prueba: 1234', W / 2, 432, { size: 13, weight: 600, color: C.dim, align: 'center' });

  // Numeric keypad — 1–9, 0, back.
  const layout = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  const margin = 20, gap = 14, cols = 3;
  const btnW = (W - margin * 2 - gap * (cols - 1)) / cols;
  const btnH = 88;
  const gridTop = 462;
  layout.forEach((label, i) => {
    if (!label) return;
    const col = i % 3, row = Math.floor(i / 3);
    const x = margin + col * (btnW + gap);
    const y = gridTop + row * (btnH + gap);
    p.rr(x, y, btnW, btnH, 16, C.input, C.border);
    p.t(label, x + btnW / 2, y + btnH / 2 + 9, {
      size: label === '⌫' ? 22 : 26, weight: 600, font: MONO, color: C.text, align: 'center',
    });
  });
}

function screenRegistrar(p) {
  p.t('TURNO ACTIVO', 24, 100, { size: 11, weight: 700, color: C.dim, track: 1.2 });
  p.t('Ignacio G.', 24, 124, { size: 19, weight: 800 });
  p.t('09:41', W - 24, 122, { size: 24, weight: 700, color: C.accent, font: MONO, align: 'right' });
  const stats = [['DENTRO', '24', true], ['HOY', '86', false], ['PROM.', '1h 12m', false]];
  stats.forEach(([label, value, accent], i) => {
    const x = 20 + i * ((W - 40 - 20) / 3 + 10), w = (W - 40 - 20) / 3;
    p.card(x, 148, w, 88, { r: 19 });
    if (accent) p.dot(x + w - 6, 152, 30, C.accentSofter);
    p.t(label, x + 14, 174, { size: 11, weight: 700, color: C.dim, track: .8 });
    p.rr(x + w - 42, 160, 28, 28, 9, accent ? C.accentSoft : C.inputAlt);
    p.t(value, x + 14, 218, { size: value.length > 3 ? 19 : 26, weight: 700, font: MONO, color: accent ? C.accent : C.text });
  });
  p.card(20, 250, W - 40, 320, { r: 22 });
  p.t('Nueva entrada', 38, 282, { size: 14, weight: 700, color: C.muted });
  p.rr(36, 296, W - 72, 60, 15, C.input, 'rgba(217,164,65,.5)');
  p.t('AB 421 KJ', 54, 336, { size: 25, weight: 700, font: MONO, track: 2.4 });
  p.rr(36, 368, (W - 82) / 2, 46, 14, C.accentSoft);
  p.t('Auto', 36 + (W - 82) / 4, 397, { size: 15, weight: 700, color: C.accent, align: 'center' });
  p.rr(46 + (W - 82) / 2, 368, (W - 82) / 2, 46, 14, C.inputAlt);
  p.t('Moto', 46 + (W - 82) * 0.75, 397, { size: 15, weight: 700, color: C.muted, align: 'center' });
  p.rr(36, 426, W - 72, 48, 14, C.input, C.dash, true);
  p.t('Cochera  (opcional)', 54, 456, { size: 14, weight: 600, color: C.dim });
  p.rr(36, 488, W - 72, 56, 16, C.accent);
  p.t('Registrar entrada', W / 2, 523, { size: 17, weight: 800, color: C.bg, align: 'center' });
  p.card(20, 586, W - 40, 84, { r: 22 });
  p.t('¿Es frecuente?', 38, 618, { size: 15, weight: 700 });
  p.t('Buscar por placa o nombre', 38, 642, { size: 13, weight: 600, color: C.dim });
  p.rr(W - 74, 612, 34, 34, 11, C.accentSoft);
  p.t('↗', W - 57, 636, { size: 16, weight: 800, color: C.accent, align: 'center' });
}

function screenDentro(p) {
  p.rr(20, 78, W - 40, 50, 14, C.input, C.border);
  p.t('Buscar placa…', 40, 110, { size: 15, weight: 600, color: C.dim });
  p.t('24 VEHÍCULOS DENTRO', 22, 156, { size: 11, weight: 700, color: C.dim, track: .8 });
  p.t('1 ATENCIÓN', W - 22, 156, { size: 11, weight: 700, color: C.error, align: 'right', track: .8 });
  const rows = [
    ['MJ 018 TR', 'Auto · hace 4h 12m', 'Atención', true],
    ['AB 421 KJ', 'Auto · Cochera B4', '32m', false],
    ['A 032 PLM', 'Moto · hace 8m', '8m', false],
  ];
  rows.forEach(([plate, meta, tag, alert], i) => {
    const y = 176 + i * 152;
    p.card(20, y, W - 40, 136, { r: 22, stroke: alert ? 'rgba(240,97,110,.38)' : C.border });
    p.t(plate, 38, y + 34, { size: 20, weight: 700, font: MONO, track: 1.4 });
    if (alert) {
      const w = p.pill(W - 38 - 92, y + 12, 'Atención', C.error, C.errorSoft);
      void w;
    } else {
      p.t(tag, W - 38, y + 32, { size: 14, weight: 600, font: MONO, color: C.green, align: 'right' });
    }
    p.t(meta, 38, y + 60, { size: 13, weight: 600, color: C.muted });
    p.rr(38, y + 76, W - 76, 44, 13, null, C.dash);
    p.t('Registrar salida', W / 2, y + 104, { size: 15, weight: 700, align: 'center' });
  });
}

function screenFrecuentes(p) {
  p.t('Frecuentes', 22, 106, { size: 21, weight: 800 });
  p.rr(20, 124, W - 40, 48, 14, C.input, C.border);
  p.t('Buscar placa o nombre…', 40, 154, { size: 14, weight: 600, color: C.dim });
  const rows = [
    ['12', 'AB 421 KJ', 'Marcela R. · última: hoy 08:14', true],
    ['7', 'KLM 774', 'Depósito 3 · última: ayer 19:40', false],
    ['4', 'A 032 PLM', 'Moto · última: lun 07:55', false],
  ];
  rows.forEach(([n, plate, meta, hot], i) => {
    const y = 192 + i * 108;
    p.card(20, y, W - 40, 92, { r: 22, stroke: hot ? 'rgba(217,164,65,.3)' : C.border });
    p.rr(38, y + 24, 46, 46, 14, hot ? C.accentSoft : C.inputAlt);
    p.t(n, 61, y + 55, { size: 16, weight: 700, font: MONO, color: hot ? C.accent : C.muted, align: 'center' });
    p.t(plate, 98, y + 42, { size: 18, weight: 700, font: MONO, track: 1.2 });
    p.t(meta, 98, y + 66, { size: 12.5, weight: 600, color: C.muted });
    p.t('›', W - 40, y + 54, { size: 20, weight: 700, color: hot ? C.accent : C.dim, align: 'right' });
  });
  p.rr(20, 528, W - 40, 62, 18, null, C.dash, true);
  p.t('Entrada en un toque desde la ficha', W / 2, 565, { size: 13.5, weight: 600, color: C.dim, align: 'center' });
}

function screenHistorial(p) {
  p.t('Historial', 22, 106, { size: 21, weight: 800 });
  p.rr(W - 84, 82, 64, 30, 15, C.accentSoft);
  p.t('PDF', W - 52, 102, { size: 13, weight: 700, color: C.accent, align: 'center' });
  p.rr(20, 126, W - 140, 44, 13, C.input, C.border);
  p.t('Buscar…', 38, 154, { size: 14, weight: 600, color: C.dim });
  p.rr(W - 112, 126, 92, 44, 13, C.input, C.border);
  p.t('Filtros', W - 66, 154, { size: 14, weight: 600, color: C.muted, align: 'center' });
  const groups = [
    ['HOY · 86 REGISTROS', [['AB 421 KJ', '08:14 → 09:46', '1h 32m'], ['KLM 774', '07:52 → 12:05', '4h 13m']]],
    ['AYER · 91 REGISTROS', [['A 032 PLM', '18:20 → 19:40', '1h 20m'], ['MJ 018 TR', '14:02 → 15:11', '1h 09m']]],
  ];
  let y = 206;
  groups.forEach(([title, rows]) => {
    p.t(title, 22, y, { size: 11, weight: 700, color: C.dim, track: .8 });
    y += 14;
    rows.forEach(([plate, span, dur]) => {
      p.card(20, y, W - 40, 74, { r: 18 });
      p.t(plate, 38, y + 32, { size: 17, weight: 700, font: MONO });
      p.t(span, 38, y + 56, { size: 12.5, weight: 600, color: C.dim, font: MONO });
      p.t(dur, W - 38, y + 44, { size: 14, weight: 600, color: C.muted, font: MONO, align: 'right' });
      y += 86;
    });
    y += 18;
  });
  p.rr(20, y, W - 40, 48, 14, null, C.dash);
  p.t('Cargar más', W / 2, y + 30, { size: 14, weight: 700, color: C.muted, align: 'center' });
}

function screenStats(p) {
  p.t('Estadísticas', 22, 106, { size: 21, weight: 800 });
  [['Movimientos', '1.284'], ['Pico', '18h']].forEach(([label, value], i) => {
    const w = (W - 50) / 2, x = 20 + i * (w + 10);
    p.card(x, 126, w, 92, { r: 19 });
    p.t(label, x + 16, 154, { size: 13, weight: 600, color: C.muted });
    p.rr(x + w - 50, 140, 32, 32, 10, C.accentSoft);
    p.t(value, x + 16, 198, { size: 28, weight: 800 });
  });
  p.card(20, 232, W - 40, 158, { r: 22 });
  p.t('Actividad por hora', 38, 262, { size: 13, weight: 700, color: C.muted });
  const pts = [62, 50, 54, 32, 38, 16, 26, 10, 22];
  const ghost = [68, 64, 66, 58, 60, 50, 56, 46, 52];
  const plot = (arr, color, width) => {
    CTX.beginPath();
    arr.forEach((v, i) => {
      const x = 42 + (i * (W - 104)) / (arr.length - 1);
      const y = 290 + v * 1.2;
      CTX[i ? 'lineTo' : 'moveTo'](x, y);
    });
    CTX.strokeStyle = color; CTX.lineWidth = width; CTX.lineJoin = 'round'; CTX.lineCap = 'round'; CTX.stroke();
  };
  plot(ghost, 'rgba(255,255,255,.22)', 2.4);
  plot(pts, C.accent, 3.4);
  p.card(20, 404, (W - 50) / 2, 170, { r: 22 });
  const cx = 20 + (W - 50) / 4, cy = 470;
  CTX.beginPath(); CTX.arc(cx, cy, 40, 0, Math.PI * 2);
  CTX.strokeStyle = C.inputAlt; CTX.lineWidth = 16; CTX.stroke();
  CTX.beginPath(); CTX.arc(cx, cy, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.74);
  CTX.strokeStyle = C.accent; CTX.lineWidth = 16; CTX.lineCap = 'round'; CTX.stroke();
  p.t('74% autos', cx, 546, { size: 13, weight: 600, color: C.muted, align: 'center' });
  const bx = 30 + (W - 50) / 2;
  p.card(bx, 404, (W - 50) / 2, 170, { r: 22 });
  p.t('Top operador', bx + 16, 434, { size: 13, weight: 600, color: C.muted });
  [[0.86, C.accent, 'Ignacio'], [0.62, 'rgba(217,164,65,.45)', 'Marcela'], [0.38, 'rgba(255,255,255,.16)', 'Juan']].forEach(([w, col, name], i) => {
    const y = 456 + i * 38;
    p.rr(bx + 16, y, ((W - 50) / 2 - 32) * w, 12, 6, col);
    p.t(name, bx + 16, y + 30, { size: 11, weight: 600, color: C.dim });
  });
}

function screenUsuarios(p) {
  p.t('Usuarios', 22, 106, { size: 21, weight: 800 });
  const rows = [
    ['IG', 'Ignacio G.', 'Administrador', true, true],
    ['MR', 'Marcela R.', 'Operador', false, false],
    ['JP', 'Juan P.', 'Operador', false, true],
  ];
  rows.forEach(([ini, name, role, admin, onDuty], i) => {
    const y = 132 + i * 112;
    p.card(20, y, W - 40, 96, { r: 22 });
    p.dot(62, y + 48, 23, admin ? C.accentSoft : C.inputAlt);
    p.t(ini, 62, y + 54, { size: 15, weight: 700, font: MONO, color: admin ? C.accent : C.muted, align: 'center' });
    p.t(name, 98, y + 44, { size: 17, weight: 700 });
    p.t(role, 98, y + 68, { size: 13, weight: 600, color: admin ? C.accent : C.dim });
    if (onDuty) {
      p.rr(W - 148, y + 34, 110, 30, 15, C.greenSoft);
      p.dot(W - 132, y + 49, 4.5, C.green);
      p.t('En turno', W - 121, y + 54, { size: 12.5, weight: 700, color: C.green });
    } else {
      p.t('Fuera de turno', W - 38, y + 54, { size: 12.5, weight: 700, color: C.dim, align: 'right' });
    }
  });
  p.rr(20, 480, W - 40, 62, 18, null, C.dash, true);
  p.t('Cada entrada y salida queda firmada', W / 2, 517, { size: 13.5, weight: 600, color: C.dim, align: 'center' });
}

// Index 0 is the pre-login screen — it has no bottom tab bar, so
// paintScreen() below skips navBar() for it and shifts every later index
// down by one when highlighting a tab.
const SCREENS = [screenLogin, screenRegistrar, screenDentro, screenFrecuentes, screenHistorial, screenStats, screenUsuarios];

function paintScreen(canvas, index) {
  const ctx = canvas.getContext('2d');
  CTX = ctx;
  ctx.setTransform(canvas.width / W, 0, 0, canvas.width / W, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const p = pen(ctx);
  p.rr(0, 0, W, H, 0, C.bg);
  const halo = ctx.createRadialGradient(W, 0, 0, W, 0, W * 1.1);
  halo.addColorStop(0, 'rgba(217,164,65,.20)');
  halo.addColorStop(1, 'rgba(217,164,65,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
  statusBar(p);
  (SCREENS[index] || SCREENS[0])(p);
  if (index > 0) navBar(p, index - 1);
}

class Phone3D extends HTMLElement {
  connectedCallback() {
    if (this.__booted) return;
    this.__booted = true;
    this.style.display = 'block';
    this.style.position = 'relative';
    this.style.width = '100%';
    this.style.height = '100%';
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;cursor:grab';
    this.appendChild(this.canvas);
    this.screenIndex = Number(this.getAttribute('screen-index') || 0);
    this.targetYaw = THREE_DEG(this.getAttribute('yaw') || -20);
    this.targetPitch = THREE_DEG(this.getAttribute('pitch') || 8);
    this.dragYaw = 0; this.dragPitch = 0;
    this.velYaw = 0; this.velPitch = 0;
    this.yaw = this.targetYaw; this.pitch = this.targetPitch;
    this.boot();
  }

  setAngle(yawDeg, pitchDeg) {
    this.targetYaw = THREE_DEG(yawDeg);
    this.targetPitch = THREE_DEG(pitchDeg);
  }

  setScreen(index) {
    if (index === this.screenIndex) return;
    this.screenIndex = index;
    if (this.screenCanvas) {
      paintScreen(this.screenCanvas, index);
      if (this.screenTexture) this.screenTexture.needsUpdate = true;
    }
    if (this.mode === 'flat') this.drawFlat();
  }

  // The 3D model needs a real network fetch (three.js from a CDN) and a
  // working WebGL context — either can be unavailable (offline preview,
  // restrictive network/CSP, a browser with WebGL disabled). Rather than
  // leave an empty <canvas> with no visible failure, fall back to a plain
  // 2D rendering of the same screen art the 3D display texture uses.
  async boot() {
    try {
      await this.boot3D();
      this.mode = '3d';
    } catch (err) {
      console.error('[phone-3d] 3D render unavailable, falling back to a flat 2D mockup:', err);
      this.bootFlat();
    }
  }

  bootFlat() {
    this.mode = 'flat';
    // A canvas's context type (2d vs webgl) is fixed for its lifetime — if
    // 3D setup got as far as handing this.canvas to WebGLRenderer before
    // failing, getContext('2d') on it would return null. Swap in a fresh
    // element so the fallback always gets a clean 2D context.
    const fresh = document.createElement('canvas');
    fresh.style.cssText = this.canvas.style.cssText;
    this.canvas.replaceWith(fresh);
    this.canvas = fresh;
    this.flatBuffer = document.createElement('canvas');
    this.flatBuffer.width = 904; this.flatBuffer.height = Math.round(904 * (H / W));
    this.screenCanvas = this.flatBuffer;
    paintScreen(this.flatBuffer, this.screenIndex);
    // A static CSS tilt so the fallback still reads as "a phone", not a flat
    // screenshot — cheap, and needs neither WebGL nor drag interaction.
    this.canvas.style.transform = 'perspective(1200px) rotateY(-14deg) rotateX(6deg)';
    this.canvas.style.cursor = 'default';
    const ro = new ResizeObserver(() => this.drawFlat());
    ro.observe(this);
    this.drawFlat();
  }

  drawFlat() {
    const ctx = this.canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.max(this.clientWidth, 1), ch = Math.max(this.clientHeight, 1);
    this.canvas.width = cw * dpr; this.canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    // Fit a W:H(+bezel) phone silhouette inside the container.
    const aspect = W / (H + 60);
    let bodyH = ch * 0.94, bodyW = bodyH * aspect;
    if (bodyW > cw * 0.94) { bodyW = cw * 0.94; bodyH = bodyW / aspect; }
    const bx = (cw - bodyW) / 2, by = (ch - bodyH) / 2;
    const p = pen(ctx);
    const grad = ctx.createLinearGradient(bx, by, bx + bodyW, by + bodyH);
    grad.addColorStop(0, '#4a4d57'); grad.addColorStop(0.4, '#1a1b20'); grad.addColorStop(1, '#0a0b0e');
    p.rr(bx, by, bodyW, bodyH, bodyW * 0.12, grad);

    const pad = bodyW * 0.026;
    const sx = bx + pad, sy = by + pad, sw = bodyW - pad * 2, sh = bodyH - pad * 2;
    ctx.save();
    p.rr(sx, sy, sw, sh, sw * 0.14, C.bg);
    ctx.clip();
    ctx.drawImage(this.flatBuffer, sx, sy, sw, sh);
    ctx.restore();
    p.rr(bx + bodyW / 2 - bodyW * 0.09, by + pad * 0.6, bodyW * 0.18, pad * 0.9, pad * 0.4, '#000');
  }

  async boot3D() {
    const THREE = await import(THREE_URL);
    this.THREE = THREE;
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { /* ignore */ } }

    const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
    camera.position.set(0, 0, 6.35);
    this.scene = scene; this.camera = camera;

    scene.environment = this.buildEnv(THREE, renderer);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(-3.4, 4.2, 5.4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xd9a441, 0.22);
    rim.position.set(4.2, 1.4, -3.2);
    scene.add(rim);

    this.pivot = new THREE.Group();
    scene.add(this.pivot);
    this.pivot.add(this.buildPhone(THREE, renderer));

    this.bindDrag();
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this);
    this.resize();

    let last = 0;
    renderer.setAnimationLoop((time) => {
      const dt = last ? Math.min((time - last) / 1000, 0.05) : 0.016;
      last = time;
      this.tick(dt, time / 1000);
      renderer.render(scene, camera);
    });
  }

  buildEnv(THREE, renderer) {
    const room = new THREE.Scene();
    const lit = (color, intensity, pos, scale, rot) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide, toneMapped: false }),
      );
      m.position.set(pos[0], pos[1], pos[2]);
      m.scale.set(scale[0], scale[1], 1);
      if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
      room.add(m);
    };
    room.add(new THREE.Mesh(
      new THREE.BoxGeometry(30, 30, 30),
      new THREE.MeshBasicMaterial({ color: 0x0a0b0d, side: THREE.BackSide, toneMapped: false }),
    ));
    lit('#ffffff', 1.5, [-6, 4, 8], [9, 14]);
    lit('#ffffff', 0.7, [7, 6, 6], [7, 9]);
    lit('#d9a441', 0.45, [8, -1, -5], [8, 10], [0, Math.PI, 0]);
    lit('#8ea6c8', 0.5, [0, 9, -6], [14, 8], [Math.PI / 2.3, 0, 0]);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const target = pmrem.fromScene(room, 0, 0.1, 60);
    pmrem.dispose();
    return target.texture;
  }

  buildPhone(THREE, renderer) {
    // iPhone 16 Pro proportions: 149.6 x 71.5 x 8.25 mm, normalized to width 1.
    const bodyW = 1.0, bodyH = 2.092, r = 0.152, depth = 0.118;
    const group = new THREE.Group();
    group.name = 'iphone';

    const titanium = new THREE.MeshStandardMaterial({ name: 'titanium', color: 0x8a8d93, metalness: 1, roughness: 0.44 });
    const backGlass = new THREE.MeshStandardMaterial({ name: 'backGlass', color: 0x15161a, metalness: 0.3, roughness: 0.5 });
    const black = new THREE.MeshStandardMaterial({ name: 'bezel', color: 0x04050a, metalness: 0.1, roughness: 0.6 });
    const glass = new THREE.MeshPhysicalMaterial({
      name: 'coverGlass', color: 0xffffff, transparent: true, opacity: 0.05,
      metalness: 0, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02,
    });

    const rounded = (w, h, rad, asPath) => {
      const s = asPath ? new THREE.Path() : new THREE.Shape();
      const x = -w / 2, y = -h / 2;
      s.moveTo(x + rad, y);
      s.lineTo(x + w - rad, y);
      s.quadraticCurveTo(x + w, y, x + w, y + rad);
      s.lineTo(x + w, y + h - rad);
      s.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      s.lineTo(x + rad, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - rad);
      s.lineTo(x, y + rad);
      s.quadraticCurveTo(x, y, x + rad, y);
      return s;
    };

    // Frame is a band, not a slab: the shape carries a hole so the display
    // sits recessed in the opening instead of behind a solid titanium face.
    const frameShape = rounded(bodyW, bodyH, r);
    frameShape.holes.push(rounded(bodyW - 0.034, bodyH - 0.034, r - 0.017, true));
    const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
      depth: depth - 0.03, bevelEnabled: true, bevelThickness: 0.015,
      bevelSize: 0.014, bevelSegments: 4, curveSegments: 26, steps: 1,
    });
    frameGeo.translate(0, 0, -(depth - 0.03) / 2);
    const frame = new THREE.Mesh(frameGeo, titanium);
    frame.name = 'frame';
    group.add(frame);

    const backGeo = new THREE.ExtrudeGeometry(rounded(bodyW - 0.035, bodyH - 0.035, r - 0.017), {
      depth: 0.012, bevelEnabled: false, curveSegments: 24, steps: 1,
    });
    backGeo.translate(0, 0, -depth / 2 - 0.004);
    const back = new THREE.Mesh(backGeo, backGlass);
    back.name = 'backPanel';
    group.add(back);

    const bezelGeo = new THREE.ExtrudeGeometry(rounded(bodyW - 0.03, bodyH - 0.03, r - 0.014), {
      depth: 0.01, bevelEnabled: false, curveSegments: 24, steps: 1,
    });
    // Sits behind the display: coplanar faces z-fight and the screen flickers.
    bezelGeo.translate(0, 0, depth / 2 - 0.057);
    const bezel = new THREE.Mesh(bezelGeo, black);
    bezel.name = 'bezel';
    group.add(bezel);

    // Screen: canvas texture, emissive so it reads as a lit display.
    const sw = bodyW - 0.06;
    const sh = sw * (H / W);
    const canvas = document.createElement('canvas');
    canvas.width = 1356; canvas.height = Math.round(1356 * (H / W));
    paintScreen(canvas, this.screenIndex);
    this.screenCanvas = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    this.screenTexture = tex;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(sw, sh),
      new THREE.MeshBasicMaterial({ name: 'display', map: tex, toneMapped: false }),
    );
    screen.name = 'display';
    screen.position.z = depth / 2 - 0.038;
    group.add(screen);

    // Camera plateau on the back: rounded plate + three lenses + flash.
    const plateGeo = new THREE.ExtrudeGeometry(rounded(0.5, 0.5, 0.14), {
      depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 18, steps: 1,
    });
    plateGeo.translate(0, 0, -depth / 2 - 0.032);
    const plate = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ name: 'cameraPlate', color: 0x1b1c21, metalness: 0.8, roughness: 0.35 }));
    plate.name = 'cameraPlate';
    plate.position.set(-0.235, 0.715, 0);
    group.add(plate);

    const lensBody = new THREE.MeshStandardMaterial({ name: 'lensRing', color: 0x6f7278, metalness: 1, roughness: 0.22 });
    const lensGlass = new THREE.MeshPhysicalMaterial({ name: 'lensGlass', color: 0x05070c, metalness: 0.6, roughness: 0.08, clearcoat: 1 });
    [[-0.115, 0.105], [0.115, 0.105], [0, -0.115]].forEach(([dx, dy], i) => {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.098, 0.028, 40), lensBody);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(-0.235 + dx, 0.715 + dy, -depth / 2 - 0.052);
      ring.name = 'lensRing' + (i + 1);
      group.add(ring);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.07, 30, 20, 0, Math.PI * 2, 0, Math.PI / 2), lensGlass);
      dome.rotation.x = -Math.PI / 2;
      dome.position.set(-0.235 + dx, 0.715 + dy, -depth / 2 - 0.064);
      dome.name = 'lensGlass' + (i + 1);
      group.add(dome);
    });
    const flash = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 24), new THREE.MeshStandardMaterial({ name: 'flash', color: 0xf6e6c0, emissive: 0x3a2f18, roughness: 0.3, metalness: 0.2 }));
    flash.rotation.x = Math.PI / 2;
    flash.position.set(-0.02, 0.6, -depth / 2 - 0.04);
    flash.name = 'flash';
    group.add(flash);

    // Dynamic island
    const island = new THREE.Mesh(
      new THREE.ExtrudeGeometry(rounded(0.27, 0.072, 0.036), { depth: 0.004, bevelEnabled: false, curveSegments: 16, steps: 1 }),
      new THREE.MeshBasicMaterial({ name: 'island', color: 0x000000, toneMapped: false }),
    );
    island.position.set(0, bodyH / 2 - 0.14, depth / 2 - 0.032);
    island.name = 'dynamicIsland';
    group.add(island);

    // Side buttons
    const btn = (w, h, x, y, name) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.062), titanium);
      m.position.set(x, y, 0);
      m.name = name || 'button';
      group.add(m);
    };
    btn(0.02, 0.19, bodyW / 2 + 0.004, 0.34, 'powerButton');
    btn(0.02, 0.11, bodyW / 2 + 0.004, 0.06, 'cameraControl');
    btn(0.018, 0.11, -bodyW / 2 - 0.004, 0.52, 'actionButton');
    btn(0.018, 0.18, -bodyW / 2 - 0.004, 0.3, 'volumeUp');
    btn(0.018, 0.18, -bodyW / 2 - 0.004, 0.08, 'volumeDown');

    return group;
  }

  bindDrag() {
    const el = this.canvas;
    let dragging = false, lastX = 0, lastY = 0, moved = false;
    const down = (e) => {
      dragging = true; moved = false;
      lastX = e.clientX; lastY = e.clientY;
      el.style.cursor = 'grabbing';
      el.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      this.dragYaw += dx * 0.008;
      this.dragPitch = Math.max(-0.65, Math.min(0.65, this.dragPitch - dy * 0.006));
      this.velYaw = dx * 0.008;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = 'grab';
      this.releasedAt = performance.now();
      void moved;
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    this.isDragging = () => dragging;
  }

  tick(dt, t) {
    // Drag momentum decays, then the phone eases back to the scroll-driven pose.
    if (!this.isDragging()) {
      this.dragYaw += this.velYaw;
      this.velYaw *= 0.92;
      this.dragYaw *= 0.965;
      this.dragPitch *= 0.965;
    } else {
      this.velYaw *= 0.6;
    }
    const yawGoal = this.targetYaw + this.dragYaw + Math.sin(t * 0.42) * 0.045;
    const pitchGoal = this.targetPitch + this.dragPitch + Math.cos(t * 0.34) * 0.03;
    this.yaw += (yawGoal - this.yaw) * Math.min(1, dt * 6);
    this.pitch += (pitchGoal - this.pitch) * Math.min(1, dt * 6);
    this.pivot.rotation.y = this.yaw;
    this.pivot.rotation.x = this.pitch;
    this.pivot.rotation.z = Math.sin(t * 0.3) * 0.01;
    this.pivot.position.y = Math.sin(t * 0.6) * 0.03;
  }

  resize() {
    const w = Math.max(this.clientWidth, 1), h = Math.max(this.clientHeight, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}

function THREE_DEG(v) { return (Number(v) || 0) * Math.PI / 180; }

if (!customElements.get('phone-3d')) customElements.define('phone-3d', Phone3D);
