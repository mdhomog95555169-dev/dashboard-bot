const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  commands: [
    // -------------------------------------------------------------
    // 🎟️ 1. أمر إعداد لوحة التذاكر المخصص بالكامل (Custom Ticket Setup)
    // -------------------------------------------------------------
    {
      data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Setup customizable Ticket Panel with custom categories, descriptions, emojis & banner')
        .addStringOption(opt => opt.setName('title').setDescription('Panel Title / عنوان لوحة التذاكر').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('Panel Description / وصف لوحة التذاكر').setRequired(true))
        .addStringOption(opt => opt.setName('cat1_label').setDescription('Category 1 Name / اسم القسم 1').setRequired(true))
        .addStringOption(opt => opt.setName('cat1_desc').setDescription('Category 1 Description / وصف القسم 1').setRequired(true))
        .addStringOption(opt => opt.setName('cat1_emoji').setDescription('Category 1 Emoji / إيموجي القسم 1').setRequired(false))
        .addStringOption(opt => opt.setName('cat2_label').setDescription('Category 2 Name / اسم القسم 2').setRequired(false))
        .addStringOption(opt => opt.setName('cat2_desc').setDescription('Category 2 Description / وصف القسم 2').setRequired(false))
        .addStringOption(opt => opt.setName('cat2_emoji').setDescription('Category 2 Emoji / إيموجي القسم 2').setRequired(false))
        .addStringOption(opt => opt.setName('cat3_label').setDescription('Category 3 Name / اسم القسم 3').setRequired(false))
        .addStringOption(opt => opt.setName('cat3_desc').setDescription('Category 3 Description / وصف القسم 3').setRequired(false))
        .addStringOption(opt => opt.setName('cat3_emoji').setDescription('Category 3 Emoji / إيموجي القسم 3').setRequired(false))
        .addStringOption(opt => opt.setName('image_url').setDescription('Banner Image URL (Optional) / رابط صورة البنر').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const imageUrl = interaction.options.getString('image_url');

        // تجهيز خيارات القائمة المنسدلة حسب الإدخالات
        const options = [];

        // القسم 1 (إجباري)
        options.push({
          label: interaction.options.getString('cat1_label'),
          description: interaction.options.getString('cat1_desc'),
          value: 'cat_1',
          emoji: interaction.options.getString('cat1_emoji') || '📂'
        });

        // القسم 2 (اختياري)
        const cat2Label = interaction.options.getString('cat2_label');
        if (cat2Label) {
          options.push({
            label: cat2Label,
            description: interaction.options.getString('cat2_desc') || 'Category 2',
            value: 'cat_2',
            emoji: interaction.options.getString('cat2_emoji') || '📂'
          });
        }

        // القسم 3 (اختياري)
        const cat3Label = interaction.options.getString('cat3_label');
        if (cat3Label) {
          options.push({
            label: cat3Label,
            description: interaction.options.getString('cat3_desc') || 'Category 3',
            value: 'cat_3',
            emoji: interaction.options.getString('cat3_emoji') || '📂'
          });
        }

        const ticketEmbed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor('#5865F2')
          .setFooter({ text: 'Oscorp Ticket System • Select a category below' })
          .setTimestamp();

        if (imageUrl) ticketEmbed.setImage(imageUrl);

        const selectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('custom_ticket_select')
            .setPlaceholder('📂 Choose Category / اختر قسم التذكرة...')
            .addOptions(options)
        );

        await interaction.channel.send({ embeds: [ticketEmbed], components: [selectMenu] });
        await interaction.reply({ content: '✅ Custom Ticket Panel created successfully!', ephemeral: true });
      }
    },

    // -------------------------------------------------------------
    // 🛡️ 2. أوامر الإشراف والإدارة (Moderation Commands)
    // -------------------------------------------------------------
    
    // Ban
    {
      data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(opt => opt.setName('target').setDescription('Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for Ban'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason specified';
        await interaction.guild.members.ban(target, { reason });
        await interaction.reply({ content: `⛔ **${target.tag}** has been banned. Reason: ${reason}` });
      }
    },

    // Kick
    {
      data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(opt => opt.setName('target').setDescription('Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for Kick'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason specified';
        if (!member) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
        await member.kick(reason);
        await interaction.reply({ content: `👞 **${member.user.tag}** has been kicked. Reason: ${reason}` });
      }
    },

    // Timeout (Mute)
    {
      data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout/Mute a user')
        .addUserOption(opt => opt.setName('target').setDescription('Target User').setRequired(true))
        .addIntegerOption(opt => opt.setName('minutes').setDescription('Duration in Minutes').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        const minutes = interaction.options.getInteger('minutes');
        const reason = interaction.options.getString('reason') || 'No reason specified';
        if (!member) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
        await member.timeout(minutes * 60 * 1000, reason);
        await interaction.reply({ content: `🔇 **${member.user.tag}** timed out for ${minutes} minutes. Reason: ${reason}` });
      }
    },

    // Untimeout (Unmute)
    {
      data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove timeout from a user')
        .addUserOption(opt => opt.setName('target').setDescription('Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        if (!member) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
        await member.timeout(null);
        await interaction.reply({ content: `🔊 Timeout removed from **${member.user.tag}**.` });
      }
    },

    // Clear (Purge Messages)
    {
      data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear bulk messages from the channel')
        .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages (1-100)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        if (amount < 1 || amount > 100) return interaction.reply({ content: '❌ Choose between 1 and 100 messages.', ephemeral: true });
        await interaction.channel.bulkDelete(amount, true);
        await interaction.reply({ content: `🧹 Cleared ${amount} messages.`, ephemeral: true });
      }
    },

    // Lock Channel
    {
      data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock the current text channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        await interaction.reply({ content: '🔒 Channel locked successfully.' });
      }
    },

    // Unlock Channel
    {
      data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock the current text channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
        await interaction.reply({ content: '🔓 Channel unlocked successfully.' });
      }
    },

    // VKick (Voice Kick)
    {
      data: new SlashCommandBuilder()
        .setName('vkick')
        .setDescription('Kick a user from voice channel')
        .addUserOption(opt => opt.setName('target').setDescription('Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        if (!member || !member.voice.channel) return interaction.reply({ content: '❌ User is not in a voice channel!', ephemeral: true });
        await member.voice.setChannel(null);
        await interaction.reply({ content: `🔊 Kicked **${member.user.tag}** from voice channel.` });
      }
    },

    // Help Command
    {
      data: new SlashCommandBuilder().setName('help').setDescription('View available commands'),
      async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
          .setTitle('✨ Oscorp System Help')
          .setDescription('Available Commands List:')
          .setColor('#5865F2')
          .addFields(
            { name: '🎟️ Tickets', value: '`/ticket-setup`' },
            { name: '🛡️ Moderation', value: '`/ban`, `/kick`, `/timeout`, `/untimeout`, `/clear`, `/lock`, `/unlock`, `/vkick`' }
          );
        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
      }
    }
  ]
};
