require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// ==========================================
// JSON DATABASE INITIALIZATION (Fallback to prevent Native Binding Crashes)
// ==========================================
const dbPath = path.join(__dirname, 'database.json');
let db = {
  users: [],
  games: [
    { id: 'cs', name: 'Counter-Strike 2', team_size: 5, draft_style: 'snake', is_active: 1 },
    { id: 'arkheron', name: 'Arkheron', team_size: 3, draft_style: 'snake', is_active: 1 },
    { id: 'lol', name: 'League of Legends', team_size: 5, draft_style: 'blind', is_active: 1 }
  ],
  matches: []
};
if (fs.existsSync(dbPath)) {
  try { db = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch(e) { console.error('Failed to parse database.json'); }
}
const saveDb = () => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
global.db = db;

// Mock Wrapper for DB queries to match sqlite3 signatures so we don't have to rewrite everything
const runDB = async (sql, params = []) => {
  // Hacky mock for: INSERT INTO users ... ON CONFLICT DO UPDATE
  if (sql.includes('INSERT INTO users')) {
    const [id, username, avatar] = params;
    let user = db.users.find(u => u.id === id);
    if (user) {
      user.username = username;
      user.avatar = avatar;
    } else {
      db.users.push({ id, username, avatar, coins: 0, is_private: 0, created_at: Date.now() });
    }
    saveDb();
  }
};

const getDB = async (sql, params = []) => {
  if (sql.includes('SELECT * FROM users WHERE id = ?')) {
    return db.users.find(u => u.id === params[0]) || null;
  }
  return null;
};

const allDB = async (sql, params = []) => {
  if (sql.includes('SELECT * FROM games WHERE is_active = 1')) {
    return db.games.filter(g => g.is_active === 1);
  }
  return [];
};

const { Server } = require('socket.io');
const cookie = require('cookie');

const PORT = process.env.PORT || 3002; // Dynamically bound port for platforms like Railway or local testing
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';
const HOST_URL = process.env.HOST_URL || `http://localhost:${PORT}`;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

let discordBot = null;

const server = http.createServer(async (req, res) => {
  const rawPath = req.url.split('?')[0];
  const urlPath = rawPath.toLowerCase();

  // Suppress favicon 404 errors
  if (urlPath === '/favicon.ico') {
    res.writeHead(204);
    return res.end();
  }

  // 🚀 Discord OAuth2 Endpoints 🚀
  if (urlPath === '/auth/discord' && req.method === 'GET') {
    if (!DISCORD_CLIENT_ID) {
      res.writeHead(500); return res.end('Discord Client ID not configured');
    }
    const redirectUri = encodeURIComponent(`${HOST_URL}/auth/discord/callback`);
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20guilds.join`;
    res.writeHead(302, { Location: authUrl });
    return res.end();
  }

  if (urlPath === '/auth/discord/callback' && req.method === 'GET') {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const code = parsedUrl.searchParams.get('code');
    if (!code) {
      res.writeHead(400); return res.end('No code provided');
    }

    try {
      const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: `${HOST_URL}/auth/discord/callback`
        })
      });
      const tokenData = await tokenRes.json();
      
      if (!tokenData.access_token) {
        console.error("Discord Token Error:", tokenData);
        throw new Error(`Discord API Error: ${tokenData.error_description || tokenData.error || 'Failed to get access token'}`);
      }

      const userRes = await fetch('https://discord.com/api/users/@me', {
        headers: { authorization: `${tokenData.token_type} ${tokenData.access_token}` }
      });
      const userData = await userRes.json();

      // Automatically add user to the Discord Server
      if (DISCORD_BOT_TOKEN) {
        try {
          await fetch(`https://discord.com/api/guilds/1503523944605683862/members/${userData.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
            },
            body: JSON.stringify({ access_token: tokenData.access_token })
          });
        } catch (e) {
          console.error("Failed to add user to guild:", e);
        }
      }

      const jwtToken = jwt.sign(
        { id: userData.id, username: userData.username, avatar: userData.avatar },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.setHeader('Set-Cookie', cookie.serialize('auth_token', jwtToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      }));

      res.writeHead(302, { Location: `/${userData.username}` });
      return res.end();
    } catch (err) {
      console.error(err);
      res.writeHead(500); return res.end('OAuth Error: ' + err.message);
    }
  }

  
    // Fetch Supported Games for the Universal Widget
    if (urlPath === '/api/games' && req.method === 'GET') {
      try {
        const games = await allDB('SELECT * FROM games WHERE is_active = 1');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(games));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'DB Error' }));
      }
    }

    if (urlPath === '/api/me' && req.method === 'GET') {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.auth_token;
    if (!token) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Not authenticated' }));
    }
    try {
      const user = jwt.verify(token, JWT_SECRET);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ user }));
    } catch (err) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid token' }));
    }
  }

  // 🚀 Discord API Bridge 🚀
  if (req.method === 'GET' && urlPath === '/api/discord/channels') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (!discordBot || !discordBot.client || !discordBot.client.isReady()) {
      return res.end(JSON.stringify([]));
    }
    const guild = discordBot.client.guilds.cache.get('1503523944605683862');
    if (!guild) {
      return res.end(JSON.stringify([]));
    }
    const channels = guild.channels.cache
      .filter(c => c.type === 0)
      .map(c => ({ id: c.id, name: c.name, position: c.position }))
      .sort((a, b) => a.position - b.position);
    return res.end(JSON.stringify(channels));
  }

  if (req.method === 'POST' && urlPath === '/api/discord/announce') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        if (!discordBot) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "Discord bot not running locally" }));
        }
        
        const success = await discordBot.sendAnnouncement(payload.channel, payload.embed, payload.content);
        if (success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Failed to send message to Discord" }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Invalid JSON payload" }));
      }
    });
    return;
  }
  // 🚀 Queue API Endpoints 🚀
  if (urlPath === '/api/queue/status' && req.method === 'GET') {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const game = parsedUrl.searchParams.get('game') || 'arkheron';
    if (!discordBot) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: "Discord bot not running locally" }));
    }
    const status = discordBot.getQueueStatus(game);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
    return;
  }

  if (urlPath === '/api/queue/join' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        if (!discordBot) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "Discord bot not running locally" }));
        }
        const result = await discordBot.webJoinQueue(payload.username, payload.game);
        if (result.success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: result.error }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Invalid JSON payload" }));
      }
    });
    return;
  }

  if (urlPath === '/api/queue/leave' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        if (!discordBot) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "Discord bot not running locally" }));
        }
        const result = await discordBot.webLeaveQueue(payload.username, payload.game);
        if (result.success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: result.error }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Invalid JSON payload" }));
      }
    });
    return;
  }

  // ── /clicker shortcut ─────────────────────────────────────────────
  if (urlPath === '/clicker') {
    res.writeHead(302, { Location: '/clicker.html' });
    res.end();
    return;
  }

  // ── Static file — has a file extension, serve normally ────────────
  const extname = path.extname(urlPath);
  if (extname) {
    const filePath = path.join(__dirname, rawPath);
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404); res.end('Not found');
      } else {
        const mime = MIME_TYPES[extname] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(content, 'utf-8');
      }
    });
    return;
  }

  // ── Dynamic profile route: /username ──────────────────────────────
  // Any single-segment path (e.g. /resteral, /tofushark) is treated as
  // a player profile URL. The server injects __PROFILE_PLAYER__ into the
  // HTML; the client resolves whether that player actually exists.
  const segments = urlPath.split('/').filter(Boolean);
  if (segments.length === 1 && segments[0] !== 'index') {
    const slug = segments[0]; // e.g. "resteral"
    const htmlPath = path.join(__dirname, 'index.html');
    fs.readFile(htmlPath, 'utf-8', (err, html) => {
      if (err) { res.writeHead(500); res.end('Server Error'); return; }
      const injected = html.replace('</head>', `
  <script>
    /* Profile route: /${slug} */
    window.__PROFILE_SLUG__ = ${JSON.stringify(slug)};
  </script>
</head>`);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(injected, 'utf-8');
    });
    return;
  }

  // ── Root / → index.html ───────────────────────────────────────────
  fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
    if (err) { res.writeHead(500); res.end('Server Error'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content, 'utf-8');
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

// Start the Discord bot in the same process if a token is configured
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (DISCORD_BOT_TOKEN && DISCORD_BOT_TOKEN !== 'YOUR_DISCORD_BOT_TOKEN') {
  console.log('DISCORD_BOT_TOKEN detected in environment. Initializing Discord bot...');
  try {
    discordBot = require('./bot.js');
  } catch (error) {
    console.error('Failed to load or start Discord bot:', error);
  }
} else {
  console.log('No DISCORD_BOT_TOKEN found or it is using the placeholder. Operating in Web Simulator mode only.');
}
