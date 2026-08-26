require('dotenv').config();
const http = require('http');
const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, Events } = require('discord.js');
const handler = require('./commandsHandler.js');

// سيرفر صغير لفتح Port وإصلاح تنبيه Render Port Binding
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OS System Bot is Running Online!');
}).listen(PORT, () => {
  console.log(`🌐 Web Port binding active on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel, Partials.Message]
});

const PREFIX = '-';

async function registerSlashCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN || process.env.BOT_TOKEN);
  const slashData = handler.commandsList.map(cmd => 
    new SlashCommandBuilder().setName(cmd.name).setDescription(cmd.desc)
  );

  try {
    console.log('🔄 Registering Slash Commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: slashData }
    );
    console.log('✅ Slash Commands registered successfully.');
  } catch (err) {
    console.error('Error registering slash commands:', err);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot ready as ${client.user.tag}`);
  await registerSlashCommands();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handler.runCommand(interaction.commandName, interaction, []);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.trim();
  let cmdName = '';
  let args = [];

  if (content.startsWith(PREFIX)) {
    const split = content.slice(PREFIX.length).trim().split(/ +/);
    cmdName = split[0].toLowerCase();
    args = split.slice(1);
  } else {
    const split = content.trim().split(/ +/);
    cmdName = split[0].toLowerCase();
    args = split.slice(1);
  }

  const matchedCmd = handler.commandsList.find(c => c.name === cmdName);
  if (matchedCmd) {
    await handler.runCommand(matchedCmd.name, message, args);
  }
});

client.login(process.env.DISCORD_TOKEN || process.env.BOT_TOKEN);
