'use strict';
/* House design editor.
   Plan coords (metres): px = east of party-wall axis, py = north of the southernmost frame line.
   Three.js: X = px, Y = height, Z = -py. Only the east unit (ours) is editable. */

const L1 = 3.06, CEIL = 5.71, TOP = 5.86, RIDGE = 7.67, HG = 2.74, HU = CEIL - L1, CY = 6.05;
const KEY = 'house31-design-v1';
const $ = id => document.getElementById(id);
const rid = p => p + Math.random().toString(36).slice(2, 9);
const r2 = v => Math.round(v * 1000) / 1000;
const cm = v => Math.round(v * 100);

function arc(cx, cy, r, a0, a1, n) {
  const o = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; o.push([r2(cx + r * Math.cos(a)), r2(cy + r * Math.sin(a))]); } return o;
}
const bayG = arc(6.75, 1.55, 1.45, -139, 49, 14);
const footG = [[0, 0.6], [5.45, 0.6], ...bayG, [7.70, 2.85], [7.70, 7.25], [8.00, 7.25], [8.00, 11.10], [7.00, 12.10], [0, 12.10]];
const footU = [[0, 0.5], [4.50, 0.5], [4.50, 2.13], [8.20, 2.13], [8.20, 6.95], [8.50, 6.95], [8.50, 10.15], [7.15, 10.15], [7.15, 12.10], [0, 12.10]];
const balc = [[4.50, 2.13], [4.50, 0.5], [5.50, 0.5], ...arc(6.84, 1.65, 1.5, -138, 17, 18), [8.20, 2.13]];
const eaveG = [[0, 0.1], [5.35, 0.1], ...arc(6.75, 1.55, 1.95, -132, 47, 22), [8.2, 3.0], [8.2, 6.9], [9.0, 6.9], [9.0, 11.35], [7.25, 12.6], [0, 12.6]];
// first-floor balcony over the bay: round (as built) | rect (w east of x=4.5, d south of y=2.13) | none
const balcOf = St => St.balc || { mode: 'round', w: 3.7, d: 1.63 };
function balcPts(St) {
  const b = balcOf(St); if (b.mode === 'none') return null; if (b.mode !== 'rect') return balc;
  return [[4.5, 2.13], [4.5, Math.min(0.5, 2.13 - b.d)], [4.5, 2.13 - b.d], [4.5 + b.w, 2.13 - b.d], [4.5 + b.w, 2.13]];
}
const stairHole = [[0.2, 6.0], [3.1, 6.0], [3.1, 8.15], [0.2, 8.15]];
const PLOT = [[0, 17.6], [12.5, 17.6], [14.63, -8], [0, -8]];

// ---------------------------------------------------------------- item catalogue
const IT = {
  stairsExt: { n: 'מדרגות חיצוניות', w: 1.0, d: 4.6, cat: 'בנייה', both: 1 },
  balcony: { n: 'מרפסת', w: 3.0, d: 1.6, cat: 'בנייה', f: 1 },
  pergola: { n: 'פרגולה', w: 3.0, d: 3.0, cat: 'בנייה' },
  column: { n: 'עמוד', w: 0.4, d: 0.4, cat: 'בנייה' },
  deck: { n: 'דק עץ', w: 3, d: 3, cat: 'גינה', flat: 1, c: '#c9a26b' },
  paving: { n: 'ריצוף', w: 3, d: 3, cat: 'גינה', flat: 1, c: '#d5d0c6' },
  lawn: { n: 'דשא', w: 4, d: 4, cat: 'גינה', flat: 1, c: '#a9d08a' },
  tree: { n: 'עץ', w: 1.6, d: 1.6, cat: 'גינה', c: '#7fb069' },
  kitchen: { n: 'מטבח', w: 3.0, d: 0.6, cat: 'מטבח', c: '#e8dcc8' },
  island: { n: 'אי', w: 1.8, d: 0.9, cat: 'מטבח', c: '#e8dcc8' },
  fridge: { n: 'מקרר', w: 0.7, d: 0.7, cat: 'מטבח', c: '#cfd4d8' },
  counter: { n: 'משטח', w: 2.0, d: 0.6, cat: 'מטבח', c: '#d0d0d0' },
  wc: { n: 'אסלה', w: 0.4, d: 0.65, cat: 'רחצה', c: '#fff' },
  sink: { n: 'כיור', w: 0.6, d: 0.45, cat: 'רחצה', c: '#fff' },
  shower: { n: 'מקלחון', w: 0.9, d: 0.9, cat: 'רחצה', c: '#dff0f7' },
  bath: { n: 'אמבטיה', w: 1.7, d: 0.7, cat: 'רחצה', c: '#fff' },
  washer: { n: 'מ. כביסה', w: 0.6, d: 0.6, cat: 'רחצה', c: '#eee' },
  bedD: { n: 'מיטה זוגית', w: 1.6, d: 2.0, cat: 'ריהוט', c: '#e7e0f0' },
  bedS: { n: 'מיטת יחיד', w: 0.9, d: 1.9, cat: 'ריהוט', c: '#e7e0f0' },
  sofa: { n: 'ספה', w: 2.2, d: 0.9, cat: 'ריהוט', c: '#d9e2ec' },
  table: { n: 'שולחן', w: 1.6, d: 0.9, cat: 'ריהוט', c: '#e6d2b5' },
  wardrobe: { n: 'ארון', w: 2.0, d: 0.6, cat: 'ריהוט', c: '#d8c7ad' },
  stairsInt: { n: 'מדרגות פנים', w: 3.33, d: 2.2, cat: '', both: 1, fixed: 1 }
};
const ROOMS = ['סלון', 'מטבח', 'פינת אוכל', 'ח. שינה', 'ח. שינה הורים', 'ח. ארונות', 'ח. רחצה', 'שירותים', 'משרד', 'מחסן', 'כביסה', 'כניסה', 'מסדרון', 'מרפסת', 'מ. שירות', 'חצר משק', 'גינה'];
const WK = { ext: 'קיר חיצוני', int: 'מחיצה', mamad: 'ממ"ד (בטון)', party: 'קיר משותף', low: 'קיר נמוך / גדר', rail: 'מעקה' };
const OPN = { door: 'דלת', win: 'חלון', slide: 'ויטרינה', open: 'פתח' };

// ---------------------------------------------------------------- base (as-built) state
function W(f, a, b, k, t, ops, ex) {
  return Object.assign({
    id: rid('w'), f, a, b, k, t: t || (k === 'int' ? 0.1 : k === 'mamad' ? 0.25 : k === 'low' ? 0.12 : 0.2), st: 'exist',
    ops: (ops || []).map(o => ({ id: rid('o'), s: o[0], w: o[1], h: o[2], sill: o[3] || 0, type: o[4] || 'win', st: 'exist' }))
  }, ex || {});
}
function baseState(mine) {
  const w = [], A = (...a) => w.push(W(...a)), d = v => r2(12.10 - v);
  // ground floor shell
  A(0, [0, 0.6], [5.45, 0.6], 'ext', 0, [[2.83, 3.25, 2.4, 0, 'slide']]);
  const bay = [[5.45, 0.6], ...bayG, [7.70, 2.85]];
  for (let i = 0; i < bay.length - 1; i++) A(0, bay[i], bay[i + 1], 'ext', 0, [], { lock: 1, curve: 1 });
  A(0, [7.70, 2.85], [7.70, 7.25], 'ext', 0, [[3.75, 1.0, 2.2, 0, 'door']]);
  A(0, [7.70, 7.25], [8.00, 7.25], 'ext');
  A(0, [8.00, 7.25], [8.00, 11.10], 'ext', 0, [[0.85, 0.7, 0.74, 2.0, 'win'], [3.25, 1.0, 1.2, 1.0, 'win']]);
  A(0, [8.00, 11.10], [7.00, 12.10], 'ext', 0, [[0.707, 1.0, 1.2, 1.0, 'win']]);
  A(0, [7.00, 12.10], [3.60, 12.10], 'ext', 0, [[0.45, 0.9, 1.2, 1.0, 'win']]);
  A(0, [3.60, 12.10], [0, 12.10], 'mamad', 0.3, [[1.75, 1.0, 1.0, 1.2, 'win']]);
  if (mine) A(0, [0, 0.6], [0, 12.10], 'party', 0.24);
  // mamad
  A(0, [3.47, 12.0], [3.47, 8.9], 'mamad'); A(0, [0.12, 8.32], [2.35, 8.32], 'mamad'); A(0, [2.35, 8.32], [2.35, 8.9], 'mamad');
  A(0, [2.35, 8.9], [3.47, 8.9], 'mamad', 0, [[0.61, 0.78, 2.0, 0, 'door']]);
  // ground partitions
  A(0, [2.42, 8.3], [2.42, 7.15], 'int');
  A(0, [3.6, 8.87], [4.33, 8.87], 'int'); A(0, [5.35, 8.87], [7.9, 8.87], 'int');
  A(0, [5.45, 8.87], [5.45, 7.55], 'int', 0, [[0.55, 0.7, 2.0, 0, 'door']]);
  A(0, [5.4, 7.55], [7.9, 7.55], 'int');
  A(0, [1.335, 7.1], [3.6, 7.1], 'int', 0.08); A(0, [0.12, 5.97], [3.6, 5.97], 'int');
  A(0, [7.8, 5.6], [10.0, 5.6], 'low', 0, [], { h: 1.8 }); A(0, [10.0, 3.35], [7.8, 3.35], 'low', 0, [], { h: 1.8 });
  // first floor shell
  A(1, [0, 0.5], [4.5, 0.5], 'ext', 0, [[2.3, 2.15, 1.2, 1.0, 'win']]);
  A(1, [4.5, 0.5], [4.5, 2.13], 'ext', 0, [[0.8, 1.3, 2.1, 0, 'slide']]);
  A(1, [4.5, 2.13], [8.2, 2.13], 'ext');
  A(1, [8.2, 2.13], [8.2, 6.95], 'ext', 0, [[1.17, 0.8, 0.8, 1.3, 'win'], [3.07, 1.2, 1.1, 1.0, 'win']]);
  A(1, [8.2, 6.95], [8.5, 6.95], 'ext');
  A(1, [8.5, 6.95], [8.5, 10.15], 'ext', 0, [[1.55, 2.6, 0.9, 1.2, 'win']]);
  A(1, [8.5, 10.15], [7.15, 10.15], 'ext'); A(1, [7.15, 10.15], [7.15, 12.1], 'ext');
  A(1, [7.15, 12.1], [0, 12.1], 'ext', 0, [[2.12, 1.2, 1.1, 1.0, 'win'], [5.55, 1.2, 1.1, 1.0, 'win']]);
  if (mine) A(1, [0, 0.5], [0, 12.10], 'party', 0.24);
  // first floor partitions
  A(1, [3.12, d(0.1)], [3.12, d(3.92)], 'int', 0, [[3.375, 0.75, 2.0, 0, 'door']]);
  A(1, [0.12, d(3.92)], [3.17, d(3.92)], 'int');
  A(1, [3.12, d(3.05)], [7.15, d(3.05)], 'int', 0, [[0.83, 0.7, 2.0, 0, 'door']]);
  A(1, [4.45, d(3.05)], [4.45, d(5.15)], 'int', 0, [[0.9, 0.7, 2.0, 0, 'door']]);
  A(1, [4.40, d(5.15)], [8.20, d(5.15)], 'int');
  A(1, [7.15, d(1.95)], [7.15, d(5.15)], 'int', 0, [[2.025, 0.65, 2.0, 0, 'door']]);
  A(1, [4.45, d(5.15)], [4.45, d(8.05)], 'int', 0, mine ? [[0.5, 0.7, 2.0, 0, 'door'], [2.0, 0.8, 2.0, 0, 'door']] : [[0.5, 0.7, 2.0, 0, 'door']]);
  A(1, [4.40, d(8.05)], [8.20, d(8.05)], 'int');
  A(1, [4.45, d(8.05)], [4.45, d(10.0)], 'int', 0, [[1.15, 0.7, 2.0, 0, 'door']]);
  A(1, [0.12, d(6.19)], [4.45, d(6.19)], 'int', 0, [[3.75, 0.9, 2.0, 0, 'door']]);
  A(1, [3.12, d(3.97)], [3.12, d(5.05)], 'rail', 0.06, [], { h: 0.95 });
  const I = (type, f, x, y, w_, d_, rot, ex) => Object.assign({ id: rid('i'), type, f, x, y, w: w_, d: d_, rot: rot || 0, st: 'exist' }, ex || {});
  const items = [
    I('stairsInt', 0, 1.785, 7.1, 3.33, 2.2, 0, { lock: 1 }),
    I('column', 0, 5.7, 7.28, 0.4, 0.4, 0, { lock: 1 }),
    I('counter', 0, 4.875, 11.7, 2.25, 0.6, 0), I('counter', 0, 7.6, 9.925, 1.95, 0.6, 90),
    I('pergola', 1, 6.45, 1.2, 3.7, 1.8, 0),
    I('bath', 1, 5.45, 7.45, 1.7, 0.7, 0), I('bath', 1, 7.525, 3.05, 1.7, 1.05, 90)
  ];
  const R = (f, name, x, y, lock) => ({ id: rid('r'), f, name, x, y, lock: lock || 0 });
  const rooms = [
    R(0, 'ממ"ד', 1.8, 10.4, 1), R(0, 'מטבח', 5.6, 10.3), R(0, 'שירותים', 6.7, 8.2), R(0, 'סלון', 4.3, 3.6), R(0, 'חצר משק', 8.9, 4.5), R(0, 'כניסה', 6.9, 6.5),
    R(1, 'ח. שינה', 1.6, 10.3), R(1, 'ח. שינה', 5.2, 10.7), R(1, 'ח. רחצה', 5.8, 8.0), R(1, 'מ. שירות', 7.85, 8.5),
    R(1, mine ? 'ח. ארונות' : 'ח. שינה', 6.3, 5.5), R(1, 'ח. רחצה', 6.3, 3.1), R(1, 'ח. שינה הורים', 2.2, 2.8), R(1, 'מרפסת', 6.5, 1.3)
  ];
  return { v: 1, walls: w, items, rooms };
}
const BASE = baseState(true);
let S = load() || JSON.parse(JSON.stringify(BASE));
function load() { try { const j = JSON.parse(localStorage.getItem(KEY)); return j && j.v === 1 ? j : null; } catch (e) { return null; } }
const hist = [JSON.stringify(S)]; let hi = 0;

// ---------------------------------------------------------------- geometry helpers
function wv(w) { const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy) || 1e-6; return { L, ux: dx / L, uy: dy / L }; }
const wp = (w, v, s) => [w.a[0] + v.ux * s, w.a[1] + v.uy * s];
const wallH = w => w.h || (w.f ? HU : HG);

