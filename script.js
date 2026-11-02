/* ========== HELPERS ========== */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/* ========== SOUND (made with Web Audio, no audio files needed) ========== */
let actx = null, master = null, soundOn = true, ambient = false;

function audio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
    master = actx.createGain();
    master.gain.value = 0.5;              // overall volume (0 to 1)
    master.connect(actx.destination);
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

function tone(freq, t0 = 0, dur = 0.5, type = 'sine', vol = 0.2) {
  const c = audio();
  if (!c || !soundOn) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

function chime(freq, t0 = 0) {              // soft bell
  tone(freq, t0, 1.1, 'sine', 0.18);
  tone(freq * 2, t0, 0.7, 'sine', 0.07);
}

function noise(dur = 0.8, t0 = 0, from = 1800, to = 300, vol = 0.25) {   // whoosh / blowing
  const c = audio();
  if (!c || !soundOn) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + t0;
  s.buffer = buf;
  f.type = 'bandpass'; f.Q.value = 0.8;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t);
}

function sparkleSound() {
  [1047, 1319, 1568, 1976, 2349, 2637].forEach((f, i) => tone(f, i * 0.07, 0.8, 'sine', 0.09));
}

/* Happy Birthday on a music box: [frequency, beats] */
const BIRTHDAY = [
  [392,.75],[392,.25],[440,1],[392,1],[523,1],[494,2],
  [392,.75],[392,.25],[440,1],[392,1],[587,1],[523,2],
  [392,.75],[392,.25],[784,1],[659,1],[523,1],[494,1],[440,2],
  [698,.75],[698,.25],[659,1],[523,1],[587,1],[523,2]
];
function playBirthday(delay = 0) {
  let t = delay;
  BIRTHDAY.forEach(([f, beats]) => {
    tone(f, t, 0.9, 'sine', 0.17);
    tone(f * 2, t, 0.4, 'sine', 0.05);
    t += beats * 0.42;
  });
}

/* Soft music-box background loop (starts on page 2) */
function startAmbient() {
  if (ambient) return;
  ambient = true;
  const chords = [[523,659,784,1047],[440,523,659,880],[349,440,523,698],[392,494,587,784]];
  const order = [0,1,2,3,2,1,2,1];
  let bar = 0;
  (function loop() {
    if (!document.hidden) {
      const n = chords[bar % 4];
      order.forEach((idx, k) => tone(n[idx], k * 0.35, 1.2, 'sine', 0.05));
      tone(n[0] / 2, 0, 2.6, 'sine', 0.06);
    }
    bar++;
    setTimeout(loop, 2800);
  })();
}

/* ========== FLOATING HEARTS, SPARKLES & BUTTERFLIES ========== */
const fx = $('#fx');
const colors = ['#f7a8c4', '#e8b4a6', '#d9c3f2', '#ffffff', '#f48fb1'];
let symbols = ['♡', '✦', '✧', '♡', '•'];   // changes per page

function spawn() {
  if (document.hidden) return;
  const e = document.createElement('span');
  e.className = 'float';
  e.textContent = pick(symbols);
  const butterfly = e.textContent === '🦋';
  if (butterfly) e.classList.add('bfly');
  e.style.left = Math.random() * 96 + 'vw';
  e.style.fontSize = (12 + Math.random() * (butterfly ? 20 : 18)) + 'px';
  e.style.color = pick(colors);
  e.style.textShadow = '0 0 8px rgba(255,255,255,.9)';
  e.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
  e.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg');
  e.style.animationDuration = (8 + Math.random() * 8) + 's';
  fx.appendChild(e);
  setTimeout(() => e.remove(), 17000);
}
setInterval(spawn, 450);
for (let i = 0; i < 14; i++) setTimeout(spawn, i * 120);

/* ========== SMOOTH PAGE TRANSITIONS ========== */
function go(from, to, newSymbols) {
  from.classList.add('leaving');
  setTimeout(() => {
    from.classList.remove('active', 'leaving');
    to.classList.add('active');
    window.scrollTo(0, 0);
    symbols = newSymbols;
    sparkleSound();
    if (to.id === 'page2') startAmbient();
  }, 600);
}

/* ========== PAGE 1: BLOW THE CANDLES ========== */
let blown = false, micStream = null, micFrame = null;

function burst() {
  const cake = $('#cake');
  for (let i = 0; i < 44; i++) {
    const s = document.createElement('span');
    const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 160;
    s.className = 'spark';
    s.style.setProperty('--col', pick(colors));
    s.style.setProperty('--x', Math.cos(a) * d + 'px');
    s.style.setProperty('--y', Math.sin(a) * d - 30 + 'px');
    cake.appendChild(s);
    setTimeout(() => s.remove(), 1600);
  }
}

function stopMic() {
  cancelAnimationFrame(micFrame);
  if (micStream) micStream.getTracks().forEach(t => t.stop());
}

function blow() {
  if (blown) return;
  blown = true;
  stopMic();
  noise(1.1, 0, 1700, 250, 0.35);
  $$('.candle').forEach((c, i) => setTimeout(() => c.classList.add('out'), i * 160));
  setTimeout(() => {
    burst();
    sparkleSound();
    playBirthday(0.8);
    $('#cake').classList.add('glow');
    $('#blowMsg').textContent = 'Make a wish, birthday girl ✨';
    $('#blowBtn').hidden = true;
    $('#micBtn').hidden = true;
  }, 900);
  setTimeout(() => { $('#openBtn').hidden = false; }, 1700);
}
$('#blowBtn').addEventListener('click', blow);

/* Optional: blow into the microphone (button above always works too) */
$('#micBtn').addEventListener('click', async () => {
  const btn = $('#micBtn');
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(micStream).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    let hits = 0;
    btn.textContent = 'Listening… blow gently 🎤';
    (function listen() {
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
      hits = peak > 60 ? hits + 1 : 0;
      if (hits > 8) { blow(); return; }
      micFrame = requestAnimationFrame(listen);
    })();
  } catch (err) {
    btn.textContent = 'Mic unavailable — use the button above 🎂';
  }
});

$('#openBtn').addEventListener('click', () => go($('#page1'), $('#page2'), ['♡', '🦋', '✦', '✧', '🦋', '•']));

/* ========== PAGE 2 -> PAGE 3 ========== */
$('#memBtn').addEventListener('click', () => go($('#page2'), $('#page3'), ['♡', '✦', '🦋', '✧', '♡']));

/* ========== PAGE 3: FLIP CARDS (click again to flip back) ========== */
$$('.card').forEach(card => {
  const flip = () => {
    card.classList.toggle('flipped');
    noise(0.4, 0, 2600, 500, 0.12);
    chime(card.classList.contains('flipped') ? 1319 : 988, 0.12);
  };
  card.addEventListener('click', flip);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
  });
});

/* ========== BUTTON CHIME & SOUND ON/OFF ========== */
$$('.btn').forEach(b => b.addEventListener('click', () => { audio(); chime(988); }));

$('#soundBtn').addEventListener('click', () => {
  audio();
  soundOn = !soundOn;
  $('#soundBtn').textContent = soundOn ? '🔊' : '🔇';
  if (soundOn) chime(1175);
});
