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
    console.log('✅ Commands Registered!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

client.once('ready', async () => {
  console.log(`🤖 Logged in as: ${client.user.tag}`);
  await connect();
  await deployCommands();

  const PORT = process.env.PORT || 3000;
  dashboard.listen(PORT, () => console.log(`🌐 Dashboard running on port ${PORT}`));
});

// التعامل مع جميع التفاعلات (أوامر ورسائل عامة مثل ProBot)
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) await command.execute(interaction).catch(console.error);
  } 
  else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'custom_ticket_select') {
      const ticketName = `ticket-${interaction.user.username}`;
      const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketName);

      if (existingChannel) {
        return interaction.reply({ content: `❌ **لديك تذكرة مفتوحة بالفعل:** ${existingChannel}` });
      }

      const settings = await Settings.findOne({ guildId: interaction.guild.id });
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
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
          },
        ],
      };

      if (settings && settings.ticketCategory) {
        channelOptions.parent = settings.ticketCategory;
      }

      const channel = await interaction.guild.channels.create(channelOptions);

      const ticketEmbed = new EmbedBuilder()
        .setTitle(`🎟️ تذكرة جديدة / Support Ticket`)
        .setDescription(`أهلاً بك <@${interaction.user.id}>!\nيرجى كتابة مشكلتك أو استفسارك هنا وسيقوم فريق الإدارة بالرد عليك قريباً.`)
        .setColor('#5865F2')
        .setFooter({ text: 'Oscorp Ticket System' });

      const closeBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('إغلاق التذكرة / Close')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

      await channel.send({ embeds: [ticketEmbed], components: [closeBtn] });
      await interaction.reply({ content: `✅ **تم إنشاء تذكرتك بنجاح:** ${channel}` });
    }
  } 
  else if (interaction.isButton()) {
    if (interaction.customId === 'close_ticket') {
      await interaction.reply({ content: '🔒 **جاري إغلاق التذكرة خلال 5 ثوانٍ...**' });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  }
});

client.login(config.token);
