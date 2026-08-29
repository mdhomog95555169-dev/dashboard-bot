const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { commands } = require('./commands.js');

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

for (const cmd of commands) {
  client.commands.set(cmd.data.name, cmd);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
  // 1. Autocomplete Handler (لإظهار قائمة الأوامر المتاحة تلقائياً أثناء الكتابة)
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === 'help') {
      const focusedValue = interaction.options.getFocused().toLowerCase();
      const availableCommands = [
        'ban', 'unban', 'kick', 'timeout', 'untimeout', 'warn', 'clear', 
        'lock', 'unlock', 'hide', 'unhide', 'slowmode', 'vkick', 'vmove', 
        'vmute', 'vunmute', 'vdeaf', 'vundeaf', 'role-add', 'role-remove', 'user'
      ];

      const filtered = availableCommands.filter(choice => choice.toLowerCase().includes(focusedValue)).slice(0, 25);
      await interaction.respond(
        filtered.map(choice => ({ name: choice, value: choice }))
      ).catch(() => null);
    }
    return;
  }

  // 2. Slash Commands Handler
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      const replyOptions = { content: '❌ حدث خطأ أثناء تنفيذ هذا الأمر!', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyOptions).catch(() => null);
      } else {
        await interaction.reply(replyOptions).catch(() => null);
      }
    }
  }
});

client.login(process.env.TOKEN);