// ================================================================= raster helpers (5 cm grid): footprints, roof, room areas
const GC = 0.05, GX0 = -0.5, GY0 = -9.5, GW = 290, GH = 480, GN = GW * GH, GI0 = Math.round(-GX0 / GC), RK = (RIDGE - TOP) / 6.3;
const gi = x => Math.max(0, Math.min(GW - 1, Math.floor((x - GX0) / GC + 1e-6))), gj = y => Math.max(0, Math.min(GH - 1, Math.floor((y - GY0) / GC + 1e-6)));
function rasterSeg(m, a, b, r, sq) {   // sq: square ends (wall corners stay sharp)
  const dx0 = b[0] - a[0], dy0 = b[1] - a[1], L = Math.hypot(dx0, dy0) || 1e-6, ux = dx0 / L, uy = dy0 / L;
  const i0 = gi(Math.min(a[0], b[0]) - r), i1 = gi(Math.max(a[0], b[0]) + r), j0 = gj(Math.min(a[1], b[1]) - r), j1 = gj(Math.max(a[1], b[1]) + r);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const x = GX0 + (i + .5) * GC - a[0], y = GY0 + (j + .5) * GC - a[1], s = Math.max(0, Math.min(L, x * ux + y * uy)), dx = x - ux * s, dy = y - uy * s;
    if (sq ? Math.abs(x * ux + y * uy - L / 2) <= L / 2 + r && Math.abs(x * uy - y * ux) <= r : dx * dx + dy * dy <= r * r) m[i + j * GW] = 1;
  }
}
function inPoly(pts, p) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function rasterPoly(m, pts) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  for (let j = gj(Math.min(...ys)); j <= gj(Math.max(...ys)); j++) for (let i = gi(Math.min(...xs)); i <= gi(Math.max(...xs)); i++) if (inPoly(pts, [GX0 + (i + .5) * GC, GY0 + (j + .5) * GC])) m[i + j * GW] = 1;
}
function dilate(m, r) {          // square (Chebyshev) dilation by r cells
  const t = new Uint8Array(GN), o = new Uint8Array(GN);
  for (let j = 0; j < GH; j++) { const b = j * GW; let l = -1e9; for (let i = 0; i < GW; i++) { if (m[b + i]) l = i; if (i - l <= r) t[b + i] = 1; } l = 1e9; for (let i = GW - 1; i >= 0; i--) { if (m[b + i]) l = i; if (l - i <= r) t[b + i] = 1; } }
  for (let i = 0; i < GW; i++) { let l = -1e9; for (let j = 0; j < GH; j++) { if (t[i + j * GW]) l = j; if (j - l <= r) o[i + j * GW] = 1; } l = 1e9; for (let j = GH - 1; j >= 0; j--) { if (t[i + j * GW]) l = j; if (l - j <= r) o[i + j * GW] = 1; } }
  return o;
}
const invert = m => m.map(v => v ? 0 : 1), erode = (m, r) => invert(dilate(invert(m), r));
const clipW = m => { for (let j = 0; j < GH; j++) m.fill(0, j * GW, j * GW + GI0); return m; };   // nothing west of the party-wall axis
function floodOut(block) {       // cells reachable from the grid border
  const R = new Uint8Array(GN), st = new Int32Array(GN); let n = 0;
  const push = k => { if (!block[k] && !R[k]) { R[k] = 1; st[n++] = k; } };
  for (let i = 0; i < GW; i++) { push(i); push(i + (GH - 1) * GW); } for (let j = 0; j < GH; j++) { push(j * GW); push(GW - 1 + j * GW); }
  while (n) { const k = st[--n], i = k % GW; if (i > 0) push(k - 1); if (i < GW - 1) push(k + 1); if (k >= GW) push(k - GW); if (k < GN - GW) push(k + GW); }
  return R;
}
function simplify(pts, tol) {    // Douglas-Peucker on a closed loop
  const dp = (a, b, out) => {
    let md = 0, mi = -1; const A = pts[a], B = pts[b], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i][0] - A[0]) * dy - (pts[i][1] - A[1]) * dx) / L; if (d > md) { md = d; mi = i; } }
    if (md > tol) { dp(a, mi, out); out.push(pts[mi]); dp(mi, b, out); }
  };
  let far = 0, fd = 0; pts.forEach((p, i) => { const d = Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]); if (d > fd) { fd = d; far = i; } });
  pts = pts.concat([pts[0]]); const out = [pts[0]]; dp(0, far, out); out.push(pts[far]); dp(far, pts.length - 1, out); return out;
}
function loopsOf(m) {            // mask -> [{o: outer polygon, h: [holes]}] in metres
  const W1 = GW + 1, nx = new Map(), add = (a, b) => { const l = nx.get(a); if (l) l.push(b); else nx.set(a, [b]); };
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    if (!m[i + j * GW]) continue; const v = i + j * W1;
    if (j === 0 || !m[i + (j - 1) * GW]) add(v, v + 1);
    if (i === GW - 1 || !m[i + 1 + j * GW]) add(v + 1, v + 1 + W1);
    if (j === GH - 1 || !m[i + (j + 1) * GW]) add(v + 1 + W1, v + W1);
    if (i === 0 || !m[i - 1 + j * GW]) add(v + W1, v);
  }
  const outer = [], holes = [];
  nx.forEach((l, s) => {
    while (l.length) {
      let raw = [], c = s; do { raw.push(c); c = nx.get(c).pop(); } while (c !== s);
      raw = raw.map(v => [r2(GX0 + (v % W1) * GC), r2(GY0 + Math.floor(v / W1) * GC)]);
      let ar = 0; raw.forEach((p, i) => { const q = raw[(i + 1) % raw.length]; ar += p[0] * q[1] - q[0] * p[1]; }); ar /= 2;
      if (Math.abs(ar) < 0.25) continue; const pts = simplify(raw, 0.045); if (pts.length < 3) continue;
      if (ar > 0) outer.push({ o: pts, h: [] }); else holes.push(pts);
    }
  });
  holes.forEach(hp => { const P = outer.find(p => inPoly(p.o, hp[0])); if (P) P.h.push(hp); });
  return outer;
}
// built outline of one floor: everything enclosed by full-height walls (gaps under 1.5 m are bridged)
const fpC = new Map();
function footprint(St, f) {
  const ws = St.walls.filter(w => w.f === f && w.st !== 'demo' && w.k !== 'rail' && wallH(w) >= 1.5);
  const key = f + ':' + ws.map(w => [w.a, w.b, w.t]).join(';'); let c = fpC.get(key); if (c) return c;
  const B = new Uint8Array(GN); for (let j = 0; j < GH; j++) B.fill(1, j * GW, j * GW + GI0);
  ws.forEach(w => rasterSeg(B, w.a, w.b, w.t / 2 + 0.03, !w.curve));
  const out = dilate(floodOut(dilate(B, 15)), 15); let m = new Uint8Array(GN);
  for (let k = 0; k < GN; k++) m[k] = out[k] ? 0 : 1;
  m = clipW(dilate(erode(clipW(m), 3), 3));
  const cnt = () => { let n = 0; for (let k = 0; k < GN; k++) n += m[k]; return n * GC * GC; };
  let area = cnt(), open = false; if (area < 45) { rasterPoly(m, f ? footU : footG); clipW(m); area = cnt(); open = true; }   // shell left open: fall back to the as-built outline
  c = { key, m, area, open, polys: loopsOf(m) }; if (fpC.size > 60) fpC.clear(); fpC.set(key, c); return c;
}
const shC = new Map();
function shells(St) {            // floor slabs, tile skirt around the ground floor, roof eave
  const G = footprint(St, 0), U = footprint(St, 1), key = G.key + '#' + U.key; let c = shC.get(key); if (c) return c;
  const sk = dilate(G.m, 10); for (let k = 0; k < GN; k++) if (U.m[k]) sk[k] = 1;
  if (G.m[gi(7.9) + gj(9) * GW]) for (let j = gj(6.9); j < gj(11.35); j++) sk.fill(1, j * GW + gi(8), j * GW + gi(9.0));
  const E = clipW(dilate(U.m, 10));
  c = { G: G.polys, U: U.polys, sk: loopsOf(clipW(sk)), E: loopsOf(E), Em: E, gross: [G.area, U.area], open: [G.open, U.open] };
  if (shC.size > 30) shC.clear(); shC.set(key, c); return c;
}
// tiled hip roof over any eave outline: height = slope x distance to the nearest eave (the party line is not an eave)
function roofGeo(E) {
  const W1 = GW + 1, d = new Uint16Array(W1 * (GH + 1)), BIG = 60000, c = (i, j) => i < GI0 || E[i + j * GW];
  for (let j = 1; j < GH; j++) for (let i = GI0; i < GW; i++) if (c(i - 1, j - 1) && c(i, j - 1) && c(i - 1, j) && c(i, j)) d[i + j * W1] = BIG;
  const rl = (p, q) => { if (d[q] + 1 < d[p]) d[p] = d[q] + 1; };
  for (let j = 1; j < GH; j++) for (let i = GI0; i < GW; i++) { const p = i + j * W1; if (!d[p]) continue; if (i > GI0) { rl(p, p - 1); rl(p, p - W1 - 1); } rl(p, p - W1); rl(p, p - W1 + 1); }
  for (let j = GH - 1; j >= 1; j--) for (let i = GW - 1; i >= GI0; i--) { const p = i + j * W1; if (!d[p]) continue; rl(p, p + 1); rl(p, p + W1 + 1); rl(p, p + W1); if (i > GI0) rl(p, p + W1 - 1); }
  const vid = new Int32Array(W1 * (GH + 1)).fill(-1), pos = [], idx = [];
  const V = p => { if (vid[p] < 0) { vid[p] = pos.length / 3; pos.push(GX0 + (p % W1) * GC, TOP + Math.min(d[p], 400) * GC * RK, -(GY0 + Math.floor(p / W1) * GC)); } return vid[p]; };
  for (let j = 0; j < GH; j++) for (let i = GI0; i < GW; i++) {
    if (!E[i + j * GW]) continue; const a = i + j * W1, b = a + 1, e = a + W1, cc = e + 1;
    if (Math.abs(d[a] - d[cc]) >= Math.abs(d[b] - d[e])) idx.push(V(a), V(b), V(cc), V(a), V(cc), V(e)); else idx.push(V(a), V(b), V(e), V(b), V(cc), V(e));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// net floor area of the space around each room label (walls of any height bound a room; openings count as closed)
const raC = new Map();
function roomAreas(St, f, rooms) {
  const ws = St.walls.filter(w => w.f === f && w.st !== 'demo'), segs = [];
  if (f) {
    const bp = balcPts(St); if (bp) bp.forEach((p, i) => segs.push([p, bp[(i + 1) % bp.length]]));
    St.items.filter(i => i.type === 'balcony' && i.st !== 'demo').forEach(it => {
      const a = (it.rot || 0) * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a), q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(p => [r2(it.x + p[0] * it.w / 2 * cs - p[1] * it.d / 2 * sn), r2(it.y + p[0] * it.w / 2 * sn + p[1] * it.d / 2 * cs)]);
      q.forEach((p, i) => segs.push([p, q[(i + 1) % 4]]));
    });
  }
  const key = f + ':' + ws.map(w => [w.a, w.b, w.t]).join(';') + '|' + segs.join(';') + '|' + rooms.map(r => [r.id, r.x, r.y]).join(';');
  let out = raC.get(key); if (out) return out; out = new Map();
  const B = new Uint8Array(GN); for (let j = 0; j < GH; j++) B.fill(1, j * GW, j * GW + GI0);
  ws.forEach(w => rasterSeg(B, w.a, w.b, w.t / 2)); segs.forEach(s => rasterSeg(B, s[0], s[1], 0.04));
  const lab = new Int32Array(GN), reg = [null], st = new Int32Array(GN); let tot = 0;
  rooms.forEach(r => {
    let k = -1; const ci = gi(r.x), cj = gj(r.y);
    for (let rad = 0; rad <= 4 && k < 0; rad++) for (let dj = -rad; dj <= rad && k < 0; dj++) for (let di = -rad; di <= rad; di++) { const i = ci + di, j = cj + dj; if (i >= 0 && i < GW && j >= 0 && j < GH && !B[i + j * GW]) { k = i + j * GW; break; } }
    if (k < 0) { out.set(r.id, { a: null, rooms: [r] }); return; }
    if (!lab[k]) {
      const id = reg.length, R = { a: null, rooms: [] }; reg.push(R); let n = 0, cells = 0, open = false; lab[k] = id; st[n++] = k;
      const push = q => { if (!B[q] && !lab[q]) { lab[q] = id; st[n++] = q; } };
      while (n) { const q = st[--n], i = q % GW, j = (q - i) / GW; cells++; if (i === GW - 1 || j === 0 || j === GH - 1) open = true; if (i > 0) push(q - 1); if (i < GW - 1) push(q + 1); if (j > 0) push(q - GW); if (j < GH - 1) push(q + GW); }
      if (!open) { R.a = cells * GC * GC; tot += R.a; }
    }
    reg[lab[k]].rooms.push(r); out.set(r.id, reg[lab[k]]);
  });
  out.tot = tot; if (raC.size > 40) raC.clear(); raC.set(key, out); return out;
}
// external stairs: I = straight, L = quarter turn, U = half turn (landing at the turn). Local coords: climb starts at y = -d/2.
function stairGeo(it) {
  const hw = it.w / 2, hd = it.d / 2, z0 = -0.2, Ht = (it.h || L1) - z0, n = Math.max(4, Math.ceil(Ht / 0.175 - 1e-6)), rise = Ht / n;
  const sh = it.shape || 'I', sw = sh === 'I' ? it.w : Math.max(.6, Math.min(it.sw || 1, sh === 'U' ? it.w / 2 : it.w - .3, it.d - .3));
  const fl = [], ld = []; let path;
  if (sh === 'I') { fl.push({ x0: -hw, x1: hw, y0: -hd, y1: hd, ax: 'y', dir: 1, n, k0: 0 }); path = [[0, -hd + .2], [0, hd - .25]]; }
  else if (sh === 'L') {
    const a = it.d - sw, b = it.w - sw, n1 = Math.max(1, Math.min(n - 2, Math.round((n - 1) * a / (a + b))));
    fl.push({ x0: -hw, x1: -hw + sw, y0: -hd, y1: hd - sw, ax: 'y', dir: 1, n: n1, k0: 0 }); ld.push({ x0: -hw, x1: -hw + sw, y0: hd - sw, y1: hd, k: n1 });
    fl.push({ x0: -hw + sw, x1: hw, y0: hd - sw, y1: hd, ax: 'x', dir: 1, n: n - 1 - n1, k0: n1 + 1 });
    path = [[-hw + sw / 2, -hd + .2], [-hw + sw / 2, hd - sw / 2], [hw - .25, hd - sw / 2]];
  } else {
    const n1 = Math.floor((n - 1) / 2);
    fl.push({ x0: -hw, x1: -hw + sw, y0: -hd, y1: hd - sw, ax: 'y', dir: 1, n: n1, k0: 0 }); ld.push({ x0: -hw, x1: hw, y0: hd - sw, y1: hd, k: n1 });
    fl.push({ x0: hw - sw, x1: hw, y0: -hd, y1: hd - sw, ax: 'y', dir: -1, n: n - 1 - n1, k0: n1 + 1 });
    path = [[-hw + sw / 2, -hd + .2], [-hw + sw / 2, hd - sw / 2], [hw - sw / 2, hd - sw / 2], [hw - sw / 2, -hd + .25]];
  }
  if (it.turn === 'l' && sh !== 'I') {
    fl.concat(ld).forEach(q => { const t = q.x0; q.x0 = -q.x1; q.x1 = -t; if (q.ax === 'x') q.dir = -q.dir; }); path.forEach(p => p[0] = -p[0]);
  }
  fl.forEach(q => q.go = (q.ax === 'y' ? q.y1 - q.y0 : q.x1 - q.x0) / q.n);
  return { fl, ld, path, n, rise, z0, sh, sw, hw, hd };
}

// ================================================================= 3D
const view = $('view3d');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
view.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xbfd9ee);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI / 2 - 0.02;
scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa37a, 0.6));
const sun = new THREE.DirectionalLight(0xfff4e0, 0.95);
sun.position.set(26, 24, 16); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 90 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.06; scene.add(sun);
const world = new THREE.Group(); world.position.z = CY; scene.add(world);

