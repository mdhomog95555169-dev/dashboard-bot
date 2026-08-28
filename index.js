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
    console.log('✅ Slash Commands Registered!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
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

// محرك الحماية القوية (AutoMod Engine)
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  try {
    const settings = await Settings.findOne({ guildId: message.guild.id });
    if (!settings || !settings.autoModEnabled) return;

    // استثناء المسؤولين
    if (message.member.permissions.has(PermissionFlagsBits.Administrator) || message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return;
    }

    const contentLower = message.content.toLowerCase();
    let isViolation = false;
    let violationReason = '';

    // 1. فحص الروابط
    if (settings.antiLinks) {
      const linkRegex = /(https?:\/\/|www\.|discord\.(gg|io|me|li)|discordapp\.com\/invite)/i;
      if (linkRegex.test(contentLower)) {
        isViolation = true;
        violationReason = 'Posting prohibited links';
      }
    }

    // 2. فحص الكلمات الممنوعة (Bad Words)
    if (!isViolation && settings.badWords && settings.badWords.length > 0) {
      for (const word of settings.badWords) {
        if (word && contentLower.includes(word.toLowerCase())) {
          isViolation = true;
          violationReason = `Using prohibited word/phrase`;
          break;
        }
      }
    }

    // 3. تطبيق العقوبة عند اكتشاف مخالفة
    if (isViolation) {
      await message.delete().catch(() => {});

      const member = message.member;
      const pType = settings.punishmentType || 'timeout';
      const durationMin = settings.timeoutDuration || 10;

      if (pType === 'timeout') {
        await member.timeout(durationMin * 60 * 1000, violationReason).catch(() => {});
        message.channel.send(`🛡️ **AutoMod:** <@${member.id}> has been timed out for **${durationMin} minutes**. Reason: ${violationReason}`)
          .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      } else if (pType === 'kick') {
        await member.kick(violationReason).catch(() => {});
        message.channel.send(`🛡️ **AutoMod:** <@${member.id}> was kicked from the server. Reason: ${violationReason}`)
          .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      } else if (pType === 'ban') {
        await member.ban({ reason: violationReason }).catch(() => {});
        message.channel.send(`🛡️ **AutoMod:** <@${member.id}> was banned from the server. Reason: ${violationReason}`)
          .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      } else {
        message.channel.send(`⚠️ <@${member.id}>, your message was deleted. Reason: Prohibited content.`)
          .then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
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
    console.error('AutoMod Message Error:', err);
  }
});

// معالجة التذاكر والأوامر
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
