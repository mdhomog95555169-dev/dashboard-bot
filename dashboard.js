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
<style>
  body { font-family: 'Cairo', sans-serif; background: #0b0d14; }
  .glow { box-shadow: 0 0 35px rgba(99, 102, 241, 0.35); }
  .gradient-text { background: linear-gradient(90deg, #818cf8, #a78bfa, #60a5fa); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
</style>
</head>
<body class="min-h-screen text-gray-100 flex flex-col">
${body}
</body>
</html>`;
}

// الواجهة الرئيسية المعدلة (Landing Page)
function landingPage() {
  return layout('OS System Engine | OSCORP RP', `
  <div class="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.2),transparent_70%)]"></div>
    
    <div class="relative z-10 text-center max-w-3xl">
      <span class="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-semibold mb-6">
        ⚡ OSCORP RP Bot Engine v1.2
      </span>
      <h1 class="text-5xl md:text-7xl font-black mb-6 gradient-text tracking-tight">OS System Engine</h1>
      <p class="text-gray-300 text-lg md:text-xl mb-10 leading-relaxed font-medium">
        أهلاً بك في المحرك الإداري المتقدم لـ <span class="text-indigo-400 font-bold">OSCORP RP</span>. تحكم كامل وحماية فائقة بسيرفراتك من مكان واحد.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <a href="/login" class="glow px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 font-bold text-white hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
          🔐 تسجيل الدخول عبر Discord
        </a>
        <a href="${getInviteUrl()}" target="_blank" class="px-8 py-4 rounded-2xl glass font-bold text-white hover:bg-white/10 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
          ➕ إضافة البوت للسيرفر
        </a>
      </div>

      <!-- قسم الإحصائيات السريعة والترحيب المطور x1000 -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div class="glass p-5 rounded-2xl border border-indigo-500/20">
          <div class="text-3xl font-extrabold text-indigo-400 mb-1">99.9%</div>
          <div class="text-xs text-gray-400 font-bold">مدة التشغيل (Uptime)</div>
        </div>
        <div class="glass p-5 rounded-2xl border border-blue-500/20">
          <div class="text-3xl font-extrabold text-blue-400 mb-1">23+</div>
          <div class="text-xs text-gray-400 font-bold">أمر إداري وحماية</div>
        </div>
        <div class="glass p-5 rounded-2xl border border-purple-500/20">
          <div class="text-3xl font-extrabold text-purple-400 mb-1">Fast</div>
          <div class="text-xs text-gray-400 font-bold">سرعة استجابة فائقة</div>
        </div>
      </div>
    </div>
  </div>`);
}

// قائمة السيرفرات
function dashboardPage(user, guilds) {
  const manageable = guilds.filter((g) => (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8) || (BigInt(g.permissions) & BigInt(0x20)) === BigInt(0x20));
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;

  const guildCards = manageable.length
    ? manageable.map((g) => `
      <div class="glass rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-indigo-500/50 transition-all">
        <div class="flex items-center gap-4">
          <img src="${g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-12 h-12 rounded-2xl border border-white/10" />
          <div>
            <h3 class="font-bold text-lg text-white">${g.name}</h3>
            <span class="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">Administrator</span>
          </div>
        </div>
        <a href="/dashboard/${g.id}" class="glow px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 font-bold text-sm text-white hover:scale-105 transition-all">
          إدارة السيرفر
        </a>
      </div>`).join('')
    : `<p class="text-gray-400 col-span-full text-center py-10 glass rounded-2xl">لا تملك صلاحيات إدارة في أي سيرفر حالياً.</p>`;

  return layout('لوحة التحكم | OSCORP RP', `
  <nav class="flex items-center justify-between px-8 py-5 glass border-b border-white/10">
    <span class="font-extrabold text-xl gradient-text">OS System Engine</span>
    <div class="flex items-center gap-4">
      <img src="${avatar}" class="w-10 h-10 rounded-full border border-indigo-500/30" />
      <span class="font-bold text-sm">${user.username}</span>
      <a href="/logout" class="text-xs px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-bold hover:bg-red-500/20 transition-all">تسجيل خروج</a>
    </div>
  </nav>
  <div class="max-w-5xl mx-auto px-6 py-12 w-full">
    <div class="mb-8">
      <h2 class="text-3xl font-extrabold text-white mb-2">سيرفراتك</h2>
      <p class="text-gray-400 text-sm">اختر السيرفر للدخول وإدارة الإعدادات والحماية والتذاكر</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${guildCards}</div>
  </div>`);
}

// لوحة التحكم الداخلية الشاملة (جميع الأقسام المطلوب)
function guildManagePage(user, guildId, currentTab = 'settings') {
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;

  const tabs = [
    { id: 'settings', name: '⚙️ الإعدادات العامة (Settings)' },
    { id: 'welcome', name: '👋 الترحب والمغادرة (Welcome)' },
    { id: 'automod', name: '🛡️ الحماية التلقائية (AutoMod)' },
    { id: 'tickets', name: '🎟️ نظام التذاكر (Tickets)' },
    { id: 'support', name: '💬 الدعم الفني (Support)' }
  ];

  const navTabs = tabs.map(t => `
    <a href="/dashboard/${guildId}?tab=${t.id}" class="px-5 py-3 rounded-xl font-bold text-sm transition-all ${currentTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'glass text-gray-400 hover:text-white'}">
      ${t.name}
    </a>
  `).join('');

  return layout(`إدارة السيرفر | OS Engine`, `
  <nav class="flex items-center justify-between px-8 py-5 glass border-b border-white/10">
    <div class="flex items-center gap-4">
      <a href="/dashboard" class="text-xs px-3 py-1.5 rounded-lg glass text-gray-300 hover:text-white">← العودة للسيرفرات</a>
      <span class="font-extrabold text-xl gradient-text">OS System Control</span>
    </div>
    <div class="flex items-center gap-3">
      <img src="${avatar}" class="w-9 h-9 rounded-full border border-indigo-500/30" />
      <span class="font-bold text-sm">${user.username}</span>
    </div>
  </nav>

  <div class="max-w-6xl mx-auto px-6 py-10 w-full flex-1">
    <div class="flex flex-wrap gap-3 mb-8">
      ${navTabs}
    </div>

    <div class="glass p-8 rounded-3xl border border-white/10">
      ${currentTab === 'settings' ? `
        <h3 class="text-2xl font-bold mb-6">⚙️ الإعدادات العامة</h3>
        <form class="space-y-6">
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">البريفكس الخاص بالبوت (Prefix)</label>
            <input type="text" value="-" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">لغة البوت الرسمية</label>
            <select class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
              <option class="bg-gray-900">العربية (Arabic)</option>
              <option class="bg-gray-900">English</option>
            </select>
          </div>
          <button type="button" class="px-6 py-3 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-500 transition-all">حفظ التغيرات</button>
        </form>

      ` : currentTab === 'welcome' ? `
        <h3 class="text-2xl font-bold mb-6">👋 نظام الترحب والمغادرة</h3>
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">قناة الترحيب (Welcome Channel)</label>
            <input type="text" placeholder="#welcome" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">رسالة الترحيب Custom Welcome Message</label>
            <textarea class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 h-28" placeholder="مرحباً بك {user} في السيرفر!"></textarea>
          </div>
          <button type="button" class="px-6 py-3 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-500 transition-all">حفظ الإعدادات</button>
        </div>

      ` : currentTab === 'automod' ? `
        <h3 class="text-2xl font-bold mb-6">🛡️ نظام الحماية التلقائي (AutoMod)</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 glass rounded-xl">
            <div><div class="font-bold">حظر الروابط المباشرة (Anti-Links)</div><div class="text-xs text-gray-400">حذف أي رابط ديسكورد أو موجه آخر تلقائياً</div></div>
            <input type="checkbox" checked class="w-6 h-6 accent-indigo-600" />
          </div>
          <div class="flex items-center justify-between p-4 glass rounded-xl">
            <div><div class="font-bold">منع السبام والتكرار (Anti-Spam)</div><div class="text-xs text-gray-400">حماية السيرفر من النشر السريع المتكرر</div></div>
            <input type="checkbox" checked class="w-6 h-6 accent-indigo-600" />
          </div>
          <div class="flex items-center justify-between p-4 glass rounded-xl">
            <div><div class="font-bold">تصفية الكلمات البذيئة (Bad Words Filter)</div><div class="text-xs text-gray-400">حذف الرسائل التي تحتوي كلمات محظورة تلقائياً</div></div>
            <input type="checkbox" checked class="w-6 h-6 accent-indigo-600" />
          </div>
        </div>

      ` : currentTab === 'tickets' ? `
        <h3 class="text-2xl font-bold mb-6">🎟️ نظام التذاكر (Tickets)</h3>
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">رتبة الدعم الفني المسؤول (Support Role)</label>
            <input type="text" placeholder="@Support" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">عنوان كرت التذكرة</label>
            <input type="text" value="الدعم الفني والخدمات" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <button type="button" class="px-6 py-3 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-500 transition-all">إرسال لوحة التذاكر للسيرفر</button>
        </div>

      ` : `
        <h3 class="text-2xl font-bold mb-6">💬 الدعم الفني والخدمات المباشرة</h3>
        <p class="text-gray-300 mb-4">إذا واجهتك أي مشكلة أو استفسار بخصوص البوت واللوحة، يمكنك الانضمام لسيرفر الدعم الفني الرسمي.</p>
        <a href="https://discord.gg" target="_blank" class="inline-block px-6 py-3 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-500 transition-all">الانضمام لسيرفر الدعم 🎧</a>
      `}
    </div>
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
    res.send(landingPage());
  });

  app.get('/login', (req, res) => {
    if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URL) {
      return res.status(500).send('❌ متغيرات OAuth2 غير مضبوطة على السيرفر.');
    }
    res.redirect(getLoginUrl());
  });

  const handleCallback = async (req, res) => {
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
  };

  app.get('/callback', handleCallback);
  app.get('/api/auth/discord/callback', handleCallback);

  app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.send(dashboardPage(req.session.user, req.session.guilds || []));
  });

  app.get('/dashboard/:guildId', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const tab = req.query.tab || 'settings';
    res.send(guildManagePage(req.session.user, req.params.guildId, tab));
  });

  app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
  });

  app.get('/health', (req, res) => res.status(200).send('OK'));

  return app;
}

module.exports = { createApp };