const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .9, side: THREE.DoubleSide }, o));
const MT = {
  wall: mat(0xf3ecdc), wallIn: mat(0xfaf8f2), mamad: mat(0xcfd6dc), slab: mat(0xe6e2d8), tile: mat(0xb9492f, { roughness: .8 }),
  glass: mat(0x5d86a8, { roughness: .2, metalness: .3, transparent: true, opacity: .75 }), frame: mat(0xffffff), door: mat(0x6b4a30),
  steel: mat(0x7d8790, { metalness: .5, roughness: .5 }), floorG: mat(0xd9cdb8), floorU: mat(0xc9b08a), pave: mat(0xc9c2b4),
  fence: mat(0xd8cfbd), stair: mat(0xbfb8aa), rail: mat(0x444444), pergola: mat(0x8a6a48), newW: mat(0xf2a7a0),
  ghost: mat(0xf2c200, { transparent: true, opacity: .35 }), wood: mat(0xb98b56), grass: mat(0x86b85f), leaf: mat(0x4f8f45),
  cab: mat(0xefe6d6), top: mat(0x3d4247, { roughness: .4 }), white: mat(0xffffff, { roughness: .4 }), fabric: mat(0x8fa3b8), bed: mat(0xe9e4ee), dark: mat(0x222222)
};
const MN = Object.assign({}, MT, { wall: mat(0xcfccc4), wallIn: mat(0xcfccc4), floorG: mat(0xbdbab2), floorU: mat(0xbdbab2), newW: mat(0xcfccc4) });
const MS = { grass: mat(0x7fa35a), plot: mat(0x8fb267), road: mat(0x55585c), solar: mat(0x1c2a44, { roughness: .3 }), red: mat(0xcc2222), man: mat(0x2f5d9b) };

function slab(parent, pts, y0, th, material, hole) {
  const s = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  (hole || []).forEach(hh => s.holes.push(new THREE.Path(hh.map(p => new THREE.Vector2(p[0], p[1])))));
  const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, material); m.position.y = y0; parent.add(m); return m;
}
function box(parent, x0, x1, py0, py1, y0, y1, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), y1 - y0, Math.abs(py1 - py0)), material);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, -(py0 + py1) / 2); parent.add(m); return m;
}
function line3(parent, pts, y0, h, t, material) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy); if (len < 1e-4) continue;
    const m = new THREE.Mesh(new THREE.BoxGeometry(len + t, h, t), material);
    m.position.set((a[0] + b[0]) / 2, y0 + h / 2, -(a[1] + b[1]) / 2); m.rotation.y = Math.atan2(dy, dx); parent.add(m);
  }
}
function sprite(parent, text, px, py, h, sc, sub) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const x = c.getContext('2d'); x.font = 'bold 56px "Segoe UI",Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 10; x.strokeStyle = 'rgba(255,255,255,.95)'; x.strokeText(text, 256, sub ? 44 : 64); x.fillStyle = '#1d2b3a'; x.fillText(text, 256, sub ? 44 : 64);
  if (sub) { x.font = 'bold 38px "Segoe UI",Arial'; x.lineWidth = 8; x.strokeText(sub, 256, 100); x.fillStyle = '#3a5a7a'; x.fillText(sub, 256, 100); }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
  s.scale.set(3.2 * (sc || 1), 0.8 * (sc || 1), 1); s.position.set(px, h, -py); parent.add(s);
}

function buildWall3(g, w, M, hl) {
  const demo = w.st === 'demo'; if (demo && !hl) return;
  const v = wv(w), base = w.f ? L1 : 0, H = wallH(w), ang = Math.atan2(v.uy, v.ux);
  const m = demo ? M.ghost : w.k === 'mamad' ? M.mamad : w.k === 'low' ? M.fence : w.k === 'rail' ? M.rail : (w.st === 'new' && hl) ? M.newW : w.k === 'int' ? M.wallIn : M.wall;
  const seg = (s0, s1, y0, y1, mm, tt) => {
    if (s1 - s0 < 0.005 || y1 - y0 < 0.005) return;
    const c = wp(w, v, (s0 + s1) / 2), me = new THREE.Mesh(new THREE.BoxGeometry(s1 - s0, y1 - y0, tt || w.t), mm || m);
    me.position.set(c[0], base + (y0 + y1) / 2, -c[1]); me.rotation.y = ang; g.add(me);
  };
  const e = w.curve || w.k === 'rail' ? 0 : w.t / 2;
  if (demo) { seg(0, v.L, 0, H); return; }
  let cur = -e;
  w.ops.filter(o => o.st !== 'closed').map(o => Object.assign({}, o, { s0: Math.max(0, o.s - o.w / 2), s1: Math.min(v.L, o.s + o.w / 2) })).sort((p, q) => p.s0 - q.s0).forEach(o => {
    const top = Math.min(H, o.sill + o.h);
    seg(cur, o.s0, 0, H); seg(o.s0, o.s1, 0, o.sill); seg(o.s0, o.s1, top, H);
    if (o.type === 'win' || o.type === 'slide') {
      seg(o.s0, o.s1, o.sill, top, M.glass, 0.05);
      seg(o.s0, o.s1, o.sill - 0.04, o.sill + 0.02, M.frame, w.t + 0.06); seg(o.s0, o.s1, top - 0.03, top + 0.03, M.frame, w.t + 0.04);
      if (o.w > 1.6) seg(o.s - 0.03, o.s + 0.03, o.sill, top, M.frame, 0.08);
    } else if (o.type === 'door') {
      const a2 = ang + 1.25, lx = Math.cos(a2), ly = Math.sin(a2), Hn = wp(w, v, o.s0), ww = o.s1 - o.s0;
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(ww, top - 0.02, 0.04), w.k === 'mamad' ? M.steel : M.door);
      leaf.position.set(Hn[0] + lx * ww / 2, base + top / 2, -(Hn[1] + ly * ww / 2)); leaf.rotation.y = a2; g.add(leaf);
    }
    cur = o.s1;
  });
  seg(cur, v.L + e, 0, H);
}

// item builders work in local coords: x across (w), y along (d), z up from the item's floor level
function buildItem3(parent, it, M, hl) {
  if (it.st === 'demo' && !hl) return;
  const g = new THREE.Group(), base = it.f ? L1 : 0; parent.add(g);
  const ghost = it.st === 'demo';
  const B = (x0, x1, y0, y1, z0, z1, m) => {
    const me = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, z1 - z0, y1 - y0), ghost ? M.ghost : m);
    me.position.set((x0 + x1) / 2, (z0 + z1) / 2, -(y0 + y1) / 2); g.add(me); return me;
  };
  const w = it.w, d = it.d, hw = w / 2, hd = d / 2, t = it.type;
  if (t === 'stairsInt') {           // fixed position, absolute unit coords
    g.position.set(0, 0, 0); const rise = L1 / 18, tr = 0.235;
    for (let i = 0; i < 9; i++) { const x1 = 3.45 - i * tr; B(x1 - tr, x1, 6.02, 7.05, 0, (i + 1) * rise, M.stair); }
    B(0.12, 1.335, 6.02, 8.2, L1 / 2 - 0.15, L1 / 2, M.stair);
    for (let i = 0; i < 9; i++) { const x0 = 1.335 + i * 0.195; B(x0, x0 + 0.195, 7.15, 8.2, L1 / 2 + i * rise - 0.15, L1 / 2 + (i + 1) * rise, M.stair); }
    return;
  }
  g.position.set(it.x, base, -it.y); g.rotation.y = (it.rot || 0) * Math.PI / 180;
  if (t === 'stairsExt') {
    const G = stairGeo(it), z0 = G.z0, rise = G.rise;
    const bar = (a, b) => {
      const A = new THREE.Vector3(a[0], a[2], -a[1]), Bv = new THREE.Vector3(b[0], b[2], -b[1]), me = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, A.distanceTo(Bv)), ghost ? M.ghost : M.rail);
      me.position.copy(A).add(Bv).multiplyScalar(.5); me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), Bv.clone().sub(A).normalize()); g.add(me);
    };
    const post = (x, y, z) => B(x - 0.02, x + 0.02, y - 0.02, y + 0.02, z, z + 0.95, M.rail);
    G.ld.forEach(q => {
      const zt = z0 + (q.k + 1) * rise; B(q.x0, q.x1, q.y0, q.y1, z0, zt, M.stair);
      [[q.x0 + .03, q.y0, q.x0 + .03, q.y1 - .03, Math.abs(q.x0 + G.hw) < .01], [q.x1 - .03, q.y0, q.x1 - .03, q.y1 - .03, Math.abs(q.x1 - G.hw) < .01], [q.x0 + .03, q.y1 - .03, q.x1 - .03, q.y1 - .03, true]]
        .forEach(e => { if (!e[4]) return; bar([e[0], e[1], zt + .95], [e[2], e[3], zt + .95]); post(e[0], e[1], zt); post(e[2], e[3], zt); });
    });
    G.fl.forEach(q => {
      const at = i => q.dir > 0 ? (q.ax === 'y' ? q.y0 : q.x0) + i * q.go : (q.ax === 'y' ? q.y1 : q.x1) - i * q.go;
      for (let i = 0; i < q.n; i++) { const u0 = Math.min(at(i), at(i + 1)), u1 = Math.max(at(i), at(i + 1)), zt = z0 + (q.k0 + i + 1) * rise; if (q.ax === 'y') B(q.x0, q.x1, u0, u1, z0, zt, M.stair); else B(u0, u1, q.y0, q.y1, z0, zt, M.stair); }
      (q.ax === 'y' ? [q.x0 + .03, q.x1 - .03] : [q.y0 + .03, q.y1 - .03]).forEach(sd => {
        const P = i => { const u = at(i + .5), z = z0 + (q.k0 + i + 1) * rise; return q.ax === 'y' ? [sd, u, z] : [u, sd, z]; };
        for (let i = 0; i < q.n - 1; i += 3) { const c = P(i); post(c[0], c[1], c[2]); }
        const a = P(0), e = P(q.n - 1); post(e[0], e[1], e[2]); bar([a[0], a[1], a[2] + .95], [e[0], e[1], e[2] + .95]);
      });
    });
  } else if (t === 'balcony') {
    B(-hw, hw, -hd, hd, -0.2, 0, M.slab); B(-hw, hw, -hd, hd, 0, 0.02, M.pave);
    const rl = [[-hw, -hd], [-hw, hd], [hw, hd], [hw, -hd]];
    for (let i = 0; i < 3; i++) {
      const a = rl[i], b = rl[i + 1];
      B(Math.min(a[0], b[0]) - 0.025, Math.max(a[0], b[0]) + 0.025, Math.min(a[1], b[1]) - 0.025, Math.max(a[1], b[1]) + 0.025, 0.95, 1.0, M.rail);
      B(Math.min(a[0], b[0]) - 0.015, Math.max(a[0], b[0]) + 0.015, Math.min(a[1], b[1]) - 0.015, Math.max(a[1], b[1]) + 0.015, 0.5, 0.53, M.rail);
    }
    for (let x = -hw; x <= hw + 0.01; x += w / Math.max(1, Math.round(w / 0.9))) B(x - 0.02, x + 0.02, hd - 0.02, hd + 0.02, 0, 0.95, M.rail);
    for (let y = -hd; y <= hd + 0.01; y += d / Math.max(1, Math.round(d / 0.9))) { B(-hw - 0.02, -hw + 0.02, y - 0.02, y + 0.02, 0, 0.95, M.rail); B(hw - 0.02, hw + 0.02, y - 0.02, y + 0.02, 0, 0.95, M.rail); }
    if (it.f) [-hw + 0.1, hw - 0.1].forEach(x => B(x - 0.1, x + 0.1, hd - 0.2, hd, -L1 - 0.2, -0.2, M.wall));
  } else if (t === 'pergola') {
    const ph = it.h || 2.4;
    [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].forEach(p => B(p[0] - 0.06, p[0] + 0.06, p[1] - 0.06, p[1] + 0.06, 0, ph, M.pergola));
    B(-hw - 0.1, hw + 0.1, -hd - 0.05, -hd + 0.05, ph, ph + 0.14, M.pergola); B(-hw - 0.1, hw + 0.1, hd - 0.05, hd + 0.05, ph, ph + 0.14, M.pergola);
    const n = Math.max(2, Math.round(w / 0.4)); for (let i = 0; i <= n; i++) { const x = -hw + w * i / n; B(x - 0.03, x + 0.03, -hd - 0.15, hd + 0.15, ph + 0.14, ph + 0.24, M.pergola); }
  } else if (t === 'column') B(-hw, hw, -hd, hd, 0, it.f ? HU : HG, M.mamad);
  else if (t === 'deck') B(-hw, hw, -hd, hd, -0.18, 0.04, M.wood);
  else if (t === 'paving') B(-hw, hw, -hd, hd, -0.18, 0.0, M.pave);
  else if (t === 'lawn') B(-hw, hw, -hd, hd, -0.18, -0.02, M.grass);
  else if (t === 'tree') {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2, 8), ghost ? M.ghost : M.pergola); tr.position.y = 0.8; g.add(tr);
    const cr = new THREE.Mesh(new THREE.SphereGeometry(Math.max(w, d) / 2, 12, 10), ghost ? M.ghost : M.leaf); cr.position.y = 1.8 + Math.max(w, d) / 2; g.add(cr);
  } else if (t === 'kitchen') {
    B(-hw, hw, -hd, hd - 0.02, 0.1, 0.86, M.cab); B(-hw, hw, -hd, hd - 0.08, 0, 0.1, M.dark); B(-hw, hw, -hd, hd + 0.02, 0.86, 0.9, M.top);
    B(-hw, hw, -hd, -hd + 0.02, 0.9, 1.45, M.white); B(-hw, hw, -hd, -hd + 0.35, 1.45, 2.15, M.cab);
    const n = Math.max(1, Math.round(w / 0.6)); for (let i = 1; i < n; i++) { const x = -hw + w * i / n; B(x - 0.004, x + 0.004, hd - 0.02, hd - 0.012, 0.12, 0.84, M.dark); B(x - 0.004, x + 0.004, -hd + 0.35, -hd + 0.358, 1.47, 2.13, M.dark); }
    B(-w / 4 - 0.28, -w / 4 + 0.28, -0.2, 0.2, 0.895, 0.91, M.steel); B(-w / 4 - 0.02, -w / 4 + 0.02, -hd + 0.06, -hd + 0.1, 0.9, 1.15, M.steel);
    B(w / 4 - 0.3, w / 4 + 0.3, -0.22, 0.22, 0.9, 0.915, M.dark); B(w / 4 - 0.3, w / 4 + 0.3, -hd, -hd + 0.4, 1.3, 1.45, M.steel);
  } else if (t === 'island') { B(-hw + 0.05, hw - 0.05, -hd + 0.05, hd - 0.05, 0, 0.86, M.cab); B(-hw, hw, -hd, hd, 0.86, 0.9, M.top); }
  else if (t === 'counter') { B(-hw, hw, -hd, hd, 0, 0.86, M.cab); B(-hw, hw, -hd, hd, 0.86, 0.9, M.top); }
  else if (t === 'fridge') { B(-hw, hw, -hd, hd, 0, 1.9, M.steel); B(-hw + 0.03, -hw + 0.06, hd, hd + 0.03, 0.9, 1.5, M.dark); }
  else if (t === 'wc') { B(-hw, hw, -hd + 0.18, hd, 0, 0.4, M.white); B(-hw, hw, -hd, -hd + 0.18, 0, 0.8, M.white); }
  else if (t === 'sink') { B(-0.08, 0.08, -hd, -hd + 0.2, 0, 0.75, M.white); B(-hw, hw, -hd, hd, 0.75, 0.88, M.white); B(-0.02, 0.02, -hd + 0.04, -hd + 0.08, 0.88, 1.05, M.steel); }
  else if (t === 'shower') { B(-hw, hw, -hd, hd, 0, 0.08, M.white); B(-hw, hw, hd - 0.02, hd, 0.08, 2.0, M.glass); B(hw - 0.02, hw, -hd, hd, 0.08, 2.0, M.glass); B(-hw + 0.05, -hw + 0.09, -hd + 0.05, -hd + 0.09, 0.08, 2.1, M.steel); }
  else if (t === 'bath') { B(-hw, hw, -hd, hd, 0, 0.55, M.white); B(-hw + 0.08, hw - 0.08, -hd + 0.08, hd - 0.08, 0.5, 0.56, M.glass); }
  else if (t === 'washer') { B(-hw, hw, -hd, hd, 0, 0.85, M.white); B(-0.18, 0.18, hd, hd + 0.02, 0.25, 0.6, M.dark); }
  else if (t === 'bedD' || t === 'bedS') {
    B(-hw, hw, -hd, hd, 0, 0.3, M.pergola); B(-hw + 0.03, hw - 0.03, -hd + 0.05, hd - 0.03, 0.3, 0.5, M.bed); B(-hw, hw, -hd, -hd + 0.06, 0, 0.95, M.pergola);
    (t === 'bedD' ? [-w / 4, w / 4] : [0]).forEach(x => B(x - 0.3, x + 0.3, -hd + 0.12, -hd + 0.5, 0.5, 0.6, M.white));
  } else if (t === 'sofa') { B(-hw, hw, -hd, hd, 0, 0.42, M.fabric); B(-hw, hw, -hd, -hd + 0.22, 0.42, 0.85, M.fabric); B(-hw, -hw + 0.18, -hd, hd, 0.42, 0.62, M.fabric); B(hw - 0.18, hw, -hd, hd, 0.42, 0.62, M.fabric); }
  else if (t === 'table') { B(-hw, hw, -hd, hd, 0.72, 0.76, M.wood);[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(p => B(p[0] * (hw - 0.08) - 0.03, p[0] * (hw - 0.08) + 0.03, p[1] * (hd - 0.08) - 0.03, p[1] * (hd - 0.08) + 0.03, 0, 0.72, M.wood)); }
  else if (t === 'wardrobe') { B(-hw, hw, -hd, hd, 0, 2.4, M.cab); const n = Math.max(1, Math.round(w / 0.5)); for (let i = 1; i < n; i++) { const x = -hw + w * i / n; B(x - 0.004, x + 0.004, hd, hd + 0.006, 0.05, 2.35, M.dark); } }
  else B(-hw, hw, -hd, hd, 0, 0.5, M.cab);
}

