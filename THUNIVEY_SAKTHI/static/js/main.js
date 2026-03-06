/* ═══════════════════════════════════════════════════════
   THUNIVEY SAKTHI · main.js
   Features: particles, counters, URL/text/screenshot/voice
             tools, scam map, chatbot, i18n (EN/TA/HI/TE),
             toast notifications, scroll reveal
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ── PARTICLES ─────────────────────────────────────── */
(function () {
  const cvs = document.getElementById('particle-canvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  let W, H, pts = [];

  function resize() {
    W = cvs.width  = window.innerWidth;
    H = cvs.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 70; i++) {
    pts.push({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.6 + .4,
      a: Math.random() * .45 + .1
    });
  }

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,205,220,${p.a})`;
      ctx.fill();
    });
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(200,205,220,${.04 * (1 - d / 110)})`;
          ctx.lineWidth = .5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(loop);
  })();
})();

/* ── COUNTER ANIMATION ──────────────────────────────── */
function animCount(id, target, suffix = '') {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const step = Math.ceil(target / 60);
  const t = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur.toLocaleString() + suffix;
    if (cur >= target) clearInterval(t);
  }, 28);
}
window.addEventListener('load', () => {
  setTimeout(() => {
    animCount('s1', 15842);
    animCount('s2',  3291);
    animCount('s3',  8740);
    animCount('s4',  1205);
  }, 600);
  loadScamMap();
});

