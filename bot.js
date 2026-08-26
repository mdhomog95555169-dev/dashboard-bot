require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel, Partials.Message]
});

const PREFIX = '-';
client.plugins = new Collection();

// تحميل جميع الإضافات (Plugins)
const pluginFiles = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'));
for (const file of pluginFiles) {
  const plugin = require(`./plugins/${file}`);
  client.plugins.set(plugin.name, plugin);
  if (plugin.aliases) {
    plugin.aliases.forEach(alias => client.plugins.set(alias, plugin));
  }
}

// تحميل أمر المساعدة الأساسي
const helpCmd = require('./help.js');

client.once('ready', () => {
  console.log(`✅ Probot Engine Active as ${client.user.tag}`);
});

// معالجة جميع الأوامر (Prefix & Prefix-less)
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.trim();
  let args = [];
  let cmdName = '';

  if (content.startsWith(PREFIX)) {
    args = content.slice(PREFIX.length).trim().split(/ +/);
    cmdName = args.shift().toLowerCase();
  } else {
    args = content.trim().split(/ +/);
    cmdName = args.shift().toLowerCase();
  }

  // تشغيل أمر المساعدة
  if (cmdName === 'help' || cmdName === 'م' || cmdName === 'مساعدة') {
    return helpCmd.execute(message);
  }

  // تشغيل الأوامر من الإضافات (Plugins)
  const plugin = client.plugins.get(cmdName);
  if (plugin) {
    try {
      await plugin.execute(message, args);
    } catch (err) {
      console.error('Plugin execution error:', err);
    }
  }
});

client.login(process.env.DISCORD_TOKEN || process.env.BOT_TOKEN);