function buildUnit(St, sx, M, hl, withLabels) {
  const root = new THREE.Group(); root.scale.x = sx;
  const gG = new THREE.Group(), gU = new THREE.Group(), gR = new THREE.Group(); root.add(gG, gU, gR);
  const labG = new THREE.Group(), labU = new THREE.Group();
  const si = St.items.find(i => i.type === 'stairsInt'), hole = si && si.st !== 'demo' ? stairHole : null;
  const sh = shells(St), each = (polys, fn) => polys.forEach(P => fn(P.o, hole && inPoly(P.o, [1.6, 7]) ? P.h.concat([hole]) : P.h));
  sh.G.forEach(P => slab(gG, P.o, -0.15, 0.17, M.floorG, P.h));
  const bg = new THREE.Mesh(new THREE.CylinderGeometry(1.56, 1.56, 1.25, 28, 1, true, -30 * Math.PI / 180, 150 * Math.PI / 180), M.glass);
  const bay = St.walls.some(w => w.curve && w.st !== 'demo');
  bg.position.set(6.75, 1.55, -1.55); if (bay) gG.add(bg);
  slab(gG, [[7.6, 5.7], [9.3, 5.7], [9.3, 7.5], [7.6, 7.5]], 2.35, 0.12, M.tile); box(gG, 9.15, 9.27, 5.75, 5.87, 0, 2.35, M.frame);
  each(sh.sk, (o, h) => { slab(gU, o, 2.74, 0.17, M.slab, h); slab(gU, o, 2.91, 0.11, M.tile, h); });
  each(sh.U, (o, h) => slab(gU, o, 3.02, 0.05, M.floorU, h));
  sh.E.forEach(P => slab(gR, P.o, CEIL, TOP - CEIL - 0.005, M.slab, P.h));
  gR.add(new THREE.Mesh(roofGeo(sh.Em), M.tile));
  const bp = balcPts(St), bm = balcOf(St);
  if (bp) {
    const nb = hl && bm.mode === 'rect';
    if (bm.mode === 'rect' || !bay) slab(gU, bp, L1 - 0.2, 0.16, nb ? M.newW : M.slab);
    slab(gU, bp, 3.02, 0.06, M.pave);
    const rl = bm.mode === 'rect' ? (bm.d > 1.64 ? [[4.5, 0.5], ...bp.slice(2)] : bp.slice(2)) : bp.slice(1);
    line3(gU, rl, L1 + 0.95, 0.06, 0.06, M.rail); line3(gU, rl, L1 + 0.5, 0.04, 0.04, M.rail);
    const step = bm.mode === 'rect' ? 1 : 3;
    rl.forEach((q, i) => { if (i % step === 0) box(gU, q[0] - 0.025, q[0] + 0.025, q[1] - 0.025, q[1] + 0.025, L1, L1 + 0.95, M.rail); });
    if (bm.mode === 'rect') for (let i = 0; i < rl.length - 1; i++) { const a = rl[i], c = rl[i + 1], n = Math.round(Math.hypot(c[0] - a[0], c[1] - a[1]) / 0.9); for (let j = 1; j < n; j++) { const x = a[0] + (c[0] - a[0]) * j / n, y = a[1] + (c[1] - a[1]) * j / n; box(gU, x - 0.02, x + 0.02, y - 0.02, y + 0.02, L1, L1 + 0.95, M.rail); } }
  } else if (hl) { slab(gU, balc, 3.03, 0.05, M.ghost); }
  St.walls.forEach(w => buildWall3(w.f ? gU : gG, w, M, hl));
  St.items.forEach(it => buildItem3(it.f ? gU : gG, it, M, hl));
  if (withLabels) [0, 1].forEach(f => { const rs = St.rooms.filter(r => r.f === f), ra = roomAreas(St, f, rs); rs.forEach(r => { const a = ra.get(r.id).a; sprite(f ? labU : labG, r.name, r.x * sx, r.y, (f ? L1 : 0) + 1.5, 1, a ? a.toFixed(1) + ' מ"ר' : ''); }); });
  root.traverse(o => { if (o.isMesh) { o.castShadow = o.material !== M.ghost; o.receiveShadow = true; } });
  return { root, gG, gU, gR, labG, labU };
}

// static: neighbour, roof, site
const gSite = new THREE.Group(), gRoof = new THREE.Group(); world.add(gSite, gRoof);
const neigh = buildUnit(baseState(false), -1, MN, false, false); world.add(neigh.root);
(function () {
  const k = RK;
  [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.9), MS.solar); p.position.set(s * 1.0, TOP + 1.25 * k + 0.08, -1.25); p.rotation.x = Math.atan(k); gRoof.add(p); });
  sprite(gRoof, 'הבית שלכם', 4.3, 6.0, 9.2); sprite(gRoof, 'שכנים', -4.3, 6.0, 9.0);
  // site
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), MS.grass); gr.rotation.x = -Math.PI / 2; gr.position.set(0, -0.2, -CY); gr.userData.noCast = 1; gSite.add(gr);
  const plot = [[-12.5, 17.6], [12.5, 17.6], [14.63, -8], [-14.63, -8]];
  slab(gSite, plot, -0.19, 0.03, MS.plot);
  line3(gSite, [plot[1], plot[2], plot[3], plot[0]], -0.2, 1.5, 0.2, MT.fence);
  line3(gSite, [[-9.0, 17.6], [-0.6, 17.6]], -0.2, 1.0, 0.2, MT.fence); line3(gSite, [[0.6, 17.6], [9.0, 17.6]], -0.2, 1.0, 0.2, MT.fence);
  line3(gSite, [[0, 0.5], [0, -8]], -0.2, 1.9, 0.15, MT.fence); line3(gSite, [[0, 12.1], [0, 17.6]], -0.2, 1.2, 0.15, MT.fence);
  slab(gSite, [[-4.6, -1.6], [4.6, -1.6], [4.6, 0.6], [-4.6, 0.6]], -0.17, 0.04, MT.pave);
  slab(gSite, [[-40, 18.0], [40, 18.0], [40, 25], [-40, 25]], -0.19, 0.03, MS.road);
  slab(gSite, [[-40, 17.75], [40, 17.75], [40, 18.0], [-40, 18.0]], -0.19, 0.08, MT.pave);
  slab(gSite, [[14.9, -8], [17.4, -8], [16.4, 18], [13.9, 18]], -0.19, 0.035, MT.pave);
  [1, -1].forEach(s => {
    const xs = [9.2 * s, 12.2 * s].sort((a, b) => a - b), ex = [8.0 * s, 9.4 * s].sort((a, b) => a - b);
    slab(gSite, [[xs[0], 12.3], [xs[1], 12.3], [xs[1], 17.6], [xs[0], 17.6]], -0.17, 0.04, MT.pave);
    slab(gSite, [[xs[0] - 0.15, 12.3], [xs[1] + 0.15, 12.3], [xs[1] + 0.15, 17.4], [xs[0] - 0.15, 17.4]], 2.35, 0.15, MT.slab);
    [[xs[0], 12.45], [xs[1], 12.45], [xs[0], 17.25], [xs[1], 17.25]].forEach(p => box(gSite, p[0] - 0.07, p[0] + 0.07, p[1] - 0.07, p[1] + 0.07, -0.2, 2.35, MT.frame));
    slab(gSite, [[ex[0], 5.6], [ex[1], 5.6], [ex[1], 12.4], [ex[0], 12.4]], -0.17, 0.04, MT.pave);
  });
  const ar = new THREE.Group(), sh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 3), MS.red); sh.position.z = -1.5;
  const hd = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 4), MS.red); hd.rotation.x = -Math.PI / 2; hd.position.z = -3.4;
  ar.add(sh, hd); ar.position.set(-17, -0.1, -21.5); ar.rotation.y = 18 * Math.PI / 180; gSite.add(ar);
  sprite(gSite, 'צ', -18.2, 24.6, 0.8); sprite(gSite, 'רחוב', 0, 21.5, 0.3);
  [gSite, gRoof].forEach(G => G.traverse(o => { if (o.isMesh) { o.castShadow = !o.userData.noCast; o.receiveShadow = true; } }));
})();