/* ── SCROLL REVEAL ──────────────────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
}, { threshold: .08 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ── TOAST ──────────────────────────────────────────── */
function toast(msg, type = 'success') {
  const wrap = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { danger: '🚨', warning: '⚠️', success: '✅' };
  el.innerHTML = `<span>${icons[type] || '🔔'}</span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.transition = '.3s'; el.style.opacity = '0'; el.style.transform = 'translateX(12px)';
    setTimeout(() => el.remove(), 320);
  }, 4000);
}

/* ── RESULT RENDERER ────────────────────────────────── */
function renderResult(container, data, type) {
  const s = data.status;
  let badge, fillCls, badgeCls, dotCls;

  if (type === 'url' || type === 'voice') {
    if (s === 'DANGER')     { badge = 'DANGEROUS URL';   badgeCls = 'rb-danger';  fillCls = 'rf-danger';  dotCls = 'rd-bad'; }
    else if (s === 'INVALID'){ badge = 'INVALID INPUT';  badgeCls = 'rb-invalid'; fillCls = 'rf-invalid'; dotCls = 'rd-bad'; }
    else if (s === 'SUSPICIOUS'){ badge = 'SUSPICIOUS';  badgeCls = 'rb-warn';    fillCls = 'rf-warn';    dotCls = 'rd-warn'; }
    else                     { badge = 'SAFE URL';        badgeCls = 'rb-safe';   fillCls = 'rf-safe';    dotCls = 'rd-good'; }
  } else if (type === 'text') {
    if (s === 'SCAM')        { badge = 'SCAM DETECTED';  badgeCls = 'rb-danger';  fillCls = 'rf-danger';  dotCls = 'rd-bad'; }
    else if (s === 'SUSPICIOUS'){ badge = 'SUSPICIOUS';  badgeCls = 'rb-warn';    fillCls = 'rf-warn';    dotCls = 'rd-warn'; }
    else                     { badge = 'LIKELY SAFE';     badgeCls = 'rb-safe';   fillCls = 'rf-safe';    dotCls = 'rd-good'; }
  } else {
    if (s === 'PHISHING_DETECTED'){ badge = 'PHISHING DETECTED'; badgeCls = 'rb-danger'; fillCls = 'rf-danger'; dotCls = 'rd-bad'; }
    else if (s === 'SUSPICIOUS'){ badge = 'SUSPICIOUS';  badgeCls = 'rb-warn';    fillCls = 'rf-warn';    dotCls = 'rd-warn'; }
    else                     { badge = 'APPEARS SAFE';    badgeCls = 'rb-safe';   fillCls = 'rf-safe';    dotCls = 'rd-good'; }
  }

  const flags = data.flags || data.triggers || data.findings || ['No suspicious patterns detected'];
  const score = data.score || 0;
  const uid = 'bar' + Date.now();

  container.innerHTML = `
    <div class="r-box">
      <div class="r-top">
        <div class="r-badge ${badgeCls}">${badge}</div>
        <div class="r-score">Risk <b>${score}</b>/100</div>
      </div>
      <div class="r-track-wrap">
        <div class="r-track-lbl"><span>RISK LEVEL</span><span>${score}/100</span></div>
        <div class="r-track"><div class="r-fill ${fillCls}" id="${uid}" style="width:0%"></div></div>
      </div>
      <div class="r-flags">
        ${flags.map(f => `<div class="r-flag"><span class="r-dot ${dotCls}"></span><span>${f}</span></div>`).join('')}
        ${type === 'voice' && data.voice_message ? `<div class="r-voice-msg"><i class="fas fa-volume-up" style="margin-right:6px"></i>${data.voice_message}</div>` : ''}
      </div>
    </div>`;

  container.classList.add('show');
  setTimeout(() => { const b = document.getElementById(uid); if (b) b.style.width = score + '%'; }, 60);

  if (badgeCls === 'rb-danger' || badgeCls === 'rb-invalid') toast('Threat detected! Avoid this.', 'danger');
  else if (badgeCls === 'rb-warn') toast('Suspicious content — stay alert!', 'warning');
  else toast('Analysis complete — looks safe!', 'success');
}

/* ── FILL EXAMPLE ───────────────────────────────────── */
function fillEx(type, val) {
  if (type === 'url')  { document.getElementById('urlInput').value  = val; }
  if (type === 'text') { document.getElementById('textInput').value = val; }
}

/* ── URL CHECKER ────────────────────────────────────── */
async function checkURL() {
  const input = document.getElementById('urlInput');
  const result = document.getElementById('urlResult');
  const btn = document.getElementById('urlScanBtn');
  const url = input.value.trim();
  if (!url) { toast('Please enter a URL to scan', 'warning'); return; }

  btn.innerHTML = '<span class="spinner"></span> Scanning...';
  btn.disabled = true;
  result.classList.remove('show');

  try {
    const res = await fetch('/api/check-url', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    renderResult(result, await res.json(), 'url');
  } catch {
    toast('Scan failed. Check your connection.', 'danger');
  } finally {
    btn.innerHTML = '<i class="fas fa-search"></i> <span data-i18n="btn_scan">Scan URL</span>';
    btn.disabled = false;
    applyLang(currentLang);
  }
}
document.getElementById('urlInput').addEventListener('keydown', e => { if (e.key === 'Enter') checkURL(); });

/* ── TEXT SCANNER ───────────────────────────────────── */
async function checkText() {
  const input  = document.getElementById('textInput');
  const result = document.getElementById('textResult');
  const btn    = document.getElementById('textScanBtn');
  const text   = input.value.trim();
  if (!text) { toast('Please paste some text to analyze', 'warning'); return; }

  btn.innerHTML = '<span class="spinner"></span> Analyzing...';
  btn.disabled = true;
  result.classList.remove('show');

  try {
    const res = await fetch('/api/check-text', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    renderResult(result, await res.json(), 'text');
  } catch {
    toast('Analysis failed. Try again.', 'danger');
  } finally {
    btn.innerHTML = '<i class="fas fa-search"></i> <span data-i18n="btn_analyze">Analyze Text</span>';
    btn.disabled = false;
    applyLang(currentLang);
  }
}

/* ── SCREENSHOT UPLOAD ──────────────────────────────── */
function handleUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('ssPreview');
    prev.innerHTML = `
      <div style="margin-bottom:.85rem">
        <img src="${e.target.result}" alt="Screenshot" style="max-width:100%;border-radius:9px;max-height:200px;object-fit:cover;border:1px solid var(--border)"/>
      </div>
      <button class="btn-sec" id="ssAnalyzeBtn" onclick="analyzeScreenshot()">
        <i class="fas fa-search"></i> <span data-i18n="btn_ss">Analyze Screenshot</span>
      </button>`;
    applyLang(currentLang);
    const zone = document.getElementById('uploadZone');
    zone.style.borderColor = 'var(--red)';
    zone.style.background  = 'var(--red-soft)';
  };
  reader.readAsDataURL(file);
}

// drag & drop
const uploadZone = document.getElementById('uploadZone');
uploadZone.addEventListener('dragover',  e => { e.preventDefault(); uploadZone.style.borderColor = 'var(--red)'; });
uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = ''; });
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith('image/')) handleUpload({ target: { files: [f] } });
});

async function analyzeScreenshot() {
  const result = document.getElementById('ssResult');
  const btn    = document.getElementById('ssAnalyzeBtn');
  if (btn) { btn.innerHTML = '<span class="spinner"></span> Analyzing...'; btn.disabled = true; }
  result.classList.remove('show');

  try {
    const res = await fetch('/api/check-screenshot', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analyze: true })
    });
    renderResult(result, await res.json(), 'screenshot');
  } catch {
    toast('Analysis failed. Try again.', 'danger');
  } finally {
    if (btn) { btn.innerHTML = '<i class="fas fa-search"></i> Analyze Screenshot'; btn.disabled = false; }
  }
}

/* ── VOICE CHECKER ──────────────────────────────────── */
let recog = null, isRec = false;

function toggleVoice() {
  const btn    = document.getElementById('micBtn');
  const icon   = document.getElementById('micIcon');
  const txt    = document.getElementById('micText');
  const wav    = document.getElementById('voiceWav');
  const trans  = document.getElementById('voiceTranscript');
  const result = document.getElementById('voiceResult');

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    toast('Voice recognition not supported in this browser', 'warning'); return;
  }

  if (isRec) {
    recog && recog.stop();
    isRec = false;
    btn.classList.remove('rec');
    wav.classList.remove('active');
    txt.setAttribute('data-i18n', 'mic_tap');
    applyLang(currentLang);
    return;
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recog = new SR();
  recog.lang = 'en-IN'; recog.continuous = false; recog.interimResults = false;

  recog.onstart = () => {
    isRec = true; btn.classList.add('rec');
    wav.classList.add('active');
    trans.textContent = 'Listening...';
    icon.className = 'fas fa-stop';
    txt.textContent = 'TAP TO STOP';
  };

  recog.onresult = async ev => {
    const spokenURL = ev.results[0][0].transcript.trim().replace(/\s+/g, '');
    trans.textContent = `Heard: ${spokenURL}`;
    result.classList.remove('show');

    try {
      const res = await fetch('/api/voice-check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: spokenURL })
      });
      const data = await res.json();
      renderResult(result, data, 'voice');
      if (data.voice_message) {
        const utt = new SpeechSynthesisUtterance(data.voice_message);
        utt.lang = 'en-IN'; window.speechSynthesis.speak(utt);
      }
    } catch { toast('Voice check failed.', 'danger'); }
  };

  recog.onerror = () => { toast('Voice input error. Try again.', 'warning'); };
  recog.onend = () => {
    isRec = false; btn.classList.remove('rec');
    wav.classList.remove('active');
    icon.className = 'fas fa-microphone';
    txt.setAttribute('data-i18n', 'mic_tap');
    applyLang(currentLang);
  };
  recog.start();
}

/* ── SCAM MAP ───────────────────────────────────────── */
async function loadScamMap() {
  try {
    const res = await fetch('/api/scam-alerts');
    const { alerts, total, updated } = await res.json();
    drawMap(alerts);
    renderAlertList(alerts, total, updated);
  } catch { console.warn('Map load failed'); }
}

function drawMap(alerts) {
  const svg = document.getElementById('indiaSvg');
  if (!svg) return;

  const latMin = 8, latMax = 37, lngMin = 68, lngMax = 97;
  function toSVG(lat, lng) {
    return {
      x: ((lng - lngMin) / (lngMax - lngMin)) * 540 + 30,
      y: ((latMax - lat) / (latMax - latMin)) * 590 + 30
    };
  }

  svg.innerHTML = `
    <defs>
      <radialGradient id="mgBg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#1a1e27"/>
        <stop offset="100%" stop-color="#09090b"/>
      </radialGradient>
    </defs>
    <rect width="600" height="650" fill="url(#mgBg)"/>
    <path d="M200 60 L220 55 L270 65 L310 60 L350 70 L380 85 L400 110 L420 130
             L440 150 L450 180 L460 210 L465 240 L470 270 L460 300 L450 320
             L430 340 L410 360 L390 380 L370 405 L350 425 L330 445 L310 460
             L285 475 L260 480 L240 470 L215 450 L195 430 L170 405 L155 385
             L140 360 L125 335 L115 305 L110 275 L115 245 L120 215 L130 185
             L145 160 L160 135 L175 110 L190 85 Z"
      fill="rgba(232,68,90,.04)" stroke="rgba(232,68,90,.18)" stroke-width="1.2"/>
    <text x="50%" y="97%" text-anchor="middle" fill="rgba(255,255,255,.12)"
      font-size="10" font-family="IBM Plex Mono">INDIA — CYBER THREAT MONITOR</text>`;

  const colors = { critical: '#e8445a', high: '#f59e0b', medium: '#3b82f6', low: '#22c55e' };
  const sizes  = { critical: 16, high: 13, medium: 10, low: 7 };

  alerts.forEach(a => {
    const { x, y } = toSVG(a.lat, a.lng);
    const c = colors[a.severity] || '#f59e0b';
    const r = sizes[a.severity]  || 9;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = `
      <circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="${c}" opacity=".08">
        <animate attributeName="r" values="${r};${r*2.8};${r}" dur="2.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".2;0;.2" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${x}" cy="${y}" r="${r * .65}" fill="${c}" opacity=".9"/>
      <title>${a.city}: ${a.type} (${a.count} reports)</title>`;
    svg.appendChild(g);

    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl.setAttribute('x', x + r + 4); lbl.setAttribute('y', y + 3.5);
    lbl.setAttribute('fill', 'rgba(244,244,246,.65)'); lbl.setAttribute('font-size', '8.5');
    lbl.setAttribute('font-family', 'IBM Plex Mono'); lbl.textContent = a.city;
    svg.appendChild(lbl);
  });
}

function renderAlertList(alerts, total, updated) {
  const list  = document.getElementById('alertList');
  const stats = document.getElementById('alertTotal');
  if (!list) return;

  list.innerHTML = alerts.map(a => `
    <div class="alert-item ai-${a.severity}">
      <div class="ai-city">
        <span class="ai-city-name">${a.city}</span>
        <span class="ai-count">${a.count}</span>
      </div>
      <div class="ai-type">${a.type}</div>
    </div>`).join('');

  if (stats) stats.innerHTML = `<strong>${total.toLocaleString()}</strong>Total reports today · Updated ${updated}`;
}

/* ── CHATBOT ────────────────────────────────────────── */
async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg   = input.value.trim();
  if (!msg) return;
  input.value = '';
  addMsg('user', msg);

  const typId = addTyping();
  try {
    const res = await fetch('/api/chatbot', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    removeTyping(typId);
    addMsg('bot', data.response, data.timestamp);
  } catch {
    removeTyping(typId);
    addMsg('bot', '⚠️ Sorry, an error occurred. Please try again.');
  }
}

function sendQuick(msg) { document.getElementById('chatInput').value = msg; sendChat(); }

function addMsg(role, text, time = null) {
  const msgs = document.getElementById('chatMsgs');
  const t    = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const av   = role === 'bot'
    ? `<div class="msg-av av-bot"><i class="fas fa-robot"></i></div>`
    : `<div class="msg-av av-user"><i class="fas fa-user"></i></div>`;
  const d = document.createElement('div');
  d.className = `msg ${role}`;
  d.innerHTML = `${av}<div class="msg-bub"><p>${text}</p><span class="msg-time">${t}</span></div>`;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  return d;
}

function addTyping() {
  const msgs = document.getElementById('chatMsgs');
  const id   = 'typ' + Date.now();
  const d    = document.createElement('div');
  d.className = 'msg bot'; d.id = id;
  d.innerHTML = `<div class="msg-av av-bot"><i class="fas fa-robot"></i></div><div class="msg-bub"><div class="typing"><span></span><span></span><span></span></div></div>`;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}
function removeTyping(id) { const el = document.getElementById(id); if (el) el.remove(); }

/* ── EMERGENCY BTN ──────────────────────────────────── */
document.getElementById('emergencyBtn').addEventListener('click', () => {
  document.getElementById('emergencyModal').classList.add('open');
});

/* ══════════════════════════════════════════════════════
   LANGUAGE / i18n SYSTEM
   Covers every text node across the entire page
   ══════════════════════════════════════════════════════ */
const T = {
  en: {
    /* nav */
    nav_url:'URL Check', nav_scam:'Scam Detect', nav_ss:'Screenshot',
    nav_voice:'Voice', nav_map:'Alert Map', nav_chat:'AI Chat',
    sos:'SOS HELP',
    /* hero */
    hero_pill:"Women's Cyber Safety Platform · India",
    hero_h1a:'Detect.', hero_h1b:'Protect.', hero_h1c:'Stay Safe.',
    hero_p:"India's first and best cybersecurity platform built for women — detecting phishing threats, SMS scams, and online fraud in real time.",
    stat1:'URLS SCANNED', stat2:'SCAMS BLOCKED', stat3:'WOMEN PROTECTED', stat4:'ALERTS SENT',
    cta1:'Start Scanning', cta2:'Ask Cyber Sakthi',
    /* hero features */
    f1_name:'URL Phishing Detection', f1_sub:'Heuristic + domain analysis',
    f2_name:'Email & SMS Scam Detector', f2_sub:'NLP pattern scoring',
    f3_name:'Screenshot Analysis', f3_sub:'AI visual phishing scan',
    f4_name:'Voice URL Checker', f4_sub:'Speak URL, hear verdict',
    f5_name:'Live Scam Alert Map', f5_sub:'India-wide threat monitor',
    f6_name:'AI Chatbot — Cyber Sakthi', f6_sub:'24/7 cybersecurity advisor',
    /* capabilities */
    cap_tag:'CAPABILITIES', cap_h:'Complete Cyber Protection Suite',
    cap_p:'Six integrated tools working together to keep you protected from every angle of digital threat.',
    f1_desc:'Heuristic analysis detects malicious URLs — checks domain structure, TLS, impersonation patterns and suspicious keywords.',
    f2_desc:'AI-powered text analysis identifies scam phrases, social engineering attempts and financial fraud patterns.',
    f3_desc:'Upload any suspicious webpage screenshot for instant AI-powered phishing and fraud visual analysis.',
    f4_desc:'Speak any URL and receive an instant audio safety verdict. No typing required — fully accessible.',
    f5_desc:'Live heatmap of active cyber threats across India — know which cities are under attack right now.',
    f6_desc:'24/7 intelligent advisor for cybersecurity guidance, scam prevention and emergency support.',
    /* url tool */
    url_h:'URL Phishing Detector', url_p:"Paste any suspicious URL below to instantly check if it's safe or a threat.",
    url_p_short:"Paste any suspicious URL to check if it's safe",
    url_ph:'https://suspicious-site.com/login',
    btn_scan:'Scan URL',
    try_ex:'Try:', ex_pay:'Fake PayPal', ex_ip:'IP URL', ex_safe:'Safe URL', ex_junk:'Gibberish',
    /* text tool */
    text_h:'Email / SMS Scam Detector', text_p:'Paste suspicious message content to analyse it for scam patterns.',
    text_p_short:'Paste suspicious email or SMS content for analysis',
    text_ph:'Paste suspicious email or SMS here...', btn_analyze:'Analyze Text',
    ex_scam:'Scam Sample', ex_safe_sms:'Safe Sample',
    /* screenshot */
    ss_h:'Screenshot Phishing Detector', ss_p:'Upload a screenshot of any suspicious page for instant AI visual analysis.',
    ss_p_short:'AI analysis of suspicious website screenshots',
    up_title:'Drop screenshot here or click to upload', up_sub:'PNG, JPG, JPEG, WEBP — max 10 MB',
    btn_ss:'Analyze Screenshot',
    /* voice */
    voice_h:'Voice-Based URL Checker', voice_p:'Speak any URL aloud and receive an instant audio safety verdict.',
    voice_p_short:'Speak a URL and get instant audio safety feedback',
    mic_tap:'TAP TO SPEAK', mic_stop:'TAP TO STOP',
    voice_prompt:'Click the microphone and speak a URL...',
    /* map */
    map_tag:'LIVE THREAT MAP', map_h:'Real-Time Scam Alert Map', map_p:'Live cyber threat hotspots across India — updated continuously.',
    leg_c:'Critical', leg_h:'High', leg_m:'Medium', leg_l:'Low',
    alerts_title:'Active Alerts',
    /* chatbot */
    chat_h:'Cyber Sakthi — AI Advisor', chat_p:'Ask anything about cybersecurity, scam prevention, or get emergency guidance instantly.',
    bot_greet:"Vanakkam! 🌸 I'm <strong>Cyber Sakthi</strong>, your AI cybersecurity assistant. Ask me about phishing, OTP scams, password safety, or UPI fraud.",
    just_now:'Just now', chat_ph:'Ask Cyber Sakthi anything...',
    qp1:'What is phishing?', qp2:'OTP Scam Safety', qp3:'UPI Safety', qp4:'Emergency Help',
    /* footer */
    footer_p:'துணிவே சக்தி\nEmpowering Women with Cyber Safety',
    footer_hl_title:'Helplines', footer_h1:'Cybercrime:', footer_h2:"Women's:", footer_h3:'Police:',
    footer_tools:'Tools', footer_more:'More',
    footer_copy:'© 2025 Thunivey Sakthi · Women\'s Cyber Safety Hackathon · Made for Digital India',
    /* modal */
    modal_h:'Emergency Cyber Help',
    modal_desc:"If you're experiencing a cyber attack or online harassment, contact these helplines immediately:",
    modal_h1:'National Cybercrime Helpline', modal_h2:"Women's Helpline",
    modal_h3:'Police Emergency', modal_h4:'Online Complaint Portal',
    modal_steps_title:'Immediate Steps',
    ms1:'Do NOT click any more suspicious links',
    ms2:'Change your passwords immediately',
    ms3:'Take screenshots as evidence',
    ms4:'Report to cybercrime helpline: 1930',
    ms5:'Contact your bank if financial fraud occurred',
  },

  ta: {
    nav_url:'URL சோதனை', nav_scam:'மோசடி கண்டறிதல்', nav_ss:'ஸ்கிரீன்ஷாட்',
    nav_voice:'குரல்', nav_map:'எச்சரிக்கை வரைபடம்', nav_chat:'AI அரட்டை',
    sos:'அவசர உதவி',
    hero_pill:'பெண்களின் சைபர் பாதுகாப்பு தளம் · இந்தியா',
    hero_h1a:'கண்டறி.', hero_h1b:'பாதுகாப்பு.', hero_h1c:'பாதுகாப்பாக இரு.',
    hero_p:'பெண்களுக்காக கட்டப்பட்ட இந்தியாவின் முதல் AI சைபர் பாதுகாப்பு தளம் — ஃபிஷிங் அச்சுறுத்தல்கள், SMS மோசடிகள் மற்றும் ஆன்லைன் மோசடிகளை நிகழ்நேரத்தில் கண்டறிகிறது.',
    stat1:'சோதிக்கப்பட்ட URLகள்', stat2:'தடுக்கப்பட்ட மோசடிகள்', stat3:'பாதுகாக்கப்பட்ட பெண்கள்', stat4:'அனுப்பப்பட்ட எச்சரிக்கைகள்',
    cta1:'சோதிப்பை தொடங்கு', cta2:'சைபர் சக்தியிடம் கேள்',
    f1_name:'URL ஃபிஷிங் கண்டறிதல்', f1_sub:'Heuristic + டொமைன் பகுப்பாய்வு',
    f2_name:'மின்னஞ்சல் & SMS மோசடி கண்டுபிடிப்பான்', f2_sub:'NLP முறை மதிப்பீடு',
    f3_name:'ஸ்கிரீன்ஷாட் பகுப்பாய்வு', f3_sub:'AI காட்சி ஃபிஷிங் சோதனை',
    f4_name:'குரல் URL சோதிப்பி', f4_sub:'URL பேசு, தீர்ப்பு கேள்',
    f5_name:'நேரடி மோசடி எச்சரிக்கை வரைபடம்', f5_sub:'இந்தியா அளவிலான அச்சுறுத்தல் கண்காணிப்பு',
    f6_name:'AI சாட்போட் — சைபர் சக்தி', f6_sub:'24/7 சைபர் பாதுகாப்பு ஆலோசகர்',
    cap_tag:'திறன்கள்', cap_h:'முழுமையான சைபர் பாதுகாப்பு தொகுப்பு',
    cap_p:'டிஜிட்டல் அச்சுறுத்தல்களிலிருந்து உங்களை பாதுகாக்க ஆறு ஒருங்கிணைந்த கருவிகள்.',
    f1_desc:'தீங்கிழைக்கும் URLகளை கண்டறிய — டொமைன் அமைப்பு, TLS, போலி பிரதிநிதித்துவம் மற்றும் சந்தேகாஸ்பத வார்த்தைகளை சோதிக்கிறது.',
    f2_desc:'மோசடி சொற்றொடர்கள், சமூக பொறியியல் முயற்சிகள் மற்றும் நிதி மோசடி முறைகளை AI கண்டறிகிறது.',
    f3_desc:'உடனடி AI ஃபிஷிங் பகுப்பாய்வுக்கு சந்தேகாஸ்பத வலைப்பக்கத்தின் ஸ்கிரீன்ஷாட்டை பதிவேற்றவும்.',
    f4_desc:'எந்த URLஐயும் சொல்லி உடனடி ஆடியோ பாதுகாப்பு தீர்ப்பு பெறுங்கள். தட்டச்சு தேவையில்லை.',
    f5_desc:'இந்தியா முழுவதும் செயலில் உள்ள சைபர் அச்சுறுத்தல்களின் நேரடி வரைபடம்.',
    f6_desc:'சைபர் பாதுகாப்பு வழிகாட்டுதல், மோசடி தடுப்பு மற்றும் அவசர ஆதரவுக்கான 24/7 AI ஆலோசகர்.',
    url_h:'URL ஃபிஷிங் கண்டுபிடிப்பான்', url_p:'சந்தேகாஸ்பத URLஐ கீழே ஒட்டி அது பாதுகாப்பானதா என்று உடனே சோதிக்கவும்.',
    url_p_short:'சந்தேகாஸ்பத URLஐ ஒட்டி சோதிக்கவும்',
    url_ph:'https://சந்தேகாஸ்பத-தளம்.com/login',
    btn_scan:'URL சோதி',
    try_ex:'முயற்சிக்கவும்:', ex_pay:'போலி PayPal', ex_ip:'IP URL', ex_safe:'பாதுகாப்பான URL', ex_junk:'குப்பை உரை',
    text_h:'மின்னஞ்சல் / SMS மோசடி கண்டுபிடிப்பான்', text_p:'மோசடி முறைகளை பகுப்பாய்வு செய்ய சந்தேகாஸ்பத செய்தி உள்ளடக்கத்தை ஒட்டவும்.',
    text_p_short:'சந்தேகாஸ்பத மின்னஞ்சல் அல்லது SMS உள்ளடக்கத்தை ஒட்டவும்',
    text_ph:'சந்தேகாஸ்பத மின்னஞ்சல் அல்லது SMS இங்கே ஒட்டவும்...', btn_analyze:'உரையை பகுப்பாய்வு செய்',
    ex_scam:'மோசடி மாதிரி', ex_safe_sms:'பாதுகாப்பான மாதிரி',
    ss_h:'ஸ்கிரீன்ஷாட் ஃபிஷிங் கண்டுபிடிப்பான்', ss_p:'உடனடி AI பகுப்பாய்வுக்கு சந்தேகாஸ்பத பக்கத்தின் ஸ்கிரீன்ஷாட்டை பதிவேற்றவும்.',
    ss_p_short:'சந்தேகாஸ்பத வலைதளத்தின் ஸ்கிரீன்ஷாட் AI பகுப்பாய்வு',
    up_title:'ஸ்கிரீன்ஷாட்டை இங்கே இழுக்கவும் அல்லது பதிவேற்றவும்', up_sub:'PNG, JPG, JPEG, WEBP — அதிகபட்சம் 10 MB',
    btn_ss:'ஸ்கிரீன்ஷாட் பகுப்பாய்வு செய்',
    voice_h:'குரல் அடிப்படையிலான URL சோதிப்பி', voice_p:'எந்த URLஐயும் சொல்லி உடனடி ஆடியோ பாதுகாப்பு தீர்ப்பு பெறுங்கள்.',
    voice_p_short:'URL பேசி உடனடி ஆடியோ பாதுகாப்பு பின்னூட்டம் பெறுங்கள்',
    mic_tap:'பேச தட்டவும்', mic_stop:'நிறுத்த தட்டவும்',
    voice_prompt:'மைக்ரோஃபோனை கிளிக் செய்து URL பேசவும்...',
    map_tag:'நேரடி அச்சுறுத்தல் வரைபடம்', map_h:'நிகழ்நேர மோசடி எச்சரிக்கை வரைபடம்', map_p:'இந்தியா முழுவதும் நேரடி சைபர் அச்சுறுத்தல் இடங்கள் — தொடர்ந்து புதுப்பிக்கப்படுகிறது.',
    leg_c:'மிக ஆபத்தானது', leg_h:'அதிகம்', leg_m:'மிதமான', leg_l:'குறைவானது',
    alerts_title:'செயலில் உள்ள எச்சரிக்கைகள்',
    chat_h:'சைபர் சக்தி — AI ஆலோசகர்', chat_p:'சைபர் பாதுகாப்பு, மோசடி தடுப்பு அல்லது அவசர வழிகாட்டுதல் பற்றி எதையும் கேளுங்கள்.',
    bot_greet:'வணக்கம்! 🌸 நான் <strong>சைபர் சக்தி</strong>, உங்கள் AI சைபர் பாதுகாப்பு உதவியாளர். ஃபிஷிங், OTP மோசடி, கடவுச்சொல் பாதுகாப்பு அல்லது UPI மோசடி பற்றி கேளுங்கள்.',
    just_now:'இப்போதுதான்', chat_ph:'சைபர் சக்தியிடம் எதையும் கேளுங்கள்...',
    qp1:'ஃபிஷிங் என்றால் என்ன?', qp2:'OTP மோசடி பாதுகாப்பு', qp3:'UPI பாதுகாப்பு', qp4:'அவசர உதவி',
    footer_p:'துணிவே சக்தி\nபெண்களை சைபர் பாதுகாப்புடன் வலுப்படுத்துகிறோம்',
    footer_hl_title:'உதவி எண்கள்', footer_h1:'சைபர் குற்றம்:', footer_h2:'பெண்கள்:', footer_h3:'காவல்துறை:',
    footer_tools:'கருவிகள்', footer_more:'மேலும்',
    footer_copy:'© 2025 துணிவேய் சக்தி · பெண்கள் சைபர் பாதுகாப்பு ஹேக்கத்தான் · டிஜிட்டல் இந்தியாவிற்காக',
    modal_h:'அவசர சைபர் உதவி',
    modal_desc:'நீங்கள் சைபர் தாக்குதல் அல்லது ஆன்லைன் துன்புறுத்தலை அனுபவிக்கிறீர்களானால், உடனே இந்த உதவி எண்களை தொடர்பு கொள்ளுங்கள்:',
    modal_h1:'தேசிய சைபர் குற்றம் உதவி எண்', modal_h2:'பெண்கள் உதவி எண்',
    modal_h3:'காவல்துறை அவசரம்', modal_h4:'ஆன்லைன் புகார் போர்டல்',
    modal_steps_title:'உடனடி நடவடிக்கைகள்',
    ms1:'இனி எந்த சந்தேகாஸ்பத இணைப்பையும் கிளிக் செய்யாதீர்கள்',
    ms2:'உங்கள் கடவுச்சொற்களை உடனே மாற்றுங்கள்',
    ms3:'சான்றாக ஸ்கிரீன்ஷாட்கள் எடுங்கள்',
    ms4:'சைபர் குற்றம் உதவி எண்ணில் புகார் செய்யுங்கள்: 1930',
    ms5:'நிதி மோசடி நடந்திருந்தால் உங்கள் வங்கியை தொடர்பு கொள்ளுங்கள்',
  },

  hi: {
    nav_url:'URL जाँच', nav_scam:'घोटाला पहचान', nav_ss:'स्क्रीनशॉट',
    nav_voice:'आवाज़', nav_map:'अलर्ट मैप', nav_chat:'AI चैट',
    sos:'आपातकाल मदद',
    hero_pill:'महिला साइबर सुरक्षा मंच · भारत',
    hero_h1a:'पहचानें.', hero_h1b:'सुरक्षित करें.', hero_h1c:'सुरक्षित रहें.',
    hero_p:'महिलाओं के लिए बना भारत का पहला AI साइबर सुरक्षा मंच — फ़िशिंग खतरों, SMS घोटालों और ऑनलाइन धोखाधड़ी को रियल-टाइम में पहचानता है।',
    stat1:'URL स्कैन किए', stat2:'घोटाले रोके', stat3:'महिलाएं सुरक्षित', stat4:'अलर्ट भेजे',
    cta1:'स्कैनिंग शुरू करें', cta2:'साइबर शक्ति से पूछें',
    f1_name:'URL फ़िशिंग पहचान', f1_sub:'Heuristic + डोमेन विश्लेषण',
    f2_name:'ईमेल & SMS घोटाला पहचान', f2_sub:'NLP पैटर्न स्कोरिंग',
    f3_name:'स्क्रीनशॉट विश्लेषण', f3_sub:'AI विजुअल फ़िशिंग स्कैन',
    f4_name:'वॉयस URL जांचकर्ता', f4_sub:'URL बोलें, फ़ैसला सुनें',
    f5_name:'लाइव स्कैम अलर्ट मैप', f5_sub:'भारत-व्यापी खतरा मॉनिटर',
    f6_name:'AI चैटबॉट — साइबर शक्ति', f6_sub:'24/7 साइबर सुरक्षा सलाहकार',
    cap_tag:'क्षमताएं', cap_h:'पूर्ण साइबर सुरक्षा सूट',
    cap_p:'डिजिटल खतरों से आपकी रक्षा के लिए छह एकीकृत उपकरण।',
    f1_desc:'हानिकारक URLs का पता लगाने के लिए डोमेन संरचना, TLS, नकली पहचान और संदिग्ध कीवर्ड जांचता है।',
    f2_desc:'AI घोटाले वाक्यांशों, सोशल इंजीनियरिंग प्रयासों और वित्तीय धोखाधड़ी पैटर्न की पहचान करता है।',
    f3_desc:'तुरंत AI फ़िशिंग विश्लेषण के लिए किसी भी संदिग्ध वेबपेज का स्क्रीनशॉट अपलोड करें।',
    f4_desc:'कोई भी URL बोलें और तत्काल ऑडियो सुरक्षा फ़ैसला पाएं। टाइपिंग की ज़रूरत नहीं।',
    f5_desc:'भारत भर में सक्रिय साइबर खतरों का लाइव हीटमैप।',
    f6_desc:'साइबर सुरक्षा मार्गदर्शन, घोटाला रोकथाम और आपातकालीन सहायता के लिए 24/7 AI सलाहकार।',
    url_h:'URL फ़िशिंग डिटेक्टर', url_p:'नीचे किसी भी संदिग्ध URL को पेस्ट करके तुरंत जांचें।',
    url_p_short:'किसी भी संदिग्ध URL को पेस्ट करके जांचें',
    url_ph:'https://संदिग्ध-साइट.com/login',
    btn_scan:'URL स्कैन करें',
    try_ex:'आज़माएं:', ex_pay:'नकली PayPal', ex_ip:'IP URL', ex_safe:'सुरक्षित URL', ex_junk:'बेमतलब',
    text_h:'ईमेल / SMS घोटाला डिटेक्टर', text_p:'घोटाले पैटर्न के लिए संदिग्ध संदेश सामग्री पेस्ट करें।',
    text_p_short:'संदिग्ध ईमेल या SMS सामग्री पेस्ट करें',
    text_ph:'संदिग्ध ईमेल या SMS यहाँ पेस्ट करें...', btn_analyze:'टेक्स्ट विश्लेषण करें',
    ex_scam:'घोटाला नमूना', ex_safe_sms:'सुरक्षित नमूना',
    ss_h:'स्क्रीनशॉट फ़िशिंग डिटेक्टर', ss_p:'तुरंत AI विश्लेषण के लिए संदिग्ध पेज का स्क्रीनशॉट अपलोड करें।',
    ss_p_short:'संदिग्ध वेबसाइट स्क्रीनशॉट का AI विश्लेषण',
    up_title:'स्क्रीनशॉट यहाँ छोड़ें या अपलोड करें', up_sub:'PNG, JPG, JPEG, WEBP — अधिकतम 10 MB',
    btn_ss:'स्क्रीनशॉट विश्लेषण करें',
    voice_h:'वॉयस-आधारित URL जांचकर्ता', voice_p:'कोई भी URL बोलें और तत्काल ऑडियो सुरक्षा फ़ैसला पाएं।',
    voice_p_short:'URL बोलें और तत्काल ऑडियो सुरक्षा फ़ीडबैक पाएं',
    mic_tap:'बोलने के लिए टैप करें', mic_stop:'रोकने के लिए टैप करें',
    voice_prompt:'माइक्रोफ़ोन क्लिक करें और URL बोलें...',
    map_tag:'लाइव खतरा मैप', map_h:'रियल-टाइम स्कैम अलर्ट मैप', map_p:'भारत भर में लाइव साइबर खतरे के हॉटस्पॉट — लगातार अपडेट।',
    leg_c:'अति खतरनाक', leg_h:'उच्च', leg_m:'मध्यम', leg_l:'कम',
    alerts_title:'सक्रिय अलर्ट',
    chat_h:'साइबर शक्ति — AI सलाहकार', chat_p:'साइबर सुरक्षा, घोटाला रोकथाम या आपातकालीन मार्गदर्शन के बारे में कुछ भी पूछें।',
    bot_greet:'नमस्ते! 🌸 मैं <strong>साइबर शक्ति</strong> हूं, आपकी AI साइबर सुरक्षा सहायक। फ़िशिंग, OTP घोटाला, पासवर्ड सुरक्षा या UPI धोखाधड़ी के बारे में पूछें।',
    just_now:'अभी', chat_ph:'साइबर शक्ति से कुछ भी पूछें...',
    qp1:'फ़िशिंग क्या है?', qp2:'OTP घोटाला सुरक्षा', qp3:'UPI सुरक्षा', qp4:'आपातकाल मदद',
    footer_p:'துணிவே சக்தி\nसाइबर सुरक्षा से महिलाओं को सशक्त बनाना',
    footer_hl_title:'हेल्पलाइन', footer_h1:'साइबर अपराध:', footer_h2:'महिला:', footer_h3:'पुलिस:',
    footer_tools:'उपकरण', footer_more:'अधिक',
    footer_copy:"© 2025 थुनिवेय शक्ति · महिला साइबर सुरक्षा हैकाथॉन · डिजिटल इंडिया के लिए",
    modal_h:'आपातकाल साइबर मदद',
    modal_desc:'यदि आप साइबर हमले या ऑनलाइन उत्पीड़न का अनुभव कर रहे हैं, तो तुरंत इन हेल्पलाइन से संपर्क करें:',
    modal_h1:'राष्ट्रीय साइबर अपराध हेल्पलाइन', modal_h2:'महिला हेल्पलाइन',
    modal_h3:'पुलिस आपातकाल', modal_h4:'ऑनलाइन शिकायत पोर्टल',
    modal_steps_title:'तत्काल कदम',
    ms1:'किसी भी संदिग्ध लिंक पर क्लिक न करें',
    ms2:'तुरंत अपने पासवर्ड बदलें',
    ms3:'सबूत के रूप में स्क्रीनशॉट लें',
    ms4:'साइबर अपराध हेल्पलाइन पर रिपोर्ट करें: 1930',
    ms5:'वित्तीय धोखाधड़ी हुई हो तो बैंक से संपर्क करें',
  },

  te: {
    nav_url:'URL తనిఖీ', nav_scam:'మోసం గుర్తింపు', nav_ss:'స్క్రీన్‌షాట్',
    nav_voice:'వాయిస్', nav_map:'అలర్ట్ మ్యాప్', nav_chat:'AI చాట్',
    sos:'అత్యవసర సహాయం',
    hero_pill:'మహిళల సైబర్ భద్రతా వేదిక · భారతదేశం',
    hero_h1a:'గుర్తించండి.', hero_h1b:'రక్షించండి.', hero_h1c:'సురక్షితంగా ఉండండి.',
    hero_p:'మహిళల కోసం నిర్మించబడిన భారతదేశపు మొదటి AI సైబర్ భద్రతా వేదిక — ఫిషింగ్ బెదిరింపులు, SMS మోసాలు మరియు ఆన్‌లైన్ మోసాలను రియల్-టైమ్‌లో గుర్తిస్తుంది.',
    stat1:'స్కాన్ చేసిన URLలు', stat2:'నిరోధించిన మోసాలు', stat3:'రక్షించబడిన మహిళలు', stat4:'పంపిన హెచ్చరికలు',
    cta1:'స్కానింగ్ ప్రారంభించండి', cta2:'సైబర్ శక్తిని అడగండి',
    f1_name:'URL ఫిషింగ్ గుర్తింపు', f1_sub:'Heuristic + డొమైన్ విశ్లేషణ',
    f2_name:'ఇమెయిల్ & SMS మోసం గుర్తింపు', f2_sub:'NLP పాటర్న్ స్కోరింగ్',
    f3_name:'స్క్రీన్‌షాట్ విశ్లేషణ', f3_sub:'AI దృశ్య ఫిషింగ్ స్కాన్',
    f4_name:'వాయిస్ URL తనిఖీదారు', f4_sub:'URL మాట్లాడండి, తీర్పు వినండి',
    f5_name:'లైవ్ స్కామ్ అలర్ట్ మ్యాప్', f5_sub:'భారతదేశం-వ్యాప్త బెదిరింపు పర్యవేక్షణ',
    f6_name:'AI చాట్‌బాట్ — సైబర్ శక్తి', f6_sub:'24/7 సైబర్ భద్రతా సలహాదారు',
    cap_tag:'సామర్థ్యాలు', cap_h:'పూర్తి సైబర్ రక్షణ సూట్',
    cap_p:'డిజిటల్ బెదిరింపుల నుండి మిమ్మల్ని రక్షించడానికి ఆరు సమన్వయ సాధనాలు.',
    f1_desc:'హానికరమైన URLలను గుర్తించడానికి డొమైన్ నిర్మాణం, TLS, వేషధారణ నమూనాలు మరియు అనుమానాస్పద కీవర్డ్‌లను తనిఖీ చేస్తుంది.',
    f2_desc:'AI మోసపూరిత పదబంధాలు, సోషల్ ఇంజినీరింగ్ ప్రయత్నాలు మరియు ఆర్థిక మోసం నమూనాలను గుర్తిస్తుంది.',
    f3_desc:'తక్షణ AI ఫిషింగ్ విశ్లేషణ కోసం అనుమానాస్పద వెబ్‌పేజ్ స్క్రీన్‌షాట్‌ను అప్‌లోడ్ చేయండి.',
    f4_desc:'ఏదైనా URL చెప్పండి మరియు తక్షణ ఆడియో భద్రతా తీర్పు పొందండి. టైపింగ్ అవసరం లేదు.',
    f5_desc:'భారతదేశం అంతటా సక్రియ సైబర్ బెదిరింపుల లైవ్ హీట్‌మాప్.',
    f6_desc:'సైబర్ భద్రత మార్గదర్శకత్వం, మోసం నివారణ మరియు అత్యవసర మద్దతు కోసం 24/7 AI సలహాదారు.',
    url_h:'URL ఫిషింగ్ డిటెక్టర్', url_p:'క్రింద అనుమానాస్పద URLను పేస్ట్ చేసి అది సురక్షితమో కాదో తక్షణం తనిఖీ చేయండి.',
    url_p_short:'అనుమానాస్పద URLను పేస్ట్ చేసి తనిఖీ చేయండి',
    url_ph:'https://అనుమానాస్పద-సైట్.com/login',
    btn_scan:'URL స్కాన్ చేయండి',
    try_ex:'ప్రయత్నించండి:', ex_pay:'నకిలీ PayPal', ex_ip:'IP URL', ex_safe:'సురక్షిత URL', ex_junk:'అర్థంలేని వచనం',
    text_h:'ఇమెయిల్ / SMS మోసం డిటెక్టర్', text_p:'మోసం నమూనాల కోసం అనుమానాస్పద సందేశ కంటెంట్‌ను పేస్ట్ చేయండి.',
    text_p_short:'అనుమానాస్పద ఇమెయిల్ లేదా SMS కంటెంట్ పేస్ట్ చేయండి',
    text_ph:'అనుమానాస్పద ఇమెయిల్ లేదా SMS ఇక్కడ పేస్ట్ చేయండి...', btn_analyze:'టెక్స్ట్ విశ్లేషించండి',
    ex_scam:'మోసం నమూనా', ex_safe_sms:'సురక్షిత నమూనా',
    ss_h:'స్క్రీన్‌షాట్ ఫిషింగ్ డిటెక్టర్', ss_p:'తక్షణ AI విశ్లేషణ కోసం అనుమానాస్పద పేజ్ స్క్రీన్‌షాట్ అప్‌లోడ్ చేయండి.',
    ss_p_short:'అనుమానాస్పద వెబ్‌సైట్ స్క్రీన్‌షాట్ AI విశ్లేషణ',
    up_title:'స్క్రీన్‌షాట్‌ను ఇక్కడ వదలండి లేదా అప్‌లోడ్ చేయండి', up_sub:'PNG, JPG, JPEG, WEBP — గరిష్టం 10 MB',
    btn_ss:'స్క్రీన్‌షాట్ విశ్లేషించండి',
    voice_h:'వాయిస్-ఆధారిత URL తనిఖీదారు', voice_p:'ఏదైనా URL బిగ్గరగా చెప్పండి మరియు తక్షణ ఆడియో భద్రతా తీర్పు పొందండి.',
    voice_p_short:'URL మాట్లాడండి మరియు తక్షణ ఆడియో అభిప్రాయం పొందండి',
    mic_tap:'మాట్లాడటానికి నొక్కండి', mic_stop:'ఆపడానికి నొక్కండి',
    voice_prompt:'మైక్రోఫోన్‌పై క్లిక్ చేసి URL మాట్లాడండి...',
    map_tag:'లైవ్ బెదిరింపు మ్యాప్', map_h:'రియల్-టైమ్ స్కామ్ అలర్ట్ మ్యాప్', map_p:'భారతదేశం అంతటా లైవ్ సైబర్ బెదిరింపు హాట్‌స్పాట్‌లు — నిరంతరం నవీకరించబడుతున్నాయి.',
    leg_c:'అత్యంత ప్రమాదకరం', leg_h:'అధికం', leg_m:'మధ్యస్థం', leg_l:'తక్కువ',
    alerts_title:'క్రియాశీల హెచ్చరికలు',
    chat_h:'సైబర్ శక్తి — AI సలహాదారు', chat_p:'సైబర్ భద్రత, మోసం నివారణ లేదా అత్యవసర మార్గదర్శకత్వం గురించి ఏదైనా అడగండి.',
    bot_greet:'నమస్కారం! 🌸 నేను <strong>సైబర్ శక్తి</strong>, మీ AI సైబర్ భద్రతా సహాయకుడు. ఫిషింగ్, OTP మోసం, పాస్‌వర్డ్ భద్రత లేదా UPI మోసం గురించి అడగండి.',
    just_now:'ఇప్పుడే', chat_ph:'సైబర్ శక్తిని ఏదైనా అడగండి...',
    qp1:'ఫిషింగ్ అంటే ఏమిటి?', qp2:'OTP మోసం భద్రత', qp3:'UPI భద్రత', qp4:'అత్యవసర సహాయం',
    footer_p:'துணிவே சக்தி\nసైబర్ భద్రతతో మహిళలను సాధికారపరచడం',
    footer_hl_title:'హెల్ప్‌లైన్‌లు', footer_h1:'సైబర్ నేరం:', footer_h2:'మహిళలు:', footer_h3:'పోలీసు:',
    footer_tools:'సాధనాలు', footer_more:'మరిన్ని',
    footer_copy:'© 2025 థునివేయ్ సక్తి · మహిళల సైబర్ భద్రతా హ్యాకథాన్ · డిజిటల్ ఇండియా కోసం',
    modal_h:'అత్యవసర సైబర్ సహాయం',
    modal_desc:'మీరు సైబర్ దాడి లేదా ఆన్‌లైన్ వేధింపులను అనుభవిస్తున్నారంటే, వెంటనే ఈ హెల్ప్‌లైన్‌లను సంప్రదించండి:',
    modal_h1:'జాతీయ సైబర్ నేరాల హెల్ప్‌లైన్', modal_h2:'మహిళల హెల్ప్‌లైన్',
    modal_h3:'పోలీసు అత్యవసరం', modal_h4:'ఆన్‌లైన్ ఫిర్యాదు పోర్టల్',
    modal_steps_title:'తక్షణ చర్యలు',
    ms1:'ఇకపై ఏ అనుమానాస్పద లింక్‌లను క్లిక్ చేయవద్దు',
    ms2:'వెంటనే మీ పాస్‌వర్డ్‌లు మార్చండి',
    ms3:'సాక్ష్యంగా స్క్రీన్‌షాట్‌లు తీయండి',
    ms4:'సైబర్ నేరాల హెల్ప్‌లైన్‌కు నివేదించండి: 1930',
    ms5:'ఆర్థిక మోసం జరిగి ఉంటే బ్యాంక్‌ను సంప్రదించండి',
  }
};

let currentLang = 'en';

function applyLang(lang) {
  const t = T[lang]; if (!t) return;
  /* text nodes */
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (t[k] !== undefined) el.innerHTML = t[k];
  });
  /* placeholders */
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const k = el.getAttribute('data-i18n-ph');
    if (t[k] !== undefined) el.placeholder = t[k];
  });
  /* active lang button */
  document.querySelectorAll('.lb').forEach(b => b.classList.remove('on'));
  const map = { en:0, ta:1, hi:2, te:3 };
  const btns = document.querySelectorAll('.lb');
  if (btns[map[lang]]) btns[map[lang]].classList.add('on');
  /* html lang attr */
  document.documentElement.lang = lang;
}

function setLang(lang) {
  if (!T[lang]) return;
  currentLang = lang;
  applyLang(lang);
  localStorage.setItem('ts_lang', lang);
  const names = { en:'🇬🇧 English', ta:'🇮🇳 தமிழ்', hi:'🇮🇳 हिन्दी', te:'🇮🇳 తెలుగు' };
  toast(`${names[lang]} selected`, 'success');
}

/* load saved language */
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('ts_lang');
  if (saved && T[saved] && saved !== 'en') setTimeout(() => setLang(saved), 300);
});
