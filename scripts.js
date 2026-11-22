'use strict';

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function uid() {
  return (crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function sum(arr) { let s = 0; for (const v of arr) s += v; return s; }
function avg(arr) { return arr.length ? sum(arr) / arr.length : NaN; }
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function debounce(fn, ms) {
  let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
}
function throttle(fn, ms) {
  let last = 0, t;
  return function (...a) {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn.apply(this, a); }
    else { clearTimeout(t); t = setTimeout(() => { last = Date.now(); fn.apply(this, a); }, ms - (now - last)); }
  };
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function linreg(pts) {
  const n = pts.length; if (n < 2) return { m: 0, b: pts.length ? pts[0].y : 0 };
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const p of pts) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; }
  const d = n * sxx - sx * sx;
  const m = d === 0 ? 0 : (n * sxy - sx * sy) / d;
  return { m, b: (sy - m * sx) / n };
}
function percentile(sorted, p) {
  if (!sorted.length) return NaN;
  const i = clamp((sorted.length - 1) * p, 0, sorted.length - 1);
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
function download(filename, text, mime) {
  const blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 400);
}
function sanitizeName(s) {
  return String(s || 'activity').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_').slice(0, 60) || 'activity';
}
function csvCell(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/* ---------------- date helpers ---------------- */
const DAY_MS = 86400000;
const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad2(n) { return (n < 10 ? '0' : '') + n; }
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfWeek(d, weekStart) {
  const x = startOfDay(d);
  const diff = (x.getDay() - weekStart + 7) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}
function startOfMonth(d) { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x; }
function endOfMonth(d) { const x = startOfMonth(d); x.setMonth(x.getMonth() + 1); return x; }
function startOfYear(d) { const x = new Date(d); x.setMonth(0, 1); x.setHours(0, 0, 0, 0); return x; }
function dayKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function parseDayKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function sameDay(a, b) { return dayKey(a) === dayKey(b); }
function relDay(d) {
  const now = new Date();
  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, addDays(now, -1))) return 'Yesterday';
  const y = new Date(d).getFullYear() !== now.getFullYear();
  return DOW_NAMES[d.getDay()] + ', ' + MON_NAMES[d.getMonth()] + ' ' + d.getDate() + (y ? ', ' + d.getFullYear() : '');
}
function fmtDate(d) { return MON_NAMES[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }
function fmtTime(d) { return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
function monthLabel(d, full) {
  return (full ? MON_FULL : MON_NAMES)[d.getMonth()] + (d.getMonth() === 0 || full ? ' ' + d.getFullYear() : '');
}

/* ---------------- formatting ---------------- */
const KM = 1000, MI = 1609.344;
function unitLabel(units) { return units === 'imperial' ? 'mi' : 'km'; }
function unitMeters(units) { return units === 'imperial' ? MI : KM; }
function speedLabel(units) { return units === 'imperial' ? 'mph' : 'km/h'; }
function elevLabel(units) { return units === 'imperial' ? 'ft' : 'm'; }

function fmtDist(m, units) {
  if (m == null || !isFinite(m)) return '—';
  if (units === 'imperial') {
    if (m < 300) return Math.round(m * 3.28084) + ' ft';
    return (m / MI).toFixed(2) + ' mi';
  }
  if (m < 950) return Math.round(m) + ' m';
  return (m / KM).toFixed(2) + ' km';
}
function fmtDistNum(m, units, dp) {
  dp = dp == null ? 2 : dp;
  return units === 'imperial' ? (m / MI).toFixed(dp) : (m / KM).toFixed(dp);
}
function fmtDur(sec) {
  if (sec == null || !isFinite(sec) || sec < 0) return '—';
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h > 0 ? h + ':' + pad2(m) + ':' + pad2(s) : m + ':' + pad2(s);
}
function fmtDurLong(sec) {
  if (sec == null || !isFinite(sec)) return '—';
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  if (h > 0) return h + 'h ' + pad2(m) + 'm';
  return Math.round(sec / 60) + ' min';
}
function fmtPace(secPerMeter, units) {
  if (secPerMeter == null || !isFinite(secPerMeter) || secPerMeter <= 0) return '—';
  const s = Math.round(secPerMeter * unitMeters(units));
  return Math.floor(s / 60) + ':' + pad2(s % 60);
}
function fmtPaceFull(secPerMeter, units) {
  if (secPerMeter == null || !isFinite(secPerMeter) || secPerMeter <= 0) return '—';
  return fmtPace(secPerMeter, units) + ' /' + unitLabel(units);
}
function fmtSpeed(mps, units) {
  if (mps == null || !isFinite(mps) || mps < 0) return '—';
  const v = units === 'imperial' ? mps * 2.236936 : mps * 3.6;
  return v.toFixed(1) + ' ' + speedLabel(units);
}
function fmtSpeedNum(mps, units) {
  const v = units === 'imperial' ? mps * 2.236936 : mps * 3.6;
  return v.toFixed(1);
}
function fmtElev(m, units) {
  if (m == null || !isFinite(m)) return '—';
  return Math.round(units === 'imperial' ? m * 3.28084 : m) + ' ' + elevLabel(units);
}
function fmtPct(x, dp) { return (x >= 0 ? '+' : '') + (100 * x).toFixed(dp == null ? 0 : dp) + '%'; }

/* ---------------- geo ---------------- */
const R_EARTH = 6371008.8;
function toRad(d) { return d * Math.PI / 180; }
function hav(p1, p2) {
  const dLat = toRad(p2.la - p1.la), dLon = toRad(p2.ln - p1.ln);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(p1.la)) * Math.cos(toRad(p2.la)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(a));
}
function smoothSeries(arr, win) {
  win = Math.max(1, win | 0);
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    let s = 0, n = 0;
    for (let j = Math.max(0, i - win); j <= Math.min(arr.length - 1, i + win); j++) {
      const v = arr[j]; if (v != null && isFinite(v)) { s += v; n++; }
    }
    out[i] = n ? s / n : null;
  }
  return out;
}

/* ---------------- calories & Training Stress Score (TSS) ---------------- */
const MET_TABLES = {
  run: [[6.4, 6.0], [8.0, 8.3], [9.7, 9.8], [11.3, 11.0], [12.9, 11.8], [14.5, 12.8], [16.1, 14.5], [19.3, 16.0], [22.5, 19.0]],
  walk: [[2.4, 2.8], [4.0, 3.0], [4.8, 3.5], [5.6, 3.8], [6.4, 5.0], [7.2, 5.3]],
  cycle: [[5.8, 3.5], [12.0, 5.8], [16.0, 6.8], [19.0, 8.0], [22.4, 10.0], [30.0, 12.0]],
  hike: [[0, 6.0], [100, 7.0]],
  gym: [[0, 5.0], [100, 5.0]],
  custom: [[0, 5.0], [100, 5.0]],
};
function metFor(type, kmh) {
  const t = MET_TABLES[type] || MET_TABLES.custom;
  if (kmh == null || !isFinite(kmh) || kmh <= 0) return t[0][1];
  if (kmh <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) {
    if (kmh <= t[i][0]) return lerp(t[i - 1][1], t[i][1], (kmh - t[i - 1][0]) / (t[i][0] - t[i - 1][0]));
  }
  return t[t.length - 1][1];
}
function estimateCalories(type, movingSec, avgSpeedMps, weightKg, gradeRatio) {
  if (!movingSec || movingSec < 60) return 0;
  const kmh = (avgSpeedMps || 0) * 3.6;
  let met = metFor(type, kmh);
  if (type === 'hike' && gradeRatio > 0.04) met += 1.0;
  return Math.round(met * (weightKg || 70) * (movingSec / 3600));
}

function computeTSS(a, maxHr) {
  const durH = (a.duration || 0) / 3600;
  if (durH <= 0.01) return 0;
  if (a.hrAvg && maxHr > 100) {
    const lthr = maxHr * 0.88;
    const ifac = clamp(a.hrAvg / lthr, 0.45, 1.35);
    return Math.round(durH * ifac * ifac * 100);
  }
  if (a.rpe) {
    const ifac = clamp(a.rpe / 8.2, 0.4, 1.3);
    return Math.round(durH * ifac * ifac * 100);
  }
  const speed = (a.duration || 0) > 0 ? (a.distance || 0) / a.duration : 0;
  const met = metFor(a.type, speed * 3.6);
  const ifac = clamp(met / 11.2, 0.42, 1.25);
  return Math.round(durH * ifac * ifac * 100);
}

/* ---------------- passcode hashing ---------------- */
async function sha256Hex(str) {
  if (crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    h1 = (h1 ^ str.charCodeAt(i)) >>> 0; h1 = Math.imul(h1, 16777619) >>> 0;
    h2 = (h2 + str.charCodeAt(i) * (i + 7)) >>> 0; h2 = Math.imul(h2, 2654435761) >>> 0;
  }
  return 'fnv1a:' + h1.toString(16) + h2.toString(16);
}
async function hashPin(pin, salt) { return sha256Hex(salt + '.' + pin + '.solo'); }

/* ---------------- storage & app state ---------------- */
const ACT_TYPES = {
  run:    { label: 'Run',     color: 'var(--run)',    verb: 'running' },
  walk:   { label: 'Walk',    color: 'var(--walk)',   verb: 'walking' },
  cycle:  { label: 'Ride',    color: 'var(--cycle)',  verb: 'cycling' },
  hike:   { label: 'Hike',    color: 'var(--hike)',   verb: 'hiking' },
  gym:    { label: 'Gym',     color: 'var(--gym)',    verb: 'training' },
  custom: { label: 'Workout', color: 'var(--custom)', verb: 'training' },
};
function typeLabel(a) {
  if (a.type === 'custom' && a.customName) return a.customName;
  return ACT_TYPES[a.type] ? ACT_TYPES[a.type].label : 'Workout';
}
function typeColor(a) { return ACT_TYPES[a.type] ? ACT_TYPES[a.type].color : 'var(--custom)'; }

const DB = {
  mode: 'idb',
  _db: null,
  async init() {
    try {
      if (!indexedDB) throw new Error('no idb');
      this._db = await new Promise((res, rej) => {
        const rq = indexedDB.open('solo-db', 1);
        rq.onupgradeneeded = () => {
          const db = rq.result;
          if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        };
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
        rq.onblocked = () => rej(new Error('blocked'));
        setTimeout(() => rej(new Error('timeout')), 4000);
      });
      this.mode = 'idb';
    } catch (e) { this.mode = 'ls'; }
    return this.mode;
  },
  _tx(mode) { return this._db.transaction('kv', mode).objectStore('kv'); },
  async get(key) {
    if (this.mode === 'idb') {
      return new Promise((res, rej) => {
        const rq = this._tx('readonly').get(key);
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
      });
    }
    const raw = localStorage.getItem('solo.kv.' + key);
    return raw == null ? undefined : JSON.parse(raw);
  },
  async set(key, val) {
    if (this.mode === 'idb') {
      return new Promise((res, rej) => {
        const rq = this._tx('readwrite').put(val, key);
        rq.onsuccess = () => res();
        rq.onerror = () => rej(rq.error);
      });
    }
    try { localStorage.setItem('solo.kv.' + key, JSON.stringify(val)); }
    catch (e) { throw new Error('Storage is full — export a backup, then remove old demo activities.'); }
  },
  async del(key) {
    if (this.mode === 'idb') {
      return new Promise((res, rej) => {
        const rq = this._tx('readwrite').delete(key);
        rq.onsuccess = () => res();
        rq.onerror = () => rej(rq.error);
      });
    }
    localStorage.removeItem('solo.kv.' + key);
  },
  async keys() {
    if (this.mode === 'idb') {
      return new Promise((res, rej) => {
        const rq = this._tx('readonly').getAllKeys();
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
      });
    }
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith('solo.kv.')) out.push(k.slice(8));
    }
    return out;
  },
};

const DEFAULT_SETTINGS = {
  setupDone: false,
  name: '',
  photo: '',
  units: 'metric',
  theme: 'dark',
  weekStart: 1,
  weightKg: null,
  maxHr: 190,
  restHr: 60,
  bio: '',
  voiceCues: true,
  autoPause: true,
  accFilter: 50,
  defaultType: 'run',
  weeklyGoalKm: 20,
  weeklyGoalType: 'all',
  monthlyGoalCount: 12,
  lock: { enabled: false, salt: '', hash: '' },
};
function loadSettings() {
  try {
    const raw = localStorage.getItem('solo.settings');
    const s = raw ? JSON.parse(raw) : {};
    const out = Object.assign({}, DEFAULT_SETTINGS, s);
    out.lock = Object.assign({}, DEFAULT_SETTINGS.lock, s.lock || {});
    return out;
  } catch (e) { return Object.assign({}, DEFAULT_SETTINGS); }
}
function saveSettings() {
  try { localStorage.setItem('solo.settings', JSON.stringify(App.settings)); }
  catch (e) { toast('Could not save settings: ' + e.message, 'err'); }
}

const App = {
  settings: loadSettings(),
  acts: [],
  goals: [],
  pr: null,
  streak: null,
  load: null,
  ready: false,

  async init() {
    await DB.init();
    const keys = await DB.keys();
    const loads = [];
    for (const k of keys) {
      if (k.startsWith('act:')) loads.push(DB.get(k).then(a => { if (a && a.id) this.acts.push(a); }));
      else if (k === 'goals') loads.push(DB.get('goals').then(g => { if (Array.isArray(g)) this.goals = g; }));
    }
    await Promise.all(loads);
    this.acts.sort((a, b) => b.start - a.start);
    this.recompute();
    this.ready = true;
  },

  async saveActivity(a) {
    await DB.set('act:' + a.id, a);
    const i = this.acts.findIndex(x => x.id === a.id);
    if (i >= 0) this.acts[i] = a; else this.acts.unshift(a);
    this.acts.sort((x, y) => y.start - x.start);
    this.recompute();
  },
  async deleteActivity(id) {
    await DB.del('act:' + id);
    this.acts = this.acts.filter(a => a.id !== id);
    this.recompute();
  },
  async persistGoals() { await DB.set('goals', this.goals); },
  saveGoal(g) {
    const i = this.goals.findIndex(x => x.id === g.id);
    if (i >= 0) this.goals[i] = g; else this.goals.push(g);
    return this.persistGoals();
  },
  async deleteGoal(id) {
    this.goals = this.goals.filter(g => g.id !== id);
    return this.persistGoals();
  },
  hasDemo() { return this.acts.some(a => a.demo); },

  recompute() {
    this.pr = computeRecords(this.acts);
    this.streak = computeStreak(this.acts);
    this.load = computeTrainingLoad(this.acts, this.settings.maxHr);
    try { checkGoals(); } catch (e) {}
  },
  refreshView() { if (typeof renderCurrent === 'function') renderCurrent(); },
};

/* ---------------- Banister CTL / ATL / TSB Training Load Model ---------------- */
function computeTrainingLoad(acts, maxHr) {
  const daysBack = 90;
  const today = startOfDay(new Date());
  const start = addDays(today, -daysBack);
  const dailyTss = new Map();
  for (const a of acts) {
    if (a.start < start.getTime()) continue;
    const k = dayKey(new Date(a.start));
    dailyTss.set(k, (dailyTss.get(k) || 0) + computeTSS(a, maxHr));
  }
  const series = [];
  let ctl = 0, atl = 0;
  const kCtl = Math.exp(-1 / 42);
  const kAtl = Math.exp(-1 / 7);
  for (let i = 0; i <= daysBack; i++) {
    const d = addDays(start, i);
    const tss = dailyTss.get(dayKey(d)) || 0;
    const tsb = ctl - atl;
    ctl = ctl * kCtl + tss * (1 - kCtl);
    atl = atl * kAtl + tss * (1 - kAtl);
    series.push({ date: d, tss, ctl, atl, tsb });
  }
  const latest = series[series.length - 1] || { ctl: 0, atl: 0, tsb: 0, tss: 0 };
  let status = 'Optimal Training', badge = 'up';
  if (latest.tsb > 12) { status = 'Fresh / Peak Race Form'; badge = 'info'; }
  else if (latest.tsb > -8) { status = 'Balanced Readiness'; badge = 'up'; }
  else if (latest.tsb > -22) { status = 'Productive Overload'; badge = 'flat'; }
  else { status = 'High Fatigue — Recover'; badge = 'down'; }
  return { series: series.slice(-60), latest, status, badge };
}

/* ---------------- track statistics ---------------- */
function segValid(p0, p1, accFilter) {
  const dt = (p1.t - p0.t) / 1000;
  if (dt <= 0) return null;
  const d = hav(p0, p1);
  const v = d / dt;
  const acc = Math.min(p0.ac == null ? 99 : p0.ac, p1.ac == null ? 99 : p1.ac);
  if (p0.p || p1.p) return null;
  if (v > 42) return null;
  if (d < 1 && acc > accFilter / 2) return null;
  if (d > 0 && acc > accFilter * 3) return null;
  return { d, dt, acc };
}
function trackStats(pts, accFilter) {
  let dist = 0, moving = 0;
  for (let i = 1; i < pts.length; i++) {
    const s = segValid(pts[i - 1], pts[i], accFilter || App.settings.accFilter);
    if (s) { dist += s.d; moving += Math.min(s.dt, 90); }
  }
  let gain = 0;
  const sm = smoothSeries(pts.map(p => p.el), 2);
  for (let i = 1; i < sm.length; i++) {
    if (sm[i] != null && sm[i - 1] != null) {
      const d = sm[i] - sm[i - 1];
      if (d > 0.4) gain += d;
    }
  }
  const wall = pts.length > 1 ? (pts[pts.length - 1].t - pts[0].t) / 1000 : 0;
  return { dist, moving, gain: Math.round(gain), wall };
}
function cumulativeDistances(pts) {
  const out = pts && pts.length ? [0] : [];
  for (let i = 1; i < (pts ? pts.length : 0); i++) {
    const s = segValid(pts[i - 1], pts[i], App.settings.accFilter);
    out.push(s ? out[i - 1] + s.d : out[i - 1]);
  }
  return out;
}
function computeSplits(pts, unitM, accFilter) {
  if (!pts || pts.length < 2) return [];
  const els = smoothSeries(pts.map(p => p.el), 2);
  const out = [];
  let dist = 0, segStartT = null, lastT = null;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i];
    const s = segValid(p0, p1, accFilter || App.settings.accFilter);
    if (!s) { lastT = p1.t; continue; }
    if (segStartT == null) { segStartT = p0.t; lastT = p0.t; }
    const segEnd = dist + s.d;
    let guard = 0;
    while ((out.length + 1) * unitM <= segEnd + 0.5 && guard++ < 500) {
      const target = (out.length + 1) * unitM;
      const f = clamp((target - dist) / (s.d || 1), 0, 1);
      const tC = p0.t + s.dt * 1000 * f;
      const elC = (els[i] == null || els[i - 1] == null) ? null : lerp(els[i - 1], els[i], f);
      out.push({ n: out.length + 1, t: (tC - segStartT) / 1000, d: target, el: elC });
    }
    dist = segEnd;
    lastT = p1.t;
  }
  if (dist > out.length * unitM + Math.max(5, unitM * 0.01) && segStartT != null && lastT != null) {
    out.push({ n: out.length + 1, t: (lastT - segStartT) / 1000, d: dist, partial: true });
  }
  return out;
}

function computeHrZones(a, maxHr) {
  maxHr = maxHr || 190;
  const zones = [
    { z: 'Z1 Recovery', min: 0, max: 0.60, color: '#64748B', sec: 0 },
    { z: 'Z2 Aerobic',  min: 0.60, max: 0.70, color: '#38BDF8', sec: 0 },
    { z: 'Z3 Tempo',    min: 0.70, max: 0.80, color: '#3ECF8E', sec: 0 },
    { z: 'Z4 Threshold',min: 0.80, max: 0.90, color: '#F5C542', sec: 0 },
    { z: 'Z5 VO2 Max',  min: 0.90, max: 2.00, color: '#FF5A1F', sec: 0 },
  ];
  if (a.points && a.points.length > 2 && a.points.some(p => p.hr != null)) {
    for (let i = 1; i < a.points.length; i++) {
      const hr = a.points[i].hr || a.points[i - 1].hr;
      if (!hr) continue;
      const dt = clamp((a.points[i].t - a.points[i - 1].t) / 1000, 0, 30);
      const pct = hr / maxHr;
      const z = zones.find(zn => pct >= zn.min && pct < zn.max) || zones[4];
      z.sec += dt;
    }
  } else if (a.hrAvg && a.duration > 0) {
    const pct = a.hrAvg / maxHr;
    const idx = pct < 0.6 ? 0 : pct < 0.7 ? 1 : pct < 0.8 ? 2 : pct < 0.9 ? 3 : 4;
    zones[idx].sec = a.duration * 0.65;
    if (idx > 0) zones[idx - 1].sec = a.duration * 0.25;
    if (idx < 4) zones[idx + 1].sec = a.duration * 0.10;
  } else return null;
  const total = sum(zones.map(z => z.sec)) || 1;
  zones.forEach(z => z.pct = Math.round((z.sec / total) * 100));
  return zones;
}

function actStats(a) {
  const u = App.settings.units;
  const unitM = unitMeters(u);
  let dist, moving, gain, elapsed, splits = [];
  if (a.points && a.points.length > 1) {
    const ts = trackStats(a.points);
    dist = ts.dist; moving = ts.moving; gain = ts.gain;
    elapsed = Math.max(0, ts.wall - (a.pausedSec || 0));
    splits = computeSplits(a.points, unitM);
  } else {
    dist = a.distance || 0; moving = a.duration || 0; gain = a.gain || 0; elapsed = a.duration || 0;
  }
  const avgSpeed = moving > 0 ? dist / moving : 0;
  const avgPace = dist > 0 ? moving / dist : NaN;
  const calories = a.calories != null ? a.calories
    : estimateCalories(a.type, moving, avgSpeed, App.settings.weightKg, dist > 0 ? (gain || 0) / dist : 0);
  const tss = computeTSS(a, App.settings.maxHr);
  const zones = computeHrZones(a, App.settings.maxHr);
  return {
    dist, moving, elapsed, gain, avgPace, avgSpeed, calories, tss, zones, splits,
    hasTrack: !!(a.points && a.points.length > 1),
    unitLabel: unitLabel(u),
  };
}
function actRowStats(a) {
  const dist = a.distance || 0, dur = a.duration || 0;
  return { dist, dur, pace: dist > 0 ? dur / dist : NaN, speed: dur > 0 ? dist / dur : 0, tss: computeTSS(a, App.settings.maxHr) };
}

/* ---------------- best efforts & personal records ---------------- */
function bestEffort(pts, targetM, accFilter) {
  if (!pts || pts.length < 2) return null;
  const D = [0], T = [pts[0].t / 1000];
  for (let i = 1; i < pts.length; i++) {
    const s = segValid(pts[i - 1], pts[i], accFilter || App.settings.accFilter);
    if (s) { D.push(D[D.length - 1] + s.d); T.push(T[T.length - 1] + s.dt); }
  }
  let i = 0, best = Infinity, bi = -1, bj = -1;
  for (let j = 1; j < D.length; j++) {
    if (T[j] - T[j - 1] > 60) i = j;
    while (i < j && D[j] - D[i + 1] >= targetM) i++;
    if (D[j] - D[i] >= targetM) {
      const t = T[j] - T[i];
      if (t < best) { best = t; bi = i; bj = j; }
    }
  }
  return best < Infinity ? { time: best, i: bi, j: bj } : null;
}

function computeRecords(acts) {
  const rec = { f1k: null, f5k: null, f10k: null, longestRun: null, longestRide: null, highestGain: null, longestWorkout: null };
  for (const a of acts) {
    const st = actRowStats(a);
    if (a.type === 'run') {
      for (const [key, distM] of [['f1k', 1000], ['f5k', 5000], ['f10k', 10000]]) {
        let cand = null;
        if (a.points && a.points.length > 1 && st.dist >= distM * 0.98) {
          const be = bestEffort(a.points, distM);
          if (be) cand = { time: be.time, manual: false };
        } else if (!a.points && st.dist >= distM * 0.98 && st.dist <= distM * 1.02) {
          cand = { time: st.dur, manual: true };
        }
        if (cand && (!rec[key] || cand.time < rec[key].value)) {
          rec[key] = { value: cand.time, actId: a.id, date: a.start, manual: cand.manual, demo: !!a.demo };
        }
      }
      if (!rec.longestRun || st.dist > rec.longestRun.value) rec.longestRun = { value: st.dist, actId: a.id, date: a.start, demo: !!a.demo };
    }
    if (a.type === 'cycle' && (!rec.longestRide || st.dist > rec.longestRide.value)) {
      rec.longestRide = { value: st.dist, actId: a.id, date: a.start, demo: !!a.demo };
    }
    const gain = a.gain || 0;
    if (gain > 0 && (!rec.highestGain || gain > rec.highestGain.value)) rec.highestGain = { value: gain, actId: a.id, date: a.start, demo: !!a.demo };
    if (st.dur > 0 && (!rec.longestWorkout || st.dur > rec.longestWorkout.value)) rec.longestWorkout = { value: st.dur, actId: a.id, date: a.start, demo: !!a.demo };
  }
  return rec;
}

function computeStreak(acts) {
  const days = new Set();
  for (const a of acts) days.add(dayKey(new Date(a.start)));
  const keys = Array.from(days).sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    if (prev && (parseDayKey(k) - parseDayKey(prev)) / DAY_MS === 1) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = k;
  }
  let cur = 0;
  const today = startOfDay(new Date());
  const hasToday = days.has(dayKey(today));
  const hasYesterday = days.has(dayKey(addDays(today, -1)));
  if (!hasToday && !hasYesterday) return { current: 0, best, active: false, hasToday: false, days };
  cur = hasToday ? 1 : 0;
  let d = addDays(today, -1);
  while (days.has(dayKey(d))) { cur++; d = addDays(d, -1); }
  return { current: cur, best, active: cur > 0, hasToday, days };
}

