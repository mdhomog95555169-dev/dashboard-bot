const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oscorp';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully.'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

const ALIAS_LIMIT = 5;

// ---------- Schemas ----------
const warningSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  warnings: [
    {
      id: String,
      reason: String,
      moderatorId: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const pointsSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  points: { type: Number, default: 0 },
});

const settingsSchema = new mongoose.Schema({
  guildId: { type: String, unique: true },
  prefix: { type: String, default: '-' },
  botName: { type: String, default: '' },
  botActivity: { type: String, default: 'OSCORP RP' },
  language: { type: String, default: 'ar' },
  aliases: [
    {
      alias: String,
      command: String,
    },
  ],
  welcome: {
    enabled: { type: Boolean, default: true },
    channelId: String,
    leaveChannelId: String,
    message: { type: String, default: 'Welcome {user} to the server!' },
    bgUrl: String,
    avatarX: { type: Number, default: 250 },
    avatarY: { type: Number, default: 100 },
    avatarSize: { type: Number, default: 120 },
    borderRadius: { type: Number, default: 50 },
  },
  moderation: {
    modLogChannelId: String,
    muteRoleName: { type: String, default: 'Muted' },
    antiAlt: { type: Boolean, default: true },
    autoWarn: { type: Boolean, default: true },
    messageLogs: { type: Boolean, default: true },
  },
  automod: {
    antiLinks: { type: Boolean, default: true },
    antiSpam: { type: Boolean, default: true },
    badWords: { type: Boolean, default: true },
    antiMention: { type: Boolean, default: true },
    antiCaps: { type: Boolean, default: false },
  },
  tickets: {
    channelId: String,
    supportRole: { type: String, default: 'Support Staff' },
    embedTitle: { type: String, default: 'Support Center 🎟️' },
    buttonLabel: { type: String, default: 'Open Ticket 📩' },
  },
  support: {
    discordUrl: String,
    instagramUrl: String,
    twitterUrl: String,
  },
});

const Warning = mongoose.model('Warning', warningSchema);
const Points = mongoose.model('Points', pointsSchema);
const Settings = mongoose.model('Settings', settingsSchema);

// ---------- Helpers ----------
function genId() {
  return Math.random().toString(36).slice(2, 8);
}

// ---------- Settings ----------
async function getSettings(guildId) {
  let doc = await Settings.findOne({ guildId });
  if (!doc) doc = await Settings.create({ guildId });
  return doc;
}

async function updateSettings(guildId, patch) {
  const doc = await getSettings(guildId);
  for (const key of Object.keys(patch)) {
    if (typeof patch[key] === 'object' && patch[key] !== null && !Array.isArray(patch[key]) && doc[key]) {
      Object.assign(doc[key], patch[key]);
    } else {
      doc[key] = patch[key];
    }
  }
  await doc.save();
  return doc;
}

async function getPrefix(guildId) {
  if (!guildId) return '-';
  const doc = await Settings.findOne({ guildId }).lean();
  return doc && doc.prefix ? doc.prefix : '-';
}

// ---------- Aliases (5 max per guild) ----------
async function getAliases(guildId) {
  const doc = await Settings.findOne({ guildId }).lean();
  return doc && doc.aliases ? doc.aliases : [];
}

async function addAlias(guildId, alias, command) {
  const doc = await getSettings(guildId);
  if (doc.aliases.length >= ALIAS_LIMIT) return { error: 'limit' };
  if (doc.aliases.some((a) => a.alias.toLowerCase() === alias.toLowerCase())) return { error: 'duplicate' };
  doc.aliases.push({ alias: alias.toLowerCase(), command });
  await doc.save();
  return { ok: true, aliases: doc.aliases };
}

async function removeAlias(guildId, alias) {
  const doc = await getSettings(guildId);
  doc.aliases = doc.aliases.filter((a) => a.alias.toLowerCase() !== alias.toLowerCase());
  await doc.save();
  return doc.aliases;
}

async function resolveAlias(guildId, alias) {
  const doc = await Settings.findOne({ guildId }).lean();
  if (!doc || !doc.aliases) return null;
  const found = doc.aliases.find((a) => a.alias.toLowerCase() === alias.toLowerCase());
  return found ? found.command : null;
}

// ---------- Warnings ----------
async function getWarnings(guildId, userId) {
  const doc = await Warning.findOne({ guildId, userId }).lean();
  return doc ? doc.warnings : [];
}

async function addWarning(guildId, userId, reason, moderatorId) {
  let doc = await Warning.findOne({ guildId, userId });
  if (!doc) doc = new Warning({ guildId, userId, warnings: [] });
  const warning = { id: genId(), reason, moderatorId, timestamp: new Date() };
  doc.warnings.push(warning);
  await doc.save();
  return warning;
}

async function removeWarning(guildId, userId, warnId) {
  const doc = await Warning.findOne({ guildId, userId });
  if (!doc) return false;
  const before = doc.warnings.length;
  doc.warnings = doc.warnings.filter((w) => w.id !== warnId);
  if (doc.warnings.length === before) return false;
  await doc.save();
  return true;
}

// ---------- Points ----------
async function getPoints(guildId, userId) {
  const doc = await Points.findOne({ guildId, userId }).lean();
  return doc ? doc.points : 0;
}

async function addPoints(guildId, userId, amount) {
  let doc = await Points.findOne({ guildId, userId });
  if (!doc) {
    doc = new Points({ guildId, userId, points: amount });
  } else {
    doc.points += amount;
  }
  await doc.save();
  return doc.points;
}

module.exports = {
  ALIAS_LIMIT,
  getSettings,
  updateSettings,
  getPrefix,
  getAliases,
  addAlias,
  removeAlias,
  resolveAlias,
  getWarnings,
  addWarning,
  removeWarning,
  getPoints,
  addPoints,
  Warning,
  Points,
  Settings,
};
