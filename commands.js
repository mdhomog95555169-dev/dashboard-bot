const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  ChannelType
} = require('discord.js');

// ضع آيدي الكاتيجوري الافتراضي للتذاكر هنا إذا أردت
const DEFAULT_TICKET_CATEGORY_ID = "1542878038675431434"; 

module.exports = {
  DEFAULT_TICKET_CATEGORY_ID,
  commands: [
    // 🎟️ 1. Ticket Setup Command
    {
      data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('🎫 Create a customized support ticket panel')
        .addStringOption(opt => opt.setName('title').setDescription('📌 Embed Title').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('📝 Embed Description').setRequired(true))
        .addChannelOption(opt => 
          opt.setName('ticket_category')
            .setDescription('📁 Category Channel for tickets (Optional)')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(false)
        )
        .addStringOption(opt => opt.setName('icon_url').setDescription('🖼️ Header Icon URL (Thumbnail)').setRequired(false))
        .addStringOption(opt => opt.setName('banner_url').setDescription('🖼️ Banner Image URL').setRequired(false))
        .addStringOption(opt => opt.setName('cat1_label').setDescription('📂 Category 1 Name').setRequired(true))
        .addStringOption(opt => opt.setName('cat1_emoji').setDescription('✨ Category 1 Emoji').setRequired(false))
        .addStringOption(opt => opt.setName('cat2_label').setDescription('📂 Category 2 Name').setRequired(false))
        .addStringOption(opt => opt.setName('cat2_emoji').setDescription('✨ Category 2 Emoji').setRequired(false))
        .addStringOption(opt => opt.setName('cat3_label').setDescription('📂 Category 3 Name').setRequired(false))
        .addStringOption(opt => opt.setName('cat3_emoji').setDescription('✨ Category 3 Emoji').setRequired(false))
        .addStringOption(opt => opt.setName('cat4_label').setDescription('📂 Category 4 Name').setRequired(false))
        .addStringOption(opt => opt.setName('cat4_emoji').setDescription('✨ Category 4 Emoji').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const selectedCategory = interaction.options.getChannel('ticket_category');
        const categoryId = selectedCategory ? selectedCategory.id : DEFAULT_TICKET_CATEGORY_ID;

        const iconUrl = interaction.options.getString('icon_url');
        const bannerUrl = interaction.options.getString('banner_url');

        const options = [];
        for (let i = 1; i <= 4; i++) {
          const label = interaction.options.getString(`cat${i}_label`);
          const emoji = interaction.options.getString(`cat${i}_emoji`);
          if (label) {
            const optObj = { label: label, value: `cat_${i}_${categoryId}` };
            if (emoji) optObj.emoji = emoji;
            options.push(optObj);
          }
        }

        const ticketEmbed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor('#2f3136')
          .setTimestamp();

        // إدراج روابط الصور بنجاح
        if (iconUrl) ticketEmbed.setThumbnail(iconUrl);
        if (bannerUrl) ticketEmbed.setImage(bannerUrl);

        const selectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('custom_ticket_select')
            .setPlaceholder('اختر قسم التذكرة...')
            .addOptions(options)
        );

        await interaction.channel.send({ embeds: [ticketEmbed], components: [selectMenu] });
        
        const responseEmbed = new EmbedBuilder()
          .setDescription('🎫 | تم إرسال لوحة التذاكر بنجاح!')
          .setColor('#57f287');
        await interaction.reply({ embeds: [responseEmbed], ephemeral: true });
      }
    },

    // 🧹 2. Clear Command
    {
      data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Purge bulk messages')
        .addIntegerOption(opt => opt.setName('number_of_messages').setDescription('Number of messages').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const amount = interaction.options.getInteger('number_of_messages');
        await interaction.reply({ content: 'Deleting messages ...' });

        const deleted = await interaction.channel.bulkDelete(amount, true).catch(() => null);
        const count = deleted ? deleted.size : amount;

        const clearEmbed = new EmbedBuilder()
          .setDescription(`\`\`\`${count} messages have been deleted.\`\`\``)
          .setColor('#2f3136');

        await interaction.editReply({ content: null, embeds: [clearEmbed] });
      }
    },

    // 🔨 3. Ban Command
    {
      data: new SlashCommandBuilder().setName('ban').setDescription('🔨 Ban user')
        .addUserOption(opt => opt.setName('user').setDescription('Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'بدون سبب';
        await interaction.guild.members.ban(user, { reason }).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`🔨 | تم حظر ${user.tag} | السبب: ${reason}`).setColor('#ed4245');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔓 4. Unban Command
    {
      data: new SlashCommandBuilder().setName('unban').setDescription('🔓 Unban user by ID')
        .addStringOption(opt => opt.setName('userid').setDescription('User ID').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const userId = interaction.options.getString('userid');
        await interaction.guild.members.unban(userId).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`🔓 | تم إلغاء حظر الآيدي \`${userId}\``).setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 👢 5. Kick Command
    {
      data: new SlashCommandBuilder().setName('kick').setDescription('👢 Kick member')
        .addUserOption(opt => opt.setName('user').setDescription('Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'بدون سبب';
        if (member) await member.kick(reason).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`👢 | تم طرد ${interaction.options.getUser('user').tag}`).setColor('#fee75c');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔇 6. Timeout Command
    {
      data: new SlashCommandBuilder().setName('timeout').setDescription('🔇 Timeout member')
        .addUserOption(opt => opt.setName('user').setDescription('Target User').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('Minutes').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const duration = interaction.options.getInteger('duration');
        if (member) await member.timeout(duration * 60 * 1000).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`🔇 | تم إعطاء ميوت لـ ${member ? member.user.tag : 'العضو'} لمدة ${duration} دقيقة`).setColor('#ed4245');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔊 7. Untimeout Command
    {
      data: new SlashCommandBuilder().setName('untimeout').setDescription('🔊 Remove timeout')
        .addUserOption(opt => opt.setName('user').setDescription('Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member) await member.timeout(null).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`🔊 | تم فك الميوت عن العضو بنجاح`).setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // ⚠️ 8. Warn Command
    {
      data: new SlashCommandBuilder().setName('warn').setDescription('⚠️ Warn member')
        .addUserOption(opt => opt.setName('user').setDescription('Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const embed = new EmbedBuilder().setDescription(`⚠️ | تم تحذير ${user.tag} | السبب: ${reason}`).setColor('#fee75c');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔒 9. Lock Command
    {
      data: new SlashCommandBuilder().setName('lock').setDescription('🔒 Lock channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`🔒 | تم قفل الروم بنجاح`).setColor('#ed4245');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔓 10. Unlock Command
    {
      data: new SlashCommandBuilder().setName('unlock').setDescription('🔓 Unlock channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true }).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`🔓 | تم فتح الروم بنجاح`).setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 👁️‍🗨️ 11. Hide Command
    {
      data: new SlashCommandBuilder().setName('hide').setDescription('👁️‍🗨️ Hide channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false }).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`👁️‍🗨️ | تم إخفاء الروم`).setColor('#2f3136');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 👁️ 12. Unhide Command
    {
      data: new SlashCommandBuilder().setName('unhide').setDescription('👁️ Make channel visible')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: true }).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`👁️ | تم إظهار الروم`).setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // ⏳ 13. Slowmode Command
    {
      data: new SlashCommandBuilder().setName('slowmode').setDescription('⏳ Set slowmode')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('Seconds').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        await interaction.channel.setRateLimitPerUser(seconds).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`⏳ | تم ضبط الوضع البطئ إلى ${seconds} ثانية`).setColor('#5865f2');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🎙️ 14. VKick Command
    {
      data: new SlashCommandBuilder().setName('vkick').setDescription('🎙️ Voice kick member')
        .addUserOption(opt => opt.setName('user').setDescription('Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setChannel(null).catch(() => {});
          const embed = new EmbedBuilder().setDescription(`🎙️ | تم طرد العضو من الروم الصوتي`).setColor('#ed4245');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ العضو ليس في روم صوتي.', ephemeral: true });
        }
      }
    },

    // ↗️ 15. VMove Command
    {
      data: new SlashCommandBuilder().setName('vmove').setDescription('↗️ Move member in voice')
        .addUserOption(opt => opt.setName('user').setDescription('Target User').setRequired(true))
        .addChannelOption(opt => opt.setName('channel').setDescription('Voice Channel').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const channel = interaction.options.getChannel('channel');
        if (member && member.voice.channel) {
          await member.voice.setChannel(channel).catch(() => {});
          const embed = new EmbedBuilder().setDescription(`↗️ | تم نقل العضو إلى ${channel.name}`).setColor('#5865f2');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ العضو ليس في روم صوتي.', ephemeral: true });
        }
      }
    },

    // 🎙️ 16. VMute Command
    {
      data: new SlashCommandBuilder().setName('vmute').setDescription('🎙️ Voice mute member')
        .addUserOption(opt => opt.setName('user').setDescription('Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setMute(true).catch(() => {});
          const embed = new EmbedBuilder().setDescription(`🎙️ | تم إعطاء ميوت صوتي للعضو`).setColor('#ed4245');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ العضو ليس في روم صوتي.', ephemeral: true });
        }
      }
    },

    // 🔊 17. VUnmute Command
    {
      data: new SlashCommandBuilder().setName('vunmute').setDescription('🔊 Voice unmute member')
        .addUserOption(opt => opt.setName('user').setDescription('Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setMute(false).catch(() => {});
          const embed = new EmbedBuilder().setDescription(`🔊 | تم فك الميوت الصوتي`).setColor('#57f287');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ العضو ليس في روم صوتي.', ephemeral: true });
        }
      }
    },

    // 🎧 18. VDeaf Command
    {
      data: new SlashCommandBuilder().setName('vdeaf').setDescription('🎧 Voice deafen member')
        .addUserOption(opt => opt.setName('user').setDescription('Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setDeaf(true).catch(() => {});
          const embed = new EmbedBuilder().setDescription(`🎧 | تم إعطاء وايب آوت (صمم) للعضو`).setColor('#ed4245');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ العضو ليس في روم صوتي.', ephemeral: true });
        }
      }
    },

    // 🎧 19. VUndeaf Command
    {
      data: new SlashCommandBuilder().setName('vundeaf').setDescription('🎧 Voice undeafen member')
        .addUserOption(opt => opt.setName('user').setDescription('Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setDeaf(false).catch(() => {});
          const embed = new EmbedBuilder().setDescription(`🎧 | تم إلغاء الصمم الصوتي`).setColor('#57f287');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ العضو ليس في روم صوتي.', ephemeral: true });
        }
      }
    },

    // ➕ 20. Role Add Command
    {
      data: new SlashCommandBuilder().setName('role-add').setDescription('➕ Add role to user')
        .addUserOption(opt => opt.setName('user').setDescription('Target User').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        if (member) await member.roles.add(role).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`➕ | تم إضافة الرتبة \`${role.name}\` بنجاح`).setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // ➖ 21. Role Remove Command
    {
      data: new SlashCommandBuilder().setName('role-remove').setDescription('➖ Remove role from user')
        .addUserOption(opt => opt.setName('user').setDescription('Target User').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        if (member) await member.roles.remove(role).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`➖ | تم إزالة الرتبة \`${role.name}\` بنجاح`).setColor('#ed4245');
        await interaction.reply({ embeds: [embed] });
      }
    }
  ]
};
