const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const WARN_FILE = path.join(DATA_DIR, 'warnings.json');
const POINTS_FILE = path.join(DATA_DIR, 'points.json');

function loadJSON(file) {
  if (!fs.existsSync(file)) return {};
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return {}; }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getWarnings(guildId, userId) {
  const all = loadJSON(WARN_FILE);
  if (!all[guildId]) all[guildId] = {};
  if (!all[guildId][userId]) all[guildId][userId] = [];
  return all[guildId][userId];
}

function addWarning(guildId, userId, reason, moderatorId) {
  const all = loadJSON(WARN_FILE);
  if (!all[guildId]) all[guildId] = {};
  if (!all[guildId][userId]) all[guildId][userId] = [];
  const warning = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    reason,
    moderatorId,
    date: new Date().toISOString(),
  };
  all[guildId][userId].push(warning);
  saveJSON(WARN_FILE, all);
  return warning;
}

function removeWarning(guildId, userId, warnId) {
  const all = loadJSON(WARN_FILE);
  if (!all[guildId] || !all[guildId][userId]) return false;
  const before = all[guildId][userId].length;
  all[guildId][userId] = all[guildId][userId].filter((w) => w.id !== warnId);
  saveJSON(WARN_FILE, all);
  return all[guildId][userId].length < before;
}

function getPoints(guildId, userId) {
  const all = loadJSON(POINTS_FILE);
  if (!all[guildId]) all[guildId] = {};
  return all[guildId][userId] || 0;
}

function addPoints(guildId, userId, amount) {
  const all = loadJSON(POINTS_FILE);
  if (!all[guildId]) all[guildId] = {};
  all[guildId][userId] = (all[guildId][userId] || 0) + amount;
  saveJSON(POINTS_FILE, all);
  return all[guildId][userId];
}

module.exports = { getWarnings, addWarning, removeWarning, getPoints, addPoints };
