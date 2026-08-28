const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

module.exports = {
  commands: [
    // 🎟️ 1. Ticket Setup Command (دعم 5 أقسام + آيدي الكاتيجوري + إيموجي وصور)
    {
      data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('🎫 Create a fully customized support ticket panel')
        .addStringOption(opt => opt.setName('title').setDescription('📌 Embed Title').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('📝 Embed Description & Rules').setRequired(true))
        .addChannelOption(opt => 
          opt.setName('ticket_category')
            .setDescription('📁 Select Category Channel where tickets will be opened')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addStringOption(opt => opt.setName('icon_url').setDescription('🖼️ Header Icon URL (Thumbnail)').setRequired(false))
        .addStringOption(opt => opt.setName('banner_url').setDescription('🖼️ Large Banner Image URL').setRequired(false))
        .addStringOption(opt => opt.setName('cat1_label').setDescription('📂 Category 1 Name').setRequired(true))
        .addStringOption(opt => opt.setName('cat1_emoji').setDescription('✨ Category 1 Emoji').setRequired(false))
        .addStringOption(opt => opt.setName('cat2_label').setDescription('📂 Category 2 Name').setRequired(false))
        .addStringOption(opt => opt.setName('cat2_emoji').setDescription('✨ Category 2 Emoji').setRequired(false))
        .addStringOption(opt => opt.setName('cat3_label').setDescription('📂 Category 3 Name').setRequired(false))
        .addStringOption(opt => opt.setName('cat3_emoji').setDescription('✨ Category 3 Emoji').setRequired(false))
        .addStringOption(opt => opt.setName('cat4_label').setDescription('📂 Category 4 Name').setRequired(true))
        .addStringOption(opt => opt.setName('cat4_emoji').setDescription('✨ Category 4 Emoji').setRequired(false))
        .addStringOption(opt => opt.setName('cat5_label').setDescription('📂 Category 5 Name').setRequired(false))
        .addStringOption(opt => opt.setName('cat5_emoji').setDescription('✨ Category 5 Emoji').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const ticketCategory = interaction.options.getChannel('ticket_category');
        const iconUrl = interaction.options.getString('icon_url');
        const bannerUrl = interaction.options.getString('banner_url');

        const options = [];
        for (let i = 1; i <= 5; i++) {
          const label = interaction.options.getString(`cat${i}_label`);
          const emoji = interaction.options.getString(`cat${i}_emoji`);
          if (label) {
            const optObj = { label: label, value: `cat_${i}_${ticketCategory.id}` };
            if (emoji) optObj.emoji = emoji;
            options.push(optObj);
          }
        }

        const ticketEmbed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor('#2f3136')
          .setTimestamp();

        // إصلاح روابط الصور بشكل صحيح
        if (iconUrl && (iconUrl.startsWith('http://') || iconUrl.startsWith('https://'))) {
          ticketEmbed.setThumbnail(iconUrl);
        }
        if (bannerUrl && (bannerUrl.startsWith('http://') || bannerUrl.startsWith('https://'))) {
          ticketEmbed.setImage(bannerUrl);
        }

        const selectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('custom_ticket_select')
            .setPlaceholder('اختر نوع التذكرة / Select Ticket Category...')
            .addOptions(options)
        );

        await interaction.channel.send({ embeds: [ticketEmbed], components: [selectMenu] });
        
        const responseEmbed = new EmbedBuilder()
          .setDescription('🎫 | تم إنشاء لوحة التذاكر وتحديد قسم التذاكر بنجاح!')
          .setColor('#57f287');
        await interaction.reply({ embeds: [responseEmbed], ephemeral: true });
      }
    },

    // 🧹 2. Clear Command (طريقة ProBot بالضبط: رد مؤقت ثم التحويل لإمبد)
    {
      data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Purge bulk messages from the channel')
        .addIntegerOption(opt => 
          opt.setName('number_of_messages')
            .setDescription('Number of messages to delete.')
            .setRequired(true)
        )
        .addUserOption(opt => opt.setName('filter_by_user').setDescription('Filter messages by user').setRequired(false))
        .addRoleOption(opt => opt.setName('filter_by_role').setDescription('Filter messages by role').setRequired(false))
        .addBooleanOption(opt => opt.setName('filter_by_bots').setDescription('Filter bot messages').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const amount = interaction.options.getInteger('number_of_messages');
        const targetUser = interaction.options.getUser('filter_by_user');
        const targetRole = interaction.options.getRole('filter_by_role');
        const filterBots = interaction.options.getBoolean('filter_by_bots');

        await interaction.reply({ content: 'Deleting messages ...' });

        let fetchedMessages = await interaction.channel.messages.fetch({ limit: 100 }).catch(() => null);

        if (!fetchedMessages) {
          const failEmbed = new EmbedBuilder().setDescription('❌ | تعذر جلب الرسائل.').setColor('#ed4245');
          return await interaction.editReply({ content: null, embeds: [failEmbed] });
        }

        let messagesToDelete = Array.from(fetchedMessages.values());

        if (targetUser) messagesToDelete = messagesToDelete.filter(m => m.author.id === targetUser.id);
        if (targetRole) messagesToDelete = messagesToDelete.filter(m => m.member && m.member.roles.cache.has(targetRole.id));
        if (filterBots) messagesToDelete = messagesToDelete.filter(m => m.author.bot);

        messagesToDelete = messagesToDelete.slice(0, amount);
        const deleted = await interaction.channel.bulkDelete(messagesToDelete, true).catch(() => null);
        const count = deleted ? deleted.size : messagesToDelete.length;

        const clearEmbed = new EmbedBuilder()
          .setDescription(`\`\`\`${count} messages have been deleted.\`\`\``)
          .setColor('#2f3136');

        await interaction.editReply({ content: null, embeds: [clearEmbed] });
      }
    },

    // 📖 3. Help Command
    {
      data: new SlashCommandBuilder().setName('help').setDescription('📖 Open system instructions & interactive command menu'),
      async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
          .setTitle('⚙️ Oscorp System Command Hub')
          .setDescription('أهلاً بك في قائمة أوامر النظام المحدثة 100%.')
          .setColor('#2f3136');
        await interaction.reply({ embeds: [helpEmbed] });
      }
    },

    // 🔨 4. Ban Command
    {
      data: new SlashCommandBuilder().setName('ban').setDescription('🔨 Ban a user permanently')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'بدون سبب مذكور';
        await interaction.guild.members.ban(user, { reason }).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`🔨 | تم حظر العضو ${user.tag} بنجاح! | السبب: ${reason}`).setColor('#ed4245');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔓 5. Unban Command
    {
      data: new SlashCommandBuilder().setName('unban').setDescription('🔓 Unban a user by ID')
        .addStringOption(opt => opt.setName('userid').setDescription('🆔 User ID').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const userId = interaction.options.getString('userid');
        await interaction.guild.members.unban(userId).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`🔓 | تم إلغاء حظر المستخدم صاحب الآيدي \`${userId}\` بنجاح!`).setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 👢 6. Kick Command
    {
      data: new SlashCommandBuilder().setName('kick').setDescription('👢 Kick a member from server')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'بدون سبب مذكور';
        if (member) await member.kick(reason).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`👢 | تم طرد العضو ${user.tag} من السيرفر! | السبب: ${reason}`).setColor('#fee75c');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔇 7. Timeout Command
    {
      data: new SlashCommandBuilder().setName('timeout').setDescription('🔇 Timeout/Mute a member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('⏱️ Duration in Minutes').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'بدون سبب مذكور';
        if (member) await member.timeout(duration * 60 * 1000, reason).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`🔇 | تم إعطاء ميوت مؤقت لـ ${member ? member.user.tag : 'العضو'} لمدة ${duration} دقيقة!`).setColor('#ed4245');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔊 8. Untimeout Command
    {
      data: new SlashCommandBuilder().setName('untimeout').setDescription('🔊 Remove timeout from a member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member) await member.timeout(null).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`🔊 | تم فك الميوت عن العضو ${member ? member.user.tag : 'العضو'} بنجاح!`).setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // ⚠️ 9. Warn Command
    {
      data: new SlashCommandBuilder().setName('warn').setDescription('⚠️ Issue warning to a member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const embed = new EmbedBuilder().setDescription(`⚠️ | تم تحذير العضو ${user.tag} بنجاح! | السبب: ${reason}`).setColor('#fee75c');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔒 10. Lock Command
    {
      data: new SlashCommandBuilder().setName('lock').setDescription('🔒 Lock text channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`🔒 | تم قفل الروم الكتابي بنجاح!`).setColor('#ed4245');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔓 11. Unlock Command
    {
      data: new SlashCommandBuilder().setName('unlock').setDescription('🔓 Unlock text channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true }).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`🔓 | تم فتح الروم الكتابي بنجاح!`).setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 👁️‍🗨️ 12. Hide Command
    {
      data: new SlashCommandBuilder().setName('hide').setDescription('👁️‍🗨️ Hide channel from members')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false }).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`👁️‍🗨️ | تم إخفاء الروم عن باقي الأعضاء بنجاح!`).setColor('#2f3136');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 👁️ 13. Unhide Command
    {
      data: new SlashCommandBuilder().setName('unhide').setDescription('👁️ Make channel visible')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: true }).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`👁️ | تم إظهار الروم للأعضاء بنجاح!`).setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // ⏳ 14. Slowmode Command
    {
      data: new SlashCommandBuilder().setName('slowmode').setDescription('⏳ Set channel slowmode seconds')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('⏱️ Seconds').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        await interaction.channel.setRateLimitPerUser(seconds).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`⏳ | تم ضبط الوضع البطئ للروم إلى ${seconds} ثانية!`).setColor('#5865f2');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🎙️ 15. VKick Command
    {
      data: new SlashCommandBuilder().setName('vkick').setDescription('🎙️ Kick user from voice channel')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setChannel(null).catch(() => {});
          const embed = new EmbedBuilder().setDescription(`🎙️ | تم طرد العضو ${member.user.tag} من الروم الصوتي!`).setColor('#ed4245');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ العضو غير متواجد في روم صوتي.', ephemeral: true });
        }
      }
    },

    // ↗️ 16. VMove Command
    {
      data: new SlashCommandBuilder().setName('vmove').setDescription('↗️ Move member to voice channel')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addChannelOption(opt => opt.setName('channel').setDescription('🔊 Target Voice Channel').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const channel = interaction.options.getChannel('channel');
        if (member && member.voice.channel) {
          await member.voice.setChannel(channel).catch(() => {});
          const embed = new EmbedBuilder().setDescription(`↗️ | تم نقل العضو ${member.user.tag} إلى ${channel.name}!`).setColor('#5865f2');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ العضو غير متواجد في روم صوتي.', ephemeral: true });
        }
      }
    },

    // 🎙️ 17. VMute Command
    {
      data: new SlashCommandBuilder().setName('vmute').setDescription('🎙️ Mute member in voice')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setMute(true).catch(() => {});
          const embed = new EmbedBuilder().setDescription(`🎙️ | تم كتم ميوت العضو ${member.user.tag} داخل الروم الصوتي!`).setColor('#ed4245');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ العضو غير متواجد في روم صوتي.', ephemeral: true });
        }
      }
    },

    // 🔊 18. VUnmute Command
    {
      data: new SlashCommandBuilder().setName('vunmute').setDescription('🔊 Unmute member in voice')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setMute(false).catch(() => {});
          const embed = new EmbedBuilder().setDescription(`🔊 | تم فك الميوت الصوتي عن العضو ${member.user.tag}!`).setColor('#57f287');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ العضو غير متواجد في روم صوتي.', ephemeral: true });
        }
      }
    },

    // 🎧 19. VDeaf Command
    {
      data: new SlashCommandBuilder().setName('vdeaf').setDescription('🎧 Deafen member in voice')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setDeaf(true).catch(() => {});
          const embed = new EmbedBuilder().setDescription(`🎧 | تم إعطاء وايب آوت (صمم صوتي) للعضو ${member.user.tag}!`).setColor('#ed4245');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ العضو غير متواجد في روم صوتي.', ephemeral: true });
        }
      }
    },

    // 🎧 20. VUndeaf Command
    {
      data: new SlashCommandBuilder().setName('vundeaf').setDescription('🎧 Undeafen member in voice')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setDeaf(false).catch(() => {});
          const embed = new EmbedBuilder().setDescription(`🎧 | تم إلغاء الصمم الصوتي عن العضو ${member.user.tag}!`).setColor('#57f287');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ العضو غير متواجد في روم صوتي.', ephemeral: true });
        }
      }
    },

    // ➕ 21. Role Add Command
    {
      data: new SlashCommandBuilder().setName('role-add').setDescription('➕ Add role to member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('🎭 Role').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        if (member) await member.roles.add(role).catch(() => {});
        const embed = new EmbedBuilder().setDescription(`➕ | تم إضافة الرتبة \`${role.name}\` للعضو ${member ? member.user.tag : 'العضو'} بنجاح!`).setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    }
  ]
};
