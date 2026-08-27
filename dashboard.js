const express = require('express');
const session = require('express-session');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || 'oscorp-rp-fallback-secret';
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const BOT_PERMISSIONS = '1099935345686';
const BOT_SCOPES = 'bot applications.commands';
const OAUTH_SCOPES = 'identify guilds';

function getInviteUrl() {
  return `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=${BOT_PERMISSIONS}&scope=${encodeURIComponent(BOT_SCOPES)}`;
}

function getLoginUrl() {
  return `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&response_type=code&scope=${encodeURIComponent(OAUTH_SCOPES)}`;
}

async function fetchGuildChannels(guildId) {
  if (!DISCORD_TOKEN) return [];
  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${DISCORD_TOKEN}` }
    });
    if (!res.ok) return [];
    const channels = await res.json();
    return channels.filter(c => c.type === 0);
  } catch (err) {
    return [];
  }
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
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Cairo', sans-serif; background: #07090e; }
  .glow { box-shadow: 0 0 35px rgba(99, 102, 241, 0.35); }
  .gradient-text { background: linear-gradient(90deg, #818cf8, #c084fc, #60a5fa); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
</style>
</head>
<body class="min-h-screen text-gray-100 flex flex-col">
${body}
</body>
</html>`;
}

function landingPage() {
  return layout('OS System Engine | OSCORP RP', `
  <div class="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.25),transparent_70%)]"></div>
    
    <div class="relative z-10 text-center max-w-3xl">
      <span class="inline-block px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-bold mb-6">
        🚀 OSCORP RP Bot Engine Ultimate v3.0
      </span>
      <h1 class="text-5xl md:text-7xl font-black mb-6 gradient-text tracking-tight">OS System Engine</h1>
      <p class="text-gray-300 text-lg md:text-xl mb-10 leading-relaxed font-medium">
        المحرك الإداري الأقوى لإدارة وتأمين سيرفرات ديسكورد بالكامل مع نظام تذاكر وترحيب مخصص وحماية فائقة.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <a href="/login" class="glow px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 font-extrabold text-white hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
          🔑 تسجيل الدخول عبر Discord
        </a>
        <a href="${getInviteUrl()}" target="_blank" class="px-8 py-4 rounded-2xl glass font-extrabold text-white hover:bg-white/10 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
          ➕ إضافة البوت للسيرفر
        </a>
      </div>
    </div>
  </div>`);
}