let mine = null;
function rebuild3D() {
  if (mine) { [mine.root, mine.labG, mine.labU].forEach(g => { world.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) { o.material.map.dispose(); o.material.dispose(); } }); }); }
  mine = buildUnit(S, 1, MT, $('cHL').checked, true); world.add(mine.root, mine.labG, mine.labU); applyVis();
}
function applyVis() {
  const up = $('cUpper').checked, rf = $('cRoof').checked && up, lb = $('cLabels').checked;
  mine.gU.visible = neigh.gU.visible = up; mine.gR.visible = neigh.gR.visible = gRoof.visible = rf; gSite.visible = $('cSite').checked;
  mine.labU.visible = lb && up && !rf; mine.labG.visible = lb && !up;
}
const VIEWS = { se: [21, 13, 24], n: [6, 9, -30], e: [32, 9, 2], top: [4, 40, 0.01], g: [11, 20, 15], u: [12, 19, 12] };
function setView(v) {
  if (v === 'g') { $('cUpper').checked = false; } if (v === 'u') { $('cUpper').checked = true; $('cRoof').checked = false; }
  applyVis(); camera.position.set(...VIEWS[v]); controls.target.set(v === 'se' || v === 'n' ? 0 : 4, 2.5, 0); controls.update();
}
function resize3D() { const w = view.clientWidth, h = view.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
(function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();

// ================================================================= 2D plan drawing (shared by editor and work sheets)
const F = v => (+v).toFixed(3), Yv = v => F(-v);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function drawPlan(St, f, o) {
  const md = o.mode, edit = md === 'edit'; let h = '';
  const poly = (pts, at) => `<polygon points="${pts.map(p => F(p[0]) + ',' + Yv(p[1])).join(' ')}" ${at}/>`;
  const LH = k => edit && lyH(k), LK = k => edit && lyL(k);
  if (f === 0) h += poly(PLOT, 'fill="#f1f7ea" stroke="#7a9a5a" stroke-width=".04" stroke-dasharray=".25 .15"');
  else footprint(St, 0).polys.forEach(P => h += poly(P.o, 'fill="none" stroke="#bbb" stroke-width=".03" stroke-dasharray=".12 .12"'));
  footprint(St, f).polys.forEach(P => h += poly(P.o, 'fill="#fffdf8" stroke="none"'));
  if (f && !LH('בנייה')) {
    const bm = balcOf(St), bp = md === 'exist' ? balc : balcPts(St), bs = o.sel && o.sel.k === 'balc', chg = bm.mode !== 'round' && (md === 'changes' || edit);
    const hit = edit ? 'data-k="balc" data-id="balc" style="cursor:pointer"' : '';
    if (chg) h += poly(balc, `fill="${bp ? 'none' : '#fff3bf'}" stroke="#e6b800" stroke-width=".05" stroke-dasharray=".14 .08" ${bp ? '' : hit}`);
    if (bp) h += poly(bp, `fill="#f0ede6" stroke="${bs ? '#1e90ff' : chg ? '#d62828' : '#999'}" stroke-width="${bs ? .08 : chg ? .05 : .03}" ${hit}`);
    if (bp && o.dims && bm.mode === 'rect' && md !== 'exist') h += `<text x="${F(4.5 + bm.w / 2)}" y="${Yv(2.13 - bm.d - .2)}" font-size=".15" fill="#b00" text-anchor="middle" direction="ltr">${cm(bm.w)}</text><text x="${F(4.5 + bm.w + .22)}" y="${Yv(2.13 - bm.d / 2)}" font-size=".15" fill="#b00" text-anchor="middle" direction="ltr">${cm(bm.d)}</text>`;
  }
  h += `<rect x="-3" y="${Yv(12.1)}" width="2.88" height="11.5" fill="#e9e9e9"/><text x="-1.5" y="${Yv(6)}" font-size=".35" fill="#999" text-anchor="middle">שכנים</text>`;
  // items
  const itemSvg = it => {
    const D = IT[it.type] || {}, isSel = o.sel && o.sel.id === it.id;
    if (md === 'exist' && it.st === 'new') return ''; if (md === 'prop' && it.st === 'demo') return ''; if (LH(lyOf(it))) return '';
    let stroke = '#666', fill = D.c || '#f3efe6', dash = '';
    if (md === 'changes' || edit) { if (it.st === 'new') stroke = '#d62828'; if (it.st === 'demo') { stroke = '#c79a00'; fill = '#fff3bf'; dash = 'stroke-dasharray=".12 .08"'; } }
    if (md === 'changes' && it.st === 'exist') { stroke = '#bbb'; fill = '#f6f6f6'; }
    let s = `<g transform="translate(${F(it.x)},${Yv(it.y)}) rotate(${-(it.rot || 0)})" data-k="item" data-id="${it.id}" ${LK(lyOf(it)) ? 'opacity=".5"' : ''} style="cursor:${edit && !it.lock && !LK(lyOf(it)) ? 'move' : 'default'}">`;
    const hw = it.w / 2, hd = it.d / 2;
    if (it.type === 'tree') s += `<circle r="${F(hw)}" fill="${fill}" stroke="${stroke}" stroke-width=".03" ${dash}/>`;
    else if (it.type === 'pergola') s += `<rect x="${F(-hw)}" y="${F(-hd)}" width="${F(it.w)}" height="${F(it.d)}" fill="none" stroke="${stroke}" stroke-width="${isSel ? .12 : .08}" stroke-opacity=".7" pointer-events="stroke" ${dash}/>`;
    else if (it.type === 'stairsExt') s += `<rect x="${F(-hw)}" y="${F(-hd)}" width="${F(it.w)}" height="${F(it.d)}" fill="transparent" stroke="${isSel ? '#1e90ff' : 'none'}" stroke-width=".03" stroke-dasharray=".1 .08"/>`;
    else s += `<rect x="${F(-hw)}" y="${F(-hd)}" width="${F(it.w)}" height="${F(it.d)}" fill="${fill}" fill-opacity="${D.flat ? .55 : .9}" stroke="${stroke}" stroke-width="${isSel ? .07 : .03}" ${dash}/>`;
    if (it.type === 'stairsExt') {
      const G = stairGeo(it), R = q => `<rect x="${F(q.x0)}" y="${F(-q.y1)}" width="${F(q.x1 - q.x0)}" height="${F(q.y1 - q.y0)}" fill="${fill}" fill-opacity=".9" stroke="${stroke}" stroke-width="${isSel ? .06 : .03}" ${dash}/>`;
      G.ld.forEach(q => s += R(q));
      G.fl.forEach(q => { s += R(q); for (let i = 1; i < q.n; i++) { const u = q.dir > 0 ? (q.ax === 'y' ? q.y0 : q.x0) + i * q.go : (q.ax === 'y' ? q.y1 : q.x1) - i * q.go; s += q.ax === 'y' ? `<line x1="${F(q.x0)}" x2="${F(q.x1)}" y1="${F(-u)}" y2="${F(-u)}" stroke="${stroke}" stroke-width=".02"/>` : `<line x1="${F(u)}" x2="${F(u)}" y1="${F(-q.y0)}" y2="${F(-q.y1)}" stroke="${stroke}" stroke-width=".02"/>`; } });
      const pp = G.path, a = pp[pp.length - 2], b = pp[pp.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      const h1 = [b[0] - ux * .25 - uy * .15, b[1] - uy * .25 + ux * .15], h2 = [b[0] - ux * .25 + uy * .15, b[1] - uy * .25 - ux * .15];
      s += `<path d="M${pp.map(q => F(q[0]) + ' ' + F(-q[1])).join(' L')} M${F(h1[0])} ${F(-h1[1])} L${F(b[0])} ${F(-b[1])} L${F(h2[0])} ${F(-h2[1])}" fill="none" stroke="${stroke}" stroke-width=".04" pointer-events="none"/>`;
    }
    if (it.type === 'stairsInt') { for (let i = 1; i < 9; i++) { const x = hw - 0.235 * i; s += `<line x1="${F(x)}" x2="${F(x)}" y1="0.05" y2="${F(hd)}" stroke="${stroke}" stroke-width=".02"/>`; const x2 = -hw + 1.2 + 0.195 * i; s += `<line x1="${F(x2)}" x2="${F(x2)}" y1="${F(-hd)}" y2="-0.05" stroke="${stroke}" stroke-width=".02"/>`; } s += `<line x1="${F(-hw + 1.2)}" x2="${F(hw)}" y1="0" y2="0" stroke="${stroke}" stroke-width=".04"/>`; }
    if (it.type === 'pergola') { const n = Math.max(2, Math.round(it.w / 0.4)); for (let i = 1; i < n; i++) { const x = -hw + it.w * i / n; s += `<line x1="${F(x)}" x2="${F(x)}" y1="${F(-hd)}" y2="${F(hd)}" stroke="${stroke}" stroke-width=".02" stroke-dasharray=".1 .06"/>`; } }
    if (it.type === 'kitchen') s += `<rect x="${F(-it.w / 4 - .25)}" y="-.18" width=".5" height=".36" fill="none" stroke="${stroke}" stroke-width=".02"/><circle cx="${F(it.w / 4 - .13)}" cy="0" r=".09" fill="none" stroke="${stroke}" stroke-width=".02"/><circle cx="${F(it.w / 4 + .13)}" cy="0" r=".09" fill="none" stroke="${stroke}" stroke-width=".02"/>`;
    if (/^(kitchen|sofa|wc|sink|bedD|bedS|wardrobe|fridge|washer|counter)$/.test(it.type)) s += `<line x1="${F(-hw)}" x2="${F(hw)}" y1="${F(hd - .03)}" y2="${F(hd - .03)}" stroke="${stroke}" stroke-width=".06"/>`;   // back (wall) side
    const fs = Math.min(.24, Math.max(.11, Math.min(it.w, it.d * 2.2) / (D.n || '').length * 1.4));
    if ((it.w > .55 || it.d > .55) && it.type !== 'column') s += `<text transform="rotate(${it.rot || 0})" font-size="${F(fs)}" fill="#444" text-anchor="middle" dominant-baseline="middle" pointer-events="none">${esc(D.n || it.type)}</text>`;
    return s + '</g>';
  };
  const its = St.items.filter(it => it.f === f || (IT[it.type] && IT[it.type].both));
  const byA = (a, b) => b.w * b.d - a.w * a.d;      // big things first, so small ones stay on top
  its.filter(i => (IT[i.type] || {}).flat).sort(byA).forEach(i => h += itemSvg(i));
  // walls
  const ws = LH('walls') ? [] : St.walls.filter(w => w.f === f);
  let top = '';
  ws.forEach(w => {
    if (md === 'exist' && w.st === 'new') return; if (md === 'prop' && w.st === 'demo') return;
    const v = wv(w), sel = o.sel && (o.sel.id === w.id || (w.curve && o.selCurve));
    let col = w.k === 'mamad' ? '#3b6ea5' : w.k === 'party' ? '#777' : w.k === 'low' || w.k === 'rail' ? '#8a7f6a' : '#2f2f2f', dash = '';
    if (edit || md === 'changes') { if (md === 'changes') col = '#b9b9b9'; if (w.st === 'new') col = '#d62828'; if (w.st === 'demo') { col = '#e6b800'; dash = 'stroke-dasharray=".14 .08"'; } }
    const ln = (a, b, c, sw, ex) => `<line x1="${F(a[0])}" y1="${Yv(a[1])}" x2="${F(b[0])}" y2="${Yv(b[1])}" stroke="${c}" stroke-width="${F(sw)}" ${ex || ''}/>`;
    if (sel) h += ln(w.a, w.b, '#1e90ff', w.t + 0.16, 'stroke-linecap="round" opacity=".6"');
    h += ln(w.a, w.b, col, w.t, dash + (w.curve ? ' stroke-linecap="round"' : ''));
    if (w.st !== 'demo' || md === 'changes') w.ops.forEach(op => {
      const p0 = wp(w, v, Math.max(0, op.s - op.w / 2)), p1 = wp(w, v, Math.min(v.L, op.s + op.w / 2));
      const showSym = md === 'exist' ? op.st !== 'new' : op.st !== 'closed';
      if (md === 'changes' && op.st === 'new') { h += ln(p0, p1, '#e6b800', w.t + .04); return; }
      if ((md === 'changes' || edit) && op.st === 'closed') { h += ln(p0, p1, '#d62828', w.t, 'stroke-dasharray=".06 .04"'); return; }
      if (!showSym) return;
      const oc = edit && op.st === 'new' ? '#d62828' : md === 'changes' ? '#999' : '#333';
      h += ln(p0, p1, '#fffdf8', w.t + .03);
      if (op.type === 'win') h += ln(p0, p1, '#2a8fbd', .05) + ln(p0, p1, oc, w.t, 'stroke-opacity=".0"');
      else if (op.type === 'slide') { const n = [-v.uy * .04, v.ux * .04]; h += ln([p0[0] + n[0], p0[1] + n[1]], wp(w, v, op.s + .1).map((c, i) => c + n[i]), '#2a8fbd', .04) + ln(wp(w, v, op.s - .1).map((c, i) => c - n[i]), [p1[0] - n[0], p1[1] - n[1]], '#2a8fbd', .04); }
      else if (op.type === 'door') { const ww = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), le = [p0[0] - v.uy * ww, p0[1] + v.ux * ww]; top += `<path d="M${F(p0[0])} ${Yv(p0[1])} L${F(le[0])} ${Yv(le[1])} A${F(ww)} ${F(ww)} 0 0 1 ${F(p1[0])} ${Yv(p1[1])}" fill="none" stroke="${oc}" stroke-width=".025"/>`; }
      else h += ln(p0, p1, oc, .02, 'stroke-dasharray=".06 .06"');
    });
    if (o.dims && !w.curve && v.L >= 0.6 && (md !== 'changes' || w.st !== 'exist') && (md === 'changes' || w.k === 'int' || w.st === 'new' || w.k === 'low')) {
      const mx = (w.a[0] + w.b[0]) / 2 - v.uy * (w.t / 2 + .13), my = (w.a[1] + w.b[1]) / 2 + v.ux * (w.t / 2 + .13); let an = -Math.atan2(v.uy, v.ux) * 180 / Math.PI; if (an > 90 || an < -90) an += 180;
      top += `<text x="${F(mx)}" y="${Yv(my)}" transform="rotate(${F(an)} ${F(mx)} ${Yv(my)})" font-size=".15" fill="${w.st === 'new' ? '#b00' : w.st === 'demo' ? '#8a6d00' : '#555'}" text-anchor="middle" dominant-baseline="middle" direction="ltr">${cm(v.L)}</text>`;
    }
    if (edit) top += ln(w.a, w.b, 'transparent', Math.max(w.t, .34), `data-k="wall" data-id="${w.id}" style="cursor:pointer"`);
  });
  its.filter(i => !(IT[i.type] || {}).flat).sort(byA).forEach(i => h += itemSvg(i));
  h += top;
  if (!LH('rooms')) {
    const rs = (md === 'exist' ? BASE.rooms : St.rooms).filter(r => r.f === f), ra = roomAreas(md === 'exist' ? BASE : St, f, rs);
    rs.forEach(r => {
      const sel = o.sel && o.sel.id === r.id, a = ra.get(r.id).a;
      h += `<text x="${F(r.x)}" y="${Yv(r.y)}" font-size=".3" font-weight="700" fill="${sel ? '#1e6fd0' : '#1d2b3a'}" text-anchor="middle" dominant-baseline="middle" data-k="room" data-id="${r.id}" style="cursor:${edit ? 'move' : 'default'};paint-order:stroke" stroke="#fff" stroke-width=".06">${esc(r.name)}</text>`;
      if (a) h += `<text x="${F(r.x)}" y="${Yv(r.y - .34)}" font-size=".2" fill="#3a5a7a" text-anchor="middle" dominant-baseline="middle" pointer-events="none" style="paint-order:stroke" stroke="#fff" stroke-width=".05">${a.toFixed(1)} מ"ר</text>`;
    });
  }
  return h;
}

// ================================================================= editor
const svg = $('plan'); let floor = 0, tool = 'select', sel = null, drag = null, draft = null, pan = null;
let vb = { x: -1.6, y: -13.8, w: 13.4, h: 17.6 };
// layers: hide or lock a whole category in the editor (design data is untouched)
const LAYERS = [['walls', 'קירות'], ['בנייה', 'בנייה'], ['גינה', 'גינה / ריצוף'], ['מטבח', 'מטבח'], ['רחצה', 'רחצה'], ['ריהוט', 'ריהוט'], ['rooms', 'שמות חדרים']];
let LY = {}; try { LY = JSON.parse(localStorage.getItem('house31-layers')) || {}; } catch (e) { }
const lyOf = it => (IT[it.type] || {}).cat || 'בנייה', lyH = k => !!(LY[k] && LY[k].h), lyL = k => !!(LY[k] && LY[k].l);
function renderLayers() {
  $('layers').innerHTML = '<span class="hint">שכבות:</span>' + LAYERS.map(l => `<span class="ly${lyH(l[0]) ? ' hid' : ''}"><span>${l[1]}</span><button data-ly="${l[0]}" data-a="h" class="${lyH(l[0]) ? '' : 'on'}" title="הצגה / הסתרה">👁</button><button data-ly="${l[0]}" data-a="l" class="${lyL(l[0]) ? 'on' : ''}" title="נעילה - לא ניתן לבחור או לגרור">🔒</button></span>`).join('');
}
$('layers').onclick = e => {
  const b = e.target.closest('button'); if (!b) return; const k = b.dataset.ly; LY[k] = LY[k] || {}; LY[k][b.dataset.a] = LY[k][b.dataset.a] ? 0 : 1;
  try { localStorage.setItem('house31-layers', JSON.stringify(LY)); } catch (x) { } sel = null; renderLayers(); render2D();
};
// everything under the pointer, best candidate first: room label, wall body, then the smallest item
function hits(e, p) {
  const out = [], seen = new Set();
  document.elementsFromPoint(e.clientX, e.clientY).forEach(el => {
    const t = el.closest && el.closest('[data-k]'); if (!t || !svg.contains(t)) return; const k = t.dataset.k, id = t.dataset.id; if (seen.has(id)) return; seen.add(id);
    const it = k === 'item' ? S.items.find(i => i.id === id) : null, w = k === 'wall' ? S.walls.find(x => x.id === id) : null, ly = w ? 'walls' : k === 'room' ? 'rooms' : it ? lyOf(it) : 'בנייה';
    if (lyL(ly) || lyH(ly)) return;
    let pr = 1e6; if (k === 'room') pr = 0; else if (w) { const q = wp(w, wv(w), projS(w, p)); pr = Math.hypot(p[0] - q[0], p[1] - q[1]) <= w.t / 2 + .05 ? 1 : 3.5; } else if (it) pr = 2 + it.w * it.d;
    out.push({ k, id, pr });
  });
  return out.sort((a, b) => a.pr - b.pr);
}
// named versions: built-in prototypes (prototypes.js) + versions saved in this browser
const PROTOS = window.PROTOS || [], VKEY = 'house31-versions';
const myVers = () => { try { return JSON.parse(localStorage.getItem(VKEY)) || []; } catch (e) { return []; } };
function renderVers() {
  const mv = myVers(), og = (lb, arr, pf) => arr.length ? `<optgroup label="${lb}">${arr.map((v, i) => `<option value="${pf}${i}">${esc(v.n)}</option>`).join('')}</optgroup>` : '';
  $('vers').innerHTML = '<option value="">גרסאות…</option>' + og('אבות טיפוס', PROTOS, 'p') + og('הגרסאות שלי', mv, 'u') + '<option value="save">＋ שמירת העיצוב הנוכחי כגרסה…</option>' + (mv.length ? '<option value="del">מחיקת גרסה שלי…</option>' : '');
}
function loadDesign(d, name) { S = JSON.parse(JSON.stringify(d)); sel = null; commit(); toast('נטען: ' + name + ' (Ctrl+Z מחזיר את הקודם)'); }
$('vers').onchange = () => {
  const v = $('vers').value, mv = myVers(); $('vers').value = ''; if (!v) return;
  if (v === 'save') { const n = (prompt('שם לגרסה:', 'גרסה ' + new Date().toLocaleDateString('he-IL')) || '').trim(); if (!n) return; mv.push({ n, d: JSON.parse(JSON.stringify(S)) }); try { localStorage.setItem(VKEY, JSON.stringify(mv)); toast('נשמר: ' + n); } catch (x) { toast('אין מקום בזיכרון הדפדפן'); } renderVers(); return; }
  if (v === 'del') { const i = parseInt(prompt('איזו גרסה למחוק?\n' + mv.map((x, k) => (k + 1) + '. ' + x.n).join('\n'), '1'), 10) - 1; if (!mv[i]) return; mv.splice(i, 1); localStorage.setItem(VKEY, JSON.stringify(mv)); renderVers(); return; }
  const src = v[0] === 'p' ? PROTOS[+v.slice(1)] : mv[+v.slice(1)]; if (!src) return;
  if (confirm('לטעון את "' + src.n + '"? העיצוב הנוכחי יוחלף.')) loadDesign(src.d, src.n);
};
const find = () => !sel ? null : sel.k === 'balc' ? (S.balc = S.balc || { mode: 'round', w: 3.7, d: 1.63 }) : sel.k === 'wall' ? S.walls.find(w => w.id === sel.id) : sel.k === 'item' ? S.items.find(i => i.id === sel.id) : S.rooms.find(r => r.id === sel.id);
function render2D() {
  svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  let g = ''; for (let x = -1; x <= 15; x++) g += `<line x1="${x}" x2="${x}" y1="-19" y2="9" stroke="#e3e8ee" stroke-width=".012"/>`;
  for (let y = -8; y <= 18; y++) g += `<line x1="-2" x2="16" y1="${-y}" y2="${-y}" stroke="#e3e8ee" stroke-width=".012"/>`;
  let d = '';
  if (draft) {
    const L = Math.hypot(draft.b[0] - draft.a[0], draft.b[1] - draft.a[1]);
    d = `<line x1="${F(draft.a[0])}" y1="${Yv(draft.a[1])}" x2="${F(draft.b[0])}" y2="${Yv(draft.b[1])}" stroke="#d62828" stroke-width="${wallKind().t}" opacity=".6"/><circle cx="${F(draft.a[0])}" cy="${Yv(draft.a[1])}" r=".07" fill="#d62828"/>` +
      `<text x="${F((draft.a[0] + draft.b[0]) / 2)}" y="${Yv((draft.a[1] + draft.b[1]) / 2 + .3)}" font-size=".28" fill="#b00" text-anchor="middle" stroke="#fff" stroke-width=".05" style="paint-order:stroke" direction="ltr">${cm(L)} ס"מ</text>`;
  }
  const so = find(); svg.innerHTML = g + drawPlan(S, floor, { mode: 'edit', sel, selCurve: !!(sel && sel.k === 'wall' && so && so.curve), dims: $('cDims').checked }) + d;
  renderProps();
}
function commit() {
  hist.length = hi + 1; hist.push(JSON.stringify(S)); if (hist.length > 150) hist.shift(); hi = hist.length - 1;
  try { localStorage.setItem(KEY, hist[hi]); } catch (e) { }
  render2D(); rebuild3D();
}
function restore(i) { hi = i; S = JSON.parse(hist[hi]); sel = null; try { localStorage.setItem(KEY, hist[hi]); } catch (e) { } render2D(); rebuild3D(); }
const wallKind = () => ({ int: { k: 'int', t: 0.1 }, wall: { k: 'int', t: 0.2 }, ext: { k: 'ext', t: 0.2 }, low: { k: 'low', t: 0.12, h: 1.2 } }[$('wk').value]);
function pt(e) { const m = svg.getScreenCTM().inverse(), p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m); return [p.x, -p.y]; }
function snap(p, from, free) {
  let x = p[0], y = p[1], lx = false, ly = false;
  if (from && !free) { if (Math.abs(x - from[0]) > Math.abs(y - from[1])) { y = from[1]; ly = true; } else { x = from[0]; lx = true; } }
  const pts = S.walls.filter(w => w.f === floor && w.st !== 'demo').flatMap(w => [w.a, w.b]);
  let bx = null, by = null, dxm = .13, dym = .13;
  pts.forEach(q => { const a = Math.abs(q[0] - x), b = Math.abs(q[1] - y); if (a < dxm) { dxm = a; bx = q[0]; } if (b < dym) { dym = b; by = q[1]; } });
  if (!lx) x = bx !== null ? bx : Math.round(x / .05) * .05; if (!ly) y = by !== null ? by : Math.round(y / .05) * .05;
  return [r2(x), r2(y)];
}
function addWall(a, b) {
  if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.08) return null;
  const kd = wallKind(), w = { id: rid('w'), f: floor, a, b, k: kd.k, t: kd.t, st: 'new', ops: [] }; if (kd.h) w.h = kd.h;
  S.walls.push(w); return w;
}
function projS(w, p) { const v = wv(w); return Math.max(0, Math.min(v.L, (p[0] - w.a[0]) * v.ux + (p[1] - w.a[1]) * v.uy)); }
const lockedWall = w => (w.lock && !w.curve) || w.k === 'mamad' || w.k === 'party';
const bayWalls = () => S.walls.filter(w => w.curve);
const BAY_A = [5.45, 0.6], BAY_B = [7.70, 2.85];
// demolish the curved bay and optionally close the corner with new straight walls
function bayReplace(mode) {
  bayWalls().forEach(w => w.st = 'demo'); S.walls = S.walls.filter(w => !w.bayNew);
  const N = (a, b) => S.walls.push({ id: rid('w'), f: 0, a, b, k: 'ext', t: 0.2, st: 'new', ops: [], bayNew: 1 });
  if (mode === 'square') { N(BAY_A, [7.70, 0.6]); N([7.70, 0.6], BAY_B); }
  else if (mode === 'diag') N(BAY_A, BAY_B);
  else if (mode === 'restore') bayWalls().forEach(w => w.st = 'exist');
  sel = null;
}

