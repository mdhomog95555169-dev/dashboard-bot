const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('./config');
const { commands } = require('./commands');
const { connect, Settings } = require('./database');
const dashboard = require('./dashboard');

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

// تسجيل الأوامر عالمياً وفي كل سيرفر متواجد فيه البوت فوراً
async function deployCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    const commandData = commands.map(cmd => cmd.data.toJSON());
    
    console.log('⏳ Registering Commands Globally & Instant Guild Sync...');
    
    // تسجيل عالمي
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commandData }
    );

    // تسجيل فوري لكافة السيرفرات الحالية
    const guilds = client.guilds.cache.map(g => g.id);
    for (const guildId of guilds) {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, guildId),
        { body: commandData }
      ).catch(() => {});
    }

    console.log(`✅ All ${commands.length} Commands Synced Instantly Across All Guilds!`);
  } catch (error) {
    console.error('❌ Error deploying slash commands:', error);
  }
}

client.once('ready', async () => {
  console.log(`🤖 Logged in as: ${client.user.tag}`);
  await connect();
  await deployCommands();

  const PORT = process.env.PORT || 3000;
  dashboard.listen(PORT, () => console.log(`🌐 Dashboard running on port ${PORT}`));
});

client.on('guildCreate', async (guild) => {
  const rest = new REST({ version: '10' }).setToken(config.token);
  const commandData = commands.map(cmd => cmd.data.toJSON());
  await rest.put(
    Routes.applicationGuildCommands(config.clientId, guild.id),
    { body: commandData }
  ).catch(() => {});
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) await command.execute(interaction).catch(console.error);
  } 
  else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'help_category_select') {
      const selected = interaction.values[0];
      let title = '';
      let desc = '';

      if (selected === 'help_mod') {
        title = '🛡️ Moderation & Security Suite';
        desc = 
          '• `/ban` - 🔨 Ban User\n' +
          '• `/unban` - 🔓 Unban User by ID\n' +
          '• `/kick` - 👢 Kick User\n' +
          '• `/timeout` - 🔇 Timeout/Mute Member\n' +
          '• `/untimeout` - 🔊 Remove Timeout\n' +
          '• `/warn` - ⚠️ Issue Warning\n' +
          '• `/clear` - 🧹 Purge Messages\n' +
          '• `/role-add` - ➕ Assign Role\n' +
          '• `/role-remove` - ➖ Remove Role\n' +
          '• `/vkick` - 🎙️ Kick from Voice\n' +
          '• `/vmove` - ↗️ Move Voice Member\n' +
          '• `/vmute` - 🎙️ Mute in Voice\n' +
          '• `/vunmute` - 🔊 Unmute in Voice\n' +
          '• `/vdeaf` - 🎧 Deafen in Voice\n' +
          '• `/vundeaf` - 🎧 Undeafen in Voice';
      } else if (selected === 'help_chan') {
        title = '🔒 Channel Controls';
        desc = 
          '• `/lock` - 🔒 Lock Text Channel\n' +
          '• `/unlock` - 🔓 Unlock Text Channel\n' +
          '• `/hide` - 👁️‍🗨️ Hide Channel\n' +
          '• `/unhide` - 👁️ Show Channel\n' +
          '• `/slowmode` - ⏳ Set Slowmode Delay';
      } else if (selected === 'help_util') {
        title = '⚙️ Utility & Profile';
        desc = 
          '• `/user` - 👤 View User Profile & ID\n' +
          '• `/help` - 📖 Display Documentation';
      }

      const categoryEmbed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setColor('#2f3136')
        .setFooter({ text: 'Oscorp Control Systems' });

      await interaction.reply({ embeds: [categoryEmbed], ephemeral: true });
    }
    else if (interaction.customId === 'custom_ticket_select') {
      const ticketName = `ticket-${interaction.user.username}`;
      const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketName);

      if (existingChannel) {
        return interaction.reply({ content: `❌ **You already have an open ticket:** ${existingChannel}`, ephemeral: true });
      }

      const settings = await Settings.findOne({ guildId: interaction.guild.id });
      const channelOptions = {
        name: ticketName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
        ],
      };

      if (settings && settings.ticketCategory) {
        channelOptions.parent = settings.ticketCategory;
      }

      const channel = await interaction.guild.channels.create(channelOptions);

      const ticketEmbed = new EmbedBuilder()
        .setTitle(`🎟️ New Support Ticket`)
        .setDescription(`Hello <@${interaction.user.id}>!\nPlease specify your issue below and our support team will respond shortly.`)
        .setColor('#2f3136');

      const closeBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

      await channel.send({ embeds: [ticketEmbed], components: [closeBtn] });
      await interaction.reply({ content: `✅ **Ticket created successfully:** ${channel}`, ephemeral: true });
    }
  } 
  else if (interaction.isButton()) {
    if (interaction.customId === 'close_ticket') {
      await interaction.reply({ content: '🔒 **Closing ticket in 5 seconds...**' });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  }
});

client.login(config.token);
