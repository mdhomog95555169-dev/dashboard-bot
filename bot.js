require('dotenv').config();
const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } = require('discord.js');
const handler = require('./commandsHandler.js');

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

// تسجل الأوامر في Slash Commands
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

client.once('ready', async () => {
  console.log(`✅ Bot ready as ${client.user.tag}`);
  await registerSlashCommands();
});

// التعامل مع Slash Commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handler.runCommand(interaction.commandName, interaction, []);
});

// التعامل مع Prefix و Prefix-less
client.on('messageCreate', async (message) => {
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

  // التأكد من أن الأمر موجود في قائمة الأوامر المعتمدة
  const matchedCmd = handler.commandsList.find(c => c.name === cmdName);
  if (matchedCmd) {
    await handler.runCommand(matchedCmd.name, message, args);
  }
});

client.login(process.env.DISCORD_TOKEN || process.env.BOT_TOKEN);
