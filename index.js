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

async function deployCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    const commandData = commands.map(cmd => cmd.data.toJSON());
    
    console.log('⏳ Deploying All Slash Commands with Emojis Globally...');
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commandData }
    );
    console.log('✅ All Slash Commands Deployed Successfully!');
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
    // 📩 قائمة اختيار الأقسام المساعدة التفصيلية الخافية (X1000 Extended Private Reply)
    if (interaction.customId === 'help_category_select') {
      const selected = interaction.values[0];
      let title = '';
      let desc = '';

      if (selected === 'help_mod') {
        title = '🛡️ Moderation & Security Management Suite';
        desc = 
          '**Detailed Command Specifications:**\n\n' +
          '• `/ban` - 🔨 **Ban User**\n  *Syntax:* `/ban user:@target reason:[text]`\n  *Permission:* `Ban Members`\n\n' +
          '• `/unban` - 🔓 **Unban User**\n  *Syntax:* `/unban userid:[ID]`\n  *Permission:* `Ban Members`\n\n' +
          '• `/kick` - 👢 **Kick User**\n  *Syntax:* `/kick user:@target reason:[text]`\n  *Permission:* `Kick Members`\n\n' +
          '• `/timeout` - 🔇 **Mute/Timeout Member**\n  *Syntax:* `/timeout user:@target duration:[minutes] reason:[text]`\n  *Permission:* `Moderate Members`\n\n' +
          '• `/untimeout` - 🔊 **Remove Timeout**\n  *Syntax:* `/untimeout user:@target`\n  *Permission:* `Moderate Members`\n\n' +
          '• `/warn` - ⚠️ **Issue Warning**\n  *Syntax:* `/warn user:@target reason:[text]`\n  *Permission:* `Manage Messages`\n\n' +
          '• `/clear` - 🧹 **Purge Messages**\n  *Syntax:* `/clear amount:[1-100]`\n  *Permission:* `Manage Messages`\n\n' +
          '• `/role-add` - ➕ **Add Role**\n  *Syntax:* `/role-add user:@target role:@role`\n  *Permission:* `Manage Roles`\n\n' +
          '• `/role-remove` - ➖ **Remove Role**\n  *Syntax:* `/role-remove user:@target role:@role`\n  *Permission:* `Manage Roles`\n\n' +
          '• `/vkick` - 🎙️ **Voice Kick**\n  *Syntax:* `/vkick user:@target`\n  *Permission:* `Move Members`\n\n' +
          '• `/vmove` - ↗️ **Voice Move**\n  *Syntax:* `/vmove user:@target channel:[#voice]`\n  *Permission:* `Move Members`\n\n' +
          '• `/vmute` - 🎙️ **Voice Mute**\n  *Syntax:* `/vmute user:@target`\n  *Permission:* `Mute Members`\n\n' +
          '• `/vunmute` - 🔊 **Voice Unmute**\n  *Syntax:* `/vunmute user:@target`\n  *Permission:* `Mute Members`\n\n' +
          '• `/vdeaf` - 🎧 **Voice Deafen**\n  *Syntax:* `/vdeaf user:@target`\n  *Permission:* `Deafen Members`\n\n' +
          '• `/vundeaf` - 🎧 **Voice Undeafen**\n  *Syntax:* `/vundeaf user:@target`\n  *Permission:* `Deafen Members`';
      } else if (selected === 'help_chan') {
        title = '🔒 Channel Management & Protection Controls';
        desc = 
          '**Detailed Command Specifications:**\n\n' +
          '• `/lock` - 🔒 **Lock Channel**\n  *Denies @everyone permission to send messages in current channel.*\n\n' +
          '• `/unlock` - 🔓 **Unlock Channel**\n  *Restores @everyone permission to send messages.*\n\n' +
          '• `/hide` - 👁️‍🗨️ **Hide Channel**\n  *Hides channel visibility from standard members.*\n\n' +
          '• `/unhide` - 👁️ **Unhide Channel**\n  *Restores channel visibility to standard members.*\n\n' +
          '• `/slowmode` - ⏳ **Channel Slowmode**\n  *Syntax:* `/slowmode seconds:[0-21600]`\n  *Sets message cooldown timer per member.*';
      } else if (selected === 'help_util') {
        title = '⚙️ Utility & System Information';
        desc = 
          '**Detailed Command Specifications:**\n\n' +
          '• `/user` - 👤 **User Profile Info**\n  *Syntax:* `/user user:[@optional]`\n  *Displays target or author user ID, tag, and account details.*\n\n' +
          '• `/help` - 📖 **System Documentation**\n  *Launches this interactive help menu with full category choices.*';
      }

      const categoryEmbed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setColor('#2f3136')
        .setFooter({ text: 'Oscorp Control Systems • Private Security Response' });

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
