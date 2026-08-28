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

// معالجة التفاعل مع القوائم المخصصة للتذاكر والأزرار
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) await command.execute(interaction).catch(console.error);
  } 
  else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'custom_ticket_select') {
      const selectedValue = interaction.values[0]; // cat_1, cat_2, cat_3
      const ticketName = `ticket-${interaction.user.username}`;
      const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketName);

      if (existingChannel) {
        return interaction.reply({ content: `❌ You already have an open ticket: ${existingChannel}`, ephemeral: true });
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
        .setTitle(`🎟️ Support Ticket`)
        .setDescription(`Hello <@${interaction.user.id}>!\nWelcome to your support ticket. Please explain your inquiry or problem here.`)
        .setColor('#5865F2')
        .setFooter({ text: 'Oscorp Ticket System' });

      const closeBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

      await channel.send({ embeds: [ticketEmbed], components: [closeBtn] });
      await interaction.reply({ content: `✅ Ticket created successfully: ${channel}`, ephemeral: true });
    }
  } 
  else if (interaction.isButton()) {
    if (interaction.customId === 'close_ticket') {
      await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  }
});

client.login(config.token);
