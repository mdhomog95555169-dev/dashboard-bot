const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'bot_data.json');

let data = {
  warnings: {},
  points: {},
  prefix: '-',
  customPrefixes: {}, // اختصارات القواعد لكل سيرفر
  commandAliases: {} // اختصارات الأوامر التخصيصية
};

if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.error('Error loading data:', e);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

module.exports = {
  getWarnings: (guildId, userId) => data.warnings[`${guildId}_${userId}`] || [],
  addWarning: (guildId, userId, reason, moderatorId) => {
    const key = `${guildId}_${userId}`;
    if (!data.warnings[key]) data.warnings[key] = [];
    const item = { id: Date.now().toString(36), reason, moderatorId, date: new Date().toISOString() };
    data.warnings[key].push(item);
    saveData();
    return item;
  },
  removeWarning: (guildId, userId, warnId) => {
    const key = `${guildId}_${userId}`;
    if (!data.warnings[key]) return false;
    const initialLen = data.warnings[key].length;
    data.warnings[key] = data.warnings[key].filter(w => w.id !== warnId);
    if (data.warnings[key].length !== initialLen) {
      saveData();
      return true;
    }
    return false;
  },
  getAlias: (cmdName) => data.commandAliases[cmdName] || null,
  setAlias: (cmdName, alias) => {
    data.commandAliases[cmdName] = alias;
    saveData();
  },
  getAllAliases: () => data.commandAliases
};
