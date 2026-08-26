require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const helpCmd = require('./help.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message]
});

const PREFIX = '-';

client.once('ready', () => {
  console.log(`✅ Bot live: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.trim();
  let cmd = '';

  if (content.startsWith(PREFIX)) {
    cmd = content.slice(PREFIX.length).trim().split(/ +/)[0].toLowerCase();
  } else {
    cmd = content.split(/ +/)[0].toLowerCase();
  }

  if (cmd === 'help' || cmd === 'م' || cmd === 'مساعدة') {
    try {
      await helpCmd.execute(message);
    } catch (err) {
      console.error(err);
    }
  }
});

client.login(process.env.DISCORD_TOKEN || process.env.BOT_TOKEN);