svg.addEventListener('contextmenu', e => e.preventDefault());
svg.addEventListener('pointerdown', e => {
  svg.setPointerCapture(e.pointerId);
  if (e.button !== 0) { pan = { cx: e.clientX, cy: e.clientY, x: vb.x, y: vb.y }; return; }
  const p = pt(e), hs = hits(e, p); let tg = hs[0];
  if (tool === 'select' && e.altKey && sel) { const i = hs.findIndex(x => x.id === sel.id); if (i >= 0) tg = hs[(i + 1) % hs.length]; }
  if (tool !== 'select' && tool !== 'wall') tg = hs.find(x => x.k === 'wall');
  if (tool === 'select') {
    if (tg) {
      sel = { k: tg.k, id: tg.id }; const ob = find();
      if ((sel.k === 'item' || sel.k === 'room') && !ob.lock) drag = { p, x: ob.x, y: ob.y, moved: false };
    } else { sel = null; pan = { cx: e.clientX, cy: e.clientY, x: vb.x, y: vb.y }; }
    render2D();
  } else if (tool === 'wall') {
    const q = snap(p, draft && draft.a, e.shiftKey);
    if (!draft) draft = { a: q, b: q }; else { const w = addWall(draft.a, q); draft = { a: q, b: q }; if (w) { sel = { k: 'wall', id: w.id }; commit(); return; } }
    render2D();
  } else if (tg) {
    const w = S.walls.find(x => x.id === tg.id);
    if (lockedWall(w)) { toast('קיר נעול: ממ"ד / קיר משותף - לא ניתן לשנות'); return; }
    if (w.curve) { sel = { k: 'wall', id: w.id }; setTool('select'); toast('קיר מעוגל: קודם החליפו אותו בקיר ישר (בחלונית למטה), ואז הוסיפו פתחים'); return; }
    if (w.st === 'demo') return;
    const s = r2(Math.round(projS(w, p) / .05) * .05), v = wv(w);
    if (tool === 'cut') {
      if (s < .1 || s > v.L - .1) return; const m = wp(w, v, s).map(r2);
      const w2 = Object.assign({}, w, { id: rid('w'), a: m, b: w.b, ops: w.ops.filter(o => o.s > s).map(o => Object.assign({}, o, { s: r2(o.s - s) })) });
      w.b = m; w.ops = w.ops.filter(o => o.s <= s); S.walls.push(w2); sel = { k: 'wall', id: w.id };
    } else {
      const df = { door: [.8, 2.05, 0], win: [1.2, 1.1, 1.0], slide: [2.0, 2.2, 0], open: [1.0, 2.2, 0] }[tool];
      const ww = Math.min(df[0], v.L - .1); if (ww < .4) { toast('קיר קצר מדי לפתח'); return; }
      const sc = Math.max(ww / 2 + .05, Math.min(v.L - ww / 2 - .05, s));
      w.ops.push({ id: rid('o'), s: r2(sc), w: ww, h: df[1], sill: df[2], type: tool, st: w.st === 'new' ? 'exist' : 'new' }); sel = { k: 'wall', id: w.id };
    }
    commit();
  }
});
svg.addEventListener('pointermove', e => {
  if (pan) { const k = vb.w / svg.clientWidth; vb.x = pan.x - (e.clientX - pan.cx) * k; vb.y = pan.y - (e.clientY - pan.cy) * k; svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); return; }
  const p = pt(e);
  if (drag) { const ob = find(); if (!ob) return; ob.x = r2(Math.round((drag.x + p[0] - drag.p[0]) / .05) * .05); ob.y = r2(Math.round((drag.y + p[1] - drag.p[1]) / .05) * .05); drag.moved = true; render2D(); }
  else if (draft) { draft.b = snap(p, draft.a, e.shiftKey); render2D(); }
});
svg.addEventListener('pointerup', () => { if (drag && drag.moved) commit(); drag = null; pan = null; });
svg.addEventListener('wheel', e => {
  e.preventDefault(); const p = pt(e), k = e.deltaY > 0 ? 1.15 : 1 / 1.15, nw = Math.max(3, Math.min(60, vb.w * k)), kk = nw / vb.w;
  vb.x = p[0] - (p[0] - vb.x) * kk; vb.y = -p[1] - (-p[1] - vb.y) * kk; vb.w = nw; vb.h *= kk; svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
}, { passive: false });

function setTool(t) { tool = t; draft = null; document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t)); svg.style.cursor = t === 'select' ? 'default' : 'crosshair'; render2D(); }
function setFloor(f) { floor = f; sel = null; draft = null; document.querySelectorAll('[data-floor]').forEach(b => b.classList.toggle('on', +b.dataset.floor === f)); render2D(); }
function toast(t) { const el = $('toast'); el.textContent = t; el.style.opacity = 1; clearTimeout(toast.t); toast.t = setTimeout(() => el.style.opacity = 0, 2600); }

function delSel() {
  const ob = find(); if (!ob) return;
  if (sel.k === 'balc') { ob.mode = ob.mode === 'none' ? 'round' : 'none'; return commit(); }
  if (sel.k === 'wall') { if (lockedWall(ob)) return toast('קיר נעול - לא ניתן להרוס'); if (ob.curve) { bayReplace(ob.st === 'demo' ? 'restore' : 'none'); return commit(); } if (ob.st === 'new') S.walls = S.walls.filter(w => w !== ob), sel = null; else ob.st = ob.st === 'demo' ? 'exist' : 'demo'; }
  else if (sel.k === 'item') { if (ob.type === 'column') return toast('עמוד קונסטרוקטיבי - לא ניתן להסיר'); if (ob.st === 'new') S.items = S.items.filter(i => i !== ob), sel = null; else ob.st = ob.st === 'demo' ? 'exist' : 'demo'; }
  else { if (ob.lock) return; S.rooms = S.rooms.filter(r => r !== ob); sel = null; }
  commit();
}

