const express = require('express');
const session = require('express-session');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || 'oscorp-rp-fallback-secret';

const BOT_PERMISSIONS = '1099935345686';
const BOT_SCOPES = 'bot applications.commands';
const OAUTH_SCOPES = 'identify guilds';

function getInviteUrl() {
  return `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=${BOT_PERMISSIONS}&scope=${encodeURIComponent(BOT_SCOPES)}`;
}

function getLoginUrl() {
  return `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&response_type=code&scope=${encodeURIComponent(OAUTH_SCOPES)}`;
}

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>body{font-family:'Cairo',sans-serif;background:#0b0d14;}
.glow{box-shadow:0 0 40px rgba(99,102,241,.35)}
.gradient-text{background:linear-gradient(90deg,#818cf8,#a78bfa,#60a5fa);-webkit-background-clip:text;background-clip:text;color:transparent}
</style>
</head>
<body class="min-h-screen text-gray-100">
${body}
</body>
</html>`;
}

function landingPage() {
  return layout('OS System Engine | OSCORP RP', `
  <div class="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15),transparent_60%)]"></div>
    <div class="relative z-10 text-center max-w-2xl">
      <span class="inline-block px-4 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm mb-6">⚡ OSCORP RP Bot Engine</span>
      <h1 class="text-5xl md:text-6xl font-extrabold mb-4 gradient-text">OS System Engine</h1>
      <p class="text-gray-400 text-lg mb-10">لوحة تحكم متكاملة لإدارة سيرفرك، الحماية التلقائية، والتذاكر — بتصميم عصري وأداء عالي.</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/login" class="glow px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 font-bold text-white hover:scale-105 transition-transform flex items-center justify-center gap-2">
          🔐 تسجيل الدخول
        </a>
        <a href="${getInviteUrl()}" target="_blank" class="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-white hover:bg-white/10 hover:scale-105 transition-all flex items-center justify-center gap-2">
          ➕ إضافة البوت للسيرفر
        </a>
      </div>
    </div>
    <div class="relative z-10 mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
      <div class="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
        <div class="text-2xl mb-2">🛡️</div><div class="font-bold">حماية تلقائية</div>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
        <div class="text-2xl mb-2">🎟️</div><div class="font-bold">نظام تذاكر</div>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
        <div class="text-2xl mb-2">⚙️</div><div class="font-bold">تحكم كامل</div>
      </div>
    </div>
  </div>`);
}

function dashboardPage(user, guilds) {
  const manageable = guilds.filter((g) => (BigInt(g.permissions) & BigInt(0x20)) === BigInt(0x20));
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;

  const guildCards = manageable.length
    ? manageable.map((g) => `
      <div class="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:bg-white/10 transition-all">
        <img src="${g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-10 h-10 rounded-full" />
        <span class="font-semibold truncate">${g.name}</span>
      </div>`).join('')
    : `<p class="text-gray-400 col-span-full text-center">لا تملك صلاحية "إدارة السيرفر" في أي سيرفر متاح.</p>`;

  return layout('لوحة التحكم | OSCORP RP', `
  <nav class="flex items-center justify-between px-8 py-5 border-b border-white/10">
    <span class="font-extrabold text-xl gradient-text">OS System Engine</span>
    <div class="flex items-center gap-4">
      <img src="${avatar}" class="w-9 h-9 rounded-full border border-white/20" />
      <span class="font-semibold">${user.username}</span>
      <a href="/logout" class="text-sm px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20">تسجيل خروج</a>
    </div>
  </nav>
  <div class="max-w-5xl mx-auto px-6 py-10">
    <h2 class="text-2xl font-bold mb-6">سيرفراتك</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">${guildCards}</div>
  </div>`);
}

function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 6 },
  }));

  app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.status(200).send(landingPage());
  });

  app.get('/login', (req, res) => {
    if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URL) {
      return res.status(500).send('❌ متغيرات OAuth2 غير مضبوطة (CLIENT_ID / CLIENT_SECRET / CALLBACK_URL).');
    }
    res.redirect(getLoginUrl());
  });

  app.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/');
    try {
      const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: CALLBACK_URL,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error('لم يتم الحصول على access_token');

      const [userRes, guildsRes] = await Promise.all([
        fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${tokenData.access_token}` } }),
        fetch('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${tokenData.access_token}` } }),
      ]);

      req.session.user = await userRes.json();
      req.session.guilds = await guildsRes.json();
      res.redirect('/dashboard');
    } catch (err) {
      console.error('OAuth2 callback error:', err);
      res.redirect('/');
    }
  });

  app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.send(dashboardPage(req.session.user, req.session.guilds || []));
  });

  app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
  });

  app.get('/health', (req, res) => res.status(200).send('OK'));

  return app;
}

module.exports = { createApp };
