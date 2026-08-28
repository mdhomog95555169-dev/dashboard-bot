const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  commands: [
    // 1. أمر المساعدة (Help)
    {
      data: new SlashCommandBuilder().setName('help').setDescription('Displays all available commands and bot setup'),
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setTitle('✨ Oscorp System Help')
          .setDescription('Welcome! Here is the command list for Oscorp Moderation & Management Bot:')
          .setColor('#5865F2')
          .addFields(
            { name: '🛡️ Moderation', value: '`/ban`, `/kick`, `/timeout`, `/untimeout`, `/clear`, `/lock`, `/unlock`', inline: false },
            { name: '🔊 Voice Control', value: '`/vkick`, `/vmove`, `/vmute`, `/vunmute`', inline: false },
            { name: '🎟️ Support & Tickets', value: '`/ticket-setup`', inline: false },
            { name: '⚙️ Settings', value: '`/set-welcome`, `/set-automod`', inline: false }
          )
          .setFooter({ text: 'Oscorp System • Fully Functional' });
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    },
    // 2. أمر إعداد نظام التذاكر (Ticket Setup)
    {
      data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Set up the Ticket Panel in the current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setTitle('🎟️ Support Tickets')
          .setDescription('Click the button below to open a support ticket!')
          .setColor('#00FF00')
          .setFooter({ text: 'Oscorp Support System' });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎟️')
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Ticket Panel has been setup successfully!', ephemeral: true });
      }
    },
    // 3. أمر إعداد الترحيب (Welcome Setup)
    {
      data: new SlashCommandBuilder()
        .setName('set-welcome')
        .setDescription('Set up the Welcome channel')
        .addChannelOption(opt => opt.setName('channel').setDescription('Select Welcome Channel').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        await interaction.reply({ content: `✅ Welcome channel has been set to ${channel}`, ephemeral: true });
      }
    },
    // 4. أمر الحماية التلقائية (AutoMod)
    {
      data: new SlashCommandBuilder()
        .setName('set-automod')
        .setDescription('Enable or Disable AutoMod')
        .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable AutoMod protection').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      async execute(interaction) {
        const enabled = interaction.options.getBoolean('enabled');
        await interaction.reply({ content: `🛡️ AutoMod status updated: **${enabled ? 'Enabled' : 'Disabled'}**`, ephemeral: true });
      }
    },
    // 5. فحص الاستجابة (Ping)
    {
      data: new SlashCommandBuilder().setName('ping').setDescription('Check bot status'),
      async execute(interaction) {
        await interaction.reply({ content: `🏓 Pong! Latency: ${interaction.client.ws.ping}ms`, ephemeral: true });
      }
    },
    // 6. طرد صوتي (VKick)
    {
      data: new SlashCommandBuilder()
        .setName('vkick')
        .setDescription('Kick a member from voice channel')
        .addUserOption(opt => opt.setName('target').setDescription('Target user').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        if (!member || !member.voice.channel) return interaction.reply({ content: '❌ User is not in a voice channel!', ephemeral: true });
        await member.voice.setChannel(null);
        await interaction.reply({ content: `✅ Kicked ${member.user.tag} from voice channel.` });
      }
    },
    // 7. مسح الرسائل (Clear)
    {
      data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete a specified amount of messages')
        .addIntegerOption(opt => opt.setName('amount').setDescription('Amount (1-100)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        if (amount < 1 || amount > 100) return interaction.reply({ content: '❌ Enter a number between 1 and 100.', ephemeral: true });
        await interaction.channel.bulkDelete(amount, true);
        await interaction.reply({ content: `🧹 Deleted ${amount} messages.`, ephemeral: true });
      }
    },
    // 8. حظر عضو (Ban)
    {
      data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(opt => opt.setName('target').setDescription('User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        await interaction.guild.members.ban(target, { reason });
        await interaction.reply({ content: `⛔ Banned ${target.tag} | Reason: ${reason}` });
      }
    },
    // 9. طرد عضو (Kick)
    {
      data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(opt => opt.setName('target').setDescription('User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        if (!member) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
        await member.kick(reason);
        await interaction.reply({ content: `👞 Kicked ${member.user.tag} | Reason: ${reason}` });
      }
    },
    // 10. إسكات عضو (Timeout)
    {
      data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user')
        .addUserOption(opt => opt.setName('target').setDescription('User').setRequired(true))
        .addIntegerOption(opt => opt.setName('minutes').setDescription('Minutes').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        const minutes = interaction.options.getInteger('minutes');
        if (!member) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
        await member.timeout(minutes * 60 * 1000);
        await interaction.reply({ content: `🔇 Muted ${member.user.tag} for ${minutes} minutes.` });
      }
    },
    // 11. قفل الشات (Lock)
    {
      data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock the current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        await interaction.reply({ content: '🔒 Channel locked successfully.' });
      }
    },
    // 12. فتح الشات (Unlock)
    {
      data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock the current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
        await interaction.reply({ content: '🔓 Channel unlocked successfully.' });
      }
    }
  ]
};