function renderProps() {
  const el = $('props'), ob = find();
  if (!ob) {
    const ra = roomAreas(S, floor, S.rooms.filter(r => r.f === floor)), sh = shells(S);
    el.innerHTML = `<div class="hint"><b>${floor ? "קומה א'" : 'קומת קרקע'}:</b> שטח חדרים סגורים (נטו) <b>${ra.tot.toFixed(1)} מ"ר</b> · שטח בנוי (ברוטו, כולל קירות) <b>${sh.gross[floor].toFixed(1)} מ"ר</b>${sh.open[floor] ? ' · <span class="warn">המעטפת פתוחה ביותר מ-150 ס"מ - רצפה וגג לפי המצב הקיים</span>' : ''}</div>` +
      '<div class="hint">בחרו קיר, פריט או שם חדר לעריכה. כלי "קיר": קליק לנקודת התחלה, קליק לסיום (או הקלדת אורך + Enter). Shift = זווית חופשית. גרירה עם קליק ימני = הזזת התוכנית. Alt+קליק = בחירת הפריט שמתחת. חצים = הזזה 5 ס"מ (Shift: 1 ס"מ).</div>';
    return;
  }
  if (sel.k === 'balc') {
    const mn = { round: 'עגולה (קיים)', rect: 'מלבנית (חדש)', none: 'מבוטלת' }[ob.mode], B = (m, t) => `<button data-act="bm:${m}" class="${ob.mode === m ? 'on' : ''}">${t}</button>`;
    el.innerHTML = `<b>מרפסת קומה א'</b> · ${mn}<div class="row">${B('round', 'עגולה R140 (קיים)')}${B('rect', 'מלבנית במידות')}${B('none', 'ביטול מרפסת')}` +
      (ob.mode === 'rect' ? `<label>רוחב ס"מ<input type="number" data-act="bw" value="${cm(ob.w)}" min="100" step="5"></label><label>עומק ס"מ<input type="number" data-act="bd" value="${cm(ob.d)}" min="80" step="5"></label>` : '') +
      `</div><div class="warn">שינוי מרפסת / מעקה / הגדלת זיז - מחייב מהנדס קונסטרוקציה והיתר.</div><div class="hint">רוחב נמדד מקיר חדר ההורים מזרחה (קיים 370), עומק מקיר חדר הרחצה דרומה (קיים 163 עד קו החזית). לסגירת המרפסת לחדר: בחרו "מלבנית" ובנו קירות עם "קיר +". הפרגולה היא פריט נפרד - בחרו אותה בקו המסגרת.</div>`;
    return;
  }
  let h = '';
  const num = (lb, act, val, ex) => `<label>${lb}<input type="number" data-act="${act}" value="${val}" ${ex || ''}></label>`;
  if (sel.k === 'wall') {
    const v = wv(ob), lk = lockedWall(ob), st = { exist: 'קיים', new: 'חדש', demo: 'להריסה' }[ob.st];
    h += `<b>${WK[ob.k] || ob.k}</b> · ${st} · אורך ${cm(v.L)} ס"מ · עובי ${cm(ob.t)} ס"מ · גובה ${cm(wallH(ob))} ס"מ`;
    if (ob.curve) {
      const bl = bayWalls().reduce((t, w) => t + wv(w).L, 0), dm = ob.st === 'demo';
      h = `<b>קיר מעוגל (מפרץ הסלון, R140)</b> · ${dm ? 'להריסה' : 'קיים'} · אורך קשת ${cm(bl)} ס"מ<div class="warn">קיר חיצוני נושא, מעליו מרפסת קומה א' - כל שינוי מחייב מהנדס קונסטרוקציה.</div><div class="row">` +
        (dm ? '<button data-act="bay:restore">שחזר קיר מעוגל</button>' : '<button data-act="bay:none" class="danger">הריסה (השאר פתוח)</button>') +
        '<button data-act="bay:square">החלף בפינה ישרה 90°</button><button data-act="bay:diag">החלף בקיר אלכסוני</button></div><div class="hint">הקירות החדשים הם קירות רגילים: אפשר לבחור, לשנות אורך, להוסיף ויטרינה / חלון / דלת, או למחוק ולבנות אחרים עם כלי "קיר +".</div>';
    } else if (lk) h += '<div class="warn">קיר נעול (ממ"ד / משותף) - אין לשנות.</div>';
    else {
      if (ob.k === 'ext') h += '<div class="warn">קיר חיצוני / נושא - כל שינוי מחייב מהנדס קונסטרוקציה.</div>';
      h += '<div class="row">';
      if (ob.st === 'new') h += num('אורך ס"מ', 'wlen', cm(v.L), 'min="10" step="5"') + `<label>עובי<select data-act="wt"><option ${ob.t <= .1 ? 'selected' : ''}>10</option><option ${ob.t > .1 && ob.t < .16 ? 'selected' : ''}>12</option><option ${ob.t >= .16 ? 'selected' : ''}>20</option></select></label>` + num('גובה ס"מ', 'wh', cm(wallH(ob)), 'min="30" step="5"');
      h += `<button data-act="del" class="${ob.st === 'demo' ? '' : 'danger'}">${ob.st === 'new' ? 'מחק קיר' : ob.st === 'demo' ? 'בטל הריסה' : 'הריסת קיר'}</button></div>`;
      if (ob.ops.length) h += '<div class="ops">' + ob.ops.map(o => `<div class="row"><span>${OPN[o.type]}${o.st === 'new' ? ' (חדש)' : o.st === 'closed' ? ' (לסגירה)' : ''}</span>${o.st === 'closed' ? '' : num('רוחב', 'ow:' + o.id, cm(o.w), 'min="40" step="5"') + num('מרחק מתחילת קיר', 'os:' + o.id, cm(o.s - o.w / 2), 'min="0" step="5"') + (o.type === 'win' ? num('גובה', 'oh:' + o.id, cm(o.h), 'step="5"') + num('סף', 'ol:' + o.id, cm(o.sill), 'step="5"') : '')}<button data-act="od:${o.id}">${o.st === 'new' ? 'מחק' : o.st === 'closed' ? 'בטל סגירה' : 'סגור פתח'}</button></div>`).join('') + '</div>';
    }
  } else if (sel.k === 'item') {
    const D = IT[ob.type] || {}, st = { exist: 'קיים', new: 'חדש', demo: 'להסרה' }[ob.st];
    h += `<b>${D.n}</b> · ${st} · ${ob.f ? "קומה א'" : 'קרקע'} · שכבה: ${lyOf(ob)}<div class="row">`;
    if (!ob.lock) h += num('רוחב ס"מ', 'iw', cm(ob.w), 'min="20" step="5"') + num('עומק ס"מ', 'id', cm(ob.d), 'min="20" step="5"') + num('X ס"מ', 'ix', cm(ob.x), 'step="5"') + num('Y ס"מ', 'iy', cm(ob.y), 'step="5"') + num('זווית°', 'ir', ob.rot || 0, 'step="15"') + '<button data-act="rot">↻ 90°</button><button data-act="dup">שכפל</button>';
    if (!D.fixed && ob.type !== 'column') h += `<button data-act="lk">${ob.lock ? 'שחרר נעילה' : 'נעל במקום'}</button>`;
    if (ob.type === 'stairsExt') {
      const sh = ob.shape || 'I', op = (v, t, c) => `<option value="${v}" ${c === v ? 'selected' : ''}>${t}</option>`;
      h += `<label>צורה<select data-act="ss">${op('I', 'ישרות', sh)}${op('L', 'פנייה 90° (ר)', sh)}${op('U', 'פנייה 180° (ח)', sh)}</select></label>`;
      if (sh !== 'I') h += `<label>כיוון פנייה<select data-act="sd">${op('r', 'ימינה', ob.turn || 'r')}${op('l', 'שמאלה', ob.turn || 'r')}</select></label>` + num('רוחב מהלך ס"מ', 'isw', cm(stairGeo(ob).sw), 'min="60" step="5"');
      h += num('גובה יעד ס"מ', 'ih', cm(ob.h || L1), 'step="5"');
    }
    if (ob.type !== 'column') h += `<button data-act="del" class="${ob.st === 'demo' ? '' : 'danger'}">${ob.st === 'new' ? 'מחק' : ob.st === 'demo' ? 'בטל הסרה' : 'הסרה / פירוק'}</button>`;
    h += '</div>';
    if (ob.type === 'stairsExt') {
      const G = stairGeo(ob), go = G.fl.map(q => (q.go * 100).toFixed(1)), bad = G.fl.some(q => q.go < .25);
      h += `<div class="hint">${G.n} רומים · רום ${(G.rise * 100).toFixed(1)} ס"מ · שלח ${go.join(' / ')} ס"מ${G.ld.length ? ' · משטח ביניים (פודסט) ' + cm(G.sw) + ' ס"מ' : ''}. המדרגות עולות לכיוון החץ. שינוי רוחב / עומק הפריט משנה את אורך המהלכים.</div>` + (bad ? '<div class="warn">שלח קטן מ-25 ס"מ - הגדילו את עומק / רוחב הפריט (תקן: רום עד 17.5, שלח 26 לפחות).</div>' : '');
    }
    if (ob.type === 'stairsInt') h += '<div class="hint">פירוק המדרגות סוגר את הפתח בתקרה (הפרדה בין הדירות).</div>';
  } else {
    h += `<b>חדר / ייעוד</b><div class="row"><label>שם<input list="roomList" data-act="rn" value="${esc(ob.name)}" ${ob.lock ? 'disabled' : ''}></label>${ob.lock ? '<span class="warn">ממ"ד - ייעוד קבוע</span>' : '<button data-act="del" class="danger">מחק תווית</button>'}</div>`;
    const R = roomAreas(S, ob.f, S.rooms.filter(r => r.f === ob.f)).get(ob.id), oth = R.rooms.filter(r => r.id !== ob.id).map(r => r.name);
    h += R.a ? `<div class="hint">שטח נטו (בין הקירות): <b>${R.a.toFixed(2)} מ"ר</b>${oth.length ? ' · חלל משותף עם: ' + esc(oth.join(', ')) + ' - השטח כולל את כולם. לחישוב נפרד הפרידו בקיר.' : ''}</div>` : '<div class="hint">החלל סביב התווית לא סגור בקירות - אין חישוב שטח.</div>';
  }
  el.innerHTML = h;
}
$('props').addEventListener('change', e => {
  const a = e.target.dataset.act, ob = find(); if (!a || !ob) return; const val = parseFloat(e.target.value);
  if (sel.k === 'balc') { if (isNaN(val)) return; if (a === 'bw') ob.w = Math.max(1, Math.min(9, val / 100)); if (a === 'bd') ob.d = Math.max(.8, Math.min(6, val / 100)); return commit(); }
  if (a === 'ss') {
    const v = e.target.value, sw = Math.min(1.5, ob.shape && ob.shape !== 'I' ? (ob.sw || 1) : ob.w); ob.shape = v; ob.sw = r2(sw);
    if (v === 'I') { ob.w = ob.sw; ob.d = 4.6; } else if (v === 'L') { ob.w = r2(ob.sw + 2.35); ob.d = r2(ob.sw + 2.35); } else { ob.w = r2(ob.sw * 2 + .1); ob.d = r2(ob.sw + 2.35); }
    return commit();
  }
  if (a === 'sd') { ob.turn = e.target.value; return commit(); }
  if (a === 'rn') ob.name = e.target.value.trim() || ob.name;
  else if (isNaN(val)) return;
  else if (a === 'wlen') { const v = wv(ob), L = Math.max(.1, val / 100); ob.b = [r2(ob.a[0] + v.ux * L), r2(ob.a[1] + v.uy * L)]; }
  else if (a === 'wt') ob.t = val / 100; else if (a === 'wh') ob.h = val / 100;
  else if (a === 'iw') ob.w = Math.max(.2, val / 100); else if (a === 'id') ob.d = Math.max(.2, val / 100);
  else if (a === 'ix') ob.x = val / 100; else if (a === 'iy') ob.y = val / 100; else if (a === 'ir') ob.rot = ((val % 360) + 360) % 360; else if (a === 'ih') ob.h = val / 100; else if (a === 'isw') ob.sw = Math.max(.6, Math.min(2, val / 100));
  else { const [k, id] = a.split(':'), o = ob.ops.find(x => x.id === id), L = wv(ob).L; if (!o) return;
    if (k === 'ow') o.w = Math.max(.4, Math.min(L - .1, val / 100)); if (k === 'os') o.s = val / 100 + o.w / 2; if (k === 'oh') o.h = val / 100; if (k === 'ol') o.sill = val / 100;
    o.s = r2(Math.max(o.w / 2, Math.min(L - o.w / 2, o.s))); }
  commit();
});
$('props').addEventListener('click', e => {
  const a = e.target.dataset.act, ob = find(); if (!a || !ob || e.target.tagName !== 'BUTTON') return;
  if (a === 'del') return delSel();
  if (a.startsWith('bay:')) { bayReplace(a.slice(4)); return commit(); }
  if (a.startsWith('bm:')) { ob.mode = a.slice(3); return commit(); }
  if (a === 'rot') ob.rot = ((ob.rot || 0) + 90) % 360;
  else if (a === 'lk') ob.lock = ob.lock ? 0 : 1;
  else if (a === 'dup') { const c = Object.assign({}, ob, { id: rid('i'), x: r2(ob.x + .5), y: r2(ob.y - .5), st: 'new' }); S.items.push(c); sel = { k: 'item', id: c.id }; }
  else if (a.startsWith('od:')) { const o = ob.ops.find(x => x.id === a.slice(3)); if (o.st === 'new') ob.ops = ob.ops.filter(x => x !== o); else o.st = o.st === 'closed' ? 'exist' : 'closed'; }
  commit();
});

