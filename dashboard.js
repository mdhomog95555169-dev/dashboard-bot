const express = require('express');
const session = require('express-session');
const { getSettings, updateSettings, addAlias, removeAlias, ALIAS_LIMIT } = require('./database');
const { commands } = require('./commands');

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
      headers: { Authorization: `Bot ${DISCORD_TOKEN}` },
    });
    if (!res.ok) return [];
    const channels = await res.json();
    return channels.filter((c) => c.type === 0);
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
          Open Dashboard →
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
      <p class="text-gray-400 text-sm font-medium">اختر السيرفر للدخول مباشرة إلى لوحة إعداداته الكاملة</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${guildCards}</div>
  </div>`);
}

function checkbox(name, checked) {
  return `<input type="checkbox" name="${name}" ${checked ? 'checked' : ''} class="w-6 h-6 accent-indigo-600" />`;
}

function channelSelect(channels, selectedId, fieldName) {
  const opts = channels.length
    ? channels.map((c) => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''} class="bg-gray-900"># ${c.name}</option>`).join('')
    : `<option value="" class="bg-gray-900">No channels found</option>`;
  return `<select name="${fieldName}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
    <option value="" class="bg-gray-900">— None —</option>
    ${opts}
  </select>`;
}

function guildManagePage(user, guildId, currentTab, channels, settings, flags = {}) {
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;

  const tabs = [
    { id: 'settings', name: '⚙️ General Settings' },
    { id: 'moderation', name: '⚔️ Moderation System' },
    { id: 'welcome', name: '🎉 Welcome System' },
    { id: 'automod', name: '🛡️ AutoMod / Protection' },
    { id: 'tickets', name: '🎫 Ticket System' },
    { id: 'support', name: '💬 Support & Links' },
  ];

  const navTabs = tabs.map((t) => `
    <a href="/dashboard/${guildId}?tab=${t.id}" class="px-5 py-3 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 ${currentTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 border border-indigo-400/30' : 'glass text-gray-400 hover:text-white'}">
      ${t.name}
    </a>
  `).join('');

  const savedBanner = flags.saved ? `<div class="mb-6 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-sm">✅ Changes saved successfully!</div>` : '';
  const aliasLimitBanner = flags.aliasError === 'limit' ? `<div class="mb-6 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-bold text-sm">You have reached the 5-alias limit!</div>` : '';
  const aliasDupBanner = flags.aliasError === 'duplicate' ? `<div class="mb-6 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-bold text-sm">This alias already exists.</div>` : '';

  const moderationCommandNames = commands.filter((c) => c.permission).map((c) => c.name);
  const aliasRows = (settings.aliases || []).length
    ? settings.aliases.map((a) => `
        <div class="flex items-center justify-between p-3 glass rounded-xl border border-white/5">
          <span class="font-bold text-white text-sm">-${a.alias} → /${a.command}</span>
          <form method="POST" action="/dashboard/${guildId}/aliases/remove">
            <input type="hidden" name="alias" value="${a.alias}" />
            <button type="submit" class="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 font-bold hover:bg-red-500/20">Remove</button>
          </form>
        </div>`).join('')
    : `<p class="text-gray-400 text-sm">No custom aliases yet.</p>`;
  const aliasOptions = moderationCommandNames.map((n) => `<option value="${n}" class="bg-gray-900">/${n}</option>`).join('');
  const aliasFull = (settings.aliases || []).length >= ALIAS_LIMIT;

  let content = '';
  if (currentTab === 'settings') {
    content = `
      <h3 class="text-2xl font-black mb-6 flex items-center gap-2">⚙️ General Settings</h3>
      <form method="POST" action="/dashboard/${guildId}/settings" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Bot Nickname in this server</label>
            <input type="text" name="botName" value="${settings.botName || ''}" placeholder="OSCORP RP Bot" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Command Prefix</label>
            <input type="text" name="prefix" value="${settings.prefix || '-'}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Bot Language</label>
            <select name="language" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
              <option value="ar" ${settings.language === 'ar' ? 'selected' : ''} class="bg-gray-900">العربية (Arabic)</option>
              <option value="en" ${settings.language === 'en' ? 'selected' : ''} class="bg-gray-900">English</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Bot Activity Status</label>
            <input type="text" name="botActivity" value="${settings.botActivity || ''}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <button type="submit" class="glow px-8 py-3.5 rounded-xl bg-indigo-600 font-extrabold text-white hover:bg-indigo-500 transition-all">Save Changes</button>
      </form>`;
  } else if (currentTab === 'moderation') {
    content = `
      <h3 class="text-2xl font-black mb-6 flex items-center gap-2">⚔️ Moderation System</h3>
      <form method="POST" action="/dashboard/${guildId}/moderation" class="space-y-6 mb-10">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Mod Log Channel</label>
            ${channelSelect(channels, settings.moderation?.modLogChannelId, 'modLogChannelId')}
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Mute Role Name</label>
            <input type="text" name="muteRoleName" value="${settings.moderation?.muteRoleName || 'Muted'}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
            <div><div class="font-bold text-white">Anti-Alt Accounts</div><div class="text-xs text-gray-400">Kick or ban accounts younger than 7 days</div></div>
            ${checkbox('antiAlt', settings.moderation?.antiAlt)}
          </div>
          <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
            <div><div class="font-bold text-white">Auto Warn System</div><div class="text-xs text-gray-400">Auto-mute after 3 warnings, auto-ban after 5</div></div>
            ${checkbox('autoWarn', settings.moderation?.autoWarn)}
          </div>
          <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
            <div><div class="font-bold text-white">Message Logs</div><div class="text-xs text-gray-400">Log edited and deleted messages</div></div>
            ${checkbox('messageLogs', settings.moderation?.messageLogs)}
          </div>
        </div>
        <button type="submit" class="glow px-8 py-3.5 rounded-xl bg-indigo-600 font-extrabold text-white hover:bg-indigo-500 transition-all">Save Moderation Settings</button>
      </form>

      <div class="border-t border-white/10 pt-8">
        <h4 class="text-xl font-black mb-1 flex items-center gap-2">🔗 Custom Command Aliases</h4>
        <p class="text-gray-400 text-sm mb-4">You can add up to ${ALIAS_LIMIT} custom aliases (${(settings.aliases || []).length}/${ALIAS_LIMIT} used).</p>
        <div class="space-y-3 mb-5">${aliasRows}</div>
        <form method="POST" action="/dashboard/${guildId}/aliases/add" class="flex flex-col md:flex-row gap-3">
          <input type="text" name="alias" placeholder="e.g. b" required ${aliasFull ? 'disabled' : ''} class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-40" />
          <select name="command" ${aliasFull ? 'disabled' : ''} class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-40">
            ${aliasOptions}
          </select>
          <button type="submit" ${aliasFull ? 'disabled' : ''} class="px-6 py-3 rounded-xl bg-indigo-600 font-extrabold text-white hover:bg-indigo-500 disabled:opacity-40 transition-all">Add Alias</button>
        </form>
      </div>`;
  } else if (currentTab === 'welcome') {
    content = `
      <h3 class="text-2xl font-black mb-6 flex items-center gap-2">🎉 Welcome System</h3>
      <form method="POST" action="/dashboard/${guildId}/welcome" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Welcome Channel</label>
            ${channelSelect(channels, settings.welcome?.channelId, 'channelId')}
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Leave Channel</label>
            ${channelSelect(channels, settings.welcome?.leaveChannelId, 'leaveChannelId')}
          </div>
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-300 mb-2">Custom Welcome Message</label>
          <textarea name="message" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 h-24" placeholder="Welcome {user} to the server! 🌟">${settings.welcome?.message || ''}</textarea>
        </div>

        <div class="p-6 glass rounded-2xl border border-indigo-500/20 space-y-4">
          <h4 class="font-extrabold text-indigo-400 text-lg flex items-center gap-2">🖼️ Welcome Card Image Settings</h4>
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Background Image URL</label>
            <input type="text" name="bgUrl" value="${settings.welcome?.bgUrl || ''}" placeholder="https://i.imgur.com/example.png" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div class="border-t border-white/10 pt-4">
            <label class="block text-sm font-bold text-gray-300 mb-3">📍 Avatar position &amp; size on the card</label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-400 mb-1">Avatar X</label>
                <input type="number" name="avatarX" value="${settings.welcome?.avatarX ?? 250}" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-400 mb-1">Avatar Y</label>
                <input type="number" name="avatarY" value="${settings.welcome?.avatarY ?? 100}" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-400 mb-1">Avatar Size</label>
                <input type="number" name="avatarSize" value="${settings.welcome?.avatarSize ?? 120}" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-400 mb-1">Border Radius</label>
                <input type="number" name="borderRadius" value="${settings.welcome?.borderRadius ?? 50}" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4">
          ${checkbox('enabled', settings.welcome?.enabled)}
          <label class="text-sm font-bold text-gray-300">Enable welcome card image</label>
        </div>
        <button type="submit" class="glow px-8 py-3.5 rounded-xl bg-indigo-600 font-extrabold text-white hover:bg-indigo-500 transition-all">Save Welcome Settings</button>
      </form>`;
  } else if (currentTab === 'automod') {
    content = `
      <h3 class="text-2xl font-black mb-6 flex items-center gap-2">🛡️ AutoMod / Protection</h3>
      <form method="POST" action="/dashboard/${guildId}/automod" class="space-y-4">
        <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
          <div><div class="font-bold text-white">Anti-Links</div><div class="text-xs text-gray-400">Auto-delete external links and Discord invites</div></div>
          ${checkbox('antiLinks', settings.automod?.antiLinks)}
        </div>
        <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
          <div><div class="font-bold text-white">Anti-Spam</div><div class="text-xs text-gray-400">Prevent rapid repeated messages</div></div>
          ${checkbox('antiSpam', settings.automod?.antiSpam)}
        </div>
        <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
          <div><div class="font-bold text-white">Bad Words Filter</div><div class="text-xs text-gray-400">Auto-delete messages containing banned words</div></div>
          ${checkbox('badWords', settings.automod?.badWords)}
        </div>
        <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
          <div><div class="font-bold text-white">Anti-Mass Mention</div><div class="text-xs text-gray-400">Block messages with more than 5 mentions</div></div>
          ${checkbox('antiMention', settings.automod?.antiMention)}
        </div>
        <div class="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
          <div><div class="font-bold text-white">Anti-Caps</div><div class="text-xs text-gray-400">Delete messages written fully in uppercase</div></div>
          ${checkbox('antiCaps', settings.automod?.antiCaps)}
        </div>
        <button type="submit" class="glow px-8 py-3.5 rounded-xl bg-indigo-600 font-extrabold text-white hover:bg-indigo-500 transition-all">Save AutoMod Settings</button>
      </form>`;
  } else if (currentTab === 'tickets') {
    content = `
      <h3 class="text-2xl font-black mb-6 flex items-center gap-2">🎫 Ticket System</h3>
      <form method="POST" action="/dashboard/${guildId}/tickets" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Target Channel for Ticket Panel</label>
            ${channelSelect(channels, settings.tickets?.channelId, 'channelId')}
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Support Role Name</label>
            <input type="text" name="supportRole" value="${settings.tickets?.supportRole || 'Support Staff'}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Ticket Panel Embed Title</label>
            <input type="text" name="embedTitle" value="${settings.tickets?.embedTitle || 'Support Center 🎟️'}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Ticket Button Label</label>
            <input type="text" name="buttonLabel" value="${settings.tickets?.buttonLabel || 'Open Ticket 📩'}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <button type="submit" class="glow px-8 py-3.5 rounded-xl bg-indigo-600 font-extrabold text-white hover:bg-indigo-500 transition-all">Save Ticket Settings</button>
      </form>`;
  } else {
    content = `
      <h3 class="text-2xl font-black mb-6 flex items-center gap-2">💬 Support & Links</h3>
      <form method="POST" action="/dashboard/${guildId}/support" class="space-y-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Support Server Invite</label>
            <input type="text" name="discordUrl" value="${settings.support?.discordUrl || ''}" placeholder="https://discord.gg/..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Instagram URL</label>
            <input type="text" name="instagramUrl" value="${settings.support?.instagramUrl || ''}" placeholder="https://instagram.com/..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-300 mb-2">Twitter / X URL</label>
            <input type="text" name="twitterUrl" value="${settings.support?.twitterUrl || ''}" placeholder="https://x.com/..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <button type="submit" class="glow px-8 py-3.5 rounded-xl bg-indigo-600 font-extrabold text-white hover:bg-indigo-500 transition-all">Save Links</button>
      </form>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="${settings.support?.discordUrl || '#'}" target="_blank" class="p-5 glass rounded-2xl flex items-center gap-4 hover:border-indigo-500/50 transition-all">
          <div class="text-2xl">🎧</div>
          <div><div class="font-bold text-white">Support Server</div><div class="text-xs text-gray-400">Join for help</div></div>
        </a>
        <a href="${settings.support?.instagramUrl || '#'}" target="_blank" class="p-5 glass rounded-2xl flex items-center gap-4 hover:border-pink-500/50 transition-all">
          <div class="text-2xl">📸</div>
          <div><div class="font-bold text-white">Instagram</div><div class="text-xs text-gray-400">Follow us</div></div>
        </a>
        <a href="${settings.support?.twitterUrl || '#'}" target="_blank" class="p-5 glass rounded-2xl flex items-center gap-4 hover:border-blue-500/50 transition-all">
          <div class="text-2xl">🌐</div>
          <div><div class="font-bold text-white">Twitter / X</div><div class="text-xs text-gray-400">Latest updates</div></div>
        </a>
      </div>`;
  }

  return layout(`Server Dashboard | OS Engine`, `
  <nav class="flex items-center justify-between px-8 py-5 glass border-b border-white/10">
    <div class="flex items-center gap-4">
      <a href="/dashboard" class="text-xs px-3.5 py-2 rounded-xl glass text-gray-300 hover:text-white font-bold">← Back to servers</a>
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

    ${savedBanner}${aliasLimitBanner}${aliasDupBanner}

    <div class="glass p-8 rounded-3xl border border-white/10">
      ${content}
    </div>
  </div>`);
}

