const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  commands: [
    // -------------------------------------------------------------
    // 🎟️ 1. أمر إعداد التذاكر (مضاف فيه الصورة والأيقونة وضبط الخيارات)
    // -------------------------------------------------------------
    {
      data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('إعداد لوحة التذاكر')
        .addStringOption(opt => opt.setName('title').setDescription('عنوان اللوحة').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('وصف وتعليمات اللوحة').setRequired(true))
        .addStringOption(opt => opt.setName('icon_url').setDescription('رابط الأيقونة الصغرى (Icon/Thumbnail)').setRequired(false))
        .addStringOption(opt => opt.setName('banner_url').setDescription('رابط بنر الصورة (Banner Image)').setRequired(false))
        .addStringOption(opt => opt.setName('cat1_label').setDescription('اسم القسم 1').setRequired(true))
        .addStringOption(opt => opt.setName('cat1_emoji').setDescription('إيموجي القسم 1').setRequired(false))
        .addStringOption(opt => opt.setName('cat2_label').setDescription('اسم القسم 2').setRequired(false))
        .addStringOption(opt => opt.setName('cat2_emoji').setDescription('إيموجي القسم 2').setRequired(false))
        .addStringOption(opt => opt.setName('cat3_label').setDescription('اسم القسم 3').setRequired(false))
        .addStringOption(opt => opt.setName('cat3_emoji').setDescription('إيموجي القسم 3').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const iconUrl = interaction.options.getString('icon_url');
        const bannerUrl = interaction.options.getString('banner_url');

        const options = [];
        for (let i = 1; i <= 3; i++) {
          const label = interaction.options.getString(`cat${i}_label`);
          const emoji = interaction.options.getString(`cat${i}_emoji`);
          if (label) {
            const optObj = { label: label, value: `cat_${i}` };
            if (emoji) optObj.emoji = emoji;
            options.push(optObj);
          }
        }

        const ticketEmbed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor('#2f3136')
          .setTimestamp();

        if (iconUrl) ticketEmbed.setThumbnail(iconUrl);
        if (bannerUrl) ticketEmbed.setImage(bannerUrl);

        const selectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('custom_ticket_select')
            .setPlaceholder('اختر نوع التذكرة...')
            .addOptions(options)
        );

        await interaction.channel.send({ embeds: [ticketEmbed], components: [selectMenu] });
        await interaction.reply({ content: '✅ **تم إنشاء لوحة التذاكر بنجاح.**' });
      }
    },

    // -------------------------------------------------------------
    // 📖 2. أمر Help المطور باللون الرمادي مع قائمة اختيار الكاتيجوري
    // -------------------------------------------------------------
    {
      data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('عرض قائمة أوامر البوت'),
      async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
          .setTitle('إرشادات وأوامر البوت')
          .setDescription('يرجى اختيار القسم المطلوب من القائمة المنسدلة أدناه لعرض الأوامر الخاصة به.')
          .setColor('#2f3136')
          .setFooter({ text: 'Oscorp Bot System' });

        const helpMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('اختر قسم الأوامر...')
            .addOptions([
              { label: 'أوامر الإشراف (Moderation)', description: 'أوامر حظر وطرد وإسكات الأعضاء (15+ أمر)', value: 'help_mod', emoji: '🛡️' },
              { label: 'أوامر القنوات (Channels)', description: 'أوامر قفل وإخفاء والتحكم بالقنوات', value: 'help_chan', emoji: '🔒' },
              { label: 'الأوامر العامة (Utility)', description: 'أوامر معلومات الحسابات والسيرفر', value: 'help_util', emoji: '⚙️' }
            ])
        );

        await interaction.reply({ embeds: [helpEmbed], components: [helpMenu] });
      }
    },

    // -------------------------------------------------------------
    // 🛡️ 3. مجموعة أوامر الإشراف الـ 21 الكاملة (Moderation Commands)
    // -------------------------------------------------------------
    // 1. Ban
    {
      data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('حظر عضو من السيرفر')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'بدون سبب';
        await interaction.guild.members.ban(user, { reason }).catch(() => {});
        await interaction.reply({ content: `✅ **تم حظر ${user.tag} بنجاح.** | السبب: ${reason}` });
      }
    },
    // 2. Unban
    {
      data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('إزالة الحظر عن عضو')
        .addStringOption(opt => opt.setName('userid').setDescription('معرف العضو (User ID)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const userId = interaction.options.getString('userid');
        await interaction.guild.members.unban(userId).catch(() => {});
        await interaction.reply({ content: `✅ **تم إزالة الحظر عن العضو (${userId}) بنجاح.**` });
      }
    },
    // 3. Kick
    {
      data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('طرد عضو من السيرفر')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'بدون سبب';
        if (member) await member.kick(reason).catch(() => {});
        await interaction.reply({ content: `✅ **تم طرد ${member ? member.user.tag : 'العضو'} بنجاح.** | السبب: ${reason}` });
      }
    },
    // 4. Timeout
    {
      data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('إسكات عضو لمدة محددة')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('المدة بالدقائق').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'بدون سبب';
        if (member) await member.timeout(duration * 60 * 1000, reason).catch(() => {});
        await interaction.reply({ content: `🔇 **تم إعطاء تايم أوت لـ ${member ? member.user.tag : 'العضو'} لمدة ${duration} دقيقة.** | السبب: ${reason}` });
      }
    },
    // 5. Untimeout
    {
      data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('إزالة التايم أوت عن عضو')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member) await member.timeout(null).catch(() => {});
        await interaction.reply({ content: `🔊 **تم إزالة التايم أوت عن ${member ? member.user.tag : 'العضو'}.**` });
      }
    },
    // 6. Warn
    {
      data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('توجيه تحذير لعضو')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        await interaction.reply({ content: `⚠️ **تم تحذير ${user.tag}.** | السبب: ${reason}` });
      }
    },
    // 7. Clear
    {
      data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('مسح الرسائل من القناة')
        .addIntegerOption(opt => opt.setName('amount').setDescription('عدد الرسائل (1-100)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        await interaction.channel.bulkDelete(amount, true).catch(() => {});
        await interaction.reply({ content: `🧹 **تم مسح ${amount} رسالة بنجاح.**` });
      }
    },
    // 8. Lock
    {
      data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('قفل القناة الحالية')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }).catch(() => {});
        await interaction.reply({ content: `🔒 **تم قفل القناة بنجاح.**` });
      }
    },
    // 9. Unlock
    {
      data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('فتح القناة الحالية')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true }).catch(() => {});
        await interaction.reply({ content: `🔓 **تم فتح القناة بنجاح.**` });
      }
    },
    // 10. Hide
    {
      data: new SlashCommandBuilder()
        .setName('hide')
        .setDescription('إخفاء القناة عن الأعضاء')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false }).catch(() => {});
        await interaction.reply({ content: `👁️‍🗨️ **تم إخفاء القناة بنجاح.**` });
      }
    },
    // 11. Unhide
    {
      data: new SlashCommandBuilder()
        .setName('unhide')
        .setDescription('إظهار القناة للأعضاء')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: true }).catch(() => {});
        await interaction.reply({ content: `👁️ **تم إظهار القناة بنجاح.**` });
      }
    },
    // 12. Slowmode
    {
      data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('تعديل الوضع البطء')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('المدة بالثواني').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        await interaction.channel.setRateLimitPerUser(seconds).catch(() => {});
        await interaction.reply({ content: `⏳ **تم ضبط Slowmode على ${seconds} ثانية.**` });
      }
    },
    // 13. VKick
    {
      data: new SlashCommandBuilder()
        .setName('vkick')
        .setDescription('طرد عضو من الروم الصوتي')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setChannel(null).catch(() => {});
          await interaction.reply({ content: `🔊 **تم طرد ${member.user.tag} من الروم الصوتي.**` });
        } else {
          await interaction.reply({ content: `❌ العضو ليس متواجداً في روم صوتي.` });
        }
      }
    },
    // 14. VMove
    {
      data: new SlashCommandBuilder()
        .setName('vmove')
        .setDescription('نقل عضو إلى روم صوتي آخر')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .addChannelOption(opt => opt.setName('channel').setDescription('الروم الصوتي المستهدف').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const channel = interaction.options.getChannel('channel');
        if (member && member.voice.channel) {
          await member.voice.setChannel(channel).catch(() => {});
          await interaction.reply({ content: `🔊 **تم نقل ${member.user.tag} إلى الروم الصوتي المحدد.**` });
        } else {
          await interaction.reply({ content: `❌ العضو ليس في روم صوتي حالياً.` });
        }
      }
    },
    // 15. VMute
    {
      data: new SlashCommandBuilder()
        .setName('vmute')
        .setDescription('كتم صوت عضو في الروم الصوتي')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setMute(true).catch(() => {});
          await interaction.reply({ content: `🎙️ **تم كتم صوت ${member.user.tag} في الروم الصوتي.**` });
        } else {
          await interaction.reply({ content: `❌ العضو ليس في روم صوتي.` });
        }
      }
    },
    // 16. VUnmute
    {
      data: new SlashCommandBuilder()
        .setName('vunmute')
        .setDescription('إلغاء كتم صوت عضو في الروم الصوتي')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setMute(false).catch(() => {});
          await interaction.reply({ content: `🎙️ **تم فك كتم صوت ${member.user.tag} في الروم الصوتي.**` });
        } else {
          await interaction.reply({ content: `❌ العضو ليس في روم صوتي.` });
        }
      }
    },
    // 17. VDeaf
    {
      data: new SlashCommandBuilder()
        .setName('vdeaf')
        .setDescription('الصمم الصوتي لعضو (منعه من الاستماع)')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setDeaf(true).catch(() => {});
          await interaction.reply({ content: `🎧 **تم تفعيل الصمم الصوتي لـ ${member.user.tag}.**` });
        } else {
          await interaction.reply({ content: `❌ العضو ليس في روم صوتي.` });
        }
      }
    },
    // 18. VUndeaf
    {
      data: new SlashCommandBuilder()
        .setName('vundeaf')
        .setDescription('إلغاء الصمم الصوتي لعضو')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setDeaf(false).catch(() => {});
          await interaction.reply({ content: `🎧 **تم إلغاء الصمم الصوتي لـ ${member.user.tag}.**` });
        } else {
          await interaction.reply({ content: `❌ العضو ليس في روم صوتي.` });
        }
      }
    },
    // 19. Role-Add
    {
      data: new SlashCommandBuilder()
        .setName('role-add')
        .setDescription('إضافة رتبة لعضو')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('الرتبة').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        if (member) await member.roles.add(role).catch(() => {});
        await interaction.reply({ content: `✅ **تم إضافة رتبة ${role.name} لـ ${member ? member.user.tag : 'العضو'}.**` });
      }
    },
    // 20. Role-Remove
    {
      data: new SlashCommandBuilder()
        .setName('role-remove')
        .setDescription('إزالة رتبة من عضو')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('الرتبة').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        if (member) await member.roles.remove(role).catch(() => {});
        await interaction.reply({ content: `✅ **تم إزالة رتبة ${role.name} من ${member ? member.user.tag : 'العضو'}.**` });
      }
    },
    // 21. User Info
    {
      data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('عرض معلومات عضو')
        .addUserOption(opt => opt.setName('user').setDescription('العضو')),
      async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        await interaction.reply({ content: `👤 **معلومات العضو:** ${user.tag} | 🆔 ID: \`${user.id}\`` });
      }
    }
  ]
};
