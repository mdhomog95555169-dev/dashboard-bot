const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('./config');
const { commands } = require('./commands');
const database = require('./database');
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
    console.log('✅ Registered all slash commands!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

client.once('ready', async () => {
  console.log(`🤖 Logged in as: ${client.user.tag}`);
  await database.connect();
  await deployCommands();

  const PORT = process.env.PORT || 3000;
  dashboard.listen(PORT, () => {
    console.log(`🌐 Dashboard running on port ${PORT}`);
  });
});

// الترحيب التلقائي عند انضمام عضو جديد (Welcome System)
client.on('guildMemberAdd', async (member) => {
  try {
    const welcomeChannel = member.guild.channels.cache.find(ch => ch.name.includes('welcome') || ch.name.includes('ترحيب'));
    if (welcomeChannel) {
      const embed = new EmbedBuilder()
        .setTitle('👋 Welcome to the Server!')
        .setDescription(`Hello <@${member.id}>, welcome to **${member.guild.name}**!`)
        .setThumbnail(member.user.displayAvatarURL())
        .setColor('#00FF00')
        .setTimestamp();
      await welcomeChannel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error('Welcome Error:', err);
  }
});

// الرد عند منشن البوت (Need Help?)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.mentions.has(client.user) && !message.mentions.everyone) {
    const mentionEmbed = new EmbedBuilder()
      .setTitle('👋 Need Help?')
      .setDescription(`Hello <@${message.author.id}>!\nI am **Oscorp Bot**. Need support or commands list?\nUse the command: \`/help\``)
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
    // إنشاء روم تذكرة (Create Ticket)
    if (interaction.customId === 'create_ticket') {
      const ticketName = `ticket-${interaction.user.username}`;
      const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketName);
      
      if (existingChannel) {
        return interaction.reply({ content: `❌ You already have an open ticket: ${existingChannel}`, ephemeral: true });
      }

      const channel = await interaction.guild.channels.create({
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
      });

      const ticketEmbed = new EmbedBuilder()
        .setTitle('🎟️ Support Ticket')
        .setDescription(`Hello <@${interaction.user.id}>, please describe your issue here. Staff will respond shortly.`)
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

    // إغلاق التذكرة (Close Ticket)
    if (interaction.customId === 'close_ticket') {
      await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  }
});

client.login(config.token);
