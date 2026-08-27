const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getAutomodSettings, addWarning } = require('./database');

// كلمات محظورة أساسية - يمكن توسيعها لاحقاً من لوحة التحكم في المرحلة 5
const BAD_WORDS = ['badword1', 'badword2'];

const LINK_REGEX = /(https?:\/\/[^\s]+|discord\.gg\/[^\s]+)/i;
const CAPS_THRESHOLD = 0.7;
const CAPS_MIN_LENGTH = 8;
const MENTION_THRESHOLD = 5;
const SPAM_WINDOW_MS = 7000;
const SPAM_MAX_MESSAGES = 5;

const spamTracker = new Map();

function isExempt(message, settings) {
  if (settings.exempt_channels.includes(message.channel.id)) return true;
  if (message.member?.roles.cache.some((r) => settings.exempt_roles.includes(r.id))) return true;
  if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return true;
  return false;
}

function checkLink(content) { return LINK_REGEX.test(content); }

function checkBadWords(content) {
  const lower = content.toLowerCase();
  return BAD_WORDS.some((w) => lower.includes(w.toLowerCase()));
}

function checkCaps(content) {
  const letters = content.replace(/[^a-zA-Z]/g, '');
  if (letters.length < CAPS_MIN_LENGTH) return false;
  const upper = letters.replace(/[^A-Z]/g, '');
  return upper.length / letters.length >= CAPS_THRESHOLD;
}

function checkMentions(message) {
  return message.mentions.users.size + message.mentions.roles.size >= MENTION_THRESHOLD;
}

function checkSpam(message) {
  const key = `${message.guild.id}-${message.author.id}`;
  const now = Date.now();
  const entry = spamTracker.get(key) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => now - t < SPAM_WINDOW_MS);
  entry.timestamps.push(now);
  spamTracker.set(key, entry);
  return entry.timestamps.length > SPAM_MAX_MESSAGES;
}

async function applyPunishment(message, settings, reason) {
  try { if (message.deletable) await message.delete(); } catch {}

  if (settings.punishment === 'warn') {
    addWarning(message.guild.id, message.author.id, `[AutoMod] ${reason}`, message.client.user.id);
  } else if (settings.punishment === 'timeout') {
    try {
      if (message.member?.moderatable) await message.member.timeout(10 * 60 * 1000, `[AutoMod] ${reason}`);
    } catch {}
  }

  try {
    const notice = await message.channel.send({
      embeds: [new EmbedBuilder().setColor(0xe74c3c).setDescription(`⚠️ <@${message.author.id}> تم اتخاذ إجراء تلقائي: **${reason}**`)],
    });
    setTimeout(() => notice.delete().catch(() => {}), 5000);
  } catch {}
}

async function handleMessage(message) {
  if (!message.guild || message.author.bot) return false;
  const settings = getAutomodSettings(message.guild.id);
  if (isExempt(message, settings)) return false;

  const content = message.content || '';

  if (settings.anti_link && checkLink(content)) { await applyPunishment(message, settings, 'إرسال رابط غير مسموح به'); return true; }
  if (settings.anti_badwords && checkBadWords(content)) { await applyPunishment(message, settings, 'استخدام كلمة محظورة'); return true; }
  if (settings.anti_caps && checkCaps(content)) { await applyPunishment(message, settings, 'الإفراط في الأحرف الكبيرة'); return true; }
  if (settings.anti_mentions && checkMentions(message)) { await applyPunishment(message, settings, 'إرسال منشنات مكثفة'); return true; }
  if (settings.anti_spam && checkSpam(message)) { await applyPunishment(message, settings, 'إرسال رسائل متكررة (سبام)'); return true; }

  return false;
}

module.exports = { handleMessage };
