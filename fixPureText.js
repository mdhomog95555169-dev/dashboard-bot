const fs = require('fs');

const mainBotCode = `require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const helpCmd = require('./help.js');

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

client.once('ready', () => {
  console.log(\`✅ Logged in as \${client.user.tag} (Pure Prefix & Text Mode)\`);
});

// معالج الأوامر النصية والبريفكس والاختصارات
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();
  let commandName = '';

  if (content.startsWith(PREFIX)) {
    commandName = content.slice(PREFIX.length).trim().split(/ +/)[0].toLowerCase();
  } else {
    commandName = content.split(/ +/)[0].toLowerCase();
  }

  if (commandName === 'help' || commandName === 'م' || commandName === 'مساعدة') {
    try {
      await helpCmd.execute(message);
    } catch (err) {
      console.error('Help command error:', err);
    }
  }
});

client.login(process.env.DISCORD_TOKEN || process.env.BOT_TOKEN);
`;

fs.writeFileSync('bot.js', mainBotCode);
console.log('✅ Converted bot to pure text and prefix mode to prevent interaction timeouts.');
