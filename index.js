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
  // 1. Slash Commands Handler
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
    return;
  }

  // 2. Help Select Menu Handler
  if (interaction.isStringSelectMenu() && interaction.customId === 'help_category_select') {
    const { EmbedBuilder } = require('discord.js');
    const selected = interaction.values[0];

    let embed = new EmbedBuilder().setColor('#2f3136').setFooter({ text: 'Oscorp Control Systems' });

    if (selected === 'help_mod') {
      embed.setTitle('🛡️ Moderation & Security Suite')
        .setDescription(
          '• </ban:0> - 🔨 Ban User\n' +
          '• </unban:0> - 🔓 Unban User by ID\n' +
          '• </kick:0> - 👢 Kick User\n' +
          '• </timeout:0> - 🔇 Timeout/Mute Member\n' +
          '• </untimeout:0> - 🔊 Remove Timeout\n' +
          '• </warn:0> - ⚠️ Issue Warning\n' +
          '• </clear:0> - 🧹 Purge Messages\n' +
          '• </role-add:0> - ➕ Assign Role\n' +
          '• </role-remove:0> - ➖ Remove Role\n' +
          '• </vkick:0> - 🎙️ Kick from Voice\n' +
          '• </vmove:0> - ↗️ Move Voice Member\n' +
          '• </vmute:0> - 🎙️ Mute in Voice\n' +
          '• </vunmute:0> - 🔊 Unmute in Voice\n' +
          '• </vdeaf:0> - 🎧 Deafen in Voice\n' +
          '• </vundeaf:0> - 🎵 Undeafen in Voice'
        );
    } else if (selected === 'help_channel') {
      embed.setTitle('🔒 Channel Controls')
        .setDescription(
          '• </lock:0> - 🔒 Lock Text Channel\n' +
          '• </unlock:0> - 🔓 Unlock Text Channel\n' +
          '• </hide:0> - 👁️‍🗨️ Hide Channel\n' +
          '• </unhide:0> - 👁️ Show Channel\n' +
          '• </slowmode:0> - 🐢 Set Slowmode Delay'
        );
    } else if (selected === 'help_utility') {
      embed.setTitle('⚙️ Utility & Profile')
        .setDescription(
          '• </user:0> - 👤 View User Profile & ID\n' +
          '• </ticket-setup:0> - 🎫 Create Ticket Panel\n' +
          '• </get-emoji:0> - 🆔 Get Emoji ID & Format\n' +
          '• </fetch-emojis:0> - 🔄 Clone Server Emojis'
        );
    }

    await interaction.update({ embeds: [embed] }).catch(() => null);
  }
});

client.login(process.env.TOKEN);
