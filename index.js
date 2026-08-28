const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const config = require('./config');
const { commands } = require('./commands');
const database = require('./database');
const { handleMessage: handleAutomod } = require('./automod');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.commands = new Collection();
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

async function deployCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    const commandData = commands.map(cmd => cmd.data.toJSON());
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commandData }
    );
    console.log('✅ تم تسجيل جميع أوامر Slash بنجاح!');
  } catch (error) {
    console.error('❌ خطأ أثناء تسجيل الأوامر:', error);
  }
}

client.once('ready', async () => {
  console.log(`🤖 تم تسجيل الدخول بواسطة: ${client.user.tag}`);
  await database.connect();
  await deployCommands();
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  await handleAutomod(message);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const replyOptions = { content: 'حدث خطأ أثناء تنفيذ هذا الأمر!', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(replyOptions);
    } else {
      await interaction.reply(replyOptions);
    }
  }
});

client.login(config.token);
