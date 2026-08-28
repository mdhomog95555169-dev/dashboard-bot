const { Client, GatewayIntentBits, REST, Routes, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { commands, DEFAULT_TICKET_CATEGORY_ID } = require('./commands.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    const commandData = commands.map(cmd => cmd.data.toJSON());
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandData }
    );
    console.log('✅ Successfully registered all 21 commands!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const cmd = commands.find(c => c.data.name === interaction.commandName);
    if (cmd) await cmd.execute(interaction);
  } else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'custom_ticket_select') {
      const selectedValue = interaction.values[0];
      const categoryId = selectedValue.split('_')[2];
      const targetCategory = (categoryId && categoryId !== 'null' && categoryId !== 'undefined') ? categoryId : DEFAULT_TICKET_CATEGORY_ID;

      const guild = interaction.guild;
      const user = interaction.user;

      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        parent: targetCategory !== "ضع_اي_دي_الكاتيجوري_هنا" ? targetCategory : null,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] }
        ],
      });

      const welcomeEmbed = new EmbedBuilder()
        .setTitle('🎫 تذكرة جديدة | Ticket Created')
        .setDescription(`مرحباً بك ${user}، اترك استفسارك وسيقوم طاقم الإدارة بالرد عليك في أقرب وقت.`)
        .setColor('#57f287');

      await ticketChannel.send({ content: `${user}`, embeds: [welcomeEmbed] });

      const replyEmbed = new EmbedBuilder()
        .setDescription(`🎫 | تم فتح تذكرتك بنجاح: ${ticketChannel}`)
        .setColor('#57f287');
      await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
