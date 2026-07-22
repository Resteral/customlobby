// ==========================================
// CUSTOM LOBBIES MATCHMAKER PORTAL

const appState = {
  currentUser: localStorage.getItem('custom_lobbies_user') || null,
  activeChannel: 'arkheron'
};

// ==========================================

async function notifyDiscord(channel, embedData, content = null) {
  try {
    const payload = { channel, embed: embedData, content };
    await fetch('/api/discord/announce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn("Failed to notify Discord API:", err);
  }
}

// ==========================================
// 🌌 LANDING SCREEN ENGINE
// ==========================================

function enterLobby() {
  const btn = document.getElementById('land-enter-btn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }
  const wipe = document.getElementById('land-wipe');
  if (wipe) {
    wipe.classList.add('wipe-go');
    setTimeout(() => {
      const ls = document.getElementById('landing-screen');
      if (ls) ls.classList.add('land-hidden');
      setTimeout(() => { if (ls) ls.style.display = 'none'; }, 700);
    }, 280);
  }
  // Show the login screen in the middle of the wipe
  setTimeout(() => {
    const loginScr = document.getElementById('login-screen');
    if (loginScr) loginScr.style.display = 'flex';
  }, 200);
}

// Particle system
function initLandingParticles() {
  const canvas = document.getElementById('landing-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const PARTICLE_COUNT = 90;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.4,
    dx: (Math.random() - 0.5) * 0.35,
    dy: (Math.random() - 0.5) * 0.35,
    alpha: Math.random() * 0.5 + 0.1,
    color: Math.random() < 0.6 ? '139,92,246' : Math.random() < 0.5 ? '6,182,212' : '244,63,94',
  }));

  const CONNECTION_DIST = 130;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < CONNECTION_DIST) {
          const op = (1 - dist / CONNECTION_DIST) * 0.15;
          ctx.strokeStyle = `rgba(139,92,246,${op})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw dots
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });

    if (!document.getElementById('landing-screen')?.classList.contains('land-hidden')) {
      requestAnimationFrame(draw);
    }
  }
  draw();
}

// Hide the login screen until the user enters from the landing page
document.addEventListener('DOMContentLoaded', () => {
  // If a profile route injected __PROFILE_PLAYER__, auto-sign in
  if (window.__PROFILE_PLAYER__) {
    const name = window.__PROFILE_PLAYER__;
    appState.currentUser = name;
    localStorage.setItem('custom_lobbies_signed_in', 'true');
    localStorage.setItem('custom_lobbies_user', name);
    // Skip landing + login — go straight to lobby
    const ls = document.getElementById('landing-screen');
    if (ls) ls.style.display = 'none';
    const loginScr = document.getElementById('login-screen');
    if (loginScr) loginScr.style.display = 'none';
  } else {
    const loginScr = document.getElementById('login-screen');
    if (loginScr) loginScr.style.display = 'none';
  }
  initLandingParticles();
});

const GAMES = ['arkheron', 'cs', 'zealot'];

// Web Audio API Sound Synthesizer for Lobby Notifications
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  try {
    initAudio();
    if (!audioCtx) return;
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    
    switch(type) {
      case 'join': {
        // Player joins queue: short gentle blip
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'match_found': {
        // Match found / Draft starts: sonar chime (double pulse)
        const playPing = (time, freq) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.4, time + 0.3);
          
          gain.gain.setValueAtTime(0.1, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
          
          osc.start(time);
          osc.stop(time + 0.4);
        };
        playPing(now, 523.25); // C5
        playPing(now + 0.18, 659.25); // E5
        break;
      }
      case 'your_turn': {
        // Your turn to pick: clean double alert chime
        const playTone = (time, freq, duration) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);
          
          gain.gain.setValueAtTime(0.08, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
          
          osc.start(time);
          osc.stop(time + duration);
        };
        playTone(now, 587.33, 0.22); // D5
        playTone(now + 0.14, 880, 0.45); // A5
        break;
      }
      case 'pick': {
        // Draft pick locked in: mechanical tick/thud
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'message': {
        // Discord message sound: gentle pop
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
    }
  } catch (e) {
    console.warn("AudioContext failed to play:", e);
  }
}

// Playable Eternals Database (for Arkheron)
const ETERNALS = [
  { id: 'leodin', name: 'Leodin', emoji: '🧝', role: 'Fighter', set: 'Tempest', lore: 'A swift, wind-bending swordsman who utilizes gale forces to reposition and outmaneuver adversaries.', stats: { hp: 'A', speed: 'S', damage: 'A' }, ability: { name: 'Gale Slash', desc: 'Leaps forward in a whirlwind, dealing damage and knocking up enemies for 1.5 seconds.' } },
  { id: 'rynshi', name: 'Rynshi', emoji: '🥷', role: 'Assassin', set: 'Tempest', lore: 'An aero-adept rogue who slips through shadows carried by draft winds.', stats: { hp: 'C', speed: 'S', damage: 'S' }, ability: { name: 'Aero Decoy', desc: 'Vanish into thin air, leaving an explosive decoy that explodes and blinds.' } },
  { id: 'dahla', name: 'Dahla', emoji: '🧛', role: 'Bruiser', set: 'Bloodthorn', lore: 'A savage arena veteran who infuses physical blades with life-stealing magic.', stats: { hp: 'A', speed: 'B', damage: 'S' }, ability: { name: 'Sanguine Fury', desc: 'Increase lifesteal by 25% and attack speed by 40% for 6 seconds.' } },
  { id: 'karriv', name: 'Karriv', emoji: '🛡️', role: 'Tank', set: 'Solar Flare', lore: 'A holy crusader who channels solar heat into his heavy shield and broadsword.', stats: { hp: 'S', speed: 'C', damage: 'A' }, ability: { name: 'Sol Crest', desc: 'Absorb all frontal attacks, releasing a blast dealing 150% of stored damage.' } },
  { id: 'edani', name: 'Edani', emoji: '🔮', role: 'Mage', set: 'Voidbringer', lore: 'An academic wizard who unlocked void equations and gravitational singularities.', stats: { hp: 'B', speed: 'B', damage: 'S' }, ability: { name: 'Void Collapse', desc: 'Summon a gravity anomaly that pulls in all entities and deals massive AP damage.' } }
];

const RELICS = [
  { id: 'tempest_crown', name: 'Crown of Hurricanes', slot: 'crown', set: 'Tempest', stats: { hp: 100, ap: 15, speed: 15 } },
  { id: 'bloodthorn_weapon1', name: 'Bloodthorn Daggers', slot: 'weapon1', set: 'Bloodthorn', stats: { ap: 25, lifesteal: 8 } },
  { id: 'voidbringer_weapon1', name: 'Rift Scepter', slot: 'weapon1', set: 'Voidbringer', stats: { ap: 45, cdr: 5 } }
];

const SETS_METADATA = {
  'Tempest': '+12% Speed bonus, wind speed trails.',
  'Bloodthorn': '+8% Lifesteal, bleed wounds.',
  'Voidbringer': '+15% Cooldown Reduction (CDR).',
  'Solar Flare': '+25 Armor, +100 Max HP.'
};

// (Mock player pool removed — queue fills from real registered players only)

// Clean starting database of competitive players (Current user only)
let players = JSON.parse(localStorage.getItem('custom_lobbies_players')) || [
  {
    username: 'Resteral.TV',
    avatar: '🛡️',
    coins: 500,
    unlockedRewards: [],
    games: {
      arkheron: { elo: 1000, wins: 0, losses: 0, kd: "1.00", eloHistory: [1000] },
      cs: { elo: 1000, wins: 0, losses: 0, kd: "1.00", eloHistory: [1000] },
      zealot: { elo: 1000, wins: 0, losses: 0, kd: "1.00", eloHistory: [1000] }
    }
  }
];

function savePlayersToStorage() {
  localStorage.setItem('custom_lobbies_players', JSON.stringify(players));
}

let activeLobbies = {};
let currentSelectedGame = 'arkheron'; // default selected game for UI display



async function leaveRealQueue() {
  const game = appState.activeChannel || 'arkheron';
  try {
    const res = await fetch('/api/queue/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: appState.currentUser, game })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Left Matchmaking Queue', 'info');
      pollRealQueue();
    } else {
      showToast(data.error || 'Failed to leave queue', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to backend', 'error');
  }
}

let lastQueueState = { players: [], averageMMR: 0, required: 6 };

async function pollRealQueue() {
  const game = appState.activeChannel || 'arkheron';
  try {
    const res = await fetch('/api/queue/status?game=' + game);
    const data = await res.json();
    if (data.players) {
      lastQueueState = data;
      updateSpireUI(data);
    }
  } catch (err) {
    // silently fail polling
  }
}

function updateSpireUI(queueData) {
  const spireContainer = document.getElementById('arkheron-spire-container');
  const countBadge = document.getElementById('queue-count-badge');
  
  if (spireContainer) {
    if (queueData.players.length > 0) {
      spireContainer.style.display = 'flex';
    } else {
      spireContainer.style.display = 'none';
      closeSpireModal();
    }
  }
  
  if (countBadge) {
    countBadge.innerText = queueData.players.length + '/' + queueData.required + ' Players';
  }
  
  // Update Modal Content if open
  document.getElementById('spire-avg-mmr').innerText = queueData.averageMMR;
  document.getElementById('spire-player-count').innerText = queueData.players.length + ' / ' + queueData.required;
  
  const listEl = document.getElementById('spire-player-list');
  if (listEl) {
    if (queueData.players.length === 0) {
      listEl.innerHTML = '<div style="text-align:center; color:gray; padding:10px;">Queue is empty.</div>';
    } else {
      listEl.innerHTML = queueData.players.map((p, i) => 
        '<div style="display:flex; justify-content:space-between; padding:8px; background:rgba(0,0,0,0.3); border-radius:4px; border-left: 3px solid #8b5cf6;">' +
        '<span><strong>' + (i+1) + '.</strong> ' + p.username + '</span>' +
        '<span style="color:#a78bfa; font-weight:bold;">' + p.elo + ' MMR</span>' +
        '</div>'
      ).join('');
    }
  }
}

function openSpireModal() {
  document.getElementById('spire-modal').style.display = 'flex';
  updateSpireUI(lastQueueState);
}

function closeSpireModal(e) {
  if (e && e.target.id !== 'spire-modal') return;
  document.getElementById('spire-modal').style.display = 'none';
}

// Start polling
setInterval(pollRealQueue, 3000);


// Backend Auth Session Check
async function checkAuthSession() {
  try {
    const res = await fetch("/api/me");
    const data = await res.json();
    if (data.user) {
      appState.currentUser = data.user.username;
      localStorage.setItem("custom_lobbies_signed_in", "true");
      document.getElementById("login-screen").style.display = "none";
      document.getElementById("app-container").style.display = "flex";
      switchTab("simulator");
      renderLeaderboard();
      showToast("Welcome back, " + data.user.username + "!", "success");
    }
  } catch (err) {}
}
document.addEventListener("DOMContentLoaded", checkAuthSession);


// ==========================================
// 🔴 REAL-TIME DISCORD SYNC (WebSockets)
// ==========================================
const socket = (typeof io !== 'undefined') ? io() : null;

let currentDiscordChannelId = '1328080649733472288'; // Default fallback

if (socket) {
  socket.on('discordMessage', (msg) => {
    // Append to chat if it matches current channel or if we don't care about channel filtering yet
    // For simplicity, we just append everything since we assume they are in the lobby
    const container = document.getElementById('chat-messages');
    if (container) {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'dc-msg';
      msgDiv.innerHTML = `
        <div class="dc-msg-avatar" style="background-image: url('${msg.author.avatar}'); background-size: cover;"></div>
        <div class="dc-msg-content">
          <div class="dc-msg-header">
            <span class="dc-msg-username">${msg.author.username}</span>
            <span class="dc-msg-time">Just now</span>
          </div>
          <div class="dc-msg-text">${msg.content}</div>
        </div>
      `;
      container.appendChild(msgDiv);
      container.scrollTop = container.scrollHeight;
      
      // Play pop sound
      if (typeof playSound === 'function') {
        playSound('message');
      }
    }
  });
}

window.handleSendChat = function(event) {
  event.preventDefault();
  const input = document.getElementById('chat-input-field');
  const text = input.value.trim();
  if (!text) return;
  
  if (socket) {
    socket.emit('sendMessage', {
      channelId: currentDiscordChannelId, // You could map this dynamically
      content: text,
      username: appState.currentUser || 'Guest'
    });
  }
  
  // Optimistically render it in UI immediately
  const container = document.getElementById('chat-messages');
  if (container) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'dc-msg';
    msgDiv.innerHTML = `
      <div class="dc-msg-avatar" style="background-color: #d97736;"></div>
      <div class="dc-msg-content">
        <div class="dc-msg-header">
          <span class="dc-msg-username">${appState.currentUser || 'Guest'}</span>
          <span class="dc-msg-time">Just now</span>
        </div>
        <div class="dc-msg-text">${text}</div>
      </div>
    `;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }
  
  input.value = '';
}

// Fetch real channels on load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/discord/channels');
    const channels = await res.json();
    if (channels && channels.length > 0) {
      currentDiscordChannelId = channels[0].id;
      const list = document.querySelector('.dc-channels-list');
      if (list) {
        // Keep the titles, but replace the text channels
        let html = '<div class="dc-category-title">Text Channels</div>';
        channels.forEach((c, i) => {
          html += `
            <a href="#" class="dc-channel-item ${i === 0 ? 'active' : ''}" onclick="currentDiscordChannelId='${c.id}'; document.querySelectorAll('.dc-channel-item').forEach(el=>el.classList.remove('active')); this.classList.add('active'); return false;">
              <span>#</span> ${c.name}
            </a>
          `;
        });
        
        // Append voice channel mocks just so it still looks cool
        html += `
          <div class="dc-category-title" style="margin-top:12px;">Voice Channels</div>
          <div class="dc-channel-item" style="cursor:default;">
            <span>🔊</span> Lobby Room
          </div>
        `;
        
        list.innerHTML = html;
      }
    }
  } catch(e) {
    console.warn('Could not load Discord channels');
  }
});
