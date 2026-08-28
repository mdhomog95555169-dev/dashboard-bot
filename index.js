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
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commandData }
    );
    console.log('✅ Slash Commands Registered Successfully!');
  } catch (error) {
    console.error('❌ Slash Command Registration Error:', error);
  }
}

client.once('ready', async () => {
  console.log(`🤖 Logged in as: ${client.user.tag}`);
  await connect();
  await deployCommands();

  const PORT = process.env.PORT || 3000;
  dashboard.listen(PORT, () => {
    console.log(`🌐 Dashboard running on port ${PORT}`);
  });
});

// نظام الترحيب التلقائي القارئ من الداشبورد
client.on('guildMemberAdd', async (member) => {
  try {
    const settings = await Settings.findOne({ guildId: member.guild.id });
    if (!settings) return;

    // الرتبة التلقائية من الموقع
    if (settings.autoRole) {
      const role = member.guild.roles.cache.get(settings.autoRole);
      if (role) await member.roles.add(role).catch(() => {});
    }

    // روم الترحيب المحدد من الموقع
    if (settings.welcomeChannel) {
      const welcomeChannel = member.guild.channels.cache.get(settings.welcomeChannel);
      if (welcomeChannel) {
        const msgText = (settings.welcomeMessage || 'Welcome {user}!').replace('{user}', `<@${member.id}>`);
        const embed = new EmbedBuilder()
          .setTitle('👋 Welcome to the Server!')
          .setDescription(msgText)
          .setThumbnail(member.user.displayAvatarURL())
          .setColor('#00FF00')
          .setTimestamp();
        await welcomeChannel.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    console.error('Welcome Event Error:', err);
  }
});

// نظام الحماية (AutoMod) القارئ من الداشبورد
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  try {
    const settings = await Settings.findOne({ guildId: message.guild.id });
    
    // فحص إذا كانت الحماية مفعلة من الموقع
    if (settings && settings.autoModEnabled) {
      const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i;
      if (inviteRegex.test(message.content)) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
          await message.delete();
          return message.channel.send(`⚠️ <@${message.author.id}>, posting invite links is prohibited by AutoMod!`).then(m => setTimeout(() => m.delete(), 4000));
        }
      }
    }

    // الرد عند منشن البوت (Need Help?)
    if (message.mentions.has(client.user) && !message.mentions.everyone) {
      const mentionEmbed = new EmbedBuilder()
        .setTitle('👋 Need Help?')
        .setDescription(`Hello <@${message.author.id}>!\nI am **Oscorp Bot**. Need support or setup?\nUse: \`/help\``)
        .setColor('#5865F2')
        .setThumbnail(client.user.displayAvatarURL());

      const btnRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Dashboard')
          .setStyle(ButtonStyle.Link)
          .setURL('https://dashboard-bot.onrender.com/dashboard')
      );

      return message.reply({ embeds: [mentionEmbed], components: [btnRow] });
    }
  } catch (err) {
    console.error('Message Event Error:', err);
  }
});

// التفاعل مع الأوامر والأزرار (Tickets System)
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      const replyOptions = { content: 'An error occurred executing this command!', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyOptions);
      } else {
        await interaction.reply(replyOptions);
      }
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === 'create_ticket') {
      const settings = await Settings.findOne({ guildId: interaction.guild.id });
      const ticketName = `ticket-${interaction.user.username}`;
      const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketName);

      if (existingChannel) {
        return interaction.reply({ content: `❌ You already have an open ticket: ${existingChannel}`, ephemeral: true });
      }

      const channelOptions = {
        name: ticketName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
        ],
      };

      // ربط الكاتيجوري من إعدادات الداشبورد إذا وُجد
      if (settings && settings.ticketCategory) {
        channelOptions.parent = settings.ticketCategory;
      }

      const channel = await interaction.guild.channels.create(channelOptions);

      const ticketEmbed = new EmbedBuilder()
        .setTitle('🎟️ Support Ticket')
        .setDescription(`Hello <@${interaction.user.id}>, please describe your issue here.`)
        .setColor('#5865F2');

      const closeBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

      await channel.send({ embeds: [ticketEmbed], components: [closeBtn] });
      await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
    }

    if (interaction.customId === 'close_ticket') {
      await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  }
});

client.login(config.token);