function createApp(client) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.urlencoded({ extended: true }));
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
    const [channels, settings] = await Promise.all([
      fetchGuildChannels(req.params.guildId),
      getSettings(req.params.guildId),
    ]);
    const flags = { saved: req.query.saved === '1', aliasError: req.query.alias_error };
    res.send(guildManagePage(req.session.user, req.params.guildId, tab, channels, settings, flags));
  });

  app.post('/dashboard/:guildId/settings', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { botName, prefix, language, botActivity } = req.body;
    await updateSettings(req.params.guildId, {
      botName: botName || '',
      prefix: prefix || '-',
      language: language || 'ar',
      botActivity: botActivity || '',
    });
    res.redirect(`/dashboard/${req.params.guildId}?tab=settings&saved=1`);
  });

  app.post('/dashboard/:guildId/moderation', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { modLogChannelId, muteRoleName, antiAlt, autoWarn, messageLogs } = req.body;
    await updateSettings(req.params.guildId, {
      moderation: {
        modLogChannelId: modLogChannelId || '',
        muteRoleName: muteRoleName || 'Muted',
        antiAlt: !!antiAlt,
        autoWarn: !!autoWarn,
        messageLogs: !!messageLogs,
      },
    });
    res.redirect(`/dashboard/${req.params.guildId}?tab=moderation&saved=1`);
  });

  app.post('/dashboard/:guildId/aliases/add', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { alias, command } = req.body;
    const cleanAlias = (alias || '').trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanAlias || !command) return res.redirect(`/dashboard/${req.params.guildId}?tab=moderation`);
    const result = await addAlias(req.params.guildId, cleanAlias, command);
    if (result.error) return res.redirect(`/dashboard/${req.params.guildId}?tab=moderation&alias_error=${result.error}`);
    res.redirect(`/dashboard/${req.params.guildId}?tab=moderation&saved=1`);
  });

  app.post('/dashboard/:guildId/aliases/remove', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { alias } = req.body;
    await removeAlias(req.params.guildId, alias);
    res.redirect(`/dashboard/${req.params.guildId}?tab=moderation&saved=1`);
  });

  app.post('/dashboard/:guildId/welcome', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { channelId, leaveChannelId, message, bgUrl, avatarX, avatarY, avatarSize, borderRadius, enabled } = req.body;
    await updateSettings(req.params.guildId, {
      welcome: {
        channelId: channelId || '',
        leaveChannelId: leaveChannelId || '',
        message: message || '',
        bgUrl: bgUrl || '',
        avatarX: Number(avatarX) || 250,
        avatarY: Number(avatarY) || 100,
        avatarSize: Number(avatarSize) || 120,
        borderRadius: Number(borderRadius) || 50,
        enabled: !!enabled,
      },
    });
    res.redirect(`/dashboard/${req.params.guildId}?tab=welcome&saved=1`);
  });

  app.post('/dashboard/:guildId/automod', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { antiLinks, antiSpam, badWords, antiMention, antiCaps } = req.body;
    await updateSettings(req.params.guildId, {
      automod: {
        antiLinks: !!antiLinks,
        antiSpam: !!antiSpam,
        badWords: !!badWords,
        antiMention: !!antiMention,
        antiCaps: !!antiCaps,
      },
    });
    res.redirect(`/dashboard/${req.params.guildId}?tab=automod&saved=1`);
  });

  app.post('/dashboard/:guildId/tickets', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { channelId, supportRole, embedTitle, buttonLabel } = req.body;
    await updateSettings(req.params.guildId, {
      tickets: {
        channelId: channelId || '',
        supportRole: supportRole || 'Support Staff',
        embedTitle: embedTitle || 'Support Center 🎟️',
        buttonLabel: buttonLabel || 'Open Ticket 📩',
      },
    });
    res.redirect(`/dashboard/${req.params.guildId}?tab=tickets&saved=1`);
  });

  app.post('/dashboard/:guildId/support', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { discordUrl, instagramUrl, twitterUrl } = req.body;
    await updateSettings(req.params.guildId, {
      support: { discordUrl: discordUrl || '', instagramUrl: instagramUrl || '', twitterUrl: twitterUrl || '' },
    });
    res.redirect(`/dashboard/${req.params.guildId}?tab=support&saved=1`);
  });

  app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
  });

  app.get('/health', (req, res) => res.status(200).send('OK'));

  return app;
}

module.exports = { createApp };
