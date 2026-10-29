// Executive presence: 9 words and phrases. Fluent Edge Swiss.
// Pure function of time: window.render(t) draws frame t from timeline.json (word timings, chapters, marks).
// One signal colour (coral): the dot, "presence". Everything else is paper, ink, slate and sky.

const W = 1920, H = 1080;
const C = {
  page: '#F7F7FF', paper: '#FFFFFF', ink: '#1E262E', slate: '#495867',
  blue: '#577399', sky: '#BDD5EA', grid: 'rgba(189,213,234,0.55)', coral: '#FE5F55',
};
const BASE = new URLSearchParams(location.search).has('base');
if (BASE) Object.assign(C, { page: '#EAE9E5', paper: '#FFFFFF', ink: '#111111', slate: '#111111', blue: '#6E6E6E', sky: '#C9C8C3', grid: 'rgba(160,160,155,0.45)', coral: '#E30613' });
const F = BASE ? 'Inter' : 'DMSans';
const M0 = 96, GUT = 24, COLW = (W - 2 * M0 - 11 * GUT) / 12;        // 12-column grid
const col = (i) => M0 + i * (COLW + GUT);
const BEAT = 60 / 96, E8 = BEAT / 2;
const RX = col(5);                                                   // right page starts at column 6
const SUB_Y = 948;

const cv = document.getElementById('c');
cv.width = W; cv.height = H;
const g = cv.getContext('2d');

// ---------- time helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
// cubic-bezier(.7,0,.2,1), solved for x
function bez(x) {
  const p1x = .7, p1y = 0, p2x = .2, p2y = 1;
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  let u = x;
  for (let i = 0; i < 8; i++) {
    const xu = ((ax * u + bx) * u + cx) * u - x, d = (3 * ax * u + 2 * bx) * u + cx;
    if (Math.abs(xu) < 1e-6 || d === 0) break;
    u -= xu / d;
  }
  u = clamp(u);
  return ((ay * u + by) * u + cy) * u;
}
const ease = (x) => bez(clamp(x));
// a snap that lands on ta, starting dur earlier
const snap = (t, ta, dur = E8) => ease((t - (ta - dur)) / dur);
const lin = (t, a, b) => clamp((t - a) / (b - a));
const steps = (p, n) => Math.floor(clamp(p) * n + 1e-9) / n;
const lerp = (a, b, p) => a + (b - a) * p;

