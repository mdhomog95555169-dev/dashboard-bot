const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  ChannelType, 
  PermissionsBitField, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
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
    console.log('✅ Successfully registered all commands!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  // 1. التعامل مع أوامر السلاش
  if (interaction.isChatInputCommand()) {
    const cmd = commands.find(c => c.data.name === interaction.commandName);
    if (cmd) await cmd.execute(interaction);
  } 
  
  // 2. التعامل مع القائمة المنسدلة لفتح التذكرة
  else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'custom_ticket_select') {
      const selectedValue = interaction.values[0];
      const categoryId = selectedValue.split('_')[2];
      const targetCategory = (categoryId && categoryId !== 'null' && categoryId !== 'undefined') ? categoryId : DEFAULT_TICKET_CATEGORY_ID;

      const guild = interaction.guild;
      const user = interaction.user;

      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        parent: (targetCategory && targetCategory !== "ضع_اي_دي_الكاتيجوري_هنا") ? targetCategory : null,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] }
        ],
      });

      const welcomeEmbed = new EmbedBuilder()
        .setTitle('🎫 تذكرة جديدة | Ticket Created')
        .setDescription(`مرحباً بك ${user}، اترك استفسارك وسيتم الرد عليك في أقرب وقت من قبل طاقم الدعم الفني.`)
        .setColor('#57f287')
        .setFooter({ text: `Owner ID: ${user.id}` });

      // أزرار التحكم بالتذكرة (استلام - إغلاق - تغيير الاسم)
      const ticketControlRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_claim_${user.id}`)
          .setLabel('استلام التذكرة')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🙋‍♂️'),
        new ButtonBuilder()
          .setCustomId(`ticket_close_ask_${user.id}`)
          .setLabel('إغلاق التذكرة')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒'),
        new ButtonBuilder()
          .setCustomId(`ticket_rename_${user.id}`)
          .setLabel('تغيير الاسم')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('✏️')
      );

      await ticketChannel.send({ content: `${user}`, embeds: [welcomeEmbed], components: [ticketControlRow] });

      const replyEmbed = new EmbedBuilder()
        .setDescription(`🎫 | تم فتح تذكرتك بنجاح: ${ticketChannel}`)
        .setColor('#57f287');
      await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
    }
  }

  // 3. التعامل مع الأزرار
  else if (interaction.isButton()) {
    const customId = interaction.customId;

    // A. زر استلام التذكرة
    if (customId.startsWith('ticket_claim_')) {
      const ownerId = customId.split('_')[2];
      
      const claimEmbed = new EmbedBuilder()
        .setTitle('✨ تم استلام التذكرة بنجاح!')
        .setDescription(`قام الإداري ${interaction.user} بالاستلام المباشر لهذه التذكرة للبدء في تقديم المساعدة لـ <@${ownerId}>.\n\n> 👑 **المستلم:** ${interaction.user}\n> 📌 **الحالة:** قيد المعالجة المباشرة ⭐`)
        .setColor('#5865f2')
        .setTimestamp();

      // تغيير اسم القناه عند الاستلام
      await interaction.channel.setName(`claimed-${interaction.user.username}`).catch(() => {});

      // إيقاف زر الاستلام لمنع التكرار
      const disabledRow = ActionRowBuilder.from(interaction.message.components[0]);
      disabledRow.components[0].setDisabled(true);

      await interaction.message.edit({ components: [disabledRow] });
      await interaction.reply({ embeds: [claimEmbed] });
    }

    // B. زر طلب إغلاق التذكرة
    else if (customId.startsWith('ticket_close_ask_')) {
      const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ تأكيد إغلاق التذكرة')
        .setDescription('هل أنت متأكد من أنك تريد إغلاق هذه التذكرة؟')
        .setColor('#fee75c');

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_close_confirm_yes')
          .setLabel('نعم')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId('ticket_close_confirm_no')
          .setLabel('لا')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❌')
      );

      await interaction.reply({ embeds: [confirmEmbed], components: [confirmRow] });
    }

    // C. تأكيد الإغلاق (نعم)
    else if (customId === 'ticket_close_confirm_yes') {
      const closingEmbed = new EmbedBuilder()
        .setDescription('🔒 | سيتم إغلاق التذكرة وحذف الروم خلال 5 ثوانٍ...')
        .setColor('#ed4245');

      await interaction.reply({ embeds: [closingEmbed] });
      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
    }

    // D. إلغاء الإغلاق (لا)
    else if (customId === 'ticket_close_confirm_no') {
      await interaction.message.delete().catch(() => {});
      await interaction.reply({ content: '✅ تم إلغاء طلب إغلاق التذكرة.', ephemeral: true });
    }

    // E. زر تغيير اسم التذكرة
    else if (customId.startsWith('ticket_rename_')) {
      const modal = new ModalBuilder()
        .setCustomId('modal_ticket_rename')
        .setTitle('تغيير اسم التذكرة');

      const nameInput = new TextInputBuilder()
        .setCustomId('new_ticket_name')
        .setLabel('الاسم الجديد للتذكرة')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('مثال: help-dark')
        .setRequired(true);

      const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
    }
  }

  // 4. التعامل مع إدخال اسم التذكرة الجديد (Modal)
  else if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_ticket_rename') {
      const newName = interaction.fields.getTextInputValue('new_ticket_name');
      await interaction.channel.setName(newName).catch(() => {});

      const renameEmbed = new EmbedBuilder()
        .setDescription(`✏️ | تم تغيير اسم التذكرة بنجاح إلى: \`${newName}\``)
        .setColor('#57f287');

      await interaction.reply({ embeds: [renameEmbed] });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