function actsInRange(from, to, type) {
  return App.acts.filter(a => a.start >= from.getTime() && a.start < to.getTime() && (!type || type === 'all' || a.type === type));
}
function rangeStats(list) {
  const r = { count: 0, dist: 0, dur: 0, elapsed: 0, gain: 0, kcal: 0, tss: 0, byType: {} };
  for (const a of list) {
    r.count++; r.dist += a.distance || 0; r.dur += a.duration || 0;
    r.elapsed += a.elapsed || a.duration || 0; r.gain += a.gain || 0;
    r.kcal += a.calories || 0; r.tss += computeTSS(a, App.settings.maxHr);
    r.byType[a.type] = (r.byType[a.type] || 0) + (a.distance || 0);
  }
  return r;
}
function weekBounds(offset) {
  const ws = App.settings.weekStart;
  const base = addDays(startOfWeek(new Date(), ws), offset * 7);
  return { from: base, to: addDays(base, 7) };
}
function weeklyBuckets(weeks, type) {
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const { from, to } = weekBounds(-i);
    out.push({ from, to, ...rangeStats(actsInRange(from, to, type)) });
  }
  return out;
}
function monthlyBuckets(months, type) {
  const out = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({ from, to, ...rangeStats(actsInRange(from, to, type)) });
  }
  return out;
}
function activityDayMap(from, to) {
  const m = new Map();
  for (const a of actsInRange(from, to)) {
    const k = dayKey(new Date(a.start));
    const e = m.get(k) || { dist: 0, count: 0 };
    e.dist += a.distance || 0; e.count++;
    m.set(k, e);
  }
  return m;
}

function goalLabel(g) {
  const u = App.settings.units;
  if (g.kind === 'weekly-distance') {
    const t = g.type && g.type !== 'all' ? ACT_TYPES[g.type].label : 'activity';
    return `${(g.targetKm * (u === 'imperial' ? 0.621371 : 1)).toFixed(u === 'imperial' ? 1 : 0)} ${unitLabel(u)} ${t === 'activity' ? '' : t} per week`.replace('  ', ' ');
  }
  if (g.kind === 'monthly-count') return `${g.targetCount} activities per month`;
  if (g.kind === 'milestone-distance') return `Total ${g.targetKm} km ${g.type && g.type !== 'all' ? ACT_TYPES[g.type].label.toLowerCase() : ''} logged`.replace('  ', ' ');
  if (g.kind === 'milestone-duration') return `Total ${g.targetHours} h of training`;
  if (g.kind === 'milestone-streak') return `${g.targetDays}-day activity streak`;
  return 'Goal';
}
function goalProgress(g) {
  const u = App.settings.units;
  let value = 0, target = 1, unit = '';
  if (g.kind === 'weekly-distance') {
    const { from, to } = weekBounds(0);
    value = rangeStats(actsInRange(from, to, g.type)).dist / KM;
    if (u === 'imperial') { value *= 0.621371; target = g.targetKm * 0.621371; } else target = g.targetKm;
    unit = unitLabel(u);
  } else if (g.kind === 'monthly-count') {
    value = actsInRange(startOfMonth(new Date()), endOfMonth(new Date()), g.type).length;
    target = g.targetCount; unit = 'activities';
  } else if (g.kind === 'milestone-distance') {
    let tot = 0;
    for (const a of App.acts) if (!g.type || g.type === 'all' || a.type === g.type) tot += a.distance || 0;
    value = tot / KM; if (u === 'imperial') value *= 0.621371;
    target = u === 'imperial' ? g.targetKm * 0.621371 : g.targetKm;
    unit = unitLabel(u);
  } else if (g.kind === 'milestone-duration') {
    let tot = 0;
    for (const a of App.acts) tot += a.duration || 0;
    value = tot / 3600; target = g.targetHours; unit = 'h';
  } else if (g.kind === 'milestone-streak') {
    value = App.streak ? App.streak.current : 0;
    target = g.targetDays; unit = 'days';
  }
  const pct = target > 0 ? clamp(value / target, 0, 1.2) : 0;
  return { value, target, pct: clamp(pct, 0, 1), over: pct >= 1, unit };
}
let goalCompletedListener = null;
function checkGoals() {
  const newly = [];
  for (const g of App.goals) {
    if (g.completedAt) continue;
    if (goalProgress(g).over) { g.completedAt = Date.now(); newly.push(g); }
  }
  if (newly.length) {
    App.persistGoals();
    if (goalCompletedListener) goalCompletedListener(newly);
  }
  return newly;
}

