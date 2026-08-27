const express = require('express');
const session = require('express-session');
const { getAutomodSettings, getPrefix } = require('./database');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || 'oscorp-rp-fallback-secret';

const BOT_PERMISSIONS = '1099935345686';
const BOT_SCOPES = 'bot applications.commands';
const OAUTH_SCOPES = 'identify guilds';
const ADMINISTRATOR = BigInt(0x8);

function getInviteUrl() {
  return `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=${BOT_PERMISSIONS}&scope=${encodeURIComponent(BOT_SCOPES)}`;
}

function getLoginUrl() {
  return `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&response_type=code&scope=${encodeURIComponent(OAUTH_SCOPES)}`;
}

function isAdmin(guild) {
  try { return (BigInt(guild.permissions) & ADMINISTRATOR) === ADMINISTRATOR; }
  catch { return false; }
}

function layout(title, body, extraHead = '') {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { font-family: 'Cairo', sans-serif; }
  body {
    background: #05060a;
    background-image:
      radial-gradient(circle at 15% 20%, rgba(129,140,248,0.18), transparent 40%),
      radial-gradient(circle at 85% 15%, rgba(167,139,250,0.15), transparent 40%),
      radial-gradient(circle at 50% 90%, rgba(96,165,250,0.12), transparent 45%);
    min-height: 100vh;
  }
  .glass {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .glow-btn { box-shadow: 0 0 25px rgba(99,102,241,.45), 0 0 60px rgba(99,102,241,.15); transition: all .3s ease; }
  .glow-btn:hover { box-shadow: 0 0 40px rgba(99,102,241,.7), 0 0 90px rgba(99,102,241,.25); transform: translateY(-3px) scale(1.03); }
  .gradient-text { background: linear-gradient(90deg,#818cf8,#c084fc,#60a5fa); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .float { animation: float 6s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
  .pulse-ring { animation: pulse-ring 2.5s cubic-bezier(0.4,0,0.6,1) infinite; }
  @keyframes pulse-ring { 0%{opacity:.6; transform:scale(1)} 100%{opacity:0; transform:scale(1.8)} }
  .fade-up { animation: fadeUp .8s ease both; }
  @keyframes fadeUp { from{opacity:0; transform:translateY(24px)} to{opacity:1; transform:translateY(0)} }
  .card-hover { transition: all .3s ease; }
  .card-hover:hover { transform: translateY(-6px); border-color: rgba(129,140,248,0.5); box-shadow: 0 10px 40px rgba(99,102,241,.25); }
  .step-line { background: linear-gradient(90deg, rgba(129,140,248,.5), rgba(167,139,250,.5)); }
  ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: rgba(129,140,248,0.4); border-radius: 10px; }
</style>
${extraHead}
</head>
<body class="text-gray-100">
${body}
</body>
</html>`;
}

function landingPage(stats) {
  return layout('OS System Engine | OSCORP RP', `
  <div class="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden py-16">
    <div class="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl float"></div>
    <div class="absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl float" style="animation-delay:2s"></div>

    <div class="relative z-10 text-center max-w-2xl fade-up">
      <div class="relative inline-block mb-6">
        <span class="absolute inset-0 rounded-full bg-indigo-500/40 pulse-ring"></span>
        <span class="relative inline-block px-5 py-1.5 rounded-full glass text-indigo-300 text-sm font-semibold">⚡ OSCORP RP Bot Engine</span>
      </div>
      <h1 class="text-5xl md:text-7xl font-black mb-5 gradient-text leading-tight">OS System Engine</h1>
      <p class="text-gray-400 text-lg md:text-xl mb-12 leading-relaxed">لوحة تحكم متكاملة لإدارة سيرفرك، الحماية التلقائية، والتذاكر<br/>بتصميم عصري وأداء خارق.</p>
      <div class="flex flex-col sm:flex-row gap-5 justify-center">
        <a href="/login" class="glow-btn px-9 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 font-bold text-white flex items-center justify-center gap-2 text-lg">
          🔐 تسجيل الدخول عبر Discord
        </a>
        <a href="${getInviteUrl()}" target="_blank" class="px-9 py-4 rounded-2xl glass font-bold text-white hover:bg-white/10 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg">
          ➕ إضافة البوت للسيرفر
        </a>
      </div>
    </div>

    <div class="relative z-10 mt-16 max-w-4xl w-full fade-up" style="animation-delay:.15s">
      <div class="glass rounded-3xl p-8 md:p-10">
        <div class="text-center mb-8">
          <h2 class="text-2xl md:text-3xl font-black gradient-text mb-2">أهلاً بك في OS System Engine</h2>
          <p class="text-gray-400">محرك إدارة متكامل يعمل على مدار الساعة لخدمة مجتمعك</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div class="text-center rounded-2xl bg-white/5 border border-white/10 py-5">
            <div class="text-3xl font-black text-indigo-300">${stats.guildCount}</div>
            <div class="text-sm text-gray-500 mt-1">سيرفر يثق بنا</div>
          </div>
          <div class="text-center rounded-2xl bg-white/5 border border-white/10 py-5">
            <div class="text-3xl font-black text-purple-300">99.9%</div>
            <div class="text-sm text-gray-500 mt-1">نسبة التشغيل</div>
          </div>
          <div class="text-center rounded-2xl bg-white/5 border border-white/10 py-5">
            <div class="text-3xl font-black text-blue-300">${stats.ping}ms</div>
            <div class="text-sm text-gray-500 mt-1">سرعة الاستجابة</div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
          <div class="hidden sm:block absolute top-6 left-[16.6%] right-[16.6%] h-0.5 step-line"></div>
          <div class="relative text-center">
            <div class="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-black text-lg mb-3 glow-btn">1</div>
            <div class="font-bold mb-1">سجّل الدخول</div>
            <p class="text-gray-500 text-sm">بحسابك في Discord بأمان عبر OAuth2</p>
          </div>
          <div class="relative text-center">
            <div class="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-black text-lg mb-3 glow-btn">2</div>
            <div class="font-bold mb-1">اختر سيرفرك</div>
            <p class="text-gray-500 text-sm">من قائمة السيرفرات التي تديرها</p>
          </div>
          <div class="relative text-center">
            <div class="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center font-black text-lg mb-3 glow-btn">3</div>
            <div class="font-bold mb-1">اضبط الإعدادات</div>
            <p class="text-gray-500 text-sm">فعّل الحماية وخصص البوت لمجتمعك</p>
          </div>
        </div>
      </div>
    </div>
  </div>`);
}

function dashboardPage(user, guilds) {
  const adminGuilds = guilds.filter(isAdmin);
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;

  const guildCards = adminGuilds.length
    ? adminGuilds.map((g) => `
      <div class="glass card-hover rounded-2xl p-5 flex items-center gap-4">
        <img src="${g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-12 h-12 rounded-full border border-white/10" />
        <div class="flex-1 min-w-0">
          <div class="font-bold truncate">${g.name}</div>
          <div class="text-xs text-indigo-300">Administrator</div>
        </div>
        <a href="/manage/${g.id}" class="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-sm font-bold whitespace-nowrap hover:scale-105 transition-transform">إدارة السيرفر</a>
      </div>`).join('')
    : `<p class="text-gray-400 col-span-full text-center py-10">لا تملك صلاحية Administrator في أي سيرفر متاح لحسابك.</p>`;

  return layout('لوحة التحكم | OSCORP RP', `
  <nav class="flex items-center justify-between px-8 py-5 glass sticky top-0 z-20">
    <span class="font-black text-xl gradient-text">OS System Engine</span>
    <div class="flex items-center gap-4">
      <img src="${avatar}" class="w-10 h-10 rounded-full border-2 border-indigo-400/40" />
      <span class="font-semibold hidden sm:inline">${user.username}</span>
      <a href="/logout" class="text-sm px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors">تسجيل خروج</a>
    </div>
  </nav>
  <div class="max-w-5xl mx-auto px-6 py-12 fade-up">
    <h2 class="text-3xl font-black mb-2">سيرفراتك</h2>
    <p class="text-gray-500 mb-8">السيرفرات التي تملك فيها صلاحية Administrator</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">${guildCards}</div>
  </div>`);
}

function manageGuildPage(guildId, guildName, automod) {
  const row = (label, enabled) => `
    <div class="glass rounded-xl p-4 flex items-center justify-between">
      <span class="font-semibold">${label}</span>
      <span class="px-3 py-1 rounded-full text-xs font-bold ${enabled ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-gray-400'}">${enabled ? 'مفعّل' : 'معطّل'}</span>
    </div>`;

  return layout(`إدارة ${guildName} | OSCORP RP`, `
  <nav class="flex items-center justify-between px-8 py-5 glass sticky top-0 z-20">
    <a href="/dashboard" class="font-black text-xl gradient-text">OS System Engine</a>
    <a href="/dashboard" class="text-sm px-4 py-2 rounded-xl glass hover:bg-white/10">⟵ رجوع للوحة</a>
  </nav>
  <div class="max-w-3xl mx-auto px-6 py-12 fade-up">
    <h2 class="text-3xl font-black mb-1">${guildName}</h2>
    <p class="text-gray-500 mb-8">البادئة الحالية: <span class="text-indigo-300 font-bold">${automod.prefix}</span></p>

    <h3 class="text-xl font-bold mb-4">🛡️ حالة الحماية التلقائية (AutoMod)</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
      ${row('منع الروابط', automod.anti_link)}
      ${row('منع السبام', automod.anti_spam)}
      ${row('منع الكلمات المحظورة', automod.anti_badwords)}
      ${row('منع الأحرف الكبيرة', automod.anti_caps)}
      ${row('منع المنشن المكثف', automod.anti_mentions)}
    </div>
    <div class="glass rounded-2xl p-6 text-center text-gray-400">
      🚧 تعديل هذه الإعدادات مباشرة من اللوحة قادم في المرحلة القادمة من التطوير.
    </div>
  </div>`);
}

function createApp(client) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 6 },
  }));

  function getStats() {
    const guildCount = client?.guilds?.cache?.size ?? 0;
    const ping = client?.ws?.ping && client.ws.ping > 0 ? Math.round(client.ws.ping) : 0;
    return { guildCount, ping };
  }

  app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.status(200).send(landingPage(getStats()));
  });

  app.get('/login', (req, res) => {
    if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URL) {
      return res.status(500).send('❌ متغيرات OAuth2 غير مضبوطة (CLIENT_ID / CLIENT_SECRET / CALLBACK_URL).');
    }
    res.redirect(getLoginUrl());
  });

  async function handleOAuthCallback(req, res) {
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
  }

  app.get('/callback', handleOAuthCallback);

  // مسار احتياطي في حال كان تطبيق Discord مضبوطاً على رابط Redirect مختلف
  app.get('/api/auth/discord/callback', (req, res) => {
    const query = new URLSearchParams(req.query).toString();
    res.redirect(`/callback${query ? `?${query}` : ''}`);
  });

  app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.send(dashboardPage(req.session.user, req.session.guilds || []));
  });

  app.get('/manage/:guildId', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { guildId } = req.params;
    const guild = (req.session.guilds || []).find((g) => g.id === guildId);
    if (!guild || !isAdmin(guild)) return res.status(403).send('❌ لا تملك صلاحية Administrator في هذا السيرفر.');

    const automod = getAutomodSettings(guildId);
    automod.prefix = getPrefix(guildId);
    res.send(manageGuildPage(guildId, guild.name, automod));
  });

  app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
  });

  app.get('/health', (req, res) => res.status(200).send('OK'));

  return app;
}

module.exports = { createApp };