function dashboardPage(user, guilds) {
  const manageable = guilds.filter((g) => (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8) || (BigInt(g.permissions) & BigInt(0x20)) === BigInt(0x20));
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;

  const guildCards = manageable.length
    ? manageable.map((g) => `
      <div class="glass rounded-2xl p-6 flex items-center justify-between gap-4 hover:border-indigo-500/50 transition-all">
        <div class="flex items-center gap-4">
          <img src="${g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-14 h-14 rounded-2xl border border-white/10" />
          <div>
            <h3 class="font-extrabold text-lg text-white">${g.name}</h3>
            <span class="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">Administrator</span>
          </div>
        </div>
        <a href="/dashboard/${g.id}" class="glow px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 font-extrabold text-sm text-white hover:scale-105 transition-all">
          إدارة السيرفر
        </a>
      </div>`).join('')
    : `<p class="text-gray-400 col-span-full text-center py-10 glass rounded-2xl">لا تملك صلاحيات أدمن في أي سيرفر حالياً.</p>`;

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
      <h2 class="text-3xl font-black text-white mb-2">سيرفراتك</h2>
      <p class="text-gray-400 text-sm font-medium">اختر السيرفر لتخصيص كامل الإعدادات والرومات والحماية</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${guildCards}</div>
  </div>`);
}

function guildManagePage(user, guildId, currentTab = 'settings', channels = []) {
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;

  const channelOptions = channels.length > 0
    ? channels.map(c => `<option value="${c.id}" class="bg-gray-900"># ${c.name}</option>`).join('')
    : `<option value="" class="bg-gray-900">تحديد قناة...</option>`;

  const tabs = [
    { id: 'settings', name: '⚙️ الإعدادات العامة' },
    { id: 'welcome', name: '🎉 الترحيب والمغادرة' },
    { id: 'moderation', name: '⚔️ الإشراف والإدارة' },
    { id: 'automod', name: '🛡️ الحماية المتقدمة (AutoMod)' },
    { id: 'tickets', name: '🎫 إدارة التذاكر' },
    { id: 'support', name: '💬 الدعم والروابط' }
  ];

  const navTabs = tabs.map(t => `
    <a href="/dashboard/${guildId}?tab=${t.id}" class="px-5 py-3 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 ${currentTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 border border-indigo-400/30' : 'glass text-gray-400 hover:text-white'}">
      ${t.name}
    </a>
  `).join('');

  return layout(`إدارة السيرفر | OS Engine`, `
  <nav class="flex items-center justify-between px-8 py-5 glass border-b border-white/10">
    <div class="flex items-center gap-4">
      <a href="/dashboard" class="text-xs px-3.5 py-2 rounded-xl glass text-gray-300 hover:text-white font-bold">← العودة للرئيسية</a>
      <span class="font-extrabold text-xl gradient-text">OS Control Center</span>
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
        <h3 class="text-2xl font-black mb-6 flex items-center gap-2">⚙️ الإعدادات العامة الشاملة</h3>
        <form class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-gray-300 mb-2">اسم البوت المستعار داخل السيرفر</label>
              <input type="text" placeholder="OSCORP RP Bot" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-300 mb-2">البريفكس الخاص بالأوامر (Prefix)</label>
              <input type="text" value="-" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-gray-300 mb-2">لغة البوت الرئيسية</label>
              <select class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                <option class="bg-gray-900">العربية (Arabic)</option>
                <option class="bg-gray-900">English</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-300 mb-2">حالة نشاط البوت (Bot Activity)</label>
              <input type="text" value="إدارة OSCORP RP ⚡" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <button type="button" class="glow px-8 py-3.5 rounded-xl bg-indigo-600 font-extrabold text-white hover:bg-indigo-500 transition-all">حفظ التغيرات</button>
        </form>

      ` : currentTab === 'welcome' ? `
        <h3 class="text-2xl font-black mb-6 flex items-center gap-2">🎉 نظام الترحيب والمغادرة المطور + كرت الصورة Custom</h3>
        <form class="space-y-6" enctype="multipart/form-data">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-gray-300 mb-2">تحديد قناة الترحيب (Welcome Channel)</label>
              <select class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                ${channelOptions}
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-300 mb-2">تحديد قناة المغادرة (Leave Channel)</label>
              <select class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                ${channelOptions}
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">رسالة الترحيب النصية المخصصة</label>
            <textarea class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 h-24" placeholder="مرحباً بك {user} في سيرفرنا! نورت المكان 🌟"></textarea>
          </div>

          <div class="p-6 glass rounded-2xl border border-indigo-500/20 space-y-4">
            <h4 class="font-extrabold text-indigo-400 text-lg flex items-center gap-2">🖼️ إعدادات صورة كرت الترحيب والكركتر (Avatar Canvas)</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-gray-300 mb-2">رفع صورة الخلفية (Upload Background Image)</label>
                <input type="file" accept="image/*" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500" />
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-300 mb-2">أو رابط خلفية مباشر (Image URL)</label>
                <input type="text" placeholder="https://i.imgur.com/example.png" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div class="border-t border-white/10 pt-4">
              <label class="block text-sm font-bold text-gray-300 mb-3">📍 التحكم في موضع وحجم صوّرة العضو (User Avatar position X, Y, Size):</label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-400 mb-1">الموقع الأفقي (Avatar X)</label>
                  <input type="number" value="250" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-400 mb-1">الموقع الرأسي (Avatar Y)</label>
                  <input type="number" value="100" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-400 mb-1">حجم الصورة (Avatar Size)</label>
                  <input type="number" value="120" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-400 mb-1">تدوير الحواف (Border Radius)</label>
                  <input type="number" value="50" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="50% للدائري" />
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <input type="checkbox" id="welcome_card" checked class="w-5 h-5 accent-indigo-600" />
            <label for="welcome_card" class="text-sm font-bold text-gray-300">تفعيل إرسال كرت صورة الترحيب المباشرة</label>
          </div>
          <button type="button" class="glow px-8 py-3.5 rounded-xl bg-indigo-600 font-extrabold text-white hover:bg-indigo-500 transition-all">حفظ الإعدادات بالكامل</button>
        </form>

      ` : currentTab === 'moderation' ? `
        <h3 class="text-2xl font-black mb-6 flex items-center gap-2">⚔️ نظام الإشراف والعقوبات المتقدم (Moderation Engine)</h3>
        <form class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-gray-300 mb-2">قناة سجل العقوبات والإداريات (Mod Log Channel)</label>
              <select class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                ${channelOptions}
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-300 mb-2">رتبة الميوت التلقائية (Mute Role)</label>
              <input type="text" placeholder="Muted" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
              <div><div class="font-bold text-white">حظر الحسابات الوهمية والجديدة (Anti-Alt Accounts)</div><div class="text-xs text-gray-400">طرد أو حظر الحسابات التي أنشئت منذ أقل من 7 أيام</div></div>
              <input type="checkbox" checked class="w-6 h-6 accent-indigo-600" />
            </div>
            <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
              <div><div class="font-bold text-white">نظام التحذيرات التلقائي (Auto Warn System)</div><div class="text-xs text-gray-400">إعطاء ميوت تلقائي بعد 3 تحذيرات وبان بعد 5 تحذيرات</div></div>
              <input type="checkbox" checked class="w-6 h-6 accent-indigo-600" />
            </div>
            <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
              <div><div class="font-bold text-white">سجل تعديل وحذف الرسائل (Message Logs)</div><div class="text-xs text-gray-400">تسجيل أي رسالة تم تعديلها أو حذفها داخل السيرفر</div></div>
              <input type="checkbox" checked class="w-6 h-6 accent-indigo-600" />
            </div>
          </div>
          <button type="button" class="glow px-8 py-3.5 rounded-xl bg-indigo-600 font-extrabold text-white hover:bg-indigo-500 transition-all">حفظ إعدادات الإشراف</button>
        </form>

      ` : currentTab === 'automod' ? `
        <h3 class="text-2xl font-black mb-6 flex items-center gap-2">🛡️ نظام الحماية المتقدم x100 (AutoMod)</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
            <div><div class="font-bold text-white">حظر الروابط المباشرة (Anti-Links)</div><div class="text-xs text-gray-400">حذف كافة الروابط الخارجية ودعوات الديسكورد تلقائياً</div></div>
            <input type="checkbox" checked class="w-6 h-6 accent-indigo-600" />
          </div>
          <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
            <div><div class="font-bold text-white">منع السبام والتكرار (Anti-Spam)</div><div class="text-xs text-gray-400">منع إرسال الرسائل المتكررة بسرعة عالية</div></div>
            <input type="checkbox" checked class="w-6 h-6 accent-indigo-600" />
          </div>
          <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
            <div><div class="font-bold text-white">تصفية الكلمات البذيئة (Bad Words Filter)</div><div class="text-xs text-gray-400">حذف الرسائل التي تحتوي على كلمات محظورة تلقائياً</div></div>
            <input type="checkbox" checked class="w-6 h-6 accent-indigo-600" />
          </div>
          <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
            <div><div class="font-bold text-white">حظر المنشن المفرط (Anti-Mass Mention)</div><div class="text-xs text-gray-400">حظر الرسائل التي تحتوي على أكثر من 5 تاغات</div></div>
            <input type="checkbox" checked class="w-6 h-6 accent-indigo-600" />
          </div>
          <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
            <div><div class="font-bold text-white">منع الأحرف الكبيرة المفرطة (Anti-Caps)</div><div class="text-xs text-gray-400">حذف الرسائل المكتوبة بالكامل باللغة الإنجليزية الكبيرة</div></div>
            <input type="checkbox" class="w-6 h-6 accent-indigo-600" />
          </div>
        </div>

      ` : currentTab === 'tickets' ? `
        <h3 class="text-2xl font-black mb-6 flex items-center gap-2">🎫 نظام التذاكر الاحترافي x1000000</h3>
        <form class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-gray-300 mb-2">القناة المحددة لإرسال لوحة التذاكر (Target Channel)</label>
              <select class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                ${channelOptions}
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-300 mb-2">اسم رتبة الدعم الفني المسؤولة (Support Role)</label>
              <input type="text" placeholder="Support Staff" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-gray-300 mb-2">عنوان كرت التذكرة (Embed Title)</label>
              <input type="text" value="مركز الدعم الفني والخدمات 🎟️" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-300 mb-2">نص زر إنشاء التذكرة (Button Label)</label>
              <input type="text" value="فتح تذكرة دعم 📩" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <button type="button" class="glow px-8 py-3.5 rounded-xl bg-indigo-600 font-extrabold text-white hover:bg-indigo-500 transition-all">إرسال وتثبيت لوحة التذاكر في الروم</button>
        </form>

      ` : `
        <h3 class="text-2xl font-black mb-6 flex items-center gap-2">💬 الدعم الفني والتواصل المباشر</h3>
        <p class="text-gray-300 mb-6 font-medium">يمكنك التواصل مع المطور والدعم الفني عبر وسائل التواصل الاجتماعية التالية:</p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="https://discord.gg" target="_blank" class="p-5 glass rounded-2xl flex items-center gap-4 hover:border-indigo-500/50 transition-all">
            <div class="text-2xl">🎧</div>
            <div>
              <div class="font-bold text-white">سيرفر الدعم</div>
              <div class="text-xs text-gray-400">انضمام لمساعدتك</div>
            </div>
          </a>
          <a href="https://instagram.com" target="_blank" class="p-5 glass rounded-2xl flex items-center gap-4 hover:border-pink-500/50 transition-all">
            <div class="text-2xl">📸</div>
            <div>
              <div class="font-bold text-white">انستقرام</div>
              <div class="text-xs text-gray-400">تابع جديدنا</div>
            </div>
          </a>
          <a href="https://x.com" target="_blank" class="p-5 glass rounded-2xl flex items-center gap-4 hover:border-blue-500/50 transition-all">
            <div class="text-2xl">🌐</div>
            <div>
              <div class="font-bold text-white">تويتر / X</div>
              <div class="text-xs text-gray-400">تحديثات المشروع</div>
            </div>
          </a>
        </div>
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

  app.get('/dashboard/:guildId', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const tab = req.query.tab || 'settings';
    const channels = await fetchGuildChannels(req.params.guildId);
    res.send(guildManagePage(req.session.user, req.params.guildId, tab, channels));
  });

  app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
  });

  app.get('/health', (req, res) => res.status(200).send('OK'));

  return app;
}

module.exports = { createApp };