/* ---------------- UI Icons, Toasts, Modals, Router ---------------- */
const ICONS = {
  home: '<path d="M3.5 10.5L12 3.5l8.5 7V20a1 1 0 0 1-1 1h-4.5v-6h-6v6H4.5a1 1 0 0 1-1-1z"/>',
  record: '<path d="M3 12h4l2.5-6.5 4.5 13 2.5-8 1.8 3.5H21"/>',
  list: '<path d="M8.5 6h12M8.5 12h12M8.5 18h12"/><circle cx="4" cy="6" r="1.3"/><circle cx="4" cy="12" r="1.3"/><circle cx="4" cy="18" r="1.3"/>',
  progress: '<path d="M5 20v-6M11 20V6M17 20v-10M3 20h18"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5H5a3 3 0 0 0 3 4.5M16 5h3a3 3 0 0 1-3 4.5"/><path d="M12 13v4M9 20.5h6M10.5 17h3"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
  moon: '<path d="M20 13.5A8.5 8.5 0 1 1 10.5 4a7 7 0 0 0 9.5 9.5z"/>',
  pause: '<path d="M9 5.5v13M15 5.5v13"/>',
  play: '<path d="M7.5 5.5l11 6.5-11 6.5z"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
  pencil: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1z"/>',
  trash: '<path d="M4.5 6.5h15M9 6V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V6M6.5 6.5l1 13a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l1-13"/><path d="M10 10.5v6M14 10.5v6"/>',
  download: '<path d="M12 4v11M7.5 11l4.5 4.5L16.5 11M4.5 19.5h15"/>',
  upload: '<path d="M12 15V4M7.5 8l4.5-4.5L16.5 8M4.5 19.5h15"/>',
  chevL: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  chevR: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  pin: '<path d="M12 21.5s7-6.2 7-11.5a7 7 0 1 0-14 0C5 15.3 12 21.5 12 21.5z"/><circle cx="12" cy="10" r="2.6"/>',
  zap: '<path d="M13 2.5L4.5 13.5H11l-1 8L18.5 10H12l1-7.5z"/>',
  flame: '<path d="M12 3.5c.5 3-1 4.6-2.6 6.1C7.8 11.1 7 12.6 7 14.5a5 5 0 0 0 10 0c0-1.5-.5-2.8-1.3-4-.4 1-1 1.8-2 2.3.4-3-1-6.6-1.7-9.3z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.5l3.5 2"/>',
  route: '<circle cx="5.5" cy="18.5" r="2.4"/><circle cx="18.5" cy="5.5" r="2.4"/><path d="M5.5 16v-2.5a4 4 0 0 1 4-4h5a4 4 0 0 0 4-4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11.2v4.8M12 8l.01.01"/>',
  alert: '<path d="M12 4L2.5 20h19L12 4z"/><path d="M12 10v4.5M12 17.3l.01.01"/>',
  gps: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5V6M12 18v3.5M2.5 12H6M18 12h3.5"/>',
  upTrend: '<path d="M7 17L17 7M9.5 7H17v7.5"/>',
  downTrend: '<path d="M7 7l10 10M17 9.5V17H9.5"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M4 10.5h16M8.5 3.5v4M15.5 3.5v4"/>',
  camera: '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.5-2h5L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.4" r="3.4"/>',
  fit: '<path d="M9 4.5H4.5V9M15 4.5h4.5V9M9 19.5H4.5V15M15 19.5h4.5V15"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8l1.2 2.3c.7.2 1.4.5 2.1.9l2.5-.7 1.7 3-1.4 2.2c.1.4.1 1.7 0 2.1l1.4 2.2-1.7 3-2.5-.7c-.6.4-1.4.7-2.1.9L12 21.2l-1.2-2.2c-.7-.2-1.5-.5-2.1-.9l-2.5.7-1.7-3 1.4-2.2c-.2-.5-.2-1.7 0-2.1L4.5 8.3l1.7-3 2.5.7c.7-.4 1.4-.7 2.1-.9z"/>',
  run: '<circle cx="15.5" cy="4.5" r="2"/><path d="M9.5 19.5l2.2-4.8 3.1 2.1 1.4 3.7"/><path d="M11.7 14.7l1.8-4.2-3.3-1.3-2.2 2.3"/><path d="M13.5 10.5l3.2 1.5 2.3-1.5"/>',
  walk: '<circle cx="12.5" cy="4.5" r="2"/><path d="M10 20l1.8-5.5 2.7 2.5 1.5 3"/><path d="M11.8 14.5l.7-5-2.8 1.5-1.2 2.5"/><path d="M12.5 9.5l2.8 2 2.2-.5"/>',
  cycle: '<circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M12 17V12l-3-2.5 4.5-2.5 2.5 3h3"/><circle cx="14.5" cy="4.5" r="1.5"/>',
  hike: '<path d="M3 19h18"/><path d="M4.5 19L10 9.5l3.2 5.3"/><path d="M11.2 13.8L14.5 8l5 11"/>',
  gym: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z"/>',
  mountain: '<path d="M3 18.5h18"/><path d="M4 18.5l5.6-9.4 3.1 5.2"/><path d="M10.6 14.2L14 8l6 10.5"/>',
  heart: '<path d="M12 20.5S3.5 15 3.5 9.2a4.7 4.7 0 0 1 8.5-2.8A4.7 4.7 0 0 1 20.5 9.2C20.5 15 12 20.5 12 20.5z"/>',
  database: '<ellipse cx="12" cy="5.5" rx="8" ry="2.8"/><path d="M4 5.5v13c0 1.6 3.6 2.8 8 2.8s8-1.2 8-2.8v-13"/><path d="M4 12c0 1.6 3.6 2.8 8 2.8s8-1.2 8-2.8"/>',
  volume: '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/>',
};
function icon(name, size) {
  const d = ICONS[name] || ICONS.star;
  return `<svg viewBox="0 0 24 24" width="${size || 24}" height="${size || 24}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}
function typeIcon(type) { return icon(type === 'custom' ? 'star' : type, 24); }

function toast(msg, type, ms) {
  type = type || 'info';
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = icon(type === 'ok' ? 'check' : type === 'err' ? 'alert' : 'info') + '<div>' + escapeHtml(msg) + '</div>';
  box.appendChild(el);
  setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 260); }, ms || 4200);
}

let _modalKeydown = null;
function closeModal() {
  const root = $('#modal-root');
  root.innerHTML = '';
  if (_modalKeydown) { document.removeEventListener('keydown', _modalKeydown); _modalKeydown = null; }
}
function openModal(opts) {
  const root = $('#modal-root');
  const actions = (opts.actions || []).map((a, i) =>
    `<button class="btn ${a.cls || 'btn-outline'}" data-mact="${i}">${a.icon ? icon(a.icon, 16) : ''}${escapeHtml(a.label)}</button>`).join('');
  root.innerHTML = `
    <div class="modal-backdrop" data-close="1">
      <div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div class="modal-title">${escapeHtml(opts.title || '')}</div>
          ${opts.noX ? '' : '<button class="btn-icon sm" data-close="1" aria-label="Close">' + icon('x', 15) + '</button>'}
        </div>
        <div class="modal-body">${opts.body || ''}</div>
        ${actions ? `<div class="modal-foot">${actions}</div>` : ''}
      </div>
    </div>`;
  root.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', e => {
    if (e.target === el || el.dataset.close === '1') { closeModal(); if (opts.onClose) opts.onClose(); }
  }));
  root.querySelectorAll('[data-mact]').forEach(el => el.addEventListener('click', () => {
    const a = (opts.actions || [])[+el.dataset.mact];
    if (a && a.onclick) a.onclick();
  }));
  if (_modalKeydown) document.removeEventListener('keydown', _modalKeydown);
  _modalKeydown = e => { if (e.key === 'Escape') { closeModal(); if (opts.onClose) opts.onClose(); } };
  document.addEventListener('keydown', _modalKeydown);
  const first = root.querySelector('input, select, textarea, button:not([data-close])');
  if (first && first.focus) setTimeout(() => first.focus(), 60);
  return closeModal;
}
function confirmDialog(opts) {
  return new Promise(res => {
    let done = false;
    const finish = v => { if (!done) { done = true; res(v); } };
    openModal({
      title: opts.title || 'Are you sure?',
      body: `<p class="muted" style="font-size:14px">${escapeHtml(opts.message || '')}</p>`,
      onClose: () => finish(false),
      actions: [
        { label: opts.cancel || 'Cancel', cls: 'btn-ghost', onclick: () => { finish(false); closeModal(); } },
        { label: opts.ok || 'Confirm', cls: opts.danger ? 'btn-danger' : 'btn-primary', onclick: () => { finish(true); closeModal(); } },
      ],
    });
  });
}

/* ---------------- Command Palette (⌘K / Ctrl+K) ---------------- */
const Cmd = {
  open: false,
  sel: 0,
  items: [],
  toggle() { this.open ? this.close() : this.show(); },
  show() {
    this.open = true;
    this.sel = 0;
    const root = $('#cmd-root');
    root.innerHTML = `
      <div class="cmd-backdrop" id="cmd-bg">
        <div class="cmd-box" role="dialog" aria-modal="true" aria-label="Command palette">
          <div class="cmd-top">
            ${icon('search', 18)}
            <input class="cmd-input" id="cmd-inp" placeholder="Jump to view, search activities, or run action…" autocomplete="off">
            <span class="kbd">ESC</span>
          </div>
          <div class="cmd-list" id="cmd-list"></div>
        </div>
      </div>`;
    $('#cmd-bg').addEventListener('click', e => { if (e.target.id === 'cmd-bg') this.close(); });
    const inp = $('#cmd-inp');
    inp.addEventListener('input', () => { this.sel = 0; this.renderList(inp.value); });
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); this.sel = (this.sel + 1) % Math.max(1, this.items.length); this.highlight(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.sel = (this.sel - 1 + Math.max(1, this.items.length)) % Math.max(1, this.items.length); this.highlight(); }
      else if (e.key === 'Enter' && this.items[this.sel]) { e.preventDefault(); const fn = this.items[this.sel].run; this.close(); fn(); }
      else if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    });
    this.renderList('');
    setTimeout(() => inp.focus(), 30);
  },
  close() {
    this.open = false;
    $('#cmd-root').innerHTML = '';
  },
  renderList(query) {
    const q = query.trim().toLowerCase();
    const u = App.settings.units;
    const all = [
      { group: 'Navigation', icon: 'home', label: 'Dashboard', meta: 'G D', run: () => go('dashboard') },
      { group: 'Navigation', icon: 'record', label: 'Record Activity (GPS)', meta: 'G R', run: () => go('record') },
      { group: 'Navigation', icon: 'list', label: 'Activities Log', meta: 'G A', run: () => go('activities') },
      { group: 'Navigation', icon: 'progress', label: 'Progress & Training Load (CTL/ATL)', meta: 'G P', run: () => go('progress') },
      { group: 'Navigation', icon: 'trophy', label: 'Personal Records', meta: 'G B', run: () => go('records') },
      { group: 'Navigation', icon: 'target', label: 'Goals & Milestones', meta: 'G G', run: () => go('goals') },
      { group: 'Navigation', icon: 'user', label: 'Profile & Settings', meta: 'G S', run: () => go('settings') },
      { group: 'Actions', icon: 'pencil', label: 'Log Manual Workout', meta: 'Action', run: () => openManualModal(null) },
      { group: 'Actions', icon: 'upload', label: 'Import GPX File', meta: 'Action', run: () => { go('record'); setTimeout(() => { const f = $('#gpx-file'); if (f) f.click(); }, 80); } },
      { group: 'Actions', icon: 'sun', label: 'Toggle Dark / Light Theme', meta: 'Theme', run: () => ACTIONS['theme-toggle']() },
      ...App.acts.slice(0, 12).map(a => ({
        group: 'Recent Activities',
        icon: a.type === 'custom' ? 'star' : a.type,
        label: a.title || typeLabel(a),
        meta: (a.distance ? fmtDist(a.distance, u) : fmtDur(a.duration)) + ' · ' + fmtDate(new Date(a.start)),
        run: () => go('activity/' + a.id),
      })),
    ];
    this.items = q ? all.filter(it => (it.label + ' ' + it.group + ' ' + it.meta).toLowerCase().includes(q)) : all;
    const listEl = $('#cmd-list');
    if (!this.items.length) {
      listEl.innerHTML = `<div class="dim small" style="padding:22px;text-align:center">No matching commands or activities</div>`;
      return;
    }
    let html = '', lastG = '';
    this.items.forEach((it, idx) => {
      if (it.group !== lastG) { html += `<div class="cmd-group">${it.group}</div>`; lastG = it.group; }
      html += `<div class="cmd-item ${idx === this.sel ? 'sel' : ''}" data-cidx="${idx}">
        ${icon(it.icon, 16)}<span>${escapeHtml(it.label)}</span><span class="cmd-meta">${escapeHtml(it.meta)}</span>
      </div>`;
    });
    listEl.innerHTML = html;
    listEl.querySelectorAll('[data-cidx]').forEach(el => el.addEventListener('click', () => {
      const fn = this.items[+el.dataset.cidx].run;
      this.close(); fn();
    }));
  },
  highlight() {
    $$('#cmd-list .cmd-item').forEach((el, i) => {
      el.classList.toggle('sel', i === this.sel);
      if (i === this.sel) el.scrollIntoView({ block: 'nearest' });
    });
  },
};
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    if (!$('#lockscreen').hidden) return;
    e.preventDefault();
    Cmd.toggle();
  }
});

/* ---------------- tooltips & theme ---------------- */
const tipEl = () => $('#tooltip');
function showTipXY(x, y, html) {
  const t = tipEl();
  t.innerHTML = html; t.classList.add('on');
  const r = t.getBoundingClientRect();
  let left = x - r.width / 2, top = y - r.height - 14;
  left = clamp(left, 8, window.innerWidth - r.width - 8);
  if (top < 8) top = y + 18;
  t.style.left = left + 'px'; t.style.top = top + 'px';
}
function hideTip() { tipEl().classList.remove('on'); }
document.addEventListener('mouseover', e => {
  const el = e.target.closest && e.target.closest('[data-tip]');
  if (el) {
    const r = el.getBoundingClientRect();
    showTipXY(r.left + r.width / 2, r.top, escapeHtml(el.dataset.tip));
  }
});
document.addEventListener('mouseout', e => {
  if (e.target.closest && e.target.closest('[data-tip]')) hideTip();
});
window.addEventListener('scroll', hideTip, { passive: true });

const themeRedraws = [];
function resolvedTheme() {
  const t = App.settings.theme;
  if (t === 'system') return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  return t;
}
function applyTheme() {
  document.documentElement.dataset.theme = resolvedTheme();
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = resolvedTheme() === 'light' ? '#F3F5F8' : '#090B0E';
  for (const fn of themeRedraws) { try { fn(); } catch (e) {} }
}
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  if (App.settings.theme === 'system') applyTheme();
});

const ACTIONS = {};
function regAction(name, fn) { ACTIONS[name] = fn; }
document.addEventListener('click', e => {
  const navEl = e.target.closest && e.target.closest('[data-nav]');
  if (navEl) {
    e.preventDefault();
    go(navEl.dataset.nav);
    return;
  }
  const el = e.target.closest && e.target.closest('[data-action]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el.dataset, el, e); }
});

/* ---------------- router ---------------- */
const VIEWS = {};
const NAV_ITEMS = [
  { route: 'dashboard', label: 'Dashboard', icon: 'home' },
  { route: 'record', label: 'Record Activity', icon: 'record' },
  { route: 'activities', label: 'Activities', icon: 'list' },
  { route: 'progress', label: 'Progress & Load', icon: 'progress' },
  { route: 'records', label: 'Personal Records', icon: 'trophy' },
  { route: 'goals', label: 'Goals', icon: 'target' },
  { route: 'settings', label: 'Settings', icon: 'user' },
];
const BOTTOM_NAV = [
  { route: 'dashboard', label: 'Home', icon: 'home' },
  { route: 'record', label: 'Record', icon: 'record' },
  { route: 'activities', label: 'Activities', icon: 'list' },
  { route: 'progress', label: 'Progress', icon: 'progress' },
  { route: 'settings', label: 'Profile', icon: 'user' },
];
let _currentRoute = { name: 'dashboard', param: '' };

function go(path) {
  const clean = String(path || 'dashboard').replace(/^#\/?/, '');
  const parts = clean.split('/');
  _currentRoute = { name: parts[0] || 'dashboard', param: decodeURIComponent(parts[1] || '') };
  try {
    if (location.hash !== '#/' + clean) location.hash = '#/' + clean;
  } catch (e) {}
  if (App.ready) renderCurrent();
}
function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  if (!h) return _currentRoute;
  const parts = h.split('/');
  return { name: parts[0] || 'dashboard', param: decodeURIComponent(parts[1] || '') };
}
function navActiveFor(name) {
  if (name === 'activity') return 'activities';
  if (name === 'records' || name === 'goals') return name;
  return NAV_ITEMS.some(n => n.route === name) ? name : 'dashboard';
}
function renderShellNav(active) {
  const isRec = typeof Recorder !== 'undefined' && Recorder.session;
  $('#sidenav').innerHTML = NAV_ITEMS.map(n => `
    <a class="nav-item ${n.route === active ? 'active' : ''}" href="#/${n.route}" data-nav="${n.route}">
      ${icon(n.icon, 19)}<span>${n.label}</span>
      ${n.route === 'record' && isRec ? '<span class="nbadge">REC</span>' : ''}
    </a>`).join('');
  const utilEl = $('#side-util');
  if (utilEl) {
    utilEl.innerHTML = `
      <button class="nav-item" data-action="theme-toggle">${icon(resolvedTheme() === 'light' ? 'moon' : 'sun', 19)}<span>${resolvedTheme() === 'light' ? 'Dark mode' : 'Light mode'}</span></button>
      ${App.settings.lock.enabled ? `<button class="nav-item" data-action="lock-now">${icon('lock', 19)}<span>Lock SOLO</span></button>` : ''}`;
  }
  $('#bottomnav').innerHTML = BOTTOM_NAV.map(n => {
    const cls = n.route === 'record' ? 'bn-item rec' : 'bn-item';
    return `<a class="${cls} ${n.route === active ? 'active' : ''}" href="#/${n.route}" data-nav="${n.route}" aria-label="${n.label}">
      ${icon(n.icon, 21)}<span>${n.label}</span></a>`;
  }).join('');
}
function renderTopbar(name, view) {
  const head = typeof view.head === 'function' ? view.head() : { title: view.title || '', sub: view.sub || '' };
  $('#topbar-title').textContent = head.title;
  $('#topbar-sub').textContent = head.sub || '';
  const showRec = name !== 'record';
  $('#topbar-actions').innerHTML = `
    <button class="btn-icon" data-action="open-cmd" aria-label="Search & Command" data-tip="Quick jump (⌘K)">${icon('search', 17)}</button>
    ${showRec ? `<button class="btn btn-primary" data-action="go-record">${icon('record', 16)}<span class="rec-label">Record</span></button>` : ''}
    <button class="btn-icon" data-action="theme-toggle" aria-label="Toggle theme" data-tip="Light / dark theme">${icon(resolvedTheme() === 'light' ? 'moon' : 'sun', 17)}</button>
    ${App.settings.lock.enabled ? `<button class="btn-icon" data-action="lock-now" aria-label="Lock" data-tip="Lock SOLO">${icon('lock', 17)}</button>` : ''}`;
}
function renderCurrent() {
  hideTip();
  const { name, param } = parseHash();
  _currentRoute = { name, param };
  const view = VIEWS[name] || VIEWS.dashboard;
  const active = navActiveFor(name);
  renderShellNav(active);
  renderTopbar(name, view);
  const v = $('#view');
  v.innerHTML = view.render(param);
  v.classList.remove('view-anim');
  void v.offsetWidth;
  v.classList.add('view-anim');
  if (view.mount) {
    try { view.mount(param); } catch (err) { console.error('View mount error:', err); }
  }
  window.scrollTo({ top: 0 });
  if (typeof Recorder !== 'undefined') Recorder.updateChip();
}
window.addEventListener('hashchange', () => {
  if (App.ready) renderCurrent();
});

function demoBannerHtml() {
  if (!App.hasDemo()) return '';
  return `<div class="demo-banner">
    <span>${icon('info', 16)} Demo dataset active — sample activities are clearly badged DEMO and include full HR/GPS telemetry.</span>
    <button class="btn btn-sm btn-lime" data-action="demo-remove">Remove demo data</button>
  </div>`;
}
function emptyState(art, title, text, btnAction, btnLabel) {
  return `<div class="empty">
    <div class="empty-art">${icon(art, 52)}</div>
    <div class="empty-title">${title}</div>
    <div class="empty-text">${text}</div>
    ${btnAction ? `<button class="btn btn-primary" data-action="${btnAction}">${btnLabel || 'Go'}</button>` : ''}
  </div>`;
}
function srcTag(a) {
  const lbl = a.source === 'gps' ? 'GPS' : a.source === 'import' ? 'Imported' : 'Manual';
  return `<span class="src-tag ${a.source}">${lbl}</span>`;
}
function demoChip(a) { return a.demo ? '<span class="chip chip-demo">DEMO</span>' : ''; }

regAction('open-cmd', () => Cmd.show());
regAction('go-record', () => go('record'));
regAction('go', d => go(d.to));
regAction('theme-toggle', () => {
  App.settings.theme = resolvedTheme() === 'light' ? 'dark' : 'light';
  saveSettings(); applyTheme();
  const cur = parseHash().name;
  renderShellNav(navActiveFor(cur));
  renderTopbar(cur, VIEWS[cur] || VIEWS.dashboard);
});

/* ---------------- Canvas Charts & Interactive RouteMap ---------------- */
function cssVar(name) {
  if (!name) return '';
  const clean = name.replace(/^var\((--[^)]+)\)$/, '$1');
  return getComputedStyle(document.documentElement).getPropertyValue(clean).trim();
}
function niceStep(range, targetCount) {
  const raw = range / Math.max(1, targetCount);
  const pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  for (const m of [1, 1.5, 2, 2.5, 5, 7.5, 10]) if (raw <= m * pow) return m * pow;
  return 10 * pow;
}
function hexLerp(c1, c2, t) {
  const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const a = p(c1), b = p(c2);
  return 'rgb(' + a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',') + ')';
}
function hexAlpha(hex, a) {
  const h = hex.replace('#', '');
  if (h.length < 6) return `rgba(255,90,31,${a})`;
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

function canvasCtx(cv) {
  const r = cv.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(10, r.width), h = Math.max(10, r.height);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function mountChart(cv, draw, hover, onLeave) {
  const redraw = () => draw();
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(throttle(redraw, 80));
    ro.observe(cv);
  }
  themeRedraws.push(redraw);
  if (hover) {
    cv.addEventListener('pointermove', hover);
    cv.addEventListener('pointerleave', () => { hideTip(); if (onLeave) onLeave(); draw(); });
  }
  draw();
  return redraw;
}

function lineChart(cv, o) {
  let H = { i: -1 };
  const draw = () => {
    const { ctx, w, h } = canvasCtx(cv);
    ctx.clearRect(0, 0, w, h);
    const padL = o.padL || 46, padR = o.padR == null ? 12 : o.padR, padT = 14, padB = 26;
    const iw = w - padL - padR, ih = h - padT - padB;
    if (iw < 20 || ih < 20) { H.i = -1; return; }
    const all = [];
    for (const s of o.series) for (const v of s.ys) if (isFinite(v)) all.push(v);
    if (!all.length) { chartEmpty(ctx, w, h, o.emptyMsg); H.i = -1; return; }
    let y0 = o.yMin != null ? o.yMin : Math.min(...all), y1 = o.yMax != null ? o.yMax : Math.max(...all);
    if (y1 === y0) { y1 += 1; y0 -= 1; }
    if (o.yMin == null) y0 -= (y1 - y0) * 0.08;
    if (o.yMax == null) y1 += (y1 - y0) * 0.08;
    const n = o.xs.length;
    const X = i => n <= 1 ? padL + iw / 2 : padL + (i / (n - 1)) * iw;
    const Y = v => padT + ih - ((v - y0) / (y1 - y0)) * ih;

    ctx.font = '11px ' + cssVar('--font-ui');
    ctx.fillStyle = cssVar('--text-3');
    ctx.strokeStyle = cssVar('--grid');
    ctx.lineWidth = 1;
    const step = niceStep(y1 - y0, 4);
    for (let v = Math.ceil(y0 / step) * step; v <= y1 + 1e-9; v += step) {
      const y = Y(v);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(o.yFmt ? o.yFmt(v) : String(Math.round(v)), padL - 7, y);
    }
    if (y0 < 0 && y1 > 0) {
      ctx.strokeStyle = cssVar('--border-2');
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(padL, Y(0)); ctx.lineTo(w - padR, Y(0)); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const tickN = Math.min(n, Math.max(2, Math.floor(iw / 62)));
    const seen = new Set();
    for (let t = 0; t < tickN; t++) {
      const i = Math.round((t / (tickN - 1)) * (n - 1));
      if (seen.has(i)) continue; seen.add(i);
      const lbl = o.xTick ? o.xTick(i) : String(o.xs[i]);
      if (lbl != null) ctx.fillText(lbl, X(i), h - padB + 7);
    }
    for (const s of o.series) {
      const ys = s.ys;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < n; i++) {
        const v = ys[i];
        if (!isFinite(v)) { started = false; continue; }
        if (!started) { ctx.moveTo(X(i), Y(v)); started = true; }
        else ctx.lineTo(X(i), Y(v));
      }
      if (s.fill) {
        const grad = ctx.createLinearGradient(0, padT, 0, padT + ih);
        grad.addColorStop(0, hexAlpha(s.color, 0.28));
        grad.addColorStop(1, hexAlpha(s.color, 0.0));
        ctx.save();
        ctx.lineTo(X(n - 1), padT + ih); ctx.lineTo(X(0), padT + ih); ctx.closePath();
        ctx.fillStyle = grad; ctx.fill();
        ctx.restore();
        ctx.beginPath();
        started = false;
        for (let i = 0; i < n; i++) {
          const v = ys[i];
          if (!isFinite(v)) { started = false; continue; }
          if (!started) { ctx.moveTo(X(i), Y(v)); started = true; }
          else ctx.lineTo(X(i), Y(v));
        }
      }
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width || 2.3;
      ctx.setLineDash(s.dash || []);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (H.i >= 0 && H.i < n) {
      const x = X(H.i);
      ctx.strokeStyle = cssVar('--border-2');
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ih); ctx.stroke();
      for (const s of o.series) {
        const v = s.ys[H.i];
        if (!isFinite(v)) continue;
        ctx.beginPath(); ctx.arc(x, Y(v), 4.2, 0, 7);
        ctx.fillStyle = s.color; ctx.fill();
        ctx.strokeStyle = cssVar('--card'); ctx.lineWidth = 2; ctx.stroke();
      }
    }
    cv._n = n;
  };
  const hover = e => {
    const n = cv._n; if (!n) return;
    const r = cv.getBoundingClientRect();
    const padL = o.padL || 46, padR = o.padR == null ? 12 : o.padR;
    const iw = r.width - padL - padR;
    const i = clamp(Math.round(((e.clientX - r.left - padL) / (iw || 1)) * (n - 1)), 0, n - 1);
    if (i !== H.i) { H.i = i; draw(); if (o.onHover) o.onHover(i); }
    if (o.tip) showTipXY(e.clientX, e.clientY - 8, o.tip(i));
  };
  return mountChart(cv, draw, o.tip ? hover : null, () => { H.i = -1; if (o.onHover) o.onHover(-1); });
}
function chartEmpty(ctx, w, h, msg) {
  ctx.fillStyle = cssVar('--text-3');
  ctx.font = '13px ' + cssVar('--font-ui');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(msg || 'No data yet', w / 2, h / 2);
}

function barChart(cv, o) {
  let H = { i: -1 };
  const draw = () => {
    const { ctx, w, h } = canvasCtx(cv);
    ctx.clearRect(0, 0, w, h);
    const padL = o.padL || 42, padR = 10, padT = 12, padB = 26;
    const iw = w - padL - padR, ih = h - padT - padB;
    if (iw < 20 || ih < 20) return;
    const vals = o.values;
    const n = vals.length;
    if (!n || !vals.some(isFinite)) { chartEmpty(ctx, w, h, o.emptyMsg); return; }
    let y1 = o.yMax != null ? o.yMax : Math.max(...vals.filter(isFinite), 0);
    if (y1 <= 0) y1 = 1;
    const Y = v => padT + ih - (v / y1) * ih;
    ctx.font = '11px ' + cssVar('--font-ui');
    const step = niceStep(y1, 4);
    ctx.strokeStyle = cssVar('--grid'); ctx.lineWidth = 1;
    for (let v = 0; v <= y1 + 1e-9; v += step) {
      const y = Y(v);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.fillStyle = cssVar('--text-3');
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(o.yFmt ? o.yFmt(v) : String(Math.round(v * 10) / 10), padL - 7, y);
    }
    const bw = Math.max(3, Math.min(46, (iw / n) * 0.62));
    const X = i => padL + (i + 0.5) * (iw / n);
    for (let i = 0; i < n; i++) {
      const v = vals[i];
      if (!isFinite(v) || v <= 0) continue;
      const x = X(i), y = Y(v);
      ctx.fillStyle = (o.colors && o.colors[i]) || cssVar('--accent');
      const r = Math.min(bw / 2, 5);
      roundRect(ctx, x - bw / 2, y, bw, padT + ih - y, r);
      ctx.fill();
    }
    ctx.fillStyle = cssVar('--text-3');
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const tickN = Math.min(n, Math.max(2, Math.floor(iw / 44)));
    const seen = new Set();
    for (let t = 0; t < tickN; t++) {
      const i = Math.round((t / (tickN - 1)) * (n - 1));
      if (seen.has(i) || !o.labels[i]) continue; seen.add(i);
      ctx.fillText(o.labels[i], X(i), h - padB + 7);
    }
    cv._n = n;
  };
  const hover = e => {
    const n = cv._n; if (!n) return;
    const r = cv.getBoundingClientRect();
    const padL = o.padL || 42, padR = 10;
    const iw = r.width - padL - padR;
    const i = clamp(Math.floor(((e.clientX - r.left - padL) / (iw || 1)) * n), 0, n - 1);
    if (i !== H.i) { H.i = i; draw(); }
    if (o.tip) showTipXY(e.clientX, e.clientY - 8, o.tip(i));
  };
  return mountChart(cv, draw, o.tip ? hover : null);
}
function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, h / 2, w / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function sparkline(cv, o) {
  const draw = () => {
    const { ctx, w, h } = canvasCtx(cv);
    ctx.clearRect(0, 0, w, h);
    const ys = o.ys;
    if (!ys.length || !ys.some(isFinite)) { chartEmpty(ctx, w, h, o.emptyMsg || ' '); return; }
    const vmin = Math.min(...ys.filter(isFinite)), vmax = Math.max(...ys.filter(isFinite));
    const pad = 6;
    const span = (vmax - vmin) || 1;
    const X = i => (i / Math.max(1, ys.length - 1)) * (w - 2 * pad) + pad;
    const Y = v => pad + (1 - (v - vmin) / span) * (h - 2 * pad);
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < ys.length; i++) {
      if (!isFinite(ys[i])) continue;
      if (!started) { ctx.moveTo(X(i), Y(ys[i])); started = true; }
      else ctx.lineTo(X(i), Y(ys[i]));
    }
    ctx.strokeStyle = o.color || cssVar('--accent');
    ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineTo(X(ys.length - 1), h); ctx.lineTo(X(0), h); ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, hexAlpha(o.color || '#FF5A1F', 0.25));
    grad.addColorStop(1, hexAlpha(o.color || '#FF5A1F', 0));
    ctx.fillStyle = grad; ctx.fill();
  };
  return mountChart(cv, draw, null);
}

function heatGrid(cv, o) {
  const draw = () => {
    const { ctx, w, h } = canvasCtx(cv);
    ctx.clearRect(0, 0, w, h);
    if (!o.days.length) { chartEmpty(ctx, w, h, 'No data yet'); return; }
    const cell = 13, gap = 3.4;
    const rows = 7;
    const labelW = 26, topPad = 16;
    const weeks = Math.floor((w - labelW) / (cell + gap));
    const days = o.days.slice(-weeks * 7);
    const x0 = labelW, y0 = topPad;
    ctx.font = '10px ' + cssVar('--font-ui');
    ctx.fillStyle = cssVar('--text-3');
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const rowLabels = App.settings.weekStart === 1 ? ['', 'M', '', 'W', '', 'F', ''] : ['S', '', 'T', '', 'T', '', 'S'];
    for (let r = 0; r < rows; r++) {
      if (rowLabels[r]) ctx.fillText(rowLabels[r], x0 - 6, y0 + r * (cell + gap) + cell / 2);
    }
    let lastMonth = -1;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    for (let i = 0; i < days.length; i++) {
      const col = Math.floor(i / 7), row = i % 7;
      const d = days[i];
      const x = x0 + col * (cell + gap), y = y0 + row * (cell + gap);
      if (d.date.getMonth() !== lastMonth) {
        lastMonth = d.date.getMonth();
        if (col > 0) ctx.fillText(MON_NAMES[d.date.getMonth()], x - 1, y0 - 5);
      }
      ctx.fillStyle = o.colorFor(d.value);
      roundRect(ctx, x, y, cell, cell, 3.2);
      ctx.fill();
    }
    cv._days = days; cv._geom = { x0, y0, cell, gap, weeks };
  };
  const hover = e => {
    const g = cv._geom; if (!g) return;
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const col = Math.floor((x - g.x0) / (g.cell + g.gap));
    const row = Math.floor((y - g.y0) / (g.cell + g.gap));
    if (col < 0 || row < 0 || row > 6 || col >= g.weeks) { hideTip(); return; }
    const i = col * 7 + row;
    const d = cv._days[i];
    if (!d) { hideTip(); return; }
    showTipXY(e.clientX, e.clientY - 8, o.tip(d));
  };
  return mountChart(cv, draw, hover);
}

const RM_STOPS = ['#5B8CFF', '#C8F542', '#FF5A1F'];
class RouteMap {
  constructor(host, opts = {}) {
    this.host = host;
    this.o = Object.assign({ colorBy: 'pace', showKm: true, interactive: true, follow: false, padding: 42, lineW: 4.5, tip: null, useTiles: true }, opts);
    this.pts = [];
    this.proj = [];
    this.cum = [];
    this.speeds = [];
    this.k = 1; this.tx = 0; this.ty = 0;
    this.userMoved = false;
    this.pointers = new Map();
    this.hoverI = -1;
    this.livePos = { la: 30.9010, ln: 75.8573, ac: 24, locked: false };
    this.origin = { la: 30.9010, ln: 75.8573 };
    this.tileCache = new Map();
    this.tilesFailed = 0;
    this.providerIdx = 0;

    this.cv = document.createElement('canvas');
    this.ctx = this.cv.getContext('2d');
    this.host.innerHTML = '';
    this.host.appendChild(this.cv);

    this._draw = () => this.draw();
    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(throttle(() => {
        if (!this.userMoved) this.fit();
        this._draw();
      }, 80));
      this._ro.observe(host);
    }
    themeRedraws.push(this._draw);
    this._bind();
    requestAnimationFrame(() => { this.fit(); this.draw(); });
  }
  toggleTiles() {
    this.o.useTiles = !this.o.useTiles;
    this.tilesFailed = 0;
    this.draw();
  }
  cycleProvider() {
    this.providerIdx = (this.providerIdx + 1) % 4;
    this.tileCache.clear();
    this.tilesFailed = 0;
    this.draw();
  }
  setLiveLocation(la, ln, ac, center) {
    this.livePos = { la, ln, ac: ac || 20, locked: true };
    if (!this.pts.length) {
      this.origin = { la, ln };
      if (center || !this.userMoved) {
        this.k = 1.4;
        const r = this.cv.getBoundingClientRect();
        this.tx = (r.width || 600) / 2;
        this.ty = (r.height || 240) / 2;
      }
    }
    this.draw();
  }
  setHighlightIndex(idx) {
    if (this.hoverI === idx) return;
    this.hoverI = idx;
    this.draw();
  }
  setPoints(pts, refit) {
    this.pts = pts || [];
    this._project();
    if (refit || !this.userMoved) { if (this.o.follow && !this.userMoved) this._follow(); else this.fit(); }
    else if (this.o.follow && !this.userMoved) this._follow();
    this.draw();
  }
  _project() {
    const pts = this.pts;
    if (!pts.length) { this.proj = []; this.cum = []; this.speeds = []; return; }
    const midLa = pts.reduce((s, p) => s + p.la, 0) / pts.length;
    const midLn = pts.reduce((s, p) => s + p.ln, 0) / pts.length;
    this.origin = { la: midLa, ln: midLn };
    const cosL = Math.cos(toRad(midLa));
    this.proj = pts.map(p => [(p.ln - midLn) * 111320 * cosL, (p.la - midLa) * 110540]);
    this.cum = [0];
    this.speeds = [0];
    for (let i = 1; i < pts.length; i++) {
      const s = segValid(pts[i - 1], pts[i], App.settings.accFilter);
      if (s) { this.cum.push(this.cum[i - 1] + s.d); this.speeds.push(s.d / s.dt); }
      else { this.cum.push(this.cum[i - 1]); this.speeds.push(0); }
    }
  }
  fit() {
    const r = this.cv.getBoundingClientRect();
    const w = r.width || 600, h = r.height || 260;
    if (!this.proj.length) { this.k = 1.15; this.tx = w / 2; this.ty = h / 2; return; }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of this.proj) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    const p = this.o.padding;
    const spanX = Math.max(40, x1 - x0), spanY = Math.max(40, y1 - y0);
    this.k = clamp(Math.min((w - 2 * p) / spanX, (h - 2 * p) / spanY), 0.02, 400);
    this.tx = w / 2 - ((x0 + x1) / 2) * this.k;
    this.ty = h / 2 + ((y0 + y1) / 2) * this.k;
  }
  _follow() {
    const r = this.cv.getBoundingClientRect();
    if (!this.proj.length) return;
    const last = this.proj[this.proj.length - 1];
    this.tx = (r.width || 600) / 2 - last[0] * this.k;
    this.ty = (r.height || 260) / 2 + last[1] * this.k;
  }
  sx(i) { return this.proj[i][0] * this.k + this.tx; }
  sy(i) { return this.ty - this.proj[i][1] * this.k; }
  zoomAt(factor, cx, cy) {
    const k2 = clamp(this.k * factor, 0.02, 400);
    const f = k2 / this.k;
    this.tx = cx - (cx - this.tx) * f;
    this.ty = cy - (cy - this.ty) * f;
    this.k = k2;
    this.userMoved = true;
    this.draw();
  }
  _bind() {
    const cv = this.cv;
    cv.addEventListener('pointerdown', e => {
      if (!this.o.interactive) return;
      cv.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    });
    cv.addEventListener('pointermove', e => {
      if (!this.o.interactive) return;
      if (this.pointers.has(e.pointerId)) {
        const prev = this.pointers.get(e.pointerId);
        this.tx += e.clientX - prev.x;
        this.ty += e.clientY - prev.y;
        this.userMoved = true;
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        this.draw();
        return;
      }
      const r = cv.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      let best = -1, bd = 22 * 22;
      for (let i = 0; i < this.pts.length; i++) {
        const dx = this.sx(i) - mx, dy = this.sy(i) - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < bd) { bd = d2; best = i; }
      }
      this.hoverI = best;
      this.draw();
      if (best >= 0) {
        const html = this.o.tip ? this.o.tip(best, this.pts[best]) : `<div class="tt-t">${fmtDist(this.cum[best], App.settings.units)}</div>`;
        showTipXY(e.clientX, e.clientY - 10, html);
      } else hideTip();
    });
    const up = e => this.pointers.delete(e.pointerId);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { this.hoverI = -1; hideTip(); this.draw(); });
    cv.addEventListener('wheel', e => {
      if (!this.o.interactive) return;
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      this.zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
  }
  _drawVectorTerrain(ctx, w, h) {
    const isLight = resolvedTheme() === 'light';
    ctx.fillStyle = isLight ? '#EBF0F5' : '#0B0F15';
    ctx.fillRect(0, 0, w, h);

    /* Organic park & water blocks in world coordinates so they pan & zoom naturally */
    const parkCol = isLight ? 'rgba(34, 197, 94, 0.12)' : 'rgba(53, 208, 186, 0.07)';
    const waterCol = isLight ? 'rgba(56, 189, 248, 0.18)' : 'rgba(56, 189, 248, 0.09)';
    const block = 480;
    const minBx = Math.floor((-this.tx / this.k) / block) - 1;
    const maxBx = Math.ceil(((w - this.tx) / this.k) / block) + 1;
    const minBy = Math.floor(((this.ty - h) / this.k) / block) - 1;
    const maxBy = Math.ceil((this.ty / this.k) / block) + 1;

    for (let bx = minBx; bx <= maxBx; bx++) {
      for (let by = minBy; by <= maxBy; by++) {
        const hash = Math.abs(Math.sin(bx * 12.9898 + by * 78.233) * 43758.5453) % 1;
        const sx = bx * block * this.k + this.tx;
        const sy = this.ty - (by + 1) * block * this.k;
        const sw = block * this.k;
        if (hash < 0.24) {
          ctx.fillStyle = parkCol;
          roundRect(ctx, sx + sw * 0.08, sy + sw * 0.08, sw * 0.84, sw * 0.84, 14);
          ctx.fill();
        } else if (hash > 0.84) {
          ctx.fillStyle = waterCol;
          roundRect(ctx, sx + sw * 0.05, sy + sw * 0.15, sw * 0.9, sw * 0.7, 18);
          ctx.fill();
        }
      }
    }

    /* Minor & Arterial Street Grid */
    const stepM = [25, 50, 100, 250, 500, 1000, 2500, 5000].find(s => s * this.k > 52) || 10000;
    for (let wx = Math.floor((-this.tx / this.k) / stepM) * stepM; wx <= ((w - this.tx) / this.k); wx += stepM) {
      const x = wx * this.k + this.tx;
      const major = Math.round(wx / stepM) % 4 === 0;
      ctx.strokeStyle = major ? (isLight ? 'rgba(15,23,42,0.14)' : 'rgba(255,255,255,0.11)') : cssVar('--grid');
      ctx.lineWidth = major ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let wy = Math.floor(((this.ty - h) / this.k) / stepM) * stepM; wy <= (this.ty / this.k); wy += stepM) {
      const y = this.ty - wy * this.k;
      const major = Math.round(wy / stepM) % 4 === 0;
      ctx.strokeStyle = major ? (isLight ? 'rgba(15,23,42,0.14)' : 'rgba(255,255,255,0.11)') : cssVar('--grid');
      ctx.lineWidth = major ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }
  _drawOsmTiles(ctx, w, h) {
    if (!this.o.useTiles) return;
    const cosL = Math.cos(toRad(this.origin.la));
    const mpp = 1 / Math.max(0.01, this.k);
    const isDark = resolvedTheme() !== 'light';
    const providers = [
      (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
      (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
      (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`,
      (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`,
    ];
    const pIdx = this.providerIdx % providers.length;
    const maxZ = pIdx === 1 ? 18 : 19;
    const zoom = clamp(Math.round(Math.log2((156543.03392 * cosL) / mpp)), 2, maxZ);
    const nTiles = Math.pow(2, zoom);
    const latRad = toRad(this.origin.la);
    const cxTile = ((this.origin.ln + 180) / 360) * nTiles;
    const cyTile = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * nTiles;
    const tileMeters = (40075016.686 * cosL) / nTiles;
    const tilePx = tileMeters * this.k;
    if (tilePx < 40 || tilePx > 1200) return;

    const minTx = Math.floor(cxTile - this.tx / tilePx) - 1;
    const maxTx = Math.ceil(cxTile + (w - this.tx) / tilePx) + 1;
    const minTy = Math.floor(cyTile - this.ty / tilePx) - 1;
    const maxTy = Math.ceil(cyTile + (h - this.ty) / tilePx) + 1;

    for (let tx = minTx; tx <= maxTx; tx++) {
      for (let ty = minTy; ty <= maxTy; ty++) {
        if (ty < 0 || ty >= nTiles) continue;
        const wx = ((tx % nTiles) + nTiles) % nTiles;
        const key = `p${pIdx}_${isDark ? 'd' : 'l'}/${zoom}/${wx}/${ty}`;
        let img = this.tileCache.get(key);
        if (!img) {
          img = new Image();
          img.onload = () => this.draw();
          img.onerror = () => {
            img._err = true;
            this.tilesFailed++;
            if (this.tilesFailed > 8 && this.providerIdx < providers.length - 1) {
              this.providerIdx++;
              this.tilesFailed = 0;
              this.draw();
            }
          };
          img.src = providers[pIdx](zoom, wx, ty);
          this.tileCache.set(key, img);
        }
        if (img.complete && !img._err && img.naturalWidth > 0) {
          const dx = this.tx + (tx - cxTile) * tilePx;
          const dy = this.ty + (ty - cyTile) * tilePx;
          if (pIdx === 0 && isDark) {
            ctx.filter = 'brightness(0.72) invert(0.88) contrast(1.15) hue-rotate(185deg) saturate(0.85)';
          } else {
            ctx.filter = 'none';
          }
          ctx.drawImage(img, dx, dy, tilePx + 0.6, tilePx + 0.6);
          ctx.filter = 'none';
        }
      }
    }
  }
  draw() {
    const { ctx, w, h } = canvasCtx(this.cv);
    ctx.clearRect(0, 0, w, h);
    this._drawVectorTerrain(ctx, w, h);
    this._drawOsmTiles(ctx, w, h);

    const n = this.pts.length;
    if (n === 0) {
      /* Pre-recording Live GPS Beacon & Coordinate HUD */
      const cx = this.tx, cy = this.ty;
      const radPx = clamp((this.livePos.ac || 25) * this.k, 18, 72);
      ctx.beginPath(); ctx.arc(cx, cy, radPx, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 90, 31, 0.14)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255, 90, 31, 0.45)'; ctx.lineWidth = 1.5; ctx.stroke();

      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#FF5A1F'; ctx.fill();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5; ctx.stroke();

      /* Coordinate HUD Pill */
      const pNames = ['OPENSTREETMAP', 'SATELLITE', 'TOPOGRAPHIC', 'STREET MAP'];
      const coordTxt = `${this.livePos.la.toFixed(4)}° N, ${this.livePos.ln.toFixed(4)}° E · ${this.o.useTiles ? (pNames[this.providerIdx] || 'TILES') : 'VECTOR GRID'}`;
      ctx.font = '600 10.5px ' + cssVar('--font-mono');
      const tw = ctx.measureText(coordTxt).width + 20;
      ctx.fillStyle = hexAlpha('#090B0E', 0.78);
      roundRect(ctx, 12, 12, tw, 24, 8);
      ctx.fill();
      ctx.fillStyle = '#E2E8F0';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(coordTxt, 22, 24.5);
      return;
    }

    const typeCol = cssVar(typeColor({ type: this.o.type || 'run' }));
    let fastP = null, slowP = null;
    if (this.o.colorBy === 'pace') {
      const ss = this.speeds.filter(v => v > 0.1).sort((a, b) => a - b);
      if (ss.length > 6) { slowP = percentile(ss, 0.2); fastP = percentile(ss, 0.8); }
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = hexAlpha(resolvedTheme() === 'light' ? '#10141B' : '#000000', 0.36);
    ctx.lineWidth = this.o.lineW + 2.8;
    ctx.beginPath();
    ctx.moveTo(this.sx(0), this.sy(0));
    for (let i = 1; i < n; i++) ctx.lineTo(this.sx(i), this.sy(i));
    ctx.stroke();

    const chunk = 24;
    for (let s = 0; s < n - 1; s += chunk) {
      const e = Math.min(s + chunk, n - 1);
      ctx.beginPath();
      ctx.moveTo(this.sx(s), this.sy(s));
      for (let i = s + 1; i <= e; i++) ctx.lineTo(this.sx(i), this.sy(i));
      if (this.o.colorBy === 'pace' && slowP != null) {
        const v = avg(this.speeds.slice(s + 1, e + 1)) || 0;
        const t = clamp((v - slowP) / ((fastP - slowP) || 1), 0, 1);
        ctx.strokeStyle = t < 0.5 ? hexLerp(RM_STOPS[0], RM_STOPS[1], t * 2) : hexLerp(RM_STOPS[1], RM_STOPS[2], (t - 0.5) * 2);
      } else ctx.strokeStyle = typeCol;
      ctx.lineWidth = this.o.lineW;
      ctx.stroke();
    }
    if (this.o.showKm && this.o.unitM) {
      const unitM = this.o.unitM;
      let nextKm = unitM, shown = 0;
      ctx.font = '700 9px ' + cssVar('--font-ui');
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 1; i < n && shown < 200; i++) {
        if (this.cum[i] >= nextKm) {
          const x = this.sx(i), y = this.sy(i);
          ctx.beginPath(); ctx.arc(x, y, 6.5, 0, 7);
          ctx.fillStyle = cssVar('--card'); ctx.fill();
          ctx.strokeStyle = cssVar('--border-2'); ctx.lineWidth = 1.2; ctx.stroke();
          ctx.fillStyle = cssVar('--text');
          ctx.fillText(String(Math.round(nextKm / unitM)), x, y + 0.5);
          nextKm += unitM; shown++;
        }
      }
    }
    const pin = (i, color, ring) => {
      const x = this.sx(i), y = this.sy(i);
      ctx.beginPath(); ctx.arc(x, y, 5.5, 0, 7);
      ctx.fillStyle = color; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 8.5, 0, 7);
      ctx.strokeStyle = ring; ctx.lineWidth = 2; ctx.stroke();
    };
    pin(0, '#3ECF8E', cssVar('--card'));
    pin(n - 1, cssVar('--accent'), cssVar('--card'));
    if (this.hoverI >= 0 && this.hoverI < n) {
      const x = this.sx(this.hoverI), y = this.sy(this.hoverI);
      ctx.beginPath(); ctx.arc(x, y, 6.5, 0, 7);
      ctx.fillStyle = cssVar('--card'); ctx.fill();
      ctx.strokeStyle = cssVar('--accent'); ctx.lineWidth = 3; ctx.stroke();
    }
    const barM = [50, 100, 250, 500, 1000, 2500, 5000, 10000].find(m => m * this.k > 44) || 25000;
    const barPx = barM * this.k;
    const bx = 14, by = h - 38;
    ctx.strokeStyle = cssVar('--text-2'); ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by); ctx.lineTo(bx + barPx, by); ctx.lineTo(bx + barPx, by - 4);
    ctx.stroke();
    ctx.fillStyle = cssVar('--text-2');
    ctx.font = '10px ' + cssVar('--font-ui');
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(fmtDist(barM, App.settings.units), bx + barPx / 2, by - 3);
  }
  destroy() {
    if (this._ro) this._ro.disconnect();
    const i = themeRedraws.indexOf(this._draw);
    if (i >= 0) themeRedraws.splice(i, 1);
  }
}

function mapControlsHtml(extra) {
  return `<div class="map-ctl">
    <button class="btn-icon" data-action="map-zoom" data-z="1.45" aria-label="Zoom in" data-tip="Zoom in">${icon('plus', 15)}</button>
    <button class="btn-icon" data-action="map-zoom" data-z="0.69" aria-label="Zoom out" data-tip="Zoom out">${icon('minus', 15)}</button>
    <button class="btn-icon" data-action="map-fit" aria-label="Fit route" data-tip="Center / fit">${icon('fit', 15)}</button>
    <button class="btn-icon" data-action="map-layer" aria-label="Switch map layer" data-tip="Switch Basemap / Satellite / Vector">${icon('pin', 15)}</button>
    ${extra || ''}
  </div>`;
}
regAction('map-zoom', d => {
  const map = RouteMap._last;
  if (map) { const r = map.host.getBoundingClientRect(); map.zoomAt(+d.z, r.width / 2, r.height / 2); }
});
regAction('map-fit', () => {
  const map = RouteMap._last;
  if (map) { map.userMoved = false; map.fit(); map.draw(); }
});
regAction('map-layer', () => {
  const map = RouteMap._last;
  if (!map) return;
  const names = ['OpenStreetMap', 'Satellite Imagery', 'Topographic Map', 'Street Map'];
  if (!map.o.useTiles) {
    map.o.useTiles = true;
    map.providerIdx = 0;
    map.tilesFailed = 0;
    map.draw();
    toast('Layer: ' + names[0], 'info', 2000);
  } else if (map.providerIdx < names.length - 1) {
    map.cycleProvider();
    toast('Layer: ' + (names[map.providerIdx] || 'Basemap'), 'info', 2000);
  } else {
    map.o.useTiles = false;
    map.draw();
    toast('Layer: Offline Vector Terrain', 'info', 2000);
  }
});
regAction('map-locate', () => {
  if (!navigator.geolocation) return toast('Geolocation unavailable in this browser.', 'err');
  if (location.protocol === 'file:') {
    toast('Note: Browser geolocation is blocked on file:// URLs. Please run a local HTTP server.', 'warn', 5500);
  }
  toast('Acquiring live GPS fix…', 'info', 2200);
  navigator.geolocation.getCurrentPosition(
    pos => {
      const map = RouteMap._last;
      if (map) {
        map.userMoved = false;
        map.setLiveLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, true);
      }
      const badge = $('#pre-gps-badge');
      if (badge) badge.textContent = `Live GPS locked · ±${Math.round(pos.coords.accuracy)} m accuracy`;
    },
    err => {
      const isFile = location.protocol === 'file:';
      const msg = isFile
        ? 'Location blocked on file:// URL. Please run via local server (http://localhost:8000).'
        : 'Location check failed: ' + err.message;
      toast(msg, 'err', 5000);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

/* ---------------- GPS Recorder ---------------- */
const Recorder = {
  state: 'idle',
  type: 'run',
  customName: '',
  session: null,
  watchId: null,
  lastErr: null,
  _timer: null,
  _wakeLock: null,
  _lastPersistN: 0,
  _lastSpokenSplit: 0,
  map: null,

  get active() { return !!this.session && this.state !== 'saving'; },

  speak(text) {
    if (!App.settings.voiceCues || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.04;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  },
  async requestWakeLock() {
    try { if ('wakeLock' in navigator) this._wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
  },
  releaseWakeLock() {
    try { if (this._wakeLock) { this._wakeLock.release(); this._wakeLock = null; } } catch (e) {}
  },
  async start(type, customName) {
    if (this.active) { go('record'); return; }
    if (!navigator.geolocation || !navigator.geolocation.watchPosition) {
      this.lastErr = { code: -1, message: 'Geolocation is not supported by this browser.' };
      App.refreshView();
      return;
    }
    this.type = type || 'run';
    this.customName = customName || '';
    this.session = {
      id: uid(), type: this.type, customName: this.customName,
      startedAt: Date.now(), points: [], pausedSec: 0, pausedAt: null, autoSince: null, title: '',
    };
    this.lastErr = null;
    this.state = 'requesting';
    this._lastPersistN = 0;
    this._lastSpokenSplit = 0;
    App.refreshView();
    this.requestWakeLock();
    this.speak('Starting ' + typeLabel(this.session));
    this.watchId = navigator.geolocation.watchPosition(
      p => this._onFix(p), e => this._onErr(e),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 25000 });
    this._timer = setInterval(() => this._tick(), 1000);
  },
  _onFix(pos) {
    const s = this.session; if (!s) return;
    const c = pos.coords;
    const t = pos.timestamp || Date.now();
    if (this.state === 'requesting') { this.state = 'recording'; s.startedAt = t; }
    const paused = this.state === 'paused' || this.state === 'auto';
    const pt = {
      la: c.latitude, ln: c.longitude, t,
      el: (c.altitude != null && isFinite(c.altitude)) ? c.altitude : null,
      ac: c.accuracy != null ? c.accuracy : null,
      v: (c.speed != null && isFinite(c.speed)) ? c.speed : null,
      p: paused,
    };
    const last = s.points[s.points.length - 1];
    if (!last || Math.abs(t - last.t) > 900 || hav(last, pt) > 2) s.points.push(pt);
    this.lastErr = null;
    if (App.settings.autoPause && this.state !== 'paused') {
      const speed = pt.v != null ? pt.v : this._recentSpeed();
      const th = this.type === 'cycle' ? { stop: 0.9, go: 1.8 } : { stop: 0.5, go: 0.9 };
      if (this.state === 'recording' && speed != null && speed < th.stop) {
        if (s.autoSince == null) s.autoSince = t;
        else if (t - s.autoSince > 25000) { this.state = 'auto'; s.autoSince = t; this.speak('Auto paused'); this._uiState(); }
      } else if (this.state === 'auto' && (speed == null || speed > th.go)) {
        if (s.autoSince != null) s.pausedSec += Math.max(0, t - s.autoSince);
        s.autoSince = null; this.state = 'recording'; this.speak('Resumed'); this._uiState();
      } else if (this.state === 'recording' && speed != null && speed >= th.stop) s.autoSince = null;
    }
    if (s.points.length - this._lastPersistN >= 10) this.persistSession();
    this._updateLive();
  },
  _recentSpeed() {
    const pts = this.session ? this.session.points : [];
    if (pts.length < 2) return null;
    const i = Math.max(0, pts.length - 6);
    const a = pts[i], b = pts[pts.length - 1];
    const dt = (b.t - a.t) / 1000;
    return dt > 0 ? hav(a, b) / dt : null;
  },
  _onErr(err) {
    this.lastErr = err;
    const s = this.session;
    if ((err.code === 1 || err.code === -1) && (!s || s.points.length < 2)) this.hardStop(false);
    this._uiState();
    if (err.code === 1) {
      const isFile = location.protocol === 'file:';
      const msg = isFile
        ? 'Location blocked on file:// URL. Please run via local server (http://localhost:8000) or use Manual Entry.'
        : 'Location permission denied — enable it in browser settings or use Manual Entry.';
      toast(msg, 'err', 6500);
    }
  },
  _tick() {
    if (!this.session) return;
    this._updateLive();
    this.updateChip();
  },
  elapsed() {
    const s = this.session; if (!s) return 0;
    let paused = s.pausedSec || 0;
    if (this.state === 'paused' && s.pausedAt != null) paused += Date.now() - s.pausedAt;
    if (this.state === 'auto' && s.autoSince != null) paused += Date.now() - s.autoSince;
    return Math.max(0, (Date.now() - s.startedAt - paused) / 1000);
  },
  liveStats() {
    const s = this.session; if (!s) return null;
    const ts = trackStats(s.points);
    const elapsed = this.elapsed();
    const avgSpeed = ts.moving > 0 ? ts.dist / ts.moving : 0;
    const last = s.points[s.points.length - 1];
    let cSpeed = null;
    if (s.points.length > 1) {
      const tEnd = last.t;
      let i = s.points.length - 1;
      while (i > 0 && tEnd - s.points[i].t < 45000) i--;
      const seg = s.points.slice(i);
      const dt = (seg[seg.length - 1].t - seg[0].t) / 1000;
      let dd = 0;
      for (let j = 1; j < seg.length; j++) dd += hav(seg[j - 1], seg[j]);
      if (dt > 3) cSpeed = dd / dt;
    }
    const u = App.settings.units;
    const completedUnits = Math.floor(ts.dist / unitMeters(u));
    if (completedUnits > this._lastSpokenSplit && this.state === 'recording') {
      this._lastSpokenSplit = completedUnits;
      const uName = u === 'imperial' ? 'mile' : 'kilometer';
      this.speak(`${completedUnits} ${uName}${completedUnits > 1 ? 's' : ''} complete. Average pace ${fmtPace(ts.moving / ts.dist, u)}.`);
    }
    return {
      dist: ts.dist, moving: ts.moving, elapsed, gain: ts.gain,
      avgPace: ts.dist > 1 ? ts.moving / ts.dist : NaN,
      avgSpeed, cSpeed,
      kcal: estimateCalories(this.type, ts.moving, avgSpeed, App.settings.weightKg, 0),
      acc: last && last.ac != null ? last.ac : null,
      n: s.points.length,
    };
  },
  pause() {
    if (this.state !== 'recording') return;
    this.state = 'paused';
    this.session.pausedAt = Date.now();
    this.speak('Workout paused');
    this._uiState(); this.persistSession(); this.updateChip();
  },
  resume() {
    const s = this.session; if (!s) return;
    if (this.state === 'paused' && s.pausedAt != null) { s.pausedSec += Date.now() - s.pausedAt; s.pausedAt = null; }
    if (this.state === 'auto' && s.autoSince != null) { s.pausedSec += Date.now() - s.autoSince; s.autoSince = null; }
    this.state = 'recording';
    this.speak('Workout resumed');
    if (!this.watchId && navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        p => this._onFix(p), e => this._onErr(e),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 25000 });
    }
    this._uiState(); this.persistSession(); this.updateChip();
  },
  hardStop(keepSession) {
    if (this.watchId != null) { navigator.geolocation.clearWatch(this.watchId); this.watchId = null; }
    clearInterval(this._timer); this._timer = null;
    this.releaseWakeLock();
    if (!keepSession) {
      this.session = null; this.state = 'idle';
      this.persistClear(); this.updateChip(); App.refreshView();
    }
  },
  discard() {
    const doIt = () => { this.hardStop(false); toast('Recording discarded.'); };
    const s = this.session;
    const st = s ? this.liveStats() : null;
    if (s && s.points.length > 1 && st && st.dist > 50) {
      confirmDialog({ title: 'Discard this recording?', message: `You recorded ${fmtDist(st.dist, App.settings.units)} so far.`, ok: 'Discard', danger: true })
        .then(v => { if (v) doIt(); });
    } else doIt();
  },
  async persistSession() {
    if (!this.session) return;
    this._lastPersistN = this.session.points.length;
    try { await DB.set('session', this.session); } catch (e) {}
  },
  async persistClear() { try { await DB.del('session'); } catch (e) {} },
  async checkInterrupted() {
    try {
      const s = await DB.get('session');
      if (s && s.points && s.points.length) {
        this.session = s; this.type = s.type; this.customName = s.customName || '';
        this.state = 'paused'; s.pausedAt = Date.now();
        this._timer = setInterval(() => this._tick(), 1000);
        return true;
      }
    } catch (e) {}
    return false;
  },
  stopAndSave() {
    if (!this.session) return;
    const st = this.liveStats();
    this.state = 'saving';
    this.speak('Workout finished');
    this._uiState();
    openSaveModal(st);
  },
  async finalize(meta) {
    const s = this.session; if (!s) return;
    const pts = s.points.length > 6000 ? s.points.filter((p, i) => i % 2 === 0 || i === s.points.length - 1) : s.points;
    const ts = trackStats(pts);
    const wall = pts.length > 1 ? (pts[pts.length - 1].t - pts[0].t) / 1000 : 0;
    const elapsed = Math.max(0, wall - (s.pausedSec || 0));
    const avgSpeed = ts.moving > 0 ? ts.dist / ts.moving : 0;
    const a = {
      id: s.id, type: meta.type, customName: meta.type === 'custom' ? (meta.customName || s.customName || '') : '',
      title: meta.title, notes: meta.notes || '', rpe: meta.rpe || null,
      start: pts.length ? pts[0].t : s.startedAt,
      distance: Math.round(ts.dist), duration: Math.round(ts.moving),
      elapsed: Math.round(elapsed), pausedSec: Math.round(s.pausedSec || 0),
      gain: ts.gain, hrAvg: meta.hrAvg || null,
      calories: estimateCalories(meta.type, ts.moving, avgSpeed, App.settings.weightKg, ts.dist > 0 ? ts.gain / ts.dist : 0),
      points: pts, source: 'gps', demo: false, createdAt: Date.now(),
    };
    this.hardStop(false);
    await App.saveActivity(a);
    toast('Activity saved — ' + fmtDist(a.distance, App.settings.units) + ' logged', 'ok');
    go('activity/' + a.id);
  },
  _uiState() {
    const pill = $('#rec-status'); if (pill) renderRecStatus(pill);
    const pb = $('#rec-pause-btn'); if (pb) updatePauseBtn(pb);
    this.updateChip();
  },
  _updateLive() {
    const st = this.liveStats(); if (!st) return;
    const u = App.settings.units;
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('#live-dist', fmtDistNum(st.dist, u));
    set('#live-elapsed', fmtDur(st.elapsed));
    set('#live-moving', fmtDur(st.moving));
    set('#live-pace', fmtPace(st.avgPace, u));
    set('#live-cpace', st.cSpeed && st.cSpeed > 0.3 ? fmtPace(1 / st.cSpeed, u) : '—');
    set('#live-speed', fmtSpeed(st.avgSpeed, u));
    set('#live-gain', fmtElev(st.gain, u));
    set('#live-kcal', '≈ ' + Math.round(st.kcal));
    set('#live-acc', st.acc != null ? '±' + Math.round(st.acc) + ' m' : '—');
    set('#live-pts', st.n + ' pts');
    if (this.map && this.session) {
      this.map.o.unitM = unitMeters(u);
      this.map.setPoints(this.session.points);
    }
    this._uiState();
  },
  updateChip() {
    const chip = $('#recchip'); if (!chip) return;
    const { name } = parseHash();
    if (!this.active || name === 'record') { chip.classList.remove('on'); return; }
    const st = this.liveStats();
    const paused = this.state === 'paused' || this.state === 'auto';
    chip.classList.toggle('paused', paused);
    chip.classList.add('on');
    chip.innerHTML = `<span class="dot"></span><span>${paused ? 'Paused' : 'Recording'} · ${fmtDist(st.dist, App.settings.units)} · ${fmtDur(st.elapsed)}</span>`;
    chip.onclick = () => go('record');
  },
};

function defaultTitle(type, date) {
  const h = (date || new Date()).getHours();
  const tod = h < 5 ? 'Early ' : h < 11 ? 'Morning ' : h < 14 ? 'Lunchtime ' : h < 18 ? 'Afternoon ' : h < 22 ? 'Evening ' : 'Night ';
  return tod + (ACT_TYPES[type] ? ACT_TYPES[type].label : 'Workout');
}
function typeSelectHtml(id, selected) {
  return `<select class="select" id="${id}">` +
    Object.keys(ACT_TYPES).map(t => `<option value="${t}" ${t === selected ? 'selected' : ''}>${ACT_TYPES[t].label}</option>`).join('') +
    '</select>';
}
function openSaveModal(st) {
  const u = App.settings.units;
  const s = Recorder.session;
  const d = new Date(s.points && s.points.length ? s.points[0].t : s.startedAt);
  openModal({
    title: 'Save activity', wide: true,
    body: `
      <div class="grid g3" style="margin-bottom:16px">
        <div><div class="stat-label">Distance</div><div class="stat-value sm num">${fmtDist(st.dist, u)}</div></div>
        <div><div class="stat-label">Moving time</div><div class="stat-value sm num">${fmtDur(st.moving)}</div></div>
        <div><div class="stat-label">Avg pace</div><div class="stat-value sm num">${fmtPaceFull(st.avgPace, u)}</div></div>
      </div>
      <div class="frow">
        <div class="field"><label class="label" for="sm-title">Title</label><input class="input" id="sm-title" maxlength="60" value="${escapeHtml(defaultTitle(s.type, d))}"></div>
        <div class="field"><label class="label" for="sm-type">Type</label>${typeSelectHtml('sm-type', s.type)}</div>
      </div>
      <div class="frow" style="margin-top:14px">
        <div class="field"><label class="label" for="sm-rpe">Effort (RPE 1–10)</label>
          <select class="select" id="sm-rpe"><option value="">—</option>${[1,2,3,4,5,6,7,8,9,10].map(n => `<option>${n}</option>`).join('')}</select></div>
        <div class="field"><label class="label" for="sm-hr">Avg heart rate (bpm)</label><input class="input" id="sm-hr" inputmode="numeric" placeholder="e.g. 152"></div>
      </div>
      <div class="field" style="margin-top:14px"><label class="label" for="sm-notes">Notes</label>
        <textarea class="textarea" id="sm-notes" maxlength="500" placeholder="How did it feel?"></textarea></div>`,
    actions: [
      { label: 'Discard', cls: 'btn-ghost', onclick: () => { closeModal(); Recorder.discard(); } },
      { label: 'Save activity', cls: 'btn-primary', icon: 'check', onclick: () => {
        const meta = {
          type: $('#sm-type').value, customName: '',
          title: $('#sm-title').value.trim() || defaultTitle($('#sm-type').value),
          notes: $('#sm-notes').value.trim(),
          rpe: $('#sm-rpe').value ? +$('#sm-rpe').value : null,
          hrAvg: parseFloat($('#sm-hr').value) || null,
        };
        closeModal(); Recorder.finalize(meta);
      } },
    ],
    onClose: () => { if (Recorder.state === 'saving') { Recorder.state = 'paused'; Recorder.session.pausedAt = Date.now(); Recorder._uiState(); } },
  });
}

function openManualModal(prefill) {
  const u = App.settings.units;
  const now = new Date();
  const distVal = prefill && prefill.distance != null ? fmtDistNum(prefill.distance, u) : '';
  openModal({
    title: prefill ? 'Save imported activity' : 'Manual entry', wide: true,
    body: `
      ${prefill ? `<div class="note" style="margin-bottom:14px">${icon('info')}<div>Imported from <b>${escapeHtml(prefill.file)}</b> — ${prefill.points ? prefill.points.length + ' track points' : 'no track'}.</div></div>` : ''}
      <div class="frow">
        <div class="field"><label class="label" for="mm-type">Type</label>${typeSelectHtml('mm-type', prefill ? prefill.type : App.settings.defaultType)}</div>
        <div class="field"><label class="label" for="mm-date">Date</label><input class="input" type="date" id="mm-date" value="${prefill ? dayKey(new Date(prefill.start)) : dayKey(now)}"></div>
        <div class="field"><label class="label" for="mm-time">Start time</label><input class="input" type="time" id="mm-time" value="${prefill ? fmtTime(new Date(prefill.start)) : fmtTime(now)}"></div>
      </div>
      <div class="frow" style="margin-top:14px">
        <div class="field"><label class="label">Duration</label>
          <div class="row" style="gap:6px"><input class="input" style="width:62px" id="mm-dur-h" inputmode="numeric" placeholder="h" value="${prefill ? Math.floor((prefill.duration || 0) / 3600) : ''}"><span class="dim">:</span><input class="input" style="width:62px" id="mm-dur-m" inputmode="numeric" placeholder="m" value="${prefill ? Math.floor(((prefill.duration || 0) % 3600) / 60) : ''}"><span class="dim">:</span><input class="input" style="width:62px" id="mm-dur-s" inputmode="numeric" placeholder="s" value="${prefill ? Math.round((prefill.duration || 0) % 60) : ''}"></div></div>
        <div class="field"><label class="label" for="mm-dist">Distance (${unitLabel(u)})</label>
          <input class="input" id="mm-dist" inputmode="decimal" placeholder="e.g. 10.2" value="${distVal}"></div>
        <div class="field"><label class="label" for="mm-gain">Elev gain (${elevLabel(u)})</label>
          <input class="input" id="mm-gain" inputmode="numeric" placeholder="optional" value="${prefill && prefill.gain ? Math.round(u === 'imperial' ? prefill.gain * 3.28084 : prefill.gain) : ''}"></div>
      </div>
      <div class="frow" style="margin-top:14px">
        <div class="field"><label class="label" for="mm-title">Title</label><input class="input" id="mm-title" maxlength="60" value="${escapeHtml((prefill && prefill.title) || '')}" placeholder="e.g. Tempo Run"></div>
        <div class="field"><label class="label" for="mm-hr">Avg HR (bpm)</label><input class="input" id="mm-hr" inputmode="numeric" placeholder="optional" value="${prefill && prefill.hrAvg ? prefill.hrAvg : ''}"></div>
        <div class="field"><label class="label" for="mm-rpe">Effort (RPE 1–10)</label><select class="select" id="mm-rpe"><option value="">—</option>${[1,2,3,4,5,6,7,8,9,10].map(n => `<option>${n}</option>`).join('')}</select></div>
      </div>
      <div class="field" id="mm-custom-wrap" style="margin-top:14px;display:none"><label class="label" for="mm-custom">Custom activity name</label>
        <input class="input" id="mm-custom" maxlength="30" placeholder="e.g. Rowing, Yoga"></div>
      <div class="field" style="margin-top:14px"><label class="label" for="mm-notes">Notes</label>
        <textarea class="textarea" id="mm-notes" maxlength="500" placeholder="Session notes…">${escapeHtml((prefill && prefill.notes) || '')}</textarea></div>
      <div class="ferr" id="mm-err"></div>`,
    actions: [
      { label: 'Cancel', cls: 'btn-ghost', onclick: () => closeModal() },
      { label: prefill ? 'Save activity' : 'Add activity', cls: 'btn-primary', icon: 'check', onclick: () => saveManual(prefill) },
    ],
  });
  const syncCustom = () => { $('#mm-custom-wrap').style.display = $('#mm-type').value === 'custom' ? '' : 'none'; };
  $('#mm-type').addEventListener('change', syncCustom); syncCustom();
}
async function saveManual(prefill) {
  const err = $('#mm-err'); err.classList.remove('on');
  const u = App.settings.units;
  const type = $('#mm-type').value;
  const customName = type === 'custom' ? ($('#mm-custom').value.trim() || '') : '';
  const h = parseInt($('#mm-dur-h').value) || 0, m = parseInt($('#mm-dur-m').value) || 0, s = parseInt($('#mm-dur-s').value) || 0;
  const duration = h * 3600 + m * 60 + s;
  const distIn = parseFloat(($('#mm-dist').value || '').replace(',', '.'));
  const distance = isFinite(distIn) ? distIn * unitMeters(u) : 0;
  const gainIn = parseFloat(($('#mm-gain').value || '').replace(',', '.'));
  const gain = isFinite(gainIn) ? (u === 'imperial' ? gainIn / 3.28084 : gainIn) : 0;
  if (duration <= 0) { err.textContent = 'Enter a duration greater than zero.'; err.classList.add('on'); return; }
  const start = new Date(($('#mm-date').value || dayKey(new Date())) + 'T' + ($('#mm-time').value || '08:00')).getTime();
  if (!isFinite(start)) { err.textContent = 'Invalid date/time.'; err.classList.add('on'); return; }
  const hrAvg = parseFloat($('#mm-hr').value) || null;
  const rpe = $('#mm-rpe').value ? +$('#mm-rpe').value : null;
  const avgSpeed = duration > 0 ? distance / duration : 0;
  const a = {
    id: uid(), type, customName,
    title: $('#mm-title').value.trim() || defaultTitle(type, new Date(start)),
    notes: $('#mm-notes').value.trim(),
    start, distance: Math.round(distance), duration, elapsed: duration,
    gain: Math.round(gain), hrAvg, rpe,
    calories: estimateCalories(type, duration, avgSpeed, App.settings.weightKg, distance > 0 ? gain / distance : 0),
    points: prefill && prefill.points && prefill.points.length > 1 ? prefill.points : null,
    source: prefill ? 'import' : 'manual', demo: false, createdAt: Date.now(),
  };
  closeModal();
  await App.saveActivity(a);
  toast('Activity added — ' + (a.distance ? fmtDist(a.distance, u) + ' ' : '') + fmtDur(a.duration), 'ok');
  go('activity/' + a.id);
}

function importGpxFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const doc = new DOMParser().parseFromString(reader.result, 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
      const trkpts = Array.from(doc.getElementsByTagName('trkpt'));
      const pts = trkpts.map(p => {
        const el = p.getElementsByTagName('ele')[0];
        const tm = p.getElementsByTagName('time')[0];
        const hre = p.getElementsByTagNameNS('*', 'hr')[0] || p.getElementsByTagName('hr')[0];
        return {
          la: parseFloat(p.getAttribute('lat')), ln: parseFloat(p.getAttribute('lon')),
          t: tm ? Date.parse(tm.textContent) : NaN,
          el: el ? parseFloat(el.textContent) : null,
          ac: 12, v: null, p: false, hr: hre ? parseFloat(hre.textContent) || null : null,
        };
      }).filter(p => isFinite(p.la) && isFinite(p.ln) && isFinite(p.t));
      if (pts.length < 2) throw new Error('No usable track points found');
      const nameEl = doc.getElementsByTagName('name')[0];
      const ts = trackStats(pts);
      const hrs = pts.map(p => p.hr).filter(v => v != null);
      openManualModal({
        file: file.name, points: pts, type: 'run',
        title: (nameEl ? nameEl.textContent.trim() : '') || 'Imported activity',
        start: pts[0].t, distance: ts.dist, duration: Math.round(ts.moving),
        gain: ts.gain, hrAvg: hrs.length > 5 ? Math.round(avg(hrs)) : null,
      });
    } catch (e) { toast('GPX import failed: ' + e.message, 'err', 5500); }
  };
  reader.readAsText(file);
}

VIEWS.record = {
  title: 'Record Activity',
  selType: null,
  head() { return { title: 'Record Activity', sub: 'Live GPS telemetry, street map, voice split cues & GPX import' }; },
  render() { return Recorder.active ? renderLiveRecording() : renderRecordIdle(); },
  mount() {
    const u = App.settings.units;
    if (Recorder.active) {
      const cv = $('#live-map');
      if (cv) {
        Recorder.map = new RouteMap(cv, { colorBy: 'none', type: Recorder.type, unitM: unitMeters(u), follow: true, interactive: true, padding: 60 });
        RouteMap._last = Recorder.map;
        Recorder.map.setPoints(Recorder.session.points, true);
      }
      Recorder._updateLive();
    } else {
      VIEWS.record.selType = VIEWS.record.selType || App.settings.defaultType || 'run';
      syncTypeCards();
      const preHost = $('#pre-live-map');
      if (preHost) {
        const preMap = new RouteMap(preHost, { colorBy: 'none', type: VIEWS.record.selType, unitM: unitMeters(u), follow: true, interactive: true });
        RouteMap._last = preMap;
        if (navigator.permissions && navigator.permissions.query) {
          navigator.permissions.query({ name: 'geolocation' }).then(res => {
            if (res.state === 'granted') {
              navigator.geolocation.getCurrentPosition(
                pos => {
                  preMap.setLiveLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, true);
                  const badge = $('#pre-gps-badge');
                  if (badge) badge.textContent = `Live GPS locked · ±${Math.round(pos.coords.accuracy)} m accuracy`;
                },
                () => {},
                { enableHighAccuracy: true, timeout: 8000 }
              );
            }
          }).catch(() => {});
        }
      }
    }
  },
};
function renderRecStatus(pill) {
  if (!pill) return;
  const map = { requesting: ['Waiting for GPS…', 'idle'], recording: ['Recording', 'live'], paused: ['Paused', 'paused'], auto: ['Auto-paused', 'paused'], saving: ['Saving…', 'paused'] };
  const [label, cls] = map[Recorder.state] || ['Ready', 'idle'];
  pill.className = 'rec-status ' + cls;
  pill.innerHTML = `<span class="dot"></span>${label}`;
}
function updatePauseBtn(btn) {
  if (!btn) return;
  const paused = Recorder.state === 'paused' || Recorder.state === 'auto';
  btn.innerHTML = paused ? icon('play', 17) + 'Resume' : icon('pause', 17) + 'Pause';
  btn.dataset.action = paused ? 'rec-resume' : 'rec-pause';
}
function renderLiveRecording() {
  const u = App.settings.units;
  const s = Recorder.session;
  return `
  ${demoBannerHtml()}
  <div class="card">
    <div class="spread" style="margin-bottom:16px;flex-wrap:wrap">
      <div class="row" style="gap:10px">
        <span id="rec-status" class="rec-status idle"><span class="dot"></span>Ready</span>
        <span class="chip"><span class="cdot" style="--tc:${typeColor({ type: s.type })}"></span>${escapeHtml(typeLabel(s))}</span>
      </div>
      <div class="tiny dim row">GPS <span id="live-acc">—</span> · <span id="live-pts">0 pts</span></div>
    </div>
    <div class="rec-hero">
      <div class="rec-stat rec-big"><div class="stat-label">Distance (${unitLabel(u)})</div><div class="stat-value num" id="live-dist">0.00</div></div>
      <div class="rec-stat"><div class="stat-label">Elapsed</div><div class="stat-value num" id="live-elapsed">0:00</div><div class="stat-sub tiny">moving <span id="live-moving">0:00</span></div></div>
      <div class="rec-stat"><div class="stat-label">Avg pace</div><div class="stat-value num" id="live-pace">—</div><div class="stat-sub tiny">now <span id="live-cpace">—</span></div></div>
    </div>
    <div class="map-wrap" style="margin-top:4px"><div id="live-map" class="map-host" style="--map-h:340px"></div>${mapControlsHtml()}<div class="map-badge">Live GPS route · OpenStreetMap / CARTO free tiles</div></div>
    <div class="rec-controls">
      <button class="btn btn-rec btn-primary" id="rec-pause-btn" data-action="rec-pause">${icon('pause', 17)}Pause</button>
      <button class="btn btn-rec btn-stop" data-action="rec-stop">${icon('stop', 17)}Stop &amp; Save</button>
      <button class="btn btn-rec btn-ghost" data-action="rec-discard">${icon('trash', 16)}Discard</button>
    </div>
    <div class="grid g4" style="margin-top:18px">
      <div><div class="stat-label">Avg speed</div><div class="stat-value sm num" id="live-speed">—</div></div>
      <div><div class="stat-label">Elev gain</div><div class="stat-value sm num" id="live-gain">0 m</div></div>
      <div><div class="stat-label">Calories</div><div class="stat-value sm num" id="live-kcal">≈ 0</div></div>
      <div><div class="stat-label">Voice cues</div><div class="stat-value sm">${App.settings.voiceCues ? 'On' : 'Off'}</div></div>
    </div>
  </div>`;
}
function renderRecordIdle() {
  const rec = VIEWS.record;
  if (!rec.selType) rec.selType = App.settings.defaultType || 'run';
  const geoOk = !!(navigator.geolocation && navigator.geolocation.watchPosition);
  const typeMeta = {
    run: 'GPS · Pace & Splits',
    walk: 'GPS · Distance & Time',
    cycle: 'GPS · Speed & Elevation',
    hike: 'GPS · Altitude & Grade',
    gym: 'Timer · Strength & HR',
    custom: 'Flexible · Custom Log',
  };
  return `
  ${demoBannerHtml()}
  <div class="card">
    <div class="card-head">
      <div>
        <div class="card-title">${icon('record', 18)} Record an activity</div>
        <div class="card-sub">Select sport mode, then start GPS tracking or log manually.</div>
      </div>
    </div>
    <div class="type-pick" id="type-pick">
      ${Object.keys(ACT_TYPES).map(t => `
        <button class="type-card ${rec.selType === t ? 'on' : ''}" data-action="rec-type" data-type="${t}" style="--tc:${ACT_TYPES[t].color}">
          <div class="tc-ico">${typeIcon(t)}</div>
          <div class="tc-info">
            <div class="tc-name">${ACT_TYPES[t].label}</div>
            <div class="tc-sub">${typeMeta[t] || 'Activity'}</div>
          </div>
        </button>`).join('')}
    </div>
    <div class="field" id="custom-name-wrap" style="display:none;margin-top:14px">
      <label class="label" for="rec-custom">Custom activity name</label>
      <input class="input" id="rec-custom" maxlength="30" placeholder="e.g. Rowing, Yoga, Climbing">
    </div>

    <div class="map-wrap" style="margin-top:18px;--map-h:240px">
      <div id="pre-live-map" class="map-host"></div>
      ${mapControlsHtml(`<button class="btn-icon" data-action="map-locate" aria-label="Center on my GPS location" data-tip="Locate me (GPS)">${icon('gps', 15)}</button>`)}
      <div class="map-badge" id="pre-gps-badge">Live Basemap · Drag to pan, scroll to zoom, or tap pin to switch layers</div>
    </div>

    <div class="row wrap" style="margin-top:18px;gap:12px">
      <button class="btn btn-lg btn-primary" data-action="rec-start" ${geoOk ? '' : 'disabled'}>${icon('gps', 18)} Start GPS Recording</button>
      <button class="btn btn-lg btn-outline" data-action="rec-manual">${icon('pencil', 17)} Manual Entry</button>
      <button class="btn btn-lg btn-ghost" data-action="rec-import">${icon('upload', 17)} Import GPX</button>
      <input type="file" id="gpx-file" accept=".gpx,application/gpx+xml" class="hide">
    </div>
    <div class="note" style="margin-top:16px">${icon('info')}
      <div>100% open-source OpenStreetMap &amp; local cartographic vector rendering — zero API keys, zero tracking. Spoken split cues (${App.settings.voiceCues ? 'enabled' : 'disabled'}) announce completed ${App.settings.units === 'imperial' ? 'miles' : 'kilometers'} and pace.</div>
    </div>
  </div>`;
}
function syncTypeCards() {
  const rec = VIEWS.record;
  $$('#type-pick .type-card').forEach(el => el.classList.toggle('on', el.dataset.type === rec.selType));
  const wrap = $('#custom-name-wrap');
  if (wrap) wrap.style.display = rec.selType === 'custom' ? '' : 'none';
}
regAction('rec-type', d => { VIEWS.record.selType = d.type; syncTypeCards(); });
regAction('rec-start', () => Recorder.start(VIEWS.record.selType, VIEWS.record.selType === 'custom' && $('#rec-custom') ? $('#rec-custom').value.trim() : ''));
regAction('rec-manual', () => openManualModal(null));
regAction('rec-import', () => { const f = $('#gpx-file'); if (f) { f.value = ''; f.click(); } });
document.addEventListener('change', e => {
  if (e.target && e.target.id === 'gpx-file' && e.target.files && e.target.files[0]) importGpxFile(e.target.files[0]);
});
regAction('rec-pause', () => Recorder.pause());
regAction('rec-resume', () => Recorder.resume());
regAction('rec-stop', () => Recorder.stopAndSave());
regAction('rec-discard', () => Recorder.discard());

/* ---------------- Dashboard View ---------------- */
function actRowHtml(a) {
  const u = App.settings.units;
  const st = actRowStats(a);
  const d = new Date(a.start);
  const main = st.dist > 1
    ? fmtDistNum(st.dist, u) + ' <span class="unit" style="font-size:11px">' + unitLabel(u) + '</span>'
    : fmtDur(st.dur);
  const sub = st.dist > 1
    ? (isFinite(st.pace) && a.type !== 'gym' ? fmtPace(st.pace, u) + ' /' + unitLabel(u) + ' · ' : '') + fmtDur(st.dur)
    : 'workout';
  return `
  <div class="act-row" data-action="act-open" data-id="${a.id}" role="button" tabindex="0">
    <div class="act-ico" style="--tc:${typeColor(a)}">${typeIcon(a.type)}</div>
    <div class="act-main">
      <div class="act-name">${escapeHtml(a.title || typeLabel(a))}${demoChip(a)}</div>
      <div class="act-sub">${relDay(d)} · ${fmtTime(d)} · ${typeLabel(a)} ${srcTag(a)} <span class="mono tiny dim">· ${st.tss} TSS</span></div>
    </div>
    <div class="act-nums">
      <div class="act-dist num">${main}</div>
      <div class="act-meta2">${sub}</div>
    </div>
  </div>`;
}
function traceTip(list) {
  const u = App.settings.units;
  const parts = list.slice(0, 5).map(a => `${a.title || typeLabel(a)} (${a.distance ? fmtDist(a.distance, u) : fmtDur(a.duration)})`);
  return 'Computed from ' + list.length + ' activit' + (list.length === 1 ? 'y' : 'ies') + ': ' + parts.join(', ');
}

VIEWS.dashboard = {
  title: 'Dashboard',
  head() {
    const h = new Date().getHours();
    const greet = h < 5 ? 'Night owl session' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const name = App.settings.name ? ', ' + App.settings.name : '';
    return { title: greet + name, sub: relDay(new Date()) + ' · ' + fmtDate(new Date()) };
  },
  render() {
    const u = App.settings.units;
    const all = App.acts;
    if (!all.length) return dashboardEmpty();
    const today = startOfDay(new Date());
    const todays = actsInRange(today, addDays(today, 1));
    const { from: wFrom, to: wTo } = weekBounds(0);
    const prevW = rangeStats(actsInRange(addDays(wFrom, -7), wFrom));
    const week = rangeStats(actsInRange(wFrom, wTo));
    const mFrom = startOfMonth(new Date()), mTo = endOfMonth(new Date());
    const month = rangeStats(actsInRange(mFrom, mTo));
    const totalDur = sum(all.map(a => a.duration || 0));

    const goalKm = App.settings.weeklyGoalKm || 0;
    const goalDist = App.settings.weeklyGoalType === 'all' ? week.dist : week.byType[App.settings.weeklyGoalType] || 0;
    const goalTgt = u === 'imperial' ? goalKm * 0.621371 : goalKm;
    const goalVal = u === 'imperial' ? goalDist / KM * 0.621371 : goalDist / KM;
    const pct = goalTgt > 0 ? clamp(goalVal / goalTgt, 0, 1) : 0;
    const daysLeft = Math.ceil((wTo - new Date()) / DAY_MS);
    const C = 2 * Math.PI * 36;
    const st = App.streak || { current: 0, best: 0, active: false };
    const ld = App.load || { latest: { ctl: 0, atl: 0, tsb: 0 }, status: 'Balanced', badge: 'up' };
    const wk8 = weeklyBuckets(8);
    const wkDelta = prevW.dist > 0 ? (week.dist - prevW.dist) / prevW.dist : null;

    return `
    ${demoBannerHtml()}
    <div class="dash-hero">
      <div class="card hoverable hero-today">
        <div class="stat-label">Today · ${DOW_NAMES[new Date().getDay()]}</div>
        ${todays.length ? `
          <div class="stat-value lg num" data-tip="${escapeHtml(traceTip(todays))}" style="margin-top:4px">${fmtDist(todays.reduce((s, a) => s + (a.distance || 0), 0), u)}</div>
          <div class="today-rows">
            ${todays.slice(0, 3).map(a => `
              <div class="today-row" data-action="act-open" data-id="${a.id}" role="button" tabindex="0">
                <span class="mini-ico" style="color:${typeColor(a)}">${typeIcon(a.type)}</span>
                <span class="grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(a.title || typeLabel(a))}</span>
                <b>${a.distance ? fmtDist(a.distance, u) : fmtDur(a.duration)}</b>
              </div>`).join('')}
          </div>`
        : `<div class="stat-value lg" style="margin-top:4px">Rest day</div>
           <div class="stat-sub" style="margin-top:6px">No activity logged yet today.</div>
           <button class="btn btn-primary" style="margin-top:16px" data-action="go-record">${icon('record', 16)} Start something</button>`}
      </div>

      <div class="card ring-card">
        <div class="ring-wrap">
          <svg width="86" height="86" viewBox="0 0 86 86">
            <circle class="ring-track" cx="43" cy="43" r="36" fill="none" stroke-width="7"/>
            <circle class="ring-val ${pct >= 1 ? 'done' : ''}" id="goal-ring" cx="43" cy="43" r="36" fill="none" stroke-width="7"
              stroke-dasharray="${C}" stroke-dashoffset="${C}" style="transition:stroke-dashoffset .9s var(--ease)"/>
          </svg>
          <div class="ring-center"><span id="ring-pct">${Math.round(pct * 100)}%</span><span class="rsub">GOAL</span></div>
        </div>
        <div class="grow">
          <div class="stat-label">Weekly goal</div>
          <div class="stat-value sm num" style="margin-top:4px">${goalVal.toFixed(goalVal < 100 ? 1 : 0)} <span class="unit">/ ${goalTgt.toFixed(goalTgt < 100 ? 1 : 0)} ${unitLabel(u)}</span></div>
          <div class="stat-sub tiny">${pct >= 1 ? 'Goal achieved this week' : daysLeft + ' day' + (daysLeft === 1 ? '' : 's') + ' left'}</div>
          <div class="stat-sub tiny dim">${App.settings.weeklyGoalType === 'all' ? 'All activities' : ACT_TYPES[App.settings.weeklyGoalType].label} · ${week.count} sessions</div>
        </div>
      </div>

      <div class="card hoverable" data-action="go" data-to="progress" style="cursor:pointer" data-tip="Banister CTL (Fitness) − ATL (Fatigue) = TSB (Form)">
        <div class="spread">
          <div class="stat-label">Readiness &amp; Form</div>
          <span class="chip chip-tss mono">${ld.latest.tsb >= 0 ? '+' : ''}${ld.latest.tsb.toFixed(1)} TSB</span>
        </div>
        <div class="stat-value sm num" style="margin-top:8px">${Math.round(ld.latest.ctl)} <span class="unit">Fitness (CTL)</span></div>
        <div class="stat-sub tiny" style="margin-top:6px"><span class="delta ${ld.badge}">${ld.status}</span></div>
        <div class="stat-sub tiny dim">Fatigue (ATL): <b>${Math.round(ld.latest.atl)}</b> · Weekly load: <b>${week.tss} TSS</b></div>
      </div>

      <div class="card">
        <div class="row" style="gap:14px">
          <div class="streak-flame ${st.active ? '' : 'cold'}">${icon('flame', 24)}</div>
          <div class="grow">
            <div class="stat-label">Current streak</div>
            <div class="stat-value sm num" style="margin-top:2px">${st.current}<span class="unit">day${st.current === 1 ? '' : 's'}</span></div>
            <div class="stat-sub tiny">${st.active ? (st.hasToday ? 'Safe for today' : 'Log today to extend') : 'Start a streak today'}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="spread">
          <div><div class="stat-label">Best streak</div><div class="stat-value sm num">${st.best}<span class="unit">d</span></div></div>
          <div style="text-align:right"><div class="stat-label">This month</div><div class="stat-value sm num">${fmtDist(month.dist, u)}</div></div>
        </div>
      </div>
    </div>

    <div class="grid g4">
      <div class="card hoverable">
        <div class="stat-label">This week</div>
        <div class="stat-value num" data-tip="${escapeHtml(traceTip(actsInRange(wFrom, wTo)))}">${fmtDist(week.dist, u)}</div>
        <div class="stat-sub">${week.count} sessions${wkDelta != null ? ` <span class="delta ${wkDelta >= 0 ? 'up' : 'down'}">${fmtPct(wkDelta)}</span>` : ''}</div>
      </div>
      <div class="card hoverable">
        <div class="stat-label">Workout time <span class="dim">all-time</span></div>
        <div class="stat-value num">${fmtDur(totalDur)}</div>
        <div class="stat-sub">${all.length} activities logged</div>
      </div>
      <div class="card hoverable">
        <div class="stat-label">Calories this week <span class="dim">≈ est.</span></div>
        <div class="stat-value num">≈ ${Math.round(week.kcal).toLocaleString()}</div>
        <div class="stat-sub tiny dim">MET model · ${App.settings.weightKg || 70} kg</div>
      </div>
      <div class="card hoverable">
        <div class="stat-label">Elevation this week</div>
        <div class="stat-value num">${fmtElev(week.gain, u)}</div>
        <div class="stat-sub tiny dim">accumulated vertical gain</div>
      </div>
    </div>

    <div class="grid g-2col" style="margin-top:16px">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">${icon('list', 17)} Recent activities</div>
            <div class="card-sub">Your last ${Math.min(5, all.length)} sessions</div>
          </div>
          <a class="btn btn-sm btn-outline" href="#/activities" data-nav="activities">View all ${icon('chevR', 13)}</a>
        </div>
        ${all.slice(0, 5).map(actRowHtml).join('')}
      </div>
      <div class="card">
        <div class="card-title">${icon('progress', 17)} 8-week volume</div>
        <div class="card-sub">Distance per week, ${unitLabel(u)}</div>
        <div class="spark-box" style="margin-top:14px"><canvas id="dash-spark"></canvas></div>
        <div class="stat-sub tiny dim" style="margin-top:10px">
          ${wk8.length ? 'Peak: ' + fmtDist(Math.max(...wk8.map(w => w.dist)), u) + ' · avg ' + fmtDist(avg(wk8.map(w => w.dist)), u) : ''}
        </div>
      </div>
    </div>`;
  },
  mount() {
    const u = App.settings.units;
    const ring = $('#goal-ring');
    if (ring) {
      const C = 2 * Math.PI * 36;
      const goalKm = App.settings.weeklyGoalKm || 0;
      const wk = rangeStats(actsInRange(...(function () { const b = weekBounds(0); return [b.from, b.to]; })()));
      const dist = App.settings.weeklyGoalType === 'all' ? wk.dist : wk.byType[App.settings.weeklyGoalType] || 0;
      const tgt = u === 'imperial' ? goalKm * 0.621371 : goalKm;
      const val = u === 'imperial' ? dist / KM * 0.621371 : dist / KM;
      const pct = tgt > 0 ? clamp(val / tgt, 0, 1) : 0;
      requestAnimationFrame(() => requestAnimationFrame(() => { ring.style.strokeDashoffset = String(C * (1 - pct)); }));
    }
    const wk8 = weeklyBuckets(8);
    const cv = $('#dash-spark');
    if (cv) sparkline(cv, { ys: wk8.map(w => w.dist / unitMeters(u)), color: cssVar('--accent'), emptyMsg: 'No activities yet' });
  },
};

function dashboardEmpty() {
  return `
  ${demoBannerHtml()}
  <div class="card" style="padding:40px 24px">
    ${emptyState('record',
      'Your command center is ready',
      `SOLO tracks runs, rides, hikes and strength sessions with Banister CTL/ATL/TSB training load modeling, rolling best efforts, and private on-device storage.`, 'go-record', 'Record first activity')}
    <div class="divider"></div>
    <div class="row wrap" style="justify-content:center;gap:10px">
      <button class="btn btn-outline" data-action="rec-manual">${icon('pencil', 15)} Log manually</button>
      <button class="btn btn-outline" data-action="rec-import">${icon('upload', 15)} Import GPX</button>
      <button class="btn btn-lime" data-action="demo-load">${icon('zap', 15)} Load 5-month demo dataset</button>
    </div>
  </div>`;
}

/* ---------------- Activities & Detail Views ---------------- */
VIEWS.activities = {
  title: 'Activities',
  f: { q: '', types: [], range: 'all', sort: 'new' },
  head() {
    const n = App.acts.length;
    return { title: 'Activities', sub: n + ' logged · ' + fmtDist(sum(App.acts.map(a => a.distance || 0)), App.settings.units) + ' total' };
  },
  render() {
    const f = this.f;
    const u = App.settings.units;
    const list = filterActs(f);
    const counts = {};
    for (const a of App.acts) counts[a.type] = (counts[a.type] || 0) + 1;
    const ranges = [['all', 'All time'], ['30d', 'Last 30 days'], ['3m', 'Last 3 months'], ['12m', 'Last 12 months']];
    return `
    ${demoBannerHtml()}
    <div class="filter-bar">
      <div class="search-box">${icon('search', 16)}
        <input class="input" id="act-search" placeholder="Search title, notes or type…" value="${escapeHtml(f.q)}">
      </div>
      <select class="select" id="act-range" style="width:auto">
        ${ranges.map(r => `<option value="${r[0]}" ${f.range === r[0] ? 'selected' : ''}>${r[1]}</option>`).join('')}
      </select>
      <select class="select" id="act-sort" style="width:auto">
        <option value="new" ${f.sort === 'new' ? 'selected' : ''}>Newest first</option>
        <option value="old" ${f.sort === 'old' ? 'selected' : ''}>Oldest first</option>
        <option value="long" ${f.sort === 'long' ? 'selected' : ''}>Longest distance</option>
        <option value="dur" ${f.sort === 'dur' ? 'selected' : ''}>Longest duration</option>
      </select>
      <button class="btn btn-outline" data-action="export-all-csv">${icon('download', 15)} CSV</button>
    </div>
    <div class="type-filter" style="margin-bottom:10px">
      <button class="tf-chip ${f.types.length === 0 ? 'on' : ''}" data-action="act-filter-type" data-type="" style="--tc:var(--text-2)">All (${App.acts.length})</button>
      ${Object.keys(ACT_TYPES).map(t => counts[t] ? `
        <button class="tf-chip ${f.types.includes(t) ? 'on' : ''}" data-action="act-filter-type" data-type="${t}" style="--tc:${ACT_TYPES[t].color}">
          <span class="cdot"></span>${ACT_TYPES[t].label} (${counts[t]})
        </button>` : '').join('')}
    </div>
    ${list.length ? `
      <div class="card">
        ${groupedByMonth(list).map(g => `
          <div class="month-h">${monthLabel(g.date, true)} · ${g.list.length} sessions · ${fmtDist(sum(g.list.map(a => a.distance || 0)), u)}</div>
          ${g.list.map(actRowHtml).join('')}
        `).join('')}
      </div>`
    : `<div class="card">${emptyState('list', 'No activities match',
        App.acts.length ? 'Try clearing your search or filters.' : 'Everything you record will live here.', 'go-record', 'Record activity')}</div>`}`;
  },
  mount() {
    const f = this.f;
    const se = $('#act-search');
    if (se) se.addEventListener('input', debounce(() => { f.q = se.value; renderCurrent(); const s2 = $('#act-search'); if (s2) { s2.focus(); s2.setSelectionRange(s2.value.length, s2.value.length); } }, 240));
    const re = $('#act-range'); if (re) re.addEventListener('change', () => { f.range = re.value; renderCurrent(); });
    const so = $('#act-sort'); if (so) so.addEventListener('change', () => { f.sort = so.value; renderCurrent(); });
  },
};
function filterActs(f) {
  const now = Date.now();
  const rangeMs = { '30d': 30 * DAY_MS, '3m': 91 * DAY_MS, '12m': 365 * DAY_MS }[f.range] || Infinity;
  const q = f.q.trim().toLowerCase();
  let list = App.acts.filter(a => {
    if (now - a.start > rangeMs) return false;
    if (f.types.length && !f.types.includes(a.type)) return false;
    if (q) {
      const hay = ((a.title || '') + ' ' + (a.notes || '') + ' ' + typeLabel(a)).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  if (f.sort === 'old') list = list.slice().reverse();
  else if (f.sort === 'long') list = list.slice().sort((a, b) => (b.distance || 0) - (a.distance || 0));
  else if (f.sort === 'dur') list = list.slice().sort((a, b) => (b.duration || 0) - (a.duration || 0));
  return list;
}
function groupedByMonth(list) {
  const groups = [];
  let cur = null;
  for (const a of list) {
    const d = new Date(a.start);
    const key = d.getFullYear() + '-' + d.getMonth();
    if (!cur || cur.key !== key) { cur = { key, date: d, list: [] }; groups.push(cur); }
    cur.list.push(a);
  }
  return groups;
}
regAction('act-filter-type', d => {
  const f = VIEWS.activities.f;
  const t = d.type;
  if (!t) f.types = [];
  else f.types = f.types.includes(t) ? f.types.filter(x => x !== t) : f.types.concat([t]);
  renderCurrent();
});

VIEWS.activity = {
  title: 'Activity',
  mapStyle: 'pace',
  head() { return { title: 'Activity detail', sub: '' }; },
  render(id) {
    const a = App.acts.find(x => x.id === id);
    if (!a) return `<div class="card">${emptyState('alert', 'Activity not found', 'It may have been deleted.')}</div>`;
    const u = App.settings.units;
    const st = actStats(a);
    const d = new Date(a.start);
    const v = this.mapStyle || 'pace';
    return `
    ${demoBannerHtml()}
    <div class="detail-head">
      <div class="detail-ico" style="--tc:${typeColor(a)}">${typeIcon(a.type)}</div>
      <div class="grow">
        <div class="detail-title">${escapeHtml(a.title || typeLabel(a))} ${demoChip(a)}</div>
        <div class="detail-sub">${relDay(d)} · ${fmtTime(d)} · ${fmtDur(st.moving)} moving · ${typeLabel(a)} ${srcTag(a)} <span class="chip chip-tss mono">${st.tss} TSS</span></div>
      </div>
      <div class="detail-actions">
        <button class="btn btn-outline btn-sm" data-action="act-edit" data-id="${a.id}">${icon('pencil', 14)} Edit</button>
        ${st.hasTrack ? `<button class="btn btn-outline btn-sm" data-action="act-gpx" data-id="${a.id}">${icon('download', 14)} GPX</button>` : ''}
        <button class="btn btn-outline btn-sm" data-action="act-csv" data-id="${a.id}">${icon('download', 14)} CSV</button>
        <button class="btn btn-danger btn-sm" data-action="act-del" data-id="${a.id}">${icon('trash', 14)} Delete</button>
      </div>
    </div>

    ${st.hasTrack ? `
    <div class="card" style="margin-bottom:16px">
      <div class="card-head">
        <div>
          <div class="card-title">${icon('route', 17)} Route</div>
          <div class="card-sub">${a.points.length} GPS points · scrub elevation chart below to inspect route position</div>
        </div>
        <div class="seg">
          <button class="seg-btn ${v === 'pace' ? 'active' : ''}" data-action="act-mapstyle" data-id="${a.id}" data-v="pace">Pace</button>
          <button class="seg-btn ${v === 'plain' ? 'active' : ''}" data-action="act-mapstyle" data-id="${a.id}" data-v="plain">Plain</button>
        </div>
      </div>
      <div class="map-wrap"><div id="detail-map" class="map-host" style="--map-h:380px"></div>${mapControlsHtml()}</div>
      ${v === 'pace' ? `<div class="map-legend"><span>Slow</span><span class="lg-grad"></span><span>Fast</span></div>` : ''}
    </div>` : ''}

    <div class="dgrid" style="margin-bottom:16px">
      ${st.dist > 1 ? dcell('Distance', fmtDist(st.dist, u)) : ''}
      ${dcell('Moving time', fmtDur(st.moving))}
      ${st.dist > 1 && a.type !== 'gym' ? dcell('Avg pace', fmtPaceFull(st.avgPace, u)) : ''}
      ${st.dist > 1 ? dcell('Avg speed', fmtSpeed(st.avgSpeed, u)) : ''}
      ${st.gain > 0 ? dcell('Elev gain', fmtElev(st.gain, u)) : ''}
      ${dcell('Training Load', st.tss + ' TSS')}
      ${dcell('Calories', '≈ ' + Math.round(st.calories) + ' kcal')}
      ${a.hrAvg ? dcell('Avg HR', a.hrAvg + ' bpm') : ''}
      ${a.rpe ? dcell('Effort (RPE)', String(a.rpe)) : ''}
    </div>

    ${st.zones ? `
    <div class="card" style="margin-bottom:16px">
      <div class="card-head">
        <div>
          <div class="card-title">${icon('heart', 17)} Heart-Rate Zone Distribution</div>
          <div class="card-sub">Calibrated to Max HR ${App.settings.maxHr} bpm</div>
        </div>
      </div>
      <div class="zone-bar">
        ${st.zones.map(z => z.pct > 0 ? `<div class="zone-seg" style="width:${z.pct}%;background:${z.color}" title="${z.z}: ${z.pct}%"></div>` : '').join('')}
      </div>
      <div class="zone-list">
        ${st.zones.map(z => `
          <div class="zone-item">
            <div class="row" style="gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${z.color}"></span><span class="tiny muted">${z.z}</span></div>
            <div class="num" style="font-size:18px;font-weight:700;margin-top:4px">${z.pct}% <span class="tiny dim">${fmtDur(z.sec)}</span></div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    ${st.hasTrack && a.points.some(p => p.el != null) ? `
    <div class="card" style="margin-bottom:16px">
      <div class="card-title">${icon('mountain', 17)} Elevation Profile (Interactive Track Scrubber)</div>
      <div class="card-sub">Move cursor along the profile to pinpoint location on the route map</div>
      <div class="chart-box h180" style="margin-top:12px"><canvas id="elev-chart" class="chart-cv"></canvas></div>
    </div>` : ''}

    ${st.hasTrack && st.splits.length ? splitsCard(a, st) : ''}

    ${a.notes ? `<div class="card" style="margin-top:16px"><div class="card-title">${icon('pencil', 17)} Notes</div>
      <p class="muted" style="margin-top:8px;font-size:14px;white-space:pre-wrap">${escapeHtml(a.notes)}</p></div>` : ''}`;
  },
  mount(id) {
    const a = App.acts.find(x => x.id === id);
    if (!a) return;
    const u = App.settings.units;
    const st = actStats(a);
    let activeMap = null;
    if (st.hasTrack) {
      const cv = $('#detail-map');
      if (cv) {
        activeMap = new RouteMap(cv, {
          colorBy: (this.mapStyle === 'plain') ? 'none' : 'pace',
          type: a.type, unitM: unitMeters(u), padding: 44,
        });
        RouteMap._last = activeMap;
        activeMap.setPoints(a.points, true);
      }
      if (st.splits.length) {
        const cv2 = $('#splits-chart');
        if (cv2) {
          const avgP = avg(st.splits.map(s => s.t / (s.d / unitMeters(u))));
          barChart(cv2, {
            labels: st.splits.map(s => String(s.n)),
            values: st.splits.map(s => s.t / (s.d / unitMeters(u))),
            colors: st.splits.map(s => (s.t / (s.d / unitMeters(u))) <= avgP ? cssVar('--lime') : cssVar('--accent')),
            yFmt: v => fmtPace(v, u),
            tip: i => `<div class="tt-t">${u === 'imperial' ? 'Mile' : 'Km'} ${st.splits[i].n}</div>
              <div class="tt-row"><span>Pace</span><b>${fmtPaceFull(st.splits[i].t / (st.splits[i].d / unitMeters(u)), u)}</b></div>`,
          });
        }
      }
      const cv3 = $('#elev-chart');
      if (cv3) {
        const sm = smoothSeries(a.points.map(p => p.el), 4);
        const xs = a.points.map((_, i) => i);
        const cum = cumulativeDistances(a.points);
        lineChart(cv3, {
          xs,
          series: [{ name: 'Elev', ys: sm.map(v => v == null ? NaN : (u === 'imperial' ? v * 3.28084 : v)), color: cssVar('--hike'), fill: true }],
          yFmt: v => Math.round(v) + (u === 'imperial' ? 'ft' : 'm'),
          xTick: i => fmtDist(cum[i] || 0, u),
          onHover: i => { if (activeMap) activeMap.setHighlightIndex(i); },
          tip: i => `<div class="tt-t">${fmtDist(cum[i] || 0, u)}</div>
            <div class="tt-row"><span>Elev</span><b>${fmtElev(a.points[i].el, u)}</b></div>`,
        });
      }
    }
  },
};
function dcell(label, value) { return `<div class="dcell"><div class="stat-label">${label}</div><div class="stat-value num">${value}</div></div>`; }
function splitsCard(a, st) {
  const u = App.settings.units;
  const unitM = unitMeters(u);
  const avgP = st.dist > 0 ? st.moving / st.dist * unitM : 0;
  const rows = st.splits.map(s => {
    const p = s.t / (s.d / unitM);
    const diff = p - avgP;
    const faster = diff <= 0;
    const w = clamp(Math.abs(diff) / (avgP * 0.25 || 1) * 50, 4, 100);
    return `<tr>
      <td><b>${s.n}</b></td>
      <td class="num">${fmtDist(s.d, u)}</td>
      <td class="num">${fmtDur(s.t)}</td>
      <td class="num">${fmtPace(p, u)}</td>
      <td><span class="delta ${faster ? 'up' : 'down'}">${faster ? '−' : '+'}${fmtPace(Math.abs(diff), u)}</span></td>
      <td style="width:90px"><div class="split-bar"><i class="${faster ? 'faster' : ''}" style="width:${w}%"></i></div></td>
    </tr>`;
  }).join('');
  return `
  <div class="card" style="margin-top:16px">
    <div class="card-title">${icon('clock', 17)} Splits · per ${u === 'imperial' ? 'mile' : 'km'}</div>
    <div class="table-wrap" style="margin-top:12px">
      <table class="table">
        <thead><tr><th>#</th><th class="num">Dist</th><th class="num">Time</th><th class="num">Pace</th><th>vs avg</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="chart-box h180" style="margin-top:16px"><canvas id="splits-chart" class="chart-cv"></canvas></div>
  </div>`;
}
regAction('act-open', d => go('activity/' + d.id));
regAction('act-mapstyle', d => { VIEWS.activity.mapStyle = d.v; renderCurrent(); });
regAction('act-del', async d => {
  const a = App.acts.find(x => x.id === d.id);
  if (!a) return;
  if (!(await confirmDialog({ title: 'Delete activity?', message: `“${a.title || typeLabel(a)}” will be permanently removed.`, ok: 'Delete', danger: true }))) return;
  await App.deleteActivity(a.id);
  toast('Activity deleted.');
  go('activities');
});
regAction('act-edit', d => {
  const a = App.acts.find(x => x.id === d.id);
  if (!a) return;
  openModal({
    title: 'Edit activity',
    body: `
      <div class="frow">
        <div class="field"><label class="label" for="em-title">Title</label><input class="input" id="em-title" maxlength="60" value="${escapeHtml(a.title || '')}"></div>
        <div class="field"><label class="label" for="em-type">Type</label>${typeSelectHtml('em-type', a.type)}</div>
      </div>
      <div class="field" style="margin-top:14px"><label class="label" for="em-notes">Notes</label>
        <textarea class="textarea" id="em-notes" maxlength="500">${escapeHtml(a.notes || '')}</textarea></div>`,
    actions: [
      { label: 'Cancel', cls: 'btn-ghost', onclick: () => closeModal() },
      { label: 'Save', cls: 'btn-primary', icon: 'check', onclick: async () => {
        a.title = $('#em-title').value.trim() || a.title;
        a.type = $('#em-type').value;
        a.notes = $('#em-notes').value.trim();
        await App.saveActivity(a);
        closeModal(); toast('Activity updated.', 'ok'); renderCurrent();
      } },
    ],
  });
});

/* ---------------- Progress & Training Load View ---------------- */
VIEWS.progress = {
  title: 'Progress & Load',
  period: 'week',
  head() { return { title: 'Progress & Training Load', sub: 'Banister CTL/ATL/TSB model, volume progression & consistency' }; },
  render() {
    const u = App.settings.units;
    const p = this.period;
    if (!App.acts.length) return `<div class="card" style="padding:40px 24px">${emptyState('progress', 'No analytics yet',
      'Record a few activities and this page fills up with Fitness/Fatigue/Form modeling, distance progression, pace trends and consistency heatmaps.', 'go-record', 'Record activity')}
      <div class="divider"></div>
      <div class="row wrap" style="justify-content:center;gap:10px">
        <button class="btn btn-outline" data-action="rec-manual">${icon('pencil', 15)} Log manually</button>
        <button class="btn btn-lime" data-action="demo-load">${icon('zap', 15)} Load 5-month demo dataset</button>
      </div></div>`;
    const ld = App.load || { latest: { ctl: 0, atl: 0, tsb: 0 }, status: 'Balanced', badge: 'up' };
    return `
    ${demoBannerHtml()}
    <div class="spread" style="margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <div class="seg">
        <button class="seg-btn ${p === 'week' ? 'active' : ''}" data-action="pg-period" data-p="week">Weekly</button>
        <button class="seg-btn ${p === 'month' ? 'active' : ''}" data-action="pg-period" data-p="month">Monthly</button>
        <button class="seg-btn ${p === 'year' ? 'active' : ''}" data-action="pg-period" data-p="year">Yearly</button>
      </div>
      <div class="row" style="gap:8px">
        <a class="btn btn-outline btn-sm" href="#/records" data-nav="records">${icon('trophy', 14)} Records</a>
        <a class="btn btn-outline btn-sm" href="#/goals" data-nav="goals">${icon('target', 14)} Goals</a>
      </div>
    </div>

    <div id="pg-kpis" class="kpis"></div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-head">
        <div>
          <div class="card-title">${icon('zap', 17)} Performance Management Chart (Fitness · Fatigue · Form)</div>
          <div class="card-sub">60-day Banister Impulse-Response model — CTL (42d Fitness), ATL (7d Fatigue), TSB (Form)</div>
        </div>
        <div class="row wrap" style="gap:12px">
          <span class="chip"><span class="cdot" style="--tc:#38BDF8"></span>Fitness (CTL): <b>${Math.round(ld.latest.ctl)}</b></span>
          <span class="chip"><span class="cdot" style="--tc:#FF5A1F"></span>Fatigue (ATL): <b>${Math.round(ld.latest.atl)}</b></span>
          <span class="chip"><span class="cdot" style="--tc:#C8F542"></span>Form (TSB): <b>${ld.latest.tsb >= 0 ? '+' : ''}${ld.latest.tsb.toFixed(1)}</b></span>
        </div>
      </div>
      <div class="chart-box h260"><canvas id="pmc-chart" class="chart-cv"></canvas></div>
    </div>

    <div class="grid g-2col-b">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">${icon('progress', 17)} Distance progression</div>
            <div class="card-sub" id="vol-sub"></div>
          </div>
        </div>
        <div class="chart-box"><canvas id="vol-chart" class="chart-cv"></canvas></div>
      </div>
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">${icon('upTrend', 17)} Cumulative ${unitLabel(u)}</div>
            <div class="card-sub" id="cum-sub"></div>
          </div>
        </div>
        <div class="chart-box"><canvas id="cum-chart" class="chart-cv"></canvas></div>
      </div>
    </div>

    <div class="grid g-2col-b" style="margin-top:16px">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">${icon('clock', 17)} Pace trend</div>
            <div class="card-sub">Distance-weighted average pace per month — lower is faster</div>
          </div>
        </div>
        <div class="chart-box h180"><canvas id="pace-chart" class="chart-cv"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title">${icon('list', 17)} Activity mix</div>
        <div class="card-sub">Last 12 months by distance</div>
        <div class="dist-list" id="type-dist" style="margin-top:14px"></div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-head">
        <div>
          <div class="card-title">${icon('calendar', 17)} Training consistency</div>
          <div class="card-sub">Every day of the last 26 weeks</div>
        </div>
        <div class="tiny dim" id="cons-stat"></div>
      </div>
      <div class="heat-scroll"><div class="heat-wrap"><canvas id="heat-chart"></canvas></div></div>
    </div>`;
  },
  mount() {
    if (!App.acts.length) return;
    const u = App.settings.units;
    const unitM = unitMeters(u);
    const p = this.period;
    const rng = periodRange(p);
    const cur = rangeStats(actsInRange(rng.cur.from, rng.cur.to));
    const prev = rangeStats(actsInRange(rng.prev.from, rng.prev.to));
    const kpi = (label, valTxt, delta, subTxt) => `
      <div class="card hoverable">
        <div class="stat-label">${label}</div>
        <div class="stat-value num">${valTxt}</div>
        <div class="stat-sub">${delta != null ? `<span class="delta ${delta >= 0 ? 'up' : 'down'}">${fmtPct(delta)}</span>` : '<span class="delta flat">—</span>'} ${subTxt || ''}</div>
      </div>`;
    $('#pg-kpis').innerHTML =
      kpi('Distance', fmtDist(cur.dist, u), prev.dist > 0 ? (cur.dist - prev.dist) / prev.dist : null, 'vs prior ' + p) +
      kpi('Training Load', cur.tss + ' TSS', prev.tss > 0 ? (cur.tss - prev.tss) / prev.tss : null, 'stress score') +
      kpi('Moving Time', fmtDur(cur.dur), prev.dur > 0 ? (cur.dur - prev.dur) / prev.dur : null, 'duration') +
      kpi('Activities', String(cur.count), prev.count > 0 ? (cur.count - prev.count) / prev.count : null, 'sessions') +
      kpi('Elev Gain', fmtElev(cur.gain, u), prev.gain > 0 ? (cur.gain - prev.gain) / prev.gain : null, 'climbed');

    const pmc = App.load.series;
    lineChart($('#pmc-chart'), {
      xs: pmc.map(d => d.date),
      series: [
        { name: 'Fitness (CTL)', ys: pmc.map(d => d.ctl), color: '#38BDF8', fill: true },
        { name: 'Fatigue (ATL)', ys: pmc.map(d => d.atl), color: '#FF5A1F' },
        { name: 'Form (TSB)', ys: pmc.map(d => d.tsb), color: '#C8F542', dash: [4, 4] },
      ],
      yFmt: v => String(Math.round(v)),
      xTick: i => MON_NAMES[pmc[i].date.getMonth()] + ' ' + pmc[i].date.getDate(),
      tip: i => {
        const d = pmc[i];
        return `<div class="tt-t">${fmtDate(d.date)}</div>
          <div class="tt-row"><span>Fitness (CTL)</span><b>${d.ctl.toFixed(1)}</b></div>
          <div class="tt-row"><span>Fatigue (ATL)</span><b>${d.atl.toFixed(1)}</b></div>
          <div class="tt-row"><span>Form (TSB)</span><b>${d.tsb >= 0 ? '+' : ''}${d.tsb.toFixed(1)}</b></div>
          <div class="tt-row"><span>Daily Load</span><b>${d.tss} TSS</b></div>`;
      },
    });

    let bars, labels, sub;
    if (p === 'week') {
      bars = weeklyBuckets(12);
      labels = bars.map(b => MON_NAMES[b.from.getMonth()] + ' ' + b.from.getDate());
      sub = 'Distance per week, last 12 weeks';
    } else if (p === 'month') {
      bars = monthlyBuckets(12);
      labels = bars.map(b => MON_NAMES[b.from.getMonth()]);
      sub = 'Distance per month, last 12 months';
    } else {
      const byYear = new Map();
      for (const a of App.acts) {
        const y = new Date(a.start).getFullYear();
        byYear.set(y, (byYear.get(y) || 0) + (a.distance || 0));
      }
      bars = Array.from(byYear.entries()).sort().map(([y, d]) => ({ from: new Date(y, 0, 1), dist: d }));
      labels = bars.map(b => String(b.from.getFullYear()));
      sub = 'Distance per year';
    }
    $('#vol-sub').textContent = sub + ' (' + unitLabel(u) + ')';
    barChart($('#vol-chart'), {
      labels,
      values: bars.map(b => b.dist / unitM),
      colors: bars.map((_, i) => i === bars.length - 1 ? cssVar('--accent') : cssVar('--card-3')),
      yFmt: v => v >= 10 ? Math.round(v) : v.toFixed(1),
      tip: i => `<div class="tt-t">${labels[i]}</div><div class="tt-row"><span>Distance</span><b>${fmtDist(bars[i].dist, u)}</b></div>`,
    });

    const cum = cumulativeSeries(p, rng);
    $('#cum-sub').textContent = cum.sub + ' (' + unitLabel(u) + ')';
    lineChart($('#cum-chart'), {
      xs: cum.labels,
      series: [
        { name: 'Previous', ys: cum.prev, color: cssVar('--text-3'), dash: [5, 5] },
        { name: 'Current', ys: cum.cur, color: cssVar('--accent'), fill: true },
      ],
      yFmt: v => v >= 10 ? Math.round(v) : v.toFixed(1),
      xTick: i => cum.tickLabels[i],
      tip: i => `<div class="tt-t">${cum.labels[i]}</div>` + cum.series.map(s =>
        `<div class="tt-row"><span>${s.name}</span><b>${isFinite(s.ys[i]) ? fmtDist(s.ys[i] * unitM, u) : '—'}</b></div>`).join(''),
    });

    const pace = paceTrend(12);
    lineChart($('#pace-chart'), {
      xs: pace.labels,
      series: [
        { name: 'Trend', ys: pace.trend, color: cssVar('--text-3'), dash: [5, 5] },
        { name: 'Pace', ys: pace.ys, color: cssVar('--lime') },
      ],
      yFmt: v => fmtPace(v / unitM, u),
      xTick: i => pace.labels[i],
      emptyMsg: 'No paced activities yet',
      tip: i => `<div class="tt-t">${pace.fullLabels[i]}</div>
        <div class="tt-row"><span>Avg pace</span><b>${isFinite(pace.ys[i]) ? fmtPaceFull(pace.ys[i] / unitM, u) : '—'}</b></div>`,
    });

    const yearAgo = new Date(Date.now() - 365 * DAY_MS);
    const mix = rangeStats(actsInRange(yearAgo, new Date())).byType;
    const mixTotal = Object.values(mix).reduce((s, v) => s + v, 0) || 1;
    const order = Object.entries(mix).sort((a, b) => b[1] - a[1]);
    $('#type-dist').innerHTML = order.length ? order.map(([t, d]) => `
      <div class="dist-row">
        <div class="spread"><span class="row" style="gap:8px"><i class="cdot" style="width:8px;height:8px;border-radius:50%;background:${ACT_TYPES[t] ? ACT_TYPES[t].color : 'var(--custom)'};display:inline-block"></i>${ACT_TYPES[t] ? ACT_TYPES[t].label : t}</span>
          <span class="muted">${fmtDist(d, u)} · ${Math.round(d / mixTotal * 100)}%</span></div>
        <div class="pb"><div class="pb-fill" style="width:${Math.max(3, d / mixTotal * 100)}%;background:${ACT_TYPES[t] ? ACT_TYPES[t].color : 'var(--custom)'}"></div></div>
      </div>`).join('') : '<div class="empty-text">No activities in the last 12 months.</div>';

    const days = [];
    const start = addDays(startOfWeek(new Date(), App.settings.weekStart), -26 * 7 + 1);
    const dayMap = activityDayMap(start, new Date(Date.now() + DAY_MS));
    for (let d = new Date(start); d <= new Date(); d = addDays(d, 1)) {
      const e = dayMap.get(dayKey(d)) || { dist: 0, count: 0 };
      days.push({ date: new Date(d), value: e.dist, count: e.count });
    }
    const nz = days.filter(d => d.value > 0).map(d => d.value).sort((a, b) => a - b);
    const th = [percentile(nz, 0.25), percentile(nz, 0.5), percentile(nz, 0.8)];
    const activeDays = days.filter(d => d.count > 0).length;
    $('#cons-stat').textContent = activeDays + ' active of last ' + days.length + ' days';
    heatGrid($('#heat-chart'), {
      days,
      colorFor: v => {
        if (v <= 0) return cssVar('--card-3');
        if (v <= th[0]) return hexAlpha('#FF5A1F', 0.28);
        if (v <= th[1]) return hexAlpha('#FF5A1F', 0.5);
        if (v <= th[2]) return hexAlpha('#FF5A1F', 0.72);
        return '#FF5A1F';
      },
      tip: d => `<div class="tt-t">${relDay(d.date)}</div><div class="tt-row"><span>Distance</span><b>${d.value ? fmtDist(d.value, u) : '—'}</b></div>`,
    });
  },
};
regAction('pg-period', d => { VIEWS.progress.period = d.p; renderCurrent(); });
function periodRange(p) {
  if (p === 'month') {
    const from = startOfMonth(new Date());
    return { cur: { from, to: endOfMonth(new Date()) }, prev: { from: new Date(from.getFullYear(), from.getMonth() - 1, 1), to: from } };
  }
  if (p === 'year') {
    const from = startOfYear(new Date());
    return { cur: { from, to: new Date(from.getFullYear() + 1, 0, 1) }, prev: { from: new Date(from.getFullYear() - 1, 0, 1), to: from } };
  }
  return { cur: weekBounds(0), prev: weekBounds(-1) };
}
function dailyCumulative(from, to) {
  const days = Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);
  const perDay = new Array(Math.max(1, days)).fill(0);
  for (const a of actsInRange(from, to)) {
    const idx = Math.floor((startOfDay(new Date(a.start)) - startOfDay(from)) / DAY_MS);
    if (idx >= 0 && idx < perDay.length) perDay[idx] += a.distance || 0;
  }
  const cum = []; let s = 0;
  for (const v of perDay) { s += v; cum.push(s); }
  return cum;
}
function cumulativeSeries(p, rng) {
  const u = App.settings.units;
  const unitM = unitMeters(u);
  if (p === 'week') {
    const cur = dailyCumulative(rng.cur.from, rng.cur.to);
    const prev = dailyCumulative(rng.prev.from, rng.prev.to);
    const labels = cur.map((_, i) => DOW_NAMES[addDays(rng.cur.from, i).getDay()]);
    return { cur: cur.map(v => v / unitM), prev: prev.map(v => v / unitM), labels, tickLabels: labels,
      sub: 'This week vs last week', series: [{ name: 'This week' }, { name: 'Last week' }] };
  }
  if (p === 'month') {
    const cur = dailyCumulative(rng.cur.from, rng.cur.to);
    const prev = dailyCumulative(rng.prev.from, rng.prev.to);
    const n = cur.length;
    const prevPad = prev.slice(0, n);
    while (prevPad.length < n) prevPad.push(NaN);
    const labels = cur.map((_, i) => String(i + 1));
    return { cur: cur.map(v => v / unitM), prev: prevPad.map(v => v / unitM), labels,
      tickLabels: labels.map(i => (+i % 5 === 0 ? i : '')),
      sub: 'This month vs last month', series: [{ name: 'This month' }, { name: 'Last month' }] };
  }
  const mc = (from, to) => {
    const arr = new Array(12).fill(0);
    for (const a of actsInRange(from, to)) arr[new Date(a.start).getMonth()] += a.distance || 0;
    const cum = []; let s = 0;
    for (const v of arr) { s += v; cum.push(s); }
    return cum;
  };
  const cur = mc(rng.cur.from, rng.cur.to);
  const prev = mc(rng.prev.from, rng.prev.to);
  const labels = MON_NAMES.slice();
  return { cur: cur.map(v => v / unitM), prev: prev.map(v => v / unitM), labels, tickLabels: labels,
    sub: 'This year vs last year', series: [{ name: 'This year' }, { name: 'Last year' }] };
}
function paceTrend(months) {
  const out = [];
  for (const b of monthlyBuckets(months)) {
    const list = actsInRange(b.from, b.to).filter(a => (a.distance || 0) > 500 && a.type !== 'gym');
    if (!list.length) { out.push(NaN); continue; }
    let dur = 0, dist = 0;
    for (const a of list) { dur += a.duration || 0; dist += a.distance || 0; }
    out.push(dist > 0 ? dur / dist * KM : NaN);
  }
  const labels = monthlyBuckets(months).map(b => MON_NAMES[b.from.getMonth()]);
  const pts = out.map((y, x) => ({ x, y })).filter(p => isFinite(p.y));
  const lr = linreg(pts);
  const trend = out.map((_, x) => lr.m * x + lr.b);
  return { ys: out, trend, labels: labels.map((l, i) => (i % 2 === 0 ? l : '')), fullLabels: labels };
}

/* ---------------- Personal Records & Goals Views ---------------- */
VIEWS.records = {
  title: 'Personal Records',
  head() { return { title: 'Personal Records', sub: 'Rolling best efforts & peak distance milestones' }; },
  render() {
    const u = App.settings.units;
    const pr = App.pr || computeRecords(App.acts);
    const act = id => App.acts.find(a => a.id === id);
    const defs = [
      { key: 'f1k', icon: 'zap', color: 'var(--run)', label: 'Fastest 1 km', fmt: v => fmtDur(v) + ' <span class="unit">min</span>' },
      { key: 'f5k', icon: 'zap', color: 'var(--run)', label: 'Fastest 5 km', fmt: v => fmtDur(v) + ' <span class="unit">min</span>' },
      { key: 'f10k', icon: 'zap', color: 'var(--run)', label: 'Fastest 10 km', fmt: v => fmtDur(v) + ' <span class="unit">min</span>' },
      { key: 'longestRun', icon: 'run', color: 'var(--run)', label: 'Longest run', fmt: v => fmtDist(v, u) },
      { key: 'longestRide', icon: 'cycle', color: 'var(--cycle)', label: 'Longest ride', fmt: v => fmtDist(v, u) },
      { key: 'highestGain', icon: 'mountain', color: 'var(--hike)', label: 'Highest elevation gain', fmt: v => fmtElev(v, u) },
      { key: 'longestWorkout', icon: 'clock', color: 'var(--gym)', label: 'Longest workout', fmt: v => fmtDurLong(v) },
    ];
    if (!App.acts.length) return `<div class="card">${emptyState('trophy', 'No records yet',
      'Personal records are scanned automatically across rolling GPS track segments whenever you log an activity.', 'go-record', 'Record activity')}</div>`;
    return `
    ${demoBannerHtml()}
    <div class="pr-grid">
      ${defs.map(def => {
        const r = pr[def.key];
        const a = r ? act(r.actId) : null;
        if (!r) return `
          <div class="card pr-card pr-empty" style="--tc:${def.color}">
            <div class="pr-ico">${icon(def.icon, 21)}</div>
            <div class="card-title" style="margin-top:12px">${def.label}</div>
            <div class="pr-value">—</div>
            <div class="pr-sub">Not achieved yet</div>
          </div>`;
        return `
        <div class="card pr-card hoverable" style="--tc:${def.color}">
          <div class="row spread"><div class="pr-ico">${icon(def.icon, 21)}</div></div>
          <div class="card-title" style="margin-top:12px">${def.label}</div>
          <div class="pr-value">${def.fmt(r.value)} ${r.demo ? '<span class="chip chip-demo">DEMO</span>' : ''}</div>
          <div class="pr-sub">${r.manual ? 'Manual entry' : 'GPS measured'} · ${fmtDate(new Date(r.date))}</div>
          ${a ? `<button class="pr-link" data-action="act-open" data-id="${a.id}">View activity ${icon('chevR', 13)}</button>` : ''}
        </div>`;
      }).join('')}
    </div>`;
  },
};

VIEWS.goals = {
  title: 'Goals',
  head() { return { title: 'Goals', sub: 'Weekly targets, milestones and streaks' }; },
  render() {
    const u = App.settings.units;
    const wk = goalProgress({ kind: 'weekly-distance', targetKm: App.settings.weeklyGoalKm, type: App.settings.weeklyGoalType });
    const mo = goalProgress({ kind: 'monthly-count', targetCount: App.settings.monthlyGoalCount, type: 'all' });
    const active = App.goals.filter(g => !g.completedAt);
    const done = App.goals.filter(g => g.completedAt);
    const daysLeft = Math.max(0, Math.ceil((weekBounds(0).to - new Date()) / DAY_MS));
    return `
    ${demoBannerHtml()}
    <div class="spread" style="margin-bottom:16px">
      <div></div>
      <button class="btn btn-primary" data-action="goal-add">${icon('plus', 16)} New goal</button>
    </div>
    <div class="goal-grid">
      ${goalCard({
        icon: 'progress', color: 'var(--accent)', label: 'Weekly distance',
        sub: (App.settings.weeklyGoalType === 'all' ? 'All activities' : ACT_TYPES[App.settings.weeklyGoalType].label) + ' per week',
        p: wk, pctTxt: Math.round(wk.pct * 100) + '%',
        foot: `${wk.value.toFixed(1)} / ${wk.target.toFixed(1)} ${unitLabel(u)} · ${daysLeft}d left`,
        editable: true,
      })}
      ${goalCard({
        icon: 'calendar', color: 'var(--cycle)', label: 'Monthly activity target',
        sub: 'Sessions logged this month',
        p: mo, pctTxt: Math.round(mo.pct * 100) + '%',
        foot: `${Math.floor(mo.value)} / ${Math.floor(mo.target)} activities`,
        editable: true,
      })}
      ${active.map(g => goalCardFromGoal(g)).join('')}
    </div>
    ${done.length ? `<div class="section-title" style="margin-top:26px">${icon('trophy', 17)} Achieved</div>
      <div class="goal-grid">${done.map(g => goalCardFromGoal(g)).join('')}</div>` : ''}`;
  },
};
function goalCard(o) {
  const pct = clamp(o.p.pct, 0, 1);
  const done = o.p.over;
  return `
  <div class="card goal-card hoverable" style="--tc:${o.color}">
    <div class="goal-head">
      <div class="goal-ico">${icon(o.icon, 21)}</div>
      <div class="grow"><div class="card-title">${o.label}</div><div class="card-sub">${o.sub}</div></div>
      ${done ? `<span class="done-chip">${icon('trophy', 15)} Done</span>` : `<div class="goal-pct num">${o.pctTxt}</div>`}
    </div>
    <div class="pb"><div class="pb-fill ${done ? 'lime' : ''}" style="width:${Math.max(2, pct * 100)}%;background:${done ? '' : o.color}"></div></div>
    <div class="goal-foot">
      <span>${o.foot}</span>
      ${o.editable ? `<a href="#/settings" data-nav="settings" class="tiny" style="color:var(--accent-hi);font-weight:600">Edit</a>`
        : `<button class="tiny" data-action="goal-del" data-id="${o.id}" style="color:var(--text-3);font-weight:600">Remove</button>`}
    </div>
  </div>`;
}
function goalCardFromGoal(g) {
  const p = goalProgress(g);
  return goalCard({
    id: g.id, icon: 'target', color: 'var(--lime)',
    label: goalLabel(g), sub: 'Custom target', p,
    pctTxt: Math.round(clamp(p.pct, 0, 1) * 100) + '%',
    foot: `${p.value.toFixed(1)} / ${p.target.toFixed(1)} ${p.unit}`,
  });
}
regAction('goal-add', () => {
  openModal({
    title: 'New goal',
    body: `
      <div class="field"><label class="label" for="ng-kind">Goal type</label>
        <select class="select" id="ng-kind">
          <option value="milestone-distance">Milestone — total distance (km)</option>
          <option value="milestone-duration">Milestone — total training hours</option>
          <option value="milestone-streak">Challenge — activity streak (days)</option>
          <option value="weekly-distance">Recurring — distance per week (km)</option>
          <option value="monthly-count">Recurring — activities per month</option>
        </select></div>
      <div class="frow" style="margin-top:14px">
        <div class="field"><label class="label" for="ng-target">Target value</label><input class="input" id="ng-target" inputmode="decimal" placeholder="e.g. 500"></div>
        <div class="field"><label class="label" for="ng-type">Sport filter</label>
          <select class="select" id="ng-type"><option value="all">All activities</option>
            ${Object.keys(ACT_TYPES).map(t => `<option value="${t}">${ACT_TYPES[t].label}</option>`).join('')}</select></div>
      </div>`,
    actions: [
      { label: 'Cancel', cls: 'btn-ghost', onclick: () => closeModal() },
      { label: 'Create goal', cls: 'btn-primary', icon: 'check', onclick: () => {
        const kind = $('#ng-kind').value;
        const val = parseFloat(($('#ng-target').value || '').replace(',', '.'));
        if (!isFinite(val) || val <= 0) return toast('Enter a target > 0.', 'err');
        const g = { id: uid(), kind, type: $('#ng-type').value, createdAt: Date.now(), completedAt: null };
        if (kind === 'milestone-distance' || kind === 'weekly-distance') g.targetKm = val;
        else if (kind === 'milestone-duration') g.targetHours = val;
        else if (kind === 'milestone-streak') g.targetDays = Math.round(val);
        else g.targetCount = Math.round(val);
        App.saveGoal(g).then(() => { closeModal(); toast('Goal created.', 'ok'); renderCurrent(); });
      } },
    ],
  });
});
regAction('goal-del', async d => {
  await App.deleteGoal(d.id); toast('Goal removed.'); renderCurrent();
});

/* ---------------- Settings & Profile View ---------------- */
VIEWS.settings = {
  title: 'Settings',
  head() { return { title: 'Profile & Settings', sub: 'Athlete profile, permissions, physiological zones & local data' }; },
  render() {
    const s = App.settings;
    const totalKm = sum(App.acts.map(a => a.distance || 0)) / KM;
    const initial = (s.name || 'S').trim().charAt(0).toUpperCase();
    const segBtn = (group, val, label) =>
      `<button class="seg-btn ${s[group] === val ? 'active' : ''}" data-action="set-seg" data-key="${group}" data-val="${val}">${label}</button>`;
    return `
    ${demoBannerHtml()}

    <div class="card profile-head">
      <div class="avatar" data-action="photo-pick" role="button" tabindex="0" data-tip="Change photo">
        ${s.photo ? `<img src="${s.photo}" alt="Profile photo">` : initial}
        <div class="avatar-edit">${icon('camera', 20)}</div>
      </div>
      <input type="file" id="photo-file" accept="image/*" class="hide">
      <div class="grow">
        <div class="display" style="font-weight:700;font-size:24px">${escapeHtml(s.name || 'Solo athlete')}</div>
        <div class="muted small" style="margin-top:3px">
          ${App.acts.length} activities · ${totalKm.toFixed(0)} km logged · Max HR ${s.maxHr} bpm · Resting HR ${s.restHr || 60} bpm
        </div>
        ${s.bio ? `<div class="tiny dim" style="margin-top:4px">${escapeHtml(s.bio)}</div>` : ''}
      </div>
      <div class="row wrap">
        ${s.photo ? `<button class="btn btn-outline btn-sm" data-action="photo-remove">${icon('trash', 14)} Remove photo</button>` : ''}
      </div>
    </div>

    <div class="set-grid" style="margin-top:16px">
      <div class="card">
        <div class="card-title">${icon('user', 17)} Athlete Profile &amp; Physiology</div>
        <div style="margin-top:8px">
          <div class="set-row">
            <div><div class="lab">Display Name</div><div class="desc">Shown on your dashboard and profile header.</div></div>
            <div class="set-ctl"><input class="input" id="set-name" style="width:185px" maxlength="40" value="${escapeHtml(s.name)}" placeholder="Your name"></div>
          </div>
          <div class="set-row">
            <div><div class="lab">Training Focus / Bio</div><div class="desc">Current block goal or personal motto.</div></div>
            <div class="set-ctl"><input class="input" id="set-bio" style="width:185px" maxlength="90" value="${escapeHtml(s.bio || '')}" placeholder="e.g. Sub-40 10K build"></div>
          </div>
          <div class="set-row">
            <div><div class="lab">Body Weight</div><div class="desc">Used for MET calorie expenditure estimates.</div></div>
            <div class="set-ctl">
              <input class="input num-input" id="set-weight" inputmode="decimal" value="${s.weightKg || ''}" placeholder="70">
              <span class="dim">kg</span>
            </div>
          </div>
          <div class="set-row">
            <div><div class="lab">Resting Heart Rate</div><div class="desc">Baseline morning pulse for recovery tracking.</div></div>
            <div class="set-ctl">
              <input class="input num-input" id="set-resthr" inputmode="numeric" value="${s.restHr || 60}" placeholder="60">
              <span class="dim">bpm</span>
            </div>
          </div>
          <div class="set-row">
            <div><div class="lab">Max Heart Rate</div><div class="desc">Calibrates HR Zones 1–5 and TSS training load.</div></div>
            <div class="set-ctl">
              <input class="input num-input" id="set-maxhr" inputmode="numeric" value="${s.maxHr || 190}" placeholder="190">
              <span class="dim">bpm</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">${icon('gps', 17)} Permissions &amp; Device Sensors</div>
        <div class="card-sub" style="margin-top:4px">Hardware &amp; browser capabilities required for live tracking.</div>
        <div style="margin-top:8px">
          <div class="set-row">
            <div>
              <div class="lab">Location / GPS Access</div>
              <div class="desc" id="perm-geo-desc">Checking browser location permission…</div>
            </div>
            <div class="set-ctl"><button class="btn btn-outline btn-sm" data-action="perm-test-gps">${icon('gps', 14)} Verify GPS</button></div>
          </div>
          <div class="set-row">
            <div>
              <div class="lab">Voice Split Cues (Speech API)</div>
              <div class="desc">${'speechSynthesis' in window ? 'Supported by this browser' : 'Unavailable in this browser'}</div>
            </div>
            <div class="set-ctl"><button class="btn btn-outline btn-sm" data-action="perm-test-voice">${icon('volume', 14)} Test Audio</button></div>
          </div>
          <div class="set-row">
            <div>
              <div class="lab">Screen Wake Lock</div>
              <div class="desc">Keeps display awake during active GPS recording.</div>
            </div>
            <div class="set-ctl"><span class="chip">${'wakeLock' in navigator ? 'Supported' : 'Standard Sleep'}</span></div>
          </div>
          <div class="set-row">
            <div>
              <div class="lab">On-Device Storage</div>
              <div class="desc">Zero cloud sync — stored privately in ${DB.mode === 'idb' ? 'IndexedDB' : 'localStorage'}.</div>
            </div>
            <div class="set-ctl"><span class="chip" style="color:var(--ok)">Active</span></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">${icon('gear', 17)} Preferences &amp; Telemetry</div>
        <div style="margin-top:8px">
          <div class="set-row">
            <div><div class="lab">Units</div><div class="desc">Distance, pace and elevation everywhere.</div></div>
            <div class="set-ctl"><div class="seg">${segBtn('units', 'metric', 'km')}${segBtn('units', 'imperial', 'mi')}</div></div>
          </div>
          <div class="set-row">
            <div><div class="lab">Theme</div><div class="desc">Dark-first design, light when needed.</div></div>
            <div class="set-ctl"><div class="seg">${segBtn('theme', 'dark', 'Dark')}${segBtn('theme', 'light', 'Light')}${segBtn('theme', 'system', 'Auto')}</div></div>
          </div>
          <div class="set-row">
            <div><div class="lab">Voice Split Cues</div><div class="desc">Announce completed distance &amp; pace during GPS runs.</div></div>
            <div class="set-ctl"><button class="switch ${s.voiceCues ? 'on' : ''}" data-action="set-toggle" data-key="voiceCues" role="switch" aria-checked="${s.voiceCues}"></button></div>
          </div>
          <div class="set-row">
            <div><div class="lab">Auto-pause</div><div class="desc">Freeze timer automatically when stopped.</div></div>
            <div class="set-ctl"><button class="switch ${s.autoPause ? 'on' : ''}" data-action="set-toggle" data-key="autoPause" role="switch" aria-checked="${s.autoPause}"></button></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">${icon('target', 17)} Training Targets</div>
        <div style="margin-top:8px">
          <div class="set-row">
            <div><div class="lab">Weekly distance goal</div><div class="desc">Shown as the dashboard ring (km).</div></div>
            <div class="set-ctl">
              <input class="input num-input" id="set-wgoal" inputmode="decimal" value="${s.weeklyGoalKm}" placeholder="20">
              <span class="dim">km</span>
            </div>
          </div>
          <div class="set-row">
            <div><div class="lab">Goal counts</div><div class="desc">Activity filter for weekly goal.</div></div>
            <div class="set-ctl">
              <select class="select" id="set-wgoaltype" style="width:155px">
                <option value="all" ${s.weeklyGoalType === 'all' ? 'selected' : ''}>All activities</option>
                ${Object.keys(ACT_TYPES).map(t => `<option value="${t}" ${s.weeklyGoalType === t ? 'selected' : ''}>${ACT_TYPES[t].label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="set-row">
            <div><div class="lab">Monthly activity target</div><div class="desc">Sessions per month.</div></div>
            <div class="set-ctl"><input class="input num-input" id="set-mgoal" inputmode="numeric" value="${s.monthlyGoalCount}" placeholder="12"></div>
          </div>
          <div class="set-row">
            <div><div class="lab">GPS accuracy filter</div><div class="desc">Fixes worse than 3× this are excluded.</div></div>
            <div class="set-ctl" style="width:165px">
              <input type="range" id="set-acc" min="20" max="100" step="5" value="${s.accFilter}">
              <span class="num small" id="acc-val" style="width:36px;text-align:right">${s.accFilter}m</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">${icon('database', 17)} Data &amp; Privacy</div>
        <div class="card-sub" style="margin-top:4px">100% local — no accounts, no cloud, no tracking.</div>
        <div style="margin-top:8px">
          <div class="set-row">
            <div><div class="lab">Backup (JSON)</div><div class="desc">Full export: activities, goals, settings.</div></div>
            <div class="set-ctl"><button class="btn btn-outline btn-sm" data-action="export-json">${icon('download', 14)} Export</button></div>
          </div>
          <div class="set-row">
            <div><div class="lab">Restore backup</div><div class="desc">Merges a SOLO JSON backup into this device.</div></div>
            <div class="set-ctl">
              <button class="btn btn-outline btn-sm" data-action="import-json">${icon('upload', 14)} Import</button>
              <input type="file" id="json-file" accept=".json,application/json" class="hide">
            </div>
          </div>
          <div class="set-row">
            <div><div class="lab">Export all activities</div><div class="desc">CSV summary or combined GPX tracks.</div></div>
            <div class="set-ctl">
              <button class="btn btn-outline btn-sm" data-action="export-all-csv">${icon('download', 14)} CSV</button>
              <button class="btn btn-outline btn-sm" data-action="export-all-gpx">${icon('download', 14)} GPX</button>
            </div>
          </div>
          <div class="set-row">
            <div><div class="lab">Demo dataset</div><div class="desc">5 months of badged sample workouts &amp; load curves.</div></div>
            <div class="set-ctl">
              ${App.hasDemo()
                ? `<button class="btn btn-lime btn-sm" data-action="demo-remove">Remove demo data</button>`
                : `<button class="btn btn-outline btn-sm" data-action="demo-load">Load demo data</button>`}
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">${icon('lock', 17)} App Lock &amp; Security</div>
        <div class="card-sub" style="margin-top:4px">Device-local passcode gate and destructive data controls.</div>
        <div style="margin-top:8px">
          <div class="set-row">
            <div>
              <div class="lab">${s.lock.enabled ? 'Passcode Enabled' : 'Passcode Disabled'}</div>
              <div class="desc">Device-local 4–6 digit passcode gate.</div>
            </div>
            <div class="set-ctl">
              ${s.lock.enabled
                ? `<button class="btn btn-outline btn-sm" data-action="pin-disable">Disable</button>`
                : `<button class="btn btn-primary btn-sm" data-action="pin-setup">Set passcode</button>`}
            </div>
          </div>
          ${s.lock.enabled ? `<div class="set-row"><div><div class="lab">Change passcode</div><div class="desc">Update your 4–6 digit lock code.</div></div><div class="set-ctl"><button class="btn btn-outline btn-sm" data-action="pin-change">Change</button></div></div>` : ''}
          <div class="set-row">
            <div><div class="lab" style="color:var(--err)">Delete everything</div><div class="desc">Permanently erases all local activities, goals, and settings.</div></div>
            <div class="set-ctl"><button class="btn btn-danger btn-sm" data-action="wipe">${icon('trash', 14)} Delete all</button></div>
          </div>
        </div>
      </div>
    </div>`;
  },
  mount() {
    const save = () => { saveSettings(); App.recompute(); };
    const nameEl = $('#set-name');
    if (nameEl) nameEl.addEventListener('change', () => { App.settings.name = nameEl.value.trim(); save(); renderCurrent(); });
    const bioEl = $('#set-bio');
    if (bioEl) bioEl.addEventListener('change', () => { App.settings.bio = bioEl.value.trim(); save(); toast('Profile bio updated.', 'ok'); renderCurrent(); });
    const wEl = $('#set-weight');
    if (wEl) wEl.addEventListener('change', () => {
      const v = parseFloat(wEl.value.replace(',', '.'));
      App.settings.weightKg = isFinite(v) && v > 20 && v < 300 ? v : null;
      save(); toast('Weight updated.', 'ok');
    });
    const rhrEl = $('#set-resthr');
    if (rhrEl) rhrEl.addEventListener('change', () => {
      const v = parseInt(rhrEl.value);
      if (isFinite(v) && v >= 30 && v <= 120) { App.settings.restHr = v; save(); toast('Resting HR updated.', 'ok'); renderCurrent(); }
    });
    const hrEl = $('#set-maxhr');
    if (hrEl) hrEl.addEventListener('change', () => {
      const v = parseInt(hrEl.value);
      if (isFinite(v) && v >= 110 && v <= 230) { App.settings.maxHr = v; save(); toast('Max HR updated — zones & TSS recalibrated.', 'ok'); renderCurrent(); }
    });
    updateGeoPermStatus();
    const wg = $('#set-wgoal');
    if (wg) wg.addEventListener('change', () => {
      const v = parseFloat(wg.value.replace(',', '.'));
      if (isFinite(v) && v > 0 && v < 2000) { App.settings.weeklyGoalKm = v; save(); toast('Weekly goal updated.', 'ok'); }
    });
    const wgt = $('#set-wgoaltype');
    if (wgt) wgt.addEventListener('change', () => { App.settings.weeklyGoalType = wgt.value; save(); });
    const mg = $('#set-mgoal');
    if (mg) mg.addEventListener('change', () => {
      const v = parseInt(mg.value);
      if (isFinite(v) && v > 0 && v < 500) { App.settings.monthlyGoalCount = v; save(); }
    });
    const acc = $('#set-acc');
    if (acc) acc.addEventListener('input', () => { $('#acc-val').textContent = acc.value + 'm'; });
    acc && acc.addEventListener('change', () => { App.settings.accFilter = +acc.value; save(); });
  },
};
regAction('set-seg', d => {
  let v = d.val;
  if (d.key === 'weekStart') v = +v;
  App.settings[d.key] = v;
  saveSettings();
  if (d.key === 'theme') applyTheme();
  renderCurrent();
});
regAction('set-toggle', d => { App.settings[d.key] = !App.settings[d.key]; saveSettings(); renderCurrent(); });
async function updateGeoPermStatus() {
  const el = $('#perm-geo-desc');
  if (!el) return;
  if (!navigator.geolocation) { el.textContent = 'Geolocation API not available in this context.'; return; }
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const res = await navigator.permissions.query({ name: 'geolocation' });
      const labels = { granted: 'Granted — ready for outdoor GPS tracking', prompt: 'Prompt — will ask when you start recording', denied: 'Blocked — enable location in browser site settings' };
      el.textContent = labels[res.state] || res.state;
      res.onchange = () => updateGeoPermStatus();
      return;
    } catch (e) {}
  }
  el.textContent = 'Ready — click Verify GPS to test location lock';
}
regAction('perm-test-gps', () => {
  if (!navigator.geolocation) return toast('Geolocation unavailable in this browser.', 'err');
  toast('Requesting GPS fix…', 'info', 2500);
  navigator.geolocation.getCurrentPosition(
    pos => {
      updateGeoPermStatus();
      toast(`GPS lock acquired (±${Math.round(pos.coords.accuracy)}m accuracy).`, 'ok', 4500);
    },
    err => {
      updateGeoPermStatus();
      toast('GPS check failed: ' + err.message, 'err', 5000);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});
regAction('perm-test-voice', () => {
  if (!('speechSynthesis' in window)) return toast('Speech synthesis unavailable in this browser.', 'err');
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance('SOLO audio telemetry active. One kilometer complete.');
  u.rate = 1.04;
  window.speechSynthesis.speak(u);
  toast('Playing voice cue sample…', 'ok', 2800);
});
regAction('photo-pick', () => { const f = $('#photo-file'); if (f) { f.value = ''; f.click(); } });
document.addEventListener('change', e => {
  if (e.target && e.target.id === 'photo-file' && e.target.files && e.target.files[0]) {
    const img = new Image();
    const url = URL.createObjectURL(e.target.files[0]);
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
      const ctx = cv.getContext('2d');
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256);
      URL.revokeObjectURL(url);
      App.settings.photo = cv.toDataURL('image/jpeg', 0.82);
      saveSettings(); toast('Profile photo updated.', 'ok'); renderCurrent();
    };
    img.src = url;
  }
  if (e.target && e.target.id === 'json-file' && e.target.files && e.target.files[0]) importBackupFile(e.target.files[0]);
});
regAction('photo-remove', () => { App.settings.photo = ''; saveSettings(); renderCurrent(); });

/* ---------------- Export / Import, Demo Data & Lock ---------------- */
function gpxTimestamp(t) { return new Date(t).toISOString(); }
function activityToGpx(a) {
  const pts = a.points || [];
  const body = pts.map(p =>
    `      <trkpt lat="${p.la.toFixed(6)}" lon="${p.ln.toFixed(6)}">` +
    (p.el != null ? `<ele>${p.el.toFixed(1)}</ele>` : '') +
    `<time>${gpxTimestamp(p.t)}</time></trkpt>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SOLO — Personal Fitness Intelligence" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${escapeHtml(a.title || typeLabel(a))}</name><time>${gpxTimestamp(a.start)}</time></metadata>
  <trk><name>${escapeHtml(a.title || typeLabel(a))}</name><type>${a.type}</type>
  ${pts.length ? `<trkseg>\n${body}\n    </trkseg>` : ''}
  </trk>
</gpx>`;
}
function allToGpx(acts) {
  const trks = acts.map(a => `  <trk><name>${escapeHtml(a.title || typeLabel(a))}</name><type>${a.type}</type><trkseg>
${(a.points || []).map(p => `      <trkpt lat="${p.la.toFixed(6)}" lon="${p.ln.toFixed(6)}">${p.el != null ? `<ele>${p.el.toFixed(1)}</ele>` : ''}<time>${gpxTimestamp(p.t)}</time></trkpt>`).join('\n')}
    </trkseg></trk>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SOLO — Personal Fitness Intelligence" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>SOLO export — ${acts.length} activities</name><time>${gpxTimestamp(Date.now())}</time></metadata>
${trks}
</gpx>`;
}
function activityToCsv(a) {
  const st = actStats(a);
  const u = App.settings.units;
  const rows = [
    ['Field', 'Value'],
    ['Title', a.title || ''], ['Type', typeLabel(a)], ['Date', fmtDate(new Date(a.start)) + ' ' + fmtTime(new Date(a.start))],
    ['Distance (' + unitLabel(u) + ')', fmtDistNum(st.dist, u, 3)],
    ['Moving time (s)', Math.round(st.moving)], ['TSS', st.tss],
    ['Avg pace (sec/' + unitLabel(u) + ')', isFinite(st.avgPace) ? Math.round(st.avgPace * unitMeters(u)) : ''],
    ['Elevation gain (' + elevLabel(u) + ')', Math.round(u === 'imperial' ? st.gain * 3.28084 : st.gain)],
    ['Calories (estimate)', Math.round(st.calories)],
    [],
    ['Split', 'Distance (' + unitLabel(u) + ')', 'Time (s)', 'Pace (sec/' + unitLabel(u) + ')'],
    ...st.splits.map(s => [s.n, fmtDistNum(s.d, u, 3), Math.round(s.t), Math.round(s.t / (s.d / unitMeters(u)))]),
  ];
  return rows.map(r => r.map(csvCell).join(',')).join('\r\n');
}
function allToCsv(acts) {
  const u = App.settings.units;
  const head = ['id', 'date', 'time', 'type', 'title', 'distance_' + unitLabel(u), 'moving_time_s', 'tss', 'elev_gain_' + elevLabel(u), 'calories_est', 'avg_hr', 'source'];
  const rows = acts.map(a => {
    const st = actRowStats(a);
    return [a.id, dayKey(new Date(a.start)), fmtTime(new Date(a.start)), a.type, a.title || '',
      fmtDistNum(st.dist, u, 3), Math.round(a.duration || 0), computeTSS(a, App.settings.maxHr),
      Math.round(u === 'imperial' ? (a.gain || 0) * 3.28084 : a.gain || 0),
      Math.round(a.calories || 0), a.hrAvg || '', a.source];
  });
  return [head].concat(rows).map(r => r.map(csvCell).join(',')).join('\r\n');
}
regAction('act-gpx', d => { const a = App.acts.find(x => x.id === d.id); if (a) { download('solo_' + sanitizeName(a.title || a.id) + '.gpx', activityToGpx(a), 'application/gpx+xml'); toast('GPX exported.', 'ok'); } });
regAction('act-csv', d => { const a = App.acts.find(x => x.id === d.id); if (a) { download('solo_' + sanitizeName(a.title || a.id) + '.csv', activityToCsv(a), 'text/csv'); toast('CSV exported.', 'ok'); } });
regAction('export-all-csv', () => { if (!App.acts.length) return toast('No activities to export.', 'info'); download('solo_activities.csv', allToCsv(App.acts), 'text/csv'); toast('Activities exported to CSV.', 'ok'); });
regAction('export-all-gpx', () => { const w = App.acts.filter(a => a.points && a.points.length); if (!w.length) return toast('No GPS tracks to export.', 'info'); download('solo_all_activities.gpx', allToGpx(w), 'application/gpx+xml'); toast(w.length + ' tracks exported to GPX.', 'ok'); });
regAction('export-json', () => {
  download('solo_backup_' + dayKey(new Date()) + '.json', JSON.stringify({ app: 'SOLO', version: 1, exportedAt: new Date().toISOString(), settings: App.settings, goals: App.goals, activities: App.acts }), 'application/json');
  toast('Backup exported.', 'ok');
});
regAction('import-json', () => { const f = $('#json-file'); if (f) { f.value = ''; f.click(); } });
async function importBackupFile(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'SOLO' || !Array.isArray(data.activities)) throw new Error('Not a SOLO backup file');
    const existing = new Set(App.acts.map(a => a.id));
    let added = 0;
    for (const a of data.activities) {
      if (!a || !a.id || !a.start || existing.has(a.id)) continue;
      existing.add(a.id); await DB.set('act:' + a.id, a); App.acts.push(a); added++;
    }
    if (Array.isArray(data.goals)) {
      const gIds = new Set(App.goals.map(g => g.id));
      for (const g of data.goals) if (g && g.id && !gIds.has(g.id)) App.goals.push(g);
      await App.persistGoals();
    }
    App.acts.sort((a, b) => b.start - a.start);
    App.recompute();
    toast(`Backup imported — ${added} new activities merged.`, 'ok');
    renderCurrent();
  } catch (e) { toast('Import failed: ' + e.message, 'err', 5500); }
}

function pinInputHtml(id, label) {
  return `<div class="field"><label class="label" for="${id}">${label}</label>
    <input class="input" id="${id}" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" placeholder="4–6 digits" style="text-align:center;font-size:22px;letter-spacing:.4em;font-family:var(--font-display)"></div>`;
}
function readPin(id) { return ($(id) ? $(id).value : '').trim(); }
function validPin(p) { return /^[0-9]{4,6}$/.test(p); }
regAction('pin-setup', () => {
  openModal({
    title: 'Set a passcode',
    body: `${pinInputHtml('np1', 'New passcode')}<div style="height:12px"></div>${pinInputHtml('np2', 'Repeat passcode')}<div class="ferr" id="np-err"></div>`,
    actions: [
      { label: 'Cancel', cls: 'btn-ghost', onclick: () => closeModal() },
      { label: 'Enable lock', cls: 'btn-primary', icon: 'lock', onclick: async () => {
        const p1 = readPin('#np1'), p2 = readPin('#np2'), err = $('#np-err'); err.classList.remove('on');
        if (!validPin(p1) || p1 !== p2) { err.textContent = 'Passcodes must be 4–6 matching digits.'; err.classList.add('on'); return; }
        const salt = uid(); App.settings.lock = { enabled: true, salt, hash: await hashPin(p1, salt) };
        saveSettings(); sessionStorage.setItem('solo.unlocked', '1'); closeModal(); toast('App lock enabled.', 'ok'); renderCurrent();
      } },
    ],
  });
});
function askPinVerify() {
  return new Promise(res => {
    let done = false; const finish = v => { if (!done) { done = true; res(v); } };
    openModal({
      title: 'Enter current passcode',
      body: `${pinInputHtml('vp1', 'Current passcode')}<div class="ferr" id="vp-err"></div>`,
      onClose: () => finish(false),
      actions: [
        { label: 'Cancel', cls: 'btn-ghost', onclick: () => { finish(false); closeModal(); } },
        { label: 'Verify', cls: 'btn-primary', onclick: async () => {
          if (await hashPin(readPin('#vp1'), App.settings.lock.salt) === App.settings.lock.hash) { finish(true); closeModal(); }
          else { $('#vp-err').textContent = 'Wrong passcode.'; $('#vp-err').classList.add('on'); }
        } },
      ],
    });
  });
}
regAction('pin-change', async () => {
  if (!(await askPinVerify())) return;
  ACTIONS['pin-setup']();
});
regAction('pin-disable', async () => {
  if (!(await askPinVerify())) return;
  App.settings.lock = { enabled: false, salt: '', hash: '' }; saveSettings(); toast('App lock disabled.'); renderCurrent();
});
regAction('lock-now', () => { sessionStorage.removeItem('solo.unlocked'); showLockScreen(); });
regAction('wipe', () => {
  openModal({
    title: 'Delete everything?',
    body: `<p class="muted" style="font-size:14px">This permanently erases all local activities, goals, and settings.</p>
      <div class="field" style="margin-top:14px"><label class="label" for="wipe-confirm">Type DELETE to confirm</label><input class="input" id="wipe-confirm" placeholder="DELETE"></div>`,
    actions: [
      { label: 'Cancel', cls: 'btn-ghost', onclick: () => closeModal() },
      { label: 'Delete all', cls: 'btn-danger', icon: 'trash', onclick: async () => {
        if ($('#wipe-confirm').value.trim() !== 'DELETE') return;
        closeModal();
        try { for (const k of await DB.keys()) await DB.del(k); } catch (e) {}
        localStorage.clear(); sessionStorage.clear(); location.hash = ''; location.reload();
      } },
    ],
  });
});

function demoGenerate() {
  const rng = mulberry32(0x5010);
  const acts = [];
  const WEEKS = 20;
  const base = { la: 47.3769, ln: 8.5417 };
  const now = new Date();
  const startMonday = startOfWeek(addDays(now, -7 * (WEEKS - 1)), 1);
  function elevAt(cum, amp) { return 412 + amp * Math.sin(cum / 900) + amp * 0.5 * Math.sin(cum / 317 + 1.7) + 2 * Math.sin(cum / 89); }
  function genLoop(targetM, paceSecPerM, amp, t0, baseHr) {
    const step = 20;
    const nSteps = Math.max(20, Math.round(targetM / step));
    let heading = rng() * Math.PI * 2, x = 0, y = 0, t = t0, cum = 0;
    const cosL = Math.cos(toRad(base.la));
    const pts = [];
    for (let i = 0; i < nSteps; i++) {
      heading += (rng() - 0.5) * 0.14;
      if (i > nSteps * 0.55) {
        let d = Math.atan2(-y, -x) - heading;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        heading += d * 0.075;
      }
      x += Math.cos(heading) * step; y += Math.sin(heading) * step; cum += step;
      const pace = paceSecPerM * (0.92 + rng() * 0.16);
      t += pace * step * 1000;
      const hr = baseHr ? Math.round(baseHr + Math.sin(i / 18) * 9 + (rng() - 0.5) * 6) : null;
      pts.push({ la: base.la + y / 110540, ln: base.ln + x / (111320 * cosL), t: Math.round(t), el: +elevAt(cum, amp).toFixed(1), ac: 6, v: 1 / pace, p: false, hr });
    }
    return pts;
  }
  function mkActivity(o) {
    const ts = trackStats(o.points);
    const wall = (o.points[o.points.length - 1].t - o.points[0].t) / 1000;
    const hrs = o.points.map(p => p.hr).filter(Boolean);
    return {
      id: uid(), type: o.type, customName: '', title: o.title, notes: o.notes || '', rpe: o.rpe || null,
      start: o.points[0].t, distance: Math.round(ts.dist), duration: Math.round(ts.moving),
      elapsed: Math.round(wall), pausedSec: 0, gain: ts.gain,
      hrAvg: hrs.length ? Math.round(avg(hrs)) : null,
      calories: estimateCalories(o.type, ts.moving, ts.moving > 0 ? ts.dist / ts.moving : 0, App.settings.weightKg, ts.dist ? ts.gain / ts.dist : 0),
      points: o.points, source: 'gps', demo: true, createdAt: Date.now(),
    };
  }
  for (let w = 0; w < WEEKS; w++) {
    const monday = addDays(startMonday, w * 7);
    const fit = w / (WEEKS - 1);
    const runPace = lerp(0.325, 0.285, fit) * (0.97 + rng() * 0.06);
    const plan = [
      { dow: 1, on: rng() > 0.25, kind: 'easy' },
      { dow: 2, on: rng() > 0.2, kind: 'gym' },
      { dow: 3, on: rng() > 0.3, kind: 'easy' },
      { dow: 4, on: rng() > 0.4, kind: 'tempo' },
      { dow: 6, on: true, kind: 'long' },
      { dow: 0, on: rng() > 0.35, kind: rng() > 0.6 ? 'hike' : 'ride' },
    ];
    for (const p of plan) {
      if (!p.on) continue;
      const date = addDays(monday, (p.dow + 6) % 7);
      if (date > now) continue;
      const t0 = new Date(date); t0.setHours(7 + Math.floor(rng() * 3), Math.floor(rng() * 59));
      if (p.kind === 'easy') acts.push(mkActivity({ type: 'run', title: 'Aerobic Base Run — Demo', points: genLoop((6 + rng() * 3.5) * KM, runPace * 1.04, 6, t0.getTime(), 144), notes: 'Controlled Zone 2 aerobic effort.' }));
      else if (p.kind === 'tempo') acts.push(mkActivity({ type: 'run', title: 'Threshold Tempo — Demo', rpe: 8, points: genLoop((7.5 + rng() * 3.5) * KM, runPace * 0.92, 8, t0.getTime(), 168), notes: 'Negative splits through the final 3 km.' }));
      else if (p.kind === 'long') acts.push(mkActivity({ type: 'run', title: 'Weekend Long Run — Demo', rpe: 6, points: genLoop((12 + fit * 8 + rng() * 3) * KM, runPace * 1.05, 11, t0.getTime(), 148), notes: 'Steady endurance build.' }));
      else if (p.kind === 'ride') acts.push(mkActivity({ type: 'cycle', title: 'Lakeside Endurance Ride — Demo', points: genLoop((26 + rng() * 28) * KM, 0.135, 9, t0.getTime(), 138) }));
      else if (p.kind === 'hike') acts.push(mkActivity({ type: 'hike', title: 'Ridge Ascent Hike — Demo', rpe: 5, points: genLoop((8 + rng() * 5) * KM, 0.72, 48, t0.getTime(), 126) }));
      else if (p.kind === 'gym') {
        const dur = (45 + rng() * 25) * 60;
        acts.push({ id: uid(), type: 'gym', customName: '', title: 'Strength & Mobility — Demo', notes: 'Compound lifts + core.', rpe: 7, start: t0.getTime(), distance: 0, duration: Math.round(dur), elapsed: Math.round(dur), gain: 0, hrAvg: 118, calories: estimateCalories('gym', dur, 0, App.settings.weightKg, 0), points: null, source: 'manual', demo: true, createdAt: Date.now() });
      }
    }
  }
  return acts;
}
regAction('demo-load', async () => {
  const ok = await confirmDialog({ title: 'Load demo dataset?', message: 'Adds ~5 months of clearly-badged sample activities with HR streams and CTL/ATL training load history.', ok: 'Load demo data' });
  if (!ok) return;
  const demo = demoGenerate();
  for (const a of demo) await DB.set('act:' + a.id, a);
  App.acts = App.acts.concat(demo).sort((x, y) => y.start - x.start);
  App.recompute();
  toast(demo.length + ' demo activities loaded.', 'ok', 4500);
  renderCurrent();
});
regAction('demo-remove', async () => {
  const demo = App.acts.filter(a => a.demo);
  if (!demo.length) return;
  const ok = await confirmDialog({ title: 'Remove all demo data?', message: demo.length + ' badged demo activities will be deleted.', ok: 'Remove demo data', danger: true });
  if (!ok) return;
  for (const a of demo) await DB.del('act:' + a.id);
  App.acts = App.acts.filter(a => !a.demo);
  App.recompute();
  toast('Demo data removed.', 'ok');
  renderCurrent();
});
goalCompletedListener = goals => { for (const g of goals) toast('🏆 Goal achieved: ' + goalLabel(g), 'ok', 6000); };

/* ---------------- Lock Screen, Onboarding & Boot ---------------- */
const Lock = {
  pin: '', onUnlock: null,
  show() {
    const ls = $('#lockscreen'); ls.hidden = false; $('#shell').hidden = true;
    ls.innerHTML = lockCardHtml(); this.pin = ''; this.syncDots(); lsKeyHandlers();
  },
  hide() { $('#lockscreen').hidden = true; $('#lockscreen').innerHTML = ''; $('#shell').hidden = false; },
  syncDots() { $$('#pin-dots i').forEach((d, i) => d.classList.toggle('f', i < this.pin.length)); },
  press(k) { if (this.pin.length < 6) { this.pin += k; this.syncDots(); this.tryAuto(); } },
  async tryAuto() {
    if (this.pin.length >= 4) await this.check(false);
    if (this.pin.length >= 6 && !$('#lockscreen').hidden) this.fail();
  },
  async check(explicit) {
    if (await hashPin(this.pin, App.settings.lock.salt) === App.settings.lock.hash) {
      sessionStorage.setItem('solo.unlocked', '1'); this.pin = '';
      if (this.onUnlock) { const cb = this.onUnlock; this.onUnlock = null; cb(); }
      return true;
    }
    if (explicit) this.fail();
    return false;
  },
  fail() {
    const dots = $('#pin-dots'); if (!dots) return;
    dots.classList.add('shake'); setTimeout(() => dots.classList.remove('shake'), 450);
    this.pin = ''; setTimeout(() => this.syncDots(), 200);
  },
};
function lockCardHtml() {
  return `<div class="lock-card">
    <div class="lock-logo">
      <div class="logo-mark" style="width:56px;height:56px;border-radius:17px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width:30px;height:30px"><path d="M4 17 L10 10.5 L14 14 L20 6.5"/><circle cx="20" cy="6.5" r="1.6" fill="currentColor" stroke="none"/></svg>
      </div>
      <div><div class="logo-word" style="font-size:26px;letter-spacing:.16em">SOLO</div><div class="muted small">Personal Fitness Intelligence</div></div>
    </div>
    <div style="text-align:center"><div class="muted small" style="margin-bottom:4px">Enter your passcode</div>
      <div class="pin-dots" id="pin-dots"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>
    <div class="keypad" id="keypad">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="key" data-key="${n}">${n}</button>`).join('')}
      <button class="key ghost-key" data-key="back" aria-label="Delete">${icon('x', 18)}</button>
      <button class="key" data-key="0">0</button>
      <button class="key ghost-key" data-key="ok" aria-label="Unlock">${icon('check', 18)}</button>
    </div>
  </div>`;
}
function lsKeyHandlers() {
  const kp = $('#keypad'); if (!kp) return;
  kp.addEventListener('click', async e => {
    const b = e.target.closest('[data-key]'); if (!b) return;
    const k = b.dataset.key;
    if (k === 'back') { Lock.pin = Lock.pin.slice(0, -1); Lock.syncDots(); }
    else if (k === 'ok') await Lock.check(true);
    else Lock.press(k);
  });
}
function showLockScreen() { Lock.onUnlock = () => { Lock.hide(); renderCurrent(); }; Lock.show(); }

function showOnboarding() {
  const ls = $('#lockscreen'); ls.hidden = false; $('#shell').hidden = true;
  ls.innerHTML = `<div class="lock-card" style="max-width:460px">
    <div class="lock-logo">
      <div class="logo-mark" style="width:56px;height:56px;border-radius:17px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width:30px;height:30px"><path d="M4 17 L10 10.5 L14 14 L20 6.5"/><circle cx="20" cy="6.5" r="1.6" fill="currentColor" stroke="none"/></svg>
      </div>
      <div><div class="logo-word" style="font-size:26px;letter-spacing:.16em">SOLO</div><div class="muted small">Personal Fitness Intelligence</div></div>
    </div>
    <div class="field"><label class="label" for="ob-name">Your name (optional)</label>
      <input class="input" id="ob-name" maxlength="40" placeholder="e.g. Alex"></div>
    <div class="frow" style="margin-top:14px">
      <div class="field"><label class="label">Units</label>
        <div class="seg" id="ob-units"><button class="seg-btn active" data-v="metric">Kilometers</button><button class="seg-btn" data-v="imperial">Miles</button></div></div>
      <div class="field"><label class="label">Theme</label>
        <div class="seg" id="ob-theme"><button class="seg-btn active" data-v="dark">Dark</button><button class="seg-btn" data-v="light">Light</button></div></div>
    </div>
    <div class="frow" style="margin-top:14px">
      <div class="field"><label class="label" for="ob-goal">Weekly goal (km)</label><input class="input" id="ob-goal" inputmode="decimal" value="20"></div>
      <div class="field"><label class="label" for="ob-maxhr">Max HR (bpm)</label><input class="input" id="ob-maxhr" inputmode="numeric" value="190"></div>
    </div>
    <button class="btn btn-lg btn-primary btn-block" id="ob-start" style="margin-top:22px">${icon('zap', 18)} Launch Command Center</button>
    <div class="dim tiny" style="text-align:center;margin-top:14px">100% local IndexedDB storage · Press ⌘K / Ctrl+K anytime for quick jump</div>
  </div>`;
  let units = 'metric', theme = 'dark';
  $('#ob-units').addEventListener('click', e => { const b = e.target.closest('.seg-btn'); if (b) { $$('#ob-units .seg-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); units = b.dataset.v; } });
  $('#ob-theme').addEventListener('click', e => { const b = e.target.closest('.seg-btn'); if (b) { $$('#ob-theme .seg-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); theme = b.dataset.v; } });
  $('#ob-start').addEventListener('click', () => {
    const s = App.settings;
    s.name = $('#ob-name').value.trim(); s.units = units; s.theme = theme;
    const goal = parseFloat($('#ob-goal').value.replace(',', '.'));
    if (isFinite(goal) && goal > 0) s.weeklyGoalKm = goal;
    const mhr = parseInt($('#ob-maxhr').value);
    if (isFinite(mhr) && mhr >= 110 && mhr <= 230) s.maxHr = mhr;
    s.setupDone = true; saveSettings(); applyTheme(); Lock.hide(); go('dashboard');
  });
}

(async function boot() {
  applyTheme();
  await App.init();
  const interrupted = await Recorder.checkInterrupted();
  if (!App.settings.setupDone) showOnboarding();
  else if (App.settings.lock.enabled && !sessionStorage.getItem('solo.unlocked')) showLockScreen();
  else {
    Lock.hide(); $('#shell').hidden = false;
    go(location.hash.replace(/^#\/?/, '') || 'dashboard');
    if (interrupted) toast('An interrupted recording was recovered — resume it from the Record screen.', 'info', 6500);
  }
})();