// toolbar wiring
document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool));
document.querySelectorAll('[data-floor]').forEach(b => b.onclick = () => setFloor(+b.dataset.floor));
document.querySelectorAll('[data-v]').forEach(b => b.onclick = () => setView(b.dataset.v));
['cRoof', 'cUpper', 'cLabels', 'cSite'].forEach(i => $(i).onchange = () => { if (i === 'cRoof' && $('cRoof').checked) $('cUpper').checked = true; applyVis(); });
$('cHL').onchange = rebuild3D; $('cDims').onchange = render2D;
(function () {
  const sl = $('addItem'), cats = {}; Object.keys(IT).forEach(k => { if (IT[k].fixed) return; (cats[IT[k].cat] = cats[IT[k].cat] || []).push(k); });
  sl.innerHTML = '<option value="">+ הוסף פריט…</option>' + Object.keys(cats).map(c => `<optgroup label="${c}">${cats[c].map(k => `<option value="${k}">${IT[k].n}</option>`).join('')}</optgroup>`).join('');
  sl.onchange = () => {
    const k = sl.value; sl.value = ''; if (!k) return; const D = IT[k], f = k === 'stairsExt' ? 0 : (D.f !== undefined && floor !== 1 ? (setFloor(1), 1) : floor);
    const it = { id: rid('i'), type: k, f, x: r2(Math.round((vb.x + vb.w / 2) / .05) * .05), y: r2(Math.round(-(vb.y + vb.h / 2) / .05) * .05), w: D.w, d: D.d, rot: 0, st: 'new' };
    if (k === 'stairsExt') { it.x = 9.2; it.y = 0.2; } if (k === 'balcony') { it.x = 2.2; it.y = -0.3; it.rot = 180; }
    S.items.push(it); sel = { k: 'item', id: it.id }; setTool('select'); commit();
  };
  $('roomList').innerHTML = ROOMS.map(r => `<option value="${r}">`).join('');
})();
$('addRoom').onclick = () => { const r = { id: rid('r'), f: floor, name: 'חדר', x: r2(vb.x + vb.w / 2), y: r2(-(vb.y + vb.h / 2)), lock: 0 }; S.rooms.push(r); sel = { k: 'room', id: r.id }; setTool('select'); commit(); };
$('undo').onclick = () => { if (hi > 0) restore(hi - 1); }; $('redo').onclick = () => { if (hi < hist.length - 1) restore(hi + 1); };
$('reset').onclick = () => { if (confirm('לאפס את כל השינויים ולחזור למצב הקיים?')) { S = JSON.parse(JSON.stringify(BASE)); sel = null; commit(); } };
$('save').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' })); a.download = 'house-design.json'; a.click(); };
$('loadBtn').onclick = () => $('loadFile').click();
$('loadFile').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { const j = JSON.parse(t); if (j.v !== 1 || !j.walls) throw 0; S = j; sel = null; commit(); } catch (x) { toast('קובץ לא תקין'); } }); e.target.value = ''; };
$('len').addEventListener('keydown', e => {
  if (e.key !== 'Enter' || !draft) return; const L = parseFloat($('len').value) / 100, dx = draft.b[0] - draft.a[0], dy = draft.b[1] - draft.a[1], n = Math.hypot(dx, dy);
  if (!(L > 0) || n < .01) return toast('הזיזו את העכבר לכיוון הקיר ואז הקלידו אורך'); const b = [r2(draft.a[0] + dx / n * L), r2(draft.a[1] + dy / n * L)];
  const w = addWall(draft.a, b); draft = { a: b, b }; $('len').value = ''; if (w) { sel = { k: 'wall', id: w.id }; commit(); }
});
addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === 'Escape') { if (draft) { draft = null; render2D(); } else setTool('select'); }
  else if (e.key === 'Delete') delSel();
  else if (/^Arrow/.test(e.key) && sel && (sel.k === 'item' || sel.k === 'room')) {
    const ob = find(); if (!ob || ob.lock) return; e.preventDefault(); const st = e.shiftKey ? .01 : .05;
    if (e.key === 'ArrowLeft') ob.x = r2(ob.x - st); if (e.key === 'ArrowRight') ob.x = r2(ob.x + st); if (e.key === 'ArrowUp') ob.y = r2(ob.y + st); if (e.key === 'ArrowDown') ob.y = r2(ob.y - st); commit();
  }
  else if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); $('undo').click(); }
  else if (e.ctrlKey && e.key.toLowerCase() === 'y') { e.preventDefault(); $('redo').click(); }
  else if (/^[0-9]$/.test(e.key) && draft) { $('len').focus(); }
});

// ================================================================= work sheets
function sheetSvg(St, f, mode, dims) {
  let x0 = -0.6, x1 = 9.4, y0 = -0.6, y1 = 12.9;
  const ext = (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
  S.walls.concat(BASE.walls).filter(w => w.f === f).forEach(w => { ext(w.a[0], w.a[1]); ext(w.b[0], w.b[1]); });
  S.items.filter(i => i.f === f || IT[i.type].both).forEach(i => { const r = Math.hypot(i.w, i.d) / 2; ext(i.x - r, i.y - r); ext(i.x + r, i.y + r); });
  x0 = Math.floor(x0 - .9); y0 = Math.floor(y0 - .9); x1 = Math.ceil(x1 + .5); y1 = Math.ceil(y1 + .5);
  const w = x1 - x0, h = y1 - y0, k = [20, 10, 5].find(k => w * k <= 180 && h * k <= 205) || 5;
  let g = '';
  for (let x = Math.ceil(x0 + .5); x <= x1; x++) g += `<line x1="${x}" x2="${x}" y1="${-y1}" y2="${-y0 - .5}" stroke="#e4e4e4" stroke-width=".012"/><text x="${x}" y="${-y0 - .2}" font-size=".2" fill="#888" text-anchor="middle" direction="ltr">${x}</text>`;
  for (let y = Math.ceil(y0 + .5); y <= y1; y++) g += `<line x1="${x0 + .5}" x2="${x1}" y1="${-y}" y2="${-y}" stroke="#e4e4e4" stroke-width=".012"/><text x="${x0 + .25}" y="${-y + .07}" font-size=".2" fill="#888" text-anchor="middle" direction="ltr">${y}</text>`;
  return { k, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${-y1} ${w} ${h}" style="width:${w * k}mm;height:${h * k}mm"><defs><clipPath id="c${f}${mode}"><rect x="${x0}" y="${-y1}" width="${w}" height="${h}"/></clipPath></defs><g clip-path="url(#c${f}${mode})">${g}${drawPlan(St, f, { mode, dims })}</g></svg>` };
}
function makeSheets() {
  const fl = ['קומת קרקע', "קומה א'"], date = new Date().toLocaleDateString('he-IL'); let html = '', n = 0;
  const sheet = (title, sub, body, scale) => `<section class="sheet"><div class="plan">${body}</div><table class="tb"><tr><td rowspan="2" class="tt">${title}<small>${sub}</small></td><td>פרויקט: פיצול בית (יחידה מזרחית)</td><td>גיליון ${++n}</td></tr><tr><td>${scale ? 'קנ"מ 1:' + scale + ' (A4) · ' : ''}מידות בס"מ · רשת 1 מ' · ראשית: ציר קיר משותף / קו דרומי של המבנה</td><td>${date}</td></tr></table><div class="disc">תוכנית רעיונית לתכנון ראשוני. אינה תוכנית לביצוע: נדרשים אדריכל, מהנדס קונסטרוקציה והיתר בנייה (פיצול דירה). ממ"ד וקיר משותף - ללא שינוי.</div></section>`;
  const lg = c => `<div class="lg">${c.map(x => `<span><i style="background:${x[0]}"></i>${x[1]}</span>`).join('')}</div>`;
  [0, 1].forEach(f => {
    let s = sheetSvg(BASE, f, 'prop', true); html += sheet(fl[f] + ' - מצב קיים', 'מדידה לפי תוכנית היתר + ביצוע בפועל', s.svg + lg([['#2f2f2f', 'קיר קיים'], ['#3b6ea5', 'בטון / ממ"ד']]), 1000 / s.k);
    s = sheetSvg(S, f, 'changes', true); html += sheet(fl[f] + ' - הריסה ובנייה', 'צהוב = הריסה / פתיחת פתח · אדום = בנייה חדשה / סגירת פתח', s.svg + lg([['#b9b9b9', 'קיים ללא שינוי'], ['#e6b800', 'הריסה / פתיחת פתח'], ['#d62828', 'בנייה חדשה / סגירת פתח']]), 1000 / s.k);
    s = sheetSvg(S, f, 'prop', true); html += sheet(fl[f] + ' - מצב מוצע', 'חלוקה, ייעודי חדרים, ריהוט ומידות מחיצות', s.svg + lg([['#2f2f2f', 'קיר'], ['#3b6ea5', 'בטון / ממ"ד'], ['#2a8fbd', 'חלון / ויטרינה']]), 1000 / s.k);
  });
  // schedules
  const P = p => `${cm(p[0])},${cm(p[1])}`, row = c => '<tr>' + c.map(x => `<td>${x}</td>`).join('') + '</tr>';
  const wt = st => { let tl = 0, ta = 0; const rows = S.walls.filter(w => w.st === st && !w.curve).map((w, i) => { const L = wv(w).L, A = L * wallH(w); tl += L; ta += A; return row([i + 1, fl[w.f], WK[w.k], P(w.a), P(w.b), cm(L), cm(w.t), cm(wallH(w)), A.toFixed(2)]); }); const bw = S.walls.filter(w => w.curve && w.st === st); if (bw.length) { const L = bw.reduce((t, w) => t + wv(w).L, 0), A = L * HG; tl += L; ta += A; rows.push(row([rows.length + 1, fl[0], 'קיר מעוגל R140', P(BAY_A), P(BAY_B), cm(L), 20, cm(HG), A.toFixed(2)])); } return rows.length ? `<table class="sc"><tr><th>#</th><th>קומה</th><th>סוג</th><th>מנקודה X,Y</th><th>עד נקודה X,Y</th><th>אורך</th><th>עובי</th><th>גובה</th><th>שטח מ"ר</th></tr>${rows.join('')}<tr class="sum"><td colspan="5">סה"כ</td><td>${cm(tl)}</td><td></td><td></td><td>${ta.toFixed(2)}</td></tr></table>` : '<p class="none">אין</p>'; };
  const ops = []; S.walls.forEach(w => { if (w.st === 'demo') return; w.ops.forEach(o => { if (o.st !== 'exist') { const v = wv(w); ops.push(row([ops.length + 1, fl[w.f], WK[w.k], o.st === 'new' ? 'פתיחת ' + OPN[o.type] : 'סגירת ' + OPN[o.type], P(wp(w, v, o.s)), cm(o.w), cm(o.h), cm(o.sill)])); } }); });
  const its = S.items.filter(i => i.st !== 'exist').map((i, k) => row([k + 1, fl[i.f], IT[i.type].n + (i.type === 'stairsExt' && i.shape === 'L' ? ' (פנייה 90°)' : i.type === 'stairsExt' && i.shape === 'U' ? ' (פנייה 180°)' : ''), i.st === 'new' ? 'חדש' : 'פירוק', cm(i.w) + ' × ' + cm(i.d), P([i.x, i.y]), (i.rot || 0) + '°']));
  const bmS = balcOf(S); if (bmS.mode === 'rect') its.push(row([its.length + 1, fl[1], 'מרפסת מלבנית', 'חדש (במקום עגולה)', cm(bmS.w) + ' × ' + cm(bmS.d), P([4.5 + bmS.w / 2, 2.13 - bmS.d / 2]), '0°'])); if (bmS.mode !== 'round') its.push(row([its.length + 1, fl[1], 'מרפסת עגולה R140 + מעקה', 'פירוק', '370 × 220', P([6.35, 1.2]), '0°']));
  const warn = []; if (bmS.mode !== 'round') warn.push('שינוי מרפסת קומה א\' (צורה / מעקה / זיז) - מחייב תכנון קונסטרוקטיבי והיתר.');
  if (S.walls.some(w => w.k === 'ext' && (w.st === 'demo' || w.ops.some(o => o.st !== 'exist')))) warn.push('שינוי בקיר חיצוני / נושא - מחייב תכנון ואישור מהנדס קונסטרוקציה.');
  if (S.items.some(i => i.type === 'stairsInt' && i.st === 'demo')) warn.push('פירוק מדרגות פנים וסגירת פתח בתקרה - מחייב תכנון קונסטרוקטיבי.');
  if (S.items.some(i => i.st === 'new' && (i.type === 'balcony' || i.type === 'stairsExt'))) warn.push('מרפסת / מדרגות חיצוניות - תוספת בנייה הטעונה היתר, בדיקת קווי בניין וביסוס.');
  warn.push('פיצול ליחידות דיור נפרדות מחייב היתר בנייה, הפרדת מערכות (חשמל, מים, גז) ופתרון מיגון לכל דירה.');
  const arTab = St => {
    let rows = '', k = 0;
    [0, 1].forEach(f => {
      const rs = St.rooms.filter(r => r.f === f), ra = roomAreas(St, f, rs), seen = new Set();
      rs.forEach(r => { const R = ra.get(r.id); if (!R.a) { rows += row([++k, fl[f], esc(r.name), '-', 'לא סגור / שטח חוץ']); return; } const first = !seen.has(R); seen.add(R); rows += row([++k, fl[f], esc(r.name), first ? R.a.toFixed(2) : '〃', R.rooms.length > 1 ? 'חלל משותף: ' + esc(R.rooms.map(q => q.name).join(' + ')) : '']); });
      rows += `<tr class="sum"><td colspan="3">סה"כ נטו - ${fl[f]}</td><td>${ra.tot.toFixed(2)}</td><td>ברוטו כולל קירות: ${shells(St).gross[f].toFixed(2)} מ"ר</td></tr>`;
    });
    return `<table class="sc"><tr><th>#</th><th>קומה</th><th>חדר</th><th>שטח נטו מ"ר</th><th>הערות</th></tr>${rows}</table>`;
  };
  html += `<section class="sheet"><h2>טבלת שטחים</h2><h3>מצב מוצע</h3>${arTab(S)}<h3>מצב קיים</h3>${arTab(BASE)}<div class="disc">שטח נטו = שטח הרצפה בין פני הקירות (פתחים נחשבים סגורים), מחושב אוטומטית מהתוכנית בדיוק של כ-1%. ברוטו = שטח המעטפת הבנויה כולל קירות. אינו מחליף מדידת מודד מוסמך. גיליון ${++n} · ${date}</div></section>`;
  html += `<section class="sheet"><h2>כתב כמויות ורשימות</h2><h3>קירות להריסה</h3>${wt('demo')}<h3>קירות לבנייה</h3>${wt('new')}<h3>פתחים - פתיחה / סגירה</h3>${ops.length ? `<table class="sc"><tr><th>#</th><th>קומה</th><th>בקיר</th><th>פעולה</th><th>מרכז X,Y</th><th>רוחב</th><th>גובה</th><th>סף</th></tr>${ops.join('')}</table>` : '<p class="none">אין</p>'}<h3>פריטים - חדש / פירוק</h3>${its.length ? `<table class="sc"><tr><th>#</th><th>קומה</th><th>פריט</th><th>פעולה</th><th>מידות</th><th>מרכז X,Y</th><th>זווית</th></tr>${its.join('')}</table>` : '<p class="none">אין</p>'}<h3>הערות מחייבות</h3><ul>${warn.map(w => `<li>${w}</li>`).join('')}</ul><div class="disc">כל המידות בס"מ. קואורדינטות X,Y נמדדות מציר הקיר המשותף (X) ומהקו הדרומי של המבנה (Y). גיליון ${++n} · ${date}</div></section>`;
  $('sheetBody').innerHTML = html; $('sheets').hidden = false;
}
$('mkSheets').onclick = makeSheets; $('closeSheets').onclick = () => $('sheets').hidden = true; $('printSheets').onclick = () => print();

// ================================================================= boot
new ResizeObserver(resize3D).observe(view);
renderLayers(); renderVers(); resize3D(); rebuild3D(); setView('se'); setFloor(0); setTool('select');