// ---------- data ----------
let TL, WORDS;
const tw = (word, after = 0) => {                 // time of a script word after a given time
  const k = word.toLowerCase().replace(/[^a-z0-9']/g, '');
  for (const w of WORDS) if (w.t0 >= after && w.w.toLowerCase().replace(/[^a-z0-9']/g, '') === k) return w.t0;
  throw new Error('word not found: ' + word + ' after ' + after);
};
const q8 = (t) => Math.round(t / E8) * E8;

// ---------- drawing helpers ----------
function font(size, weight = 500) { g.font = `${weight} ${size}px ${F}`; }
function text(s, x, y, size, weight, color, track = 0) {
  font(size, weight);
  g.letterSpacing = track ? `${track}px` : '0px';
  g.fillStyle = color;
  g.fillText(s, x, y);
  const w = g.measureText(s).width;
  g.letterSpacing = '0px';
  return w;
}
function measure(s, size, weight, track = 0) {
  font(size, weight); g.letterSpacing = track ? `${track}px` : '0px';
  const w = g.measureText(s).width; g.letterSpacing = '0px'; return w;
}
// clip-reveal: words rise out of a clip rect from below the baseline (p 0→1), leave upward (out 0→1)
function reveal(s, x, y, size, weight, color, p, out = 0, track = 0) {
  if (p <= 0 || out >= 1) return measure(s, size, weight, track);
  const h = size * 1.12;
  g.save();
  g.beginPath(); g.rect(x - 4, y - size * 0.92, measure(s, size, weight, track) + size * 0.6, h); g.clip();
  const dy = (1 - ease(p)) * h - ease(out) * h;
  const w = text(s, x, y + dy, size, weight, color, track);
  g.restore();
  return w;
}
function rule(x0, y, x1, color = C.slate, p = 1, wdt = 1) {          // a line grows along its length
  if (p <= 0) return;
  g.fillStyle = color; g.fillRect(x0, y, (x1 - x0) * clamp(p), wdt);
}
function dot(x, y, r = 16) { g.fillStyle = C.coral; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
// knife cut: a line crosses the element (p 0→0.5), then the element collapses to its midline (0.5→1)
function knifeBox(x, y, w, h, fill, p, stroke = null) {
  if (p >= 1) return;
  const c = p < 0.5 ? 1 : 1 - ease((p - 0.5) / 0.5);
  const hh = h * c;
  if (hh > 0.5) {
    if (fill) { g.fillStyle = fill; g.fillRect(x, y + (h - hh) / 2, w, hh); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2; g.strokeRect(x + 1, y + (h - hh) / 2 + 1, w - 2, Math.max(0, hh - 2)); }
  }
  if (p > 0 && p < 0.75) {
    const lp = clamp(p / 0.5);
    g.fillStyle = C.ink; g.fillRect(x - 24, y + h / 2 - 1, (w + 48) * lp, 2);
  }
}
function caption(x, y, w, parts, p = 1) {                          // caption row: 1 px rule above, small blue notes
  rule(x, y - 30, x + w, C.slate, p);
  if (p < 1) return;
  font(19, 500);
  let cx = x;
  parts.forEach((s, i) => { text(s.toUpperCase(), cx, y, 19, 600, C.blue, 1.4); cx += measure(s.toUpperCase(), 19, 600, 1.4) + 36; });
}
function gridLines(alpha = 1) {
  if (alpha <= 0) return;
  g.globalAlpha = alpha;
  g.fillStyle = C.grid;
  for (let i = 0; i < 12; i++) { g.fillRect(col(i), 0, 1, H); g.fillRect(col(i) + COLW, 0, 1, H); }
  g.globalAlpha = 1;
}

// ---------- the room: a grid of slate dots ----------
function room(t, ox, oy, cols, rows, step, r, coral, leanT, leanAmt = 0.22) {
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    let x = ox + i * step, y = oy + j * step;
    if (coral && leanT != null) {
      const dx = coral.x - x, dy = coral.y - y, d = Math.hypot(dx, dy) || 1;
      const p = snap(t, leanT + d * 0.0016 + E8, E8 * 1.5);            // ripple ordered by distance
      const amt = Math.min(leanAmt * d, 46) * p;
      x += dx / d * amt; y += dy / d * amt;
    }
    g.fillStyle = C.slate; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
}

// ---------- chapters ----------
const CHS = {
  1: { lines: ['Gravitas'], size: 150, pos: 'noun', mean: 'serious, steady weight', cap: ['From Latin gravis', 'heavy'] },
  2: { lines: ['Unflappable'], size: 150, pos: 'adjective', mean: 'calm when things go wrong', cap: ['US Airways 1549', 'Hudson River', '15 Jan 2009'] },
  3: { lines: ['Grace under', 'pressure'], size: 112, top: 200, pos: 'phrase', mean: 'staying composed when it breaks', cap: ['Apple WWDC', 'San Francisco', '7 June 2010'] },
  4: { lines: ['Read the', 'room'], size: 112, top: 200, pos: 'phrase', mean: 'sense the mood before you speak', cap: ['Listen first', 'speak second'] },
  6: { lines: ['Own it'], size: 150, pos: 'phrase', mean: 'take responsibility, fast and in public', cap: ['Microsoft', 'Grace Hopper Celebration', 'Oct 2014'] },
  7: { lines: ['Bottom line', 'up front'], size: 112, top: 200, pos: 'phrase · BLUF', mean: 'answer first, reasons second', cap: ['US military writing', 'BLUF'] },
  8: { lines: ['Let it land'], size: 140, pos: 'phrase', mean: 'say the important thing, then stop', cap: ['Apple Macworld', 'San Francisco', '9 Jan 2007'] },
  9: { lines: ['Measured'], size: 150, pos: 'adjective', mean: 'careful, controlled, never rushed', cap: ['A measured answer', 'buys time'] },
};
const pad2 = (n) => String(n).padStart(2, '0');

// giant numeral, optically flush left, climbing in module steps
function numeral(n, t, t0, x = M0, y = 760, size = 560, color = C.sky) {
  const s = pad2(n);
  font(size, 800);
  const m = g.measureText(s);
  const bearing = m.actualBoundingBoxLeft ? -m.actualBoundingBoxLeft : 0;
  const p = steps(lin(t, t0, t0 + BEAT * 2), 4);
  if (p <= 0) return;
  const h = size * 0.74;
  g.save(); g.beginPath(); g.rect(x - 20, y - h - 10, m.width + 60, h + 20); g.clip();
  text(s, x - bearing, y + (1 - p) * h, size, 800, color, -size * 0.02);
  g.restore();
}

// right page: eyebrow, term + coral full stop, meaning, caption row. Returns the dot position.
function termBlock(n, t, t0, tTerm, tMean, opts = {}) {
  const d = CHS[n];
  const x = opts.x ?? RX, top = opts.y ?? d.top ?? 250;
  const size = opts.size ?? d.size;
  reveal(`NO. ${pad2(n)} · ${d.pos.toUpperCase()}`, x, top, 22, 700, C.blue, snap(t, q8(t0 + BEAT), E8), 0, 2);
  let y = top + size * 1.02, lastW = 0, lastY = y;
  d.lines.forEach((ln, i) => {
    lastW = reveal(ln, x, y, size, 800, C.ink, snap(t, tTerm + i * E8, E8 * 1.5), 0, -size * 0.02);
    lastY = y; y += size * 0.98;
  });
  const dotPos = { x: x + lastW + size * 0.16, y: lastY - size * 0.09, r: size * 0.1 };
  const my = lastY + 92;
  reveal(d.mean, x, my, 42, 500, C.slate, snap(t, tMean, E8 * 1.5));
  if (!opts.noCap) caption(x, my + 112, opts.capW ?? 960, d.cap, lin(t, tMean + 0.2, tMean + 0.2 + BEAT));
  return { dot: dotPos, artY: my + 150 };
}

function chapterHeader(n, t) {
  text('THE FLUENT EDGE', M0, 70, 18, 700, C.blue, 2);
  font(18, 700);
  const s = `EXECUTIVE PRESENCE   ${pad2(n)} / 09`;
  text(s, W - M0 - measure(s, 18, 700, 2), 70, 18, 700, C.blue, 2);
  rule(M0, 88, W - M0, C.sky);
}

// ---------- scenes: each returns nothing, draws at local camera ----------
function sceneIntro(t) {
  const m = TL.m;
  gridLines(1 - lin(t, 0, 1.5) * 0.5);
  // room on the right page
  const ox = RX + 60, oy = 250, step = 96, cols = 10, rows = 6;
  const target = { x: ox + 4.5 * step + 10, y: oy + 2.5 * step - 6 };
  const enter = lin(t, 0.6, 4.2);                                    // the exception: linear, unsnapped
  const cx = lerp(-60, target.x, enter), cy = target.y;
  room(t, ox, oy, cols, rows, step, 7, { x: target.x, y: target.y }, m.leans);
  if (t > 0.6) dot(cx, cy, 16);
  // coordinate readout beside it
  if (t > 0.8 && t < m.leans) {
    const on = enter >= 1;
    text(on ? 'OFF GRID' : `X ${Math.round(cx)}  Y ${Math.round(cy)}`, cx + 30, cy - 26, 17, 600, C.blue, 1.4);
  }
  // title on the left page
  reveal('Executive', M0, 440, 150, 800, C.ink, snap(t, m.title + 0.2, E8 * 1.5), 0, -3);
  reveal('presence', M0, 590, 150, 800, C.ink, snap(t, m.title + 0.2 + E8, E8 * 1.5), 0, -3);
  // 9 modules, one per eighth
  for (let i = 0; i < 9; i++) {
    const p = snap(t, q8(m.nine) + i * E8, E8);
    if (p <= 0) continue;
    g.strokeStyle = C.ink; g.lineWidth = 2;
    const s = 44 * p;
    g.strokeRect(M0 + i * 62, 690 + (44 - s), 44, s);
  }
  reveal('9 WORDS AND PHRASES', M0, 790, 22, 700, C.blue, snap(t, q8(m.nine) + 9 * E8, E8), 0, 2);
  caption(M0, 880, 650, ['A Fluent Edge vocabulary film'], lin(t, m.title + 1, m.title + 1 + BEAT));
}

function chapterBase(n, t, t0, tTerm, tMean, opts) {
  chapterHeader(n, t);
  gridLines(0.35);
  numeral(n, t, t0);
  return termBlock(n, t, t0, tTerm, tMean, opts);
}

function ch1(t, t0) {
  const r = chapterBase(1, t, t0, TL.m.term1, tw('serious', t0));
  // weight: a heavy ink bar drops into place on "weight"
  const tw1 = tw('weight', t0);
  const p = snap(t, q8(tw1), E8);
  if (p > 0) { g.fillStyle = C.ink; g.fillRect(RX, r.artY + 40 - 40 * (1 - p), col(9) + COLW - RX, 40 * p + 0.01); }
  text('MASS', RX, r.artY + 120, 17, 600, C.blue, 1.4);
  dot(r.dot.x, r.dot.y, r.dot.r);
}

function ch2(t, t0) {
  const r = chapterBase(2, t, t0, TL.m.term2, tw('calm', t0));
  const tFail = tw('fail', t0), y = r.artY + 10;
  // two engines, knife-cut on "fail"
  ['ENGINE 1', 'ENGINE 2'].forEach((s, i) => {
    const x = RX + i * (COLW * 2 + GUT * 2);
    const p = lin(t, tFail + i * E8, tFail + i * E8 + BEAT);
    if (t > tw('both', t0) - 0.2) {
      knifeBox(x, y, COLW * 2 + GUT, 70, null, p, C.ink);
      if (p < 0.5) text(s, x + 18, y + 44, 19, 700, C.ink, 1.4);
    }
  });
  // 155: a giant counter climbing in eased steps on "survive"
  const tS = tw('all', TL.m.lands);
  const cp = steps(ease(lin(t, tS, tS + BEAT * 3)), 31);
  if (cp > 0) {
    const nn = Math.round(155 * cp);
    text(String(nn), col(9), r.artY + 160, 200, 800, C.ink, -4);
    text(nn === 155 ? 'ON BOARD · ALL SURVIVED' : 'ON BOARD', col(9), r.artY + 200, 17, 600, C.blue, 1.4);
  }
  dot(r.dot.x, r.dot.y, r.dot.r);
}

function ch3(t, t0) {
  const r = chapterBase(3, t, t0, TL.m.term3, TL.m.term3 + 0.9);
  // a signal meter: 5 bars, knife-cut from the tallest on "collapses"
  const y0 = r.artY + 110, tC = TL.m.collapses;
  for (let i = 0; i < 5; i++) {
    const h = 24 + i * 22, x = RX + i * 46;
    const appear = snap(t, q8(tw('wi-fi', t0)) + i * E8 * 0.5, E8);
    if (appear <= 0) continue;
    const k = 4 - i;
    knifeBox(x, y0 - h * appear, 30, h * appear, C.ink, lin(t, tC + k * E8 * 0.6, tC + k * E8 * 0.6 + E8 * 2));
  }
  text('WI-FI', RX, y0 + 36, 17, 600, C.blue, 1.4);
  // "and carries on": one ruling line runs on, linear
  const tCar = tw('carries', t0);
  rule(RX + 270, y0 - 12, col(11) + COLW, C.ink, lin(t, tCar, tCar + 2.2), 3);
  if (t > tCar + 2.2) text('CARRIES ON', col(11) + COLW - measure('CARRIES ON', 17, 600, 1.4), y0 + 36, 17, 600, C.blue, 1.4);
  dot(r.dot.x, r.dot.y, r.dot.r);
}

function ch4(t, t0) {
  const r = chapterBase(4, t, t0, TL.m.term4, tw('sense', t0));
  // the room, small; the full stop leaves the term and reads it
  const ox = RX + 20, oy = r.artY + 10, step = 50;
  const tS = tw('mood', t0);
  const target = { x: ox + 7.5 * step, y: oy + 1.5 * step };
  room(t, ox, oy, 16, 3, step, 5, target, tS + 1.2, 0.18);
  const p = lin(t, tS - 0.2, tS + 1.2);
  dot(lerp(r.dot.x, target.x, p), lerp(r.dot.y, target.y, p), lerp(r.dot.r, 12, p));
}

function ch5(t, t0) {
  // split frame: two equal cells, parallel cases
  chapterHeader(5, t);
  gridLines(0.35);
  const mid = W / 2;
  const sp = snap(t, t0 + E8 * 2, E8 * 2);
  g.fillStyle = C.slate; g.fillRect(mid, 120, 1, (H - 240) * sp);
  numeral(4, t, t0 - 10, M0, 470, 300);
  numeral(5, t, t0, mid + GUT * 2, 470, 300);
  const L = { x: M0, y: 560 }, R = { x: mid + GUT * 2, y: 560 };
  const wl = reveal('Read the room', L.x, L.y + 86, 86, 800, C.ink, 1, 0, -2);
  const wr = reveal('Strike the right tone', R.x, R.y + 86, 74, 800, C.ink, snap(t, TL.m.term5, E8 * 1.5), 0, -2);
  reveal('the mood, before you speak', L.x, L.y + 150, 32, 500, C.slate, 1);
  reveal('the words, matched to the mood', R.x, R.y + 150, 32, 500, C.slate, snap(t, TL.m.term5 + 0.8, E8 * 1.5));
  caption(R.x, R.y + 250, 820, ['Airbnb', '5 May 2020', 'about 1,900 roles'], lin(t, tw('airbnb', t0) - 0.2, tw('airbnb', t0) + BEAT));
  // a quarter of the staff: 4 blocks, one knife-cut on "laid off"
  const tA = tw('airbnb', t0), tL = tw('laid', t0);
  for (let i = 0; i < 4; i++) {
    const a = snap(t, q8(tA) + i * E8, E8);
    if (a <= 0) continue;
    const x = L.x + i * 200;
    knifeBox(x, L.y + 220, 180, 60 * a, C.ink, i === 3 ? lin(t, tL + 0.2, tL + 0.2 + BEAT * 1.5) : 0);
  }
  if (t > tL + 1.2) text('ABOUT A QUARTER', L.x + 600, L.y + 310, 17, 600, C.blue, 1.4);
  // the full stop: after "room", then on "struck" it glides across the gutter to "tone"
  const tSt = tw('struck', t0);
  const p = lin(t, tSt - 0.3, tSt + 0.9);
  const dl = { x: L.x + wl + 14, y: L.y + 78 }, dr = { x: R.x + wr + 12, y: R.y + 78 };
  dot(lerp(dl.x, dr.x, p), lerp(dl.y, dr.y, p) - Math.sin(p * Math.PI) * 40, 9);
}

function ch6(t, t0) {
  const r = chapterBase(6, t, t0, TL.m.term6, tw('take', t0));
  const y = r.artY + 70, tT = tw('trust', t0), tWi = TL.m.within;
  // the sentence, then a knife cut through it on "Within hours"
  const kp = lin(t, tWi, tWi + BEAT * 1.6);
  if (kp < 1) {
    const c = kp < 0.5 ? 1 : 1 - ease((kp - 0.5) / 0.5);
    g.save(); g.translate(0, y - 14); g.scale(1, Math.max(0.001, c)); g.translate(0, -(y - 14));
    reveal('"Trust the system."', RX, y, 46, 700, C.ink, snap(t, tT + 0.2, E8 * 1.5));
    g.restore();
    if (kp > 0 && kp < 0.75) { g.fillStyle = C.ink; g.fillRect(RX - 24, y - 16, (measure('"Trust the system."', 46, 700) + 48) * clamp(kp / 0.5), 2); }
  }
  const tCw = tw('completely', t0);
  reveal('"Completely wrong."', RX, y + 10, 64, 800, C.ink, snap(t, tCw, E8 * 1.5));
  if (t > tCw + 0.6) text('HIS WORDS, TO EVERY MICROSOFT EMPLOYEE', RX, y + 60, 17, 600, C.blue, 1.4);
  dot(r.dot.x, r.dot.y, r.dot.r);
}

function ch7(t, t0) {
  const r = chapterBase(7, t, t0, TL.m.term7, tw('lead', t0) - 0.1, { noCap: false });
  // a stack of 4 blocks; ANSWER re-flows to the top, the reasons ripple down, nearest first
  const tC = TL.m.conclusion, x = RX, y0 = r.artY - 10, bh = 34, gap = 8, bw = col(8) + COLW - RX;
  const tIn = tw('lead', t0) - 0.6;
  const labels = ['REASON', 'REASON', 'REASON', 'ANSWER'];
  for (let i = 0; i < 4; i++) {
    const a = snap(t, q8(tIn) + i * E8, E8);
    if (a <= 0) continue;
    let slot = i;
    const isA = i === 3;
    const pr = snap(t, q8(tC) + (isA ? E8 : E8 + (2 - i) * E8 * 0.5) + E8 * 2, E8 * 2);
    slot = isA ? lerp(3, 0, pr) : lerp(i, i + 1, pr);
    const yy = y0 + slot * (bh + gap);
    if (isA) { g.fillStyle = C.ink; g.fillRect(x, yy, bw * a, bh); text('ANSWER', x + 16, yy + 24, 16, 700, C.paper, 1.6); }
    else { g.strokeStyle = C.slate; g.lineWidth = 2; g.strokeRect(x + 1, yy + 1, bw * a - 2, bh - 2); text('REASON', x + 16, yy + 24, 16, 700, C.slate, 1.6); }
  }
  const tN = tw('90', t0);
  if (t > tN) {
    const p = steps(lin(t, tN, tN + 1.4), 3);
    text(String(Math.round(90 * p)).padStart(2, '0'), col(9) + 40, y0 + 150, 170, 800, C.ink, -3);
    text('SECONDS', col(9) + 46, y0 + 186, 17, 600, C.blue, 1.4);
  }
  dot(r.dot.x, r.dot.y, r.dot.r);
}

function ch8(t, t0) {
  const r = chapterBase(8, t, t0, TL.m.term8, tw('say', t0));
  // three lines, then one bar: "it's one device"
  const y0 = r.artY + 6, tR = TL.m.realizes;
  const items = [['an iPod', tw('ipod', t0)], ['a phone', tw('phone', t0)], ['an internet communicator', tw('internet', t0)]];
  const mp = snap(t, q8(tR) + E8 * 3, E8 * 3);
  items.forEach(([s, ti], i) => {
    const a = snap(t, ti + 0.15, E8 * 1.5);
    if (a <= 0) return;
    const yy = lerp(y0 + i * 58, y0 + 58, mp);
    g.fillStyle = C.ink; g.fillRect(RX, yy, 12, 40);
    if (mp < 1) { g.globalAlpha = 1; reveal(s, RX + 30, yy + 32, 34, 600, C.ink, a, mp); }
  });
  if (mp > 0) {
    g.fillStyle = C.ink; g.fillRect(RX, y0 + 58, (col(10) + COLW - RX) * mp, 40);
    if (mp >= 1) text('ONE DEVICE', RX + 20, y0 + 86, 19, 700, C.paper, 1.6);
  }
  // the silence: nothing moves, then the full stop lands on the downbeat
  const tL = TL.m.silence;
  const dp = snap(t, tL, 0.35);
  if (dp > 0) dot(r.dot.x, lerp(r.dot.y - 260, r.dot.y, dp), r.dot.r);
}

function ch9(t, t0) {
  const r = chapterBase(9, t, t0, TL.m.term9, tw('careful', t0));
  // four even steps, one per half note: measured
  const tA = tw('answer', t0) - 0.2, y = r.artY + 140;
  for (let i = 0; i < 4; i++) {
    const p = snap(t, q8(tA) + i * BEAT * 2, E8 * 2);
    if (p <= 0) continue;
    const h = 30 + i * 30;
    g.fillStyle = C.ink; g.fillRect(RX + i * 150, y - h * p, 130, h * p);
  }
  if (t > tw('thursday', t0)) text('THURSDAY', RX + 3 * 150, y + 30, 17, 600, C.blue, 1.4);
  dot(r.dot.x, r.dot.y, r.dot.r);
}

const TERMS = ['Gravitas', 'Unflappable', 'Grace under pressure', 'Read the room', 'Strike the right tone', 'Own it', 'Bottom line up front', 'Let it land', 'Measured'];
function wallCell(i) {
  const cw = (W - 2 * M0 - 2 * GUT) / 3, ch = 230;
  return { x: M0 + (i % 3) * (cw + GUT), y: 150 + Math.floor(i / 3) * (ch + GUT), w: cw, h: ch };
}
function wall(t, cut = null) {
  const RT = TL.m.recap_terms;
  let cur = -1;
  RT.forEach((tt, i) => { if (t >= tt - 0.1) cur = i; });
  for (let i = 0; i < 9; i++) {
    const c = wallCell(i);
    const a = snap(t, TL.m.recap + i * E8 * 0.5, E8);
    if (a <= 0) continue;
    const kp = cut ? cut(i) : 0;
    if (kp >= 1) continue;
    g.save();
    const sc = kp < 0.5 ? 1 : 1 - ease((kp - 0.5) / 0.5);
    g.translate(0, c.y + c.h / 2); g.scale(1, Math.max(0.001, sc)); g.translate(0, -(c.y + c.h / 2));
    g.fillStyle = C.paper; g.fillRect(c.x, c.y, c.w * a, c.h);
    text(pad2(i + 1), c.x + 28, c.y + 64, 44, 800, C.sky, -1);
    const spoken = i <= cur;
    const size = TERMS[i].length > 16 ? 46 : 54;
    text(TERMS[i], c.x + 28, c.y + c.h - 44, size, 800, spoken ? C.ink : C.sky, -1);
    g.restore();
    if (kp > 0 && kp < 0.75) { g.fillStyle = C.ink; g.fillRect(c.x - 12, c.y + c.h / 2 - 1, (c.w + 24) * clamp(kp / 0.5), 2); }
  }
  return cur;
}
function dotOnWall(t, cur) {
  if (cur < 0) return null;
  const RT = TL.m.recap_terms;
  const pos = (i) => { const c = wallCell(i); const s = TERMS[i].length > 16 ? 46 : 54; return { x: c.x + 28 + measure(TERMS[i], s, 800, -1) + 14, y: c.y + c.h - 50 }; };
  const a = pos(Math.max(0, cur - 1)), b = pos(cur);
  const p = cur === 0 ? 1 : lin(t, RT[cur] - 0.1, RT[cur] + 0.25);
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) };
}

function sceneRecap(t) {
  gridLines(0.35);
  text('THE FLUENT EDGE', M0, 70, 18, 700, C.blue, 2);
  rule(M0, 88, W - M0, C.sky);
  const cur = wall(t);
  const d = dotOnWall(t, cur);
  if (d) dot(d.x, d.y, 9);
}

function sceneOutro(t) {
  gridLines(0.35);
  const t0 = TL.m.outro;
  // knife cuts clear the wall, nearest to the dot first; the dot stays
  const keep = 8;
  const order = [7, 5, 4, 6, 2, 3, 1, 0];
  const cut = (i) => i === keep ? lin(t, t0 + 2.6, t0 + 2.6 + BEAT) : lin(t, t0 + order.indexOf(i) * E8, t0 + order.indexOf(i) * E8 + BEAT);
  const cur = wall(Math.max(t, TL.m.recap_terms[8] + 0.3), cut);
  const d = dotOnWall(TL.m.recap_terms[8] + 1, 8);
  // the dot glides to the left page, where the last line is set
  const mp = lin(t, t0 + 3.0, t0 + 4.2);
  const tl = TL.m.learnable - 1.0;
  // the dot is the full stop of the second line: "this week", then "is learnable"
  const e1 = { x: M0 + measure('this week', 150, 800, -3) + 22, y: 590 - 14 };
  const e2 = { x: M0 + measure('is learnable', 150, 800, -3) + 22, y: 590 - 14 };
  const sw = lin(t, q8(tl) + E8 * 2, q8(tl) + E8 * 2 + 0.5);
  const end = { x: lerp(e1.x, e2.x, sw), y: e1.y };
  dot(lerp(d.x, end.x, ease(mp)), lerp(d.y, end.y, ease(mp)), lerp(9, 15, mp));
  const tp = Math.max(tw('pick', t0 - 1), t0 + 2.9);       // after the wall is cleared
  reveal('Pick one', M0, 440, 150, 800, C.ink, snap(t, q8(tp) + E8, E8 * 1.5), snap(t, q8(tl), E8 * 1.5), -3);
  reveal('this week', M0, 590, 150, 800, C.slate, snap(t, q8(tp) + E8 * 3, E8 * 1.5), snap(t, q8(tl), E8 * 1.5), -3);
  reveal('Executive presence', M0, 440, 150, 800, C.ink, snap(t, q8(tl) + E8, E8 * 1.5), 0, -3);
  reveal('is learnable', M0, 590, 150, 800, C.ink, snap(t, q8(tl) + E8 * 2, E8 * 1.5), 0, -3);
}

function sceneEnd(t) {
  const t0 = TL.m.end;
  gridLines(0.35);
  const w = reveal('The Fluent Edge', M0, 420, 150, 800, C.ink, snap(t, t0 + E8 * 2, E8 * 2), 0, -3);
  dot(M0 + w + 24, 420 - 14, 15);
  reveal('Sean Watson & Dr. Howie Jacobson', M0, 500, 44, 600, C.slate, snap(t, t0 + BEAT * 2, E8 * 1.5));
  reveal('Leadership, mindset and executive English. A weekly podcast.', M0, 556, 32, 500, C.slate, snap(t, t0 + BEAT * 2 + E8, E8 * 1.5));
  const rows = [
    ['Listen', 'thefluentedge.com', '@fluentedgepodcast'],
    ['Sean Watson', 'English Communication Coach', 'seanwatson.coach'],
    ['Dr. Howie Jacobson', 'Leadership and mindset', 'howiejacobson.com'],
  ];
  rows.forEach((r, i) => {
    const y = 700 + i * 92, p = lin(t, t0 + BEAT * 4 + i * BEAT, t0 + BEAT * 5 + i * BEAT);
    rule(M0, y - 34, col(11) + COLW, C.slate, p);
    if (p < 1) return;
    text(r[0].toUpperCase(), M0, y, 19, 700, C.blue, 1.6);
    text(r[1], col(3), y, 30, 600, C.ink);
    text(r[2], col(8), y, 30, 600, C.ink);
  });
}

// ---------- subtitles: part of the layout, each word clip-revealed on its timestamp ----------
function subtitles(t) {
  if (t >= TL.m.end) return;
  const c = TL.cues.find((c) => t >= c.t0 && t < c.t1);
  if (!c) return;
  const size = 34, lh = 46, maxW = W - M0 - RX;
  // lay out lines
  const lines = [[]]; let lw = 0;
  font(size, 500);
  const sp = g.measureText(' ').width;
  for (const w of c.words) {
    const ww = g.measureText(w.w).width;
    if (lw + ww > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push({ ...w, x: lw, ww }); lw += ww + sp;
  }
  const y0 = SUB_Y - (lines.length - 1) * lh;
  const out = lin(t, c.t1 - 0.18, c.t1);
  g.fillStyle = C.slate; g.fillRect(RX - 30, y0 - 22, 10, 10);
  lines.forEach((ln, j) => ln.forEach((w) => {
    reveal(w.w, RX + w.x, y0 + j * lh, size, 500, C.ink, lin(t, w.t0 - 0.06, w.t0 + 0.14), out);
  }));
}

// ---------- camera: hard pans by one page between scenes ----------
function scenes() {
  const ch = TL.ch, m = TL.m;
  const list = [{ s: 0, e: ch[0].t, f: sceneIntro }];
  const fs = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9];
  ch.forEach((c, i) => list.push({ s: c.t, e: i + 1 < ch.length ? ch[i + 1].t : m.recap, f: (t) => fs[i](t, c.t) }));
  list.push({ s: m.recap, e: m.outro, f: sceneRecap }, { s: m.outro, e: m.end, f: sceneOutro }, { s: m.end, e: TL.dur + 1, f: sceneEnd });
  return list;
}
let SC;
const PAN = BEAT;                     // a pan lands on the scene's start

function draw(t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = C.page; g.fillRect(0, 0, W, H);
  let i = SC.findIndex((s) => t >= s.s && t < s.e);
  if (i < 0) i = SC.length - 1;
  const nxt = SC[i + 1];
  const drawAt = (k, dx, tt) => {
    g.save(); g.translate(dx, 0);
    // intro: a slow push-in on the room; recap: a pull-out to the wall
    if (k === 0) { const s = 1 + 0.03 * lin(tt, 0, SC[0].e); g.translate(W / 2, H / 2); g.scale(s, s); g.translate(-W / 2, -H / 2); }
    if (SC[k].f === sceneRecap) { const p = snap(tt, TL.m.recap + BEAT * 2, BEAT * 2); const s = lerp(1.55, 1, p); const c = wallCell(0); g.translate(W / 2, H / 2); g.scale(s, s); g.translate(-lerp(c.x + c.w / 2, W / 2, p), -lerp(c.y + c.h / 2, H / 2, p)); }
    SC[k].f(tt);
    g.restore();
  };
  if (nxt && t > nxt.s - PAN && nxt.f !== sceneOutro) {
    const p = ease((t - (nxt.s - PAN)) / PAN);
    drawAt(i, -W * p, t);
    drawAt(i + 1, W * (1 - p), nxt.s);
  } else if (i > 0 && t < SC[i].s + 0.0001 && SC[i].f !== sceneOutro) {
    drawAt(i, 0, t);
  } else {
    drawAt(i, 0, t);
  }
  subtitles(t);
}

// ---------- sound / cue events for the mixer ----------
function events() {
  const ev = [], m = TL.m, ch = TL.ch;
  ev.push({ t: 0.6, type: 'slide', dur: 3.6 });
  ev.push({ t: m.leans + E8, type: 'ticks' });
  ev.push({ t: m.title + 0.2, type: 'clack' });
  for (let i = 0; i < 9; i++) ev.push({ t: q8(m.nine) + i * E8, type: 'tick' });
  ch.forEach((c) => {
    ev.push({ t: c.t - PAN, type: 'pan' });
    for (let k = 0; k < 4; k++) ev.push({ t: c.t + k * BEAT * 0.5, type: 'thunk', g: 0.5 + k * 0.12 });
  });
  for (let n = 1; n <= 9; n++) if (m['term' + n]) ev.push({ t: m['term' + n], type: 'clack' });
  ev.push({ t: q8(tw('weight', ch[0].t)), type: 'slab' });
  const tF = tw('fail', ch[1].t);
  ev.push({ t: tF + E8 * 0.5, type: 'snick' }, { t: tF + E8 * 1.5, type: 'snick' });
  ev.push({ t: tw('all', m.lands), type: 'count', dur: BEAT * 3 });
  for (let k = 0; k < 5; k++) ev.push({ t: m.collapses + k * E8 * 0.6 + E8, type: 'snick', g: 0.6 });
  ev.push({ t: tw('carries', ch[2].t), type: 'pen', dur: 2.2 });
  ev.push({ t: tw('mood', ch[3].t) - 0.2, type: 'slide', dur: 1.4 });
  ev.push({ t: tw('laid', ch[4].t) + 0.2 + BEAT * 0.75, type: 'snick' });
  ev.push({ t: tw('struck', ch[4].t) - 0.3, type: 'slide', dur: 1.2 });
  ev.push({ t: m.within + BEAT * 0.8, type: 'snick' });
  ev.push({ t: q8(m.conclusion) + E8 * 3, type: 'slab' });
  ev.push({ t: q8(m.realizes) + E8 * 3, type: 'slab' });
  ev.push({ t: m.silence, type: 'felt' });
  for (let k = 0; k < 4; k++) ev.push({ t: q8(tw('answer', ch[8].t) - 0.2) + k * BEAT * 2, type: 'thunk', g: 0.6 });
  ev.push({ t: m.recap, type: 'pan' });
  m.recap_terms.forEach((tt) => ev.push({ t: tt, type: 'tick' }));
  for (let k = 0; k < 8; k++) ev.push({ t: m.outro + k * E8 + BEAT * 0.5, type: 'snick', g: 0.5 });
  ev.push({ t: m.outro + 2.6 + BEAT * 0.5, type: 'snick', g: 0.5 });
  ev.push({ t: m.end + E8 * 2, type: 'stamp' });
  return ev.sort((a, b) => a.t - b.t);
}

async function init() {
  TL = await (await fetch('timeline.json')).json();
  WORDS = TL.words;
  await Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px ${F}`).catch(() => null)));
  SC = scenes();
  window.DUR = TL.dur;
  window.EV = events();
  window.render = (t) => draw(t);
  window.READY = true;
  const qs = new URLSearchParams(location.search);
  if (qs.has('t')) draw(parseFloat(qs.get('t')));
}
init();
