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

// تسجيل الأوامر عالمياً وللسيرفرات مباشرة
async function deployCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    const commandData = commands.map(cmd => cmd.data.toJSON());
    
    console.log('⏳ Registering Global Slash Commands...');
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commandData }
    );
    console.log('✅ All 21 Slash Commands Successfully Deployed Globally!');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
}

client.once('ready', async () => {
  console.log(`🤖 Logged in as: ${client.user.tag}`);
  await connect();
  await deployCommands();

  const PORT = process.env.PORT || 3000;
  dashboard.listen(PORT, () => console.log(`🌐 Dashboard running on port ${PORT}`));
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) await command.execute(interaction).catch(console.error);
  } 
  else if (interaction.isStringSelectMenu()) {
    // 📩 قائمة اختيار الأقسام المساعدة تصبح خاصة (Ephemeral - Private)
    if (interaction.customId === 'help_category_select') {
      const selected = interaction.values[0];
      let title = '';
      let desc = '';

      if (selected === 'help_mod') {
        title = '🛡️ Moderation & Security Commands';
        desc = '`/ban` - Ban a user from the server\n`/unban` - Remove ban by ID\n`/kick` - Kick a user\n`/timeout` - Timeout member\n`/untimeout` - Remove timeout\n`/warn` - Issue a warning\n`/clear` - Purge messages\n`/role-add` - Add role to user\n`/role-remove` - Remove role from user\n`/vkick` - Kick from voice\n`/vmove` - Move voice member\n`/vmute` - Mute in voice\n`/vunmute` - Unmute in voice\n`/vdeaf` - Deafen in voice\n`/vundeaf` - Undeafen in voice';
      } else if (selected === 'help_chan') {
        title = '🔒 Channel Management Commands';
        desc = '`/lock` - Lock current channel\n`/unlock` - Unlock channel\n`/hide` - Hide channel from members\n`/unhide` - Show channel to members\n`/slowmode` - Set slowmode timer';
      } else if (selected === 'help_util') {
        title = '⚙️ Utility & System Commands';
        desc = '`/user` - Display member profile & ID\n`/help` - Show instructions & commands hub';
      }

      const categoryEmbed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setColor('#2f3136')
        .setFooter({ text: 'Oscorp Control Systems' });

      // إرسال رد خاص يراه المستخدم فقط (Private Message / Ephemeral)
      await interaction.reply({ embeds: [categoryEmbed], ephemeral: true });
    }
    // معالجة اختيار التذاكر
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
        .setDescription(`Hello <@${interaction.user.id}>!\nPlease specify your issue or request below and support team will assist you shortly.`)
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
