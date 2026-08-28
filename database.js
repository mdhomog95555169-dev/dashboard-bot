const mongoose = require('mongoose');
const config = require('./config');

const guildSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: '!' },
  botName: { type: String, default: 'Oscorp' },
  activity: { type: String, default: 'Playing' },
  welcomeChannel: { type: String, default: '' },
  welcomeMessage: { type: String, default: 'Welcome to the server {user}!' },
  autoRole: { type: String, default: '' },
  autoModEnabled: { type: Boolean, default: false },
  ticketCategory: { type: String, default: '' }
});

const Settings = mongoose.model('GuildSettings', guildSettingsSchema);

async function connect() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB successfully!');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
}

module.exports = { connect, Settings };
