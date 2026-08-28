const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  commands: [
    // 1. فحص الاستجابة
    {
      data: new SlashCommandBuilder().setName('ping').setDescription('فحص سرعة استجابة البوت'),
      async execute(interaction) {
        await interaction.reply({ content: `🏓 Pong! ${interaction.client.ws.ping}ms`, ephemeral: true });
      }
    },
    // 2. طرد صوتي
    {
      data: new SlashCommandBuilder()
        .setName('vkick')
        .setDescription('طرد عضو من الروم الصوتي')
        .addUserOption(opt => opt.setName('target').setDescription('العضو المراد طرده').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        if (!member || !member.voice.channel) return interaction.reply({ content: '❌ العضو ليس متواجد في روم صوتي حالياً!', ephemeral: true });
        await member.voice.setChannel(null);
        await interaction.reply({ content: `✅ تم طرد ${member.user.tag} من الروم الصوتي.` });
      }
    },
    // 3. مسح الرسائل
    {
      data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('مسح عدد معين من الرسائل')
        .addIntegerOption(opt => opt.setName('amount').setDescription('عدد الرسائل (1-100)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        if (amount < 1 || amount > 100) return interaction.reply({ content: '❌ يرجى ادخال رقم بين 1 و 100', ephemeral: true });
        await interaction.channel.bulkDelete(amount, true);
        await interaction.reply({ content: `🧹 تم مسح ${amount} رسالة بنجاح.`, ephemeral: true });
      }
    },
    // 4. حظر عضو
    {
      data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('حظر عضو من السيرفر')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'لا يوجد سبب';
        await interaction.guild.members.ban(target, { reason });
        await interaction.reply({ content: `⛔ تم حظر ${target.tag} | السبب: ${reason}` });
      }
    },
    // 5. طرد عضو
    {
      data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('طرد عضو من السيرفر')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'لا يوجد سبب';
        if (!member) return interaction.reply({ content: '❌ العضو غير موجود', ephemeral: true });
        await member.kick(reason);
        await interaction.reply({ content: `👞 تم طرد ${member.user.tag} | السبب: ${reason}` });
      }
    },
    // 6. اسكات مؤقت
    {
      data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('إسكات عضو لمدة معينة')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .addIntegerOption(opt => opt.setName('minutes').setDescription('المدة بالدقائق').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        const minutes = interaction.options.getInteger('minutes');
        if (!member) return interaction.reply({ content: '❌ العضو غير موجود', ephemeral: true });
        await member.timeout(minutes * 60 * 1000);
        await interaction.reply({ content: `🔇 تم إيقاف ${member.user.tag} لمدة ${minutes} دقيقة.` });
      }
    },
    // 7. إلغاء الإسكات
    {
      data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('إلغاء إسكات عضو')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        if (!member) return interaction.reply({ content: '❌ العضو غير موجود', ephemeral: true });
        await member.timeout(null);
        await interaction.reply({ content: `🔊 تم إلغاء إسكات ${member.user.tag}.` });
      }
    },
    // 8. معلومات السيرفر
    {
      data: new SlashCommandBuilder().setName('serverinfo').setDescription('عرض معلومات السيرفر'),
      async execute(interaction) {
        const { guild } = interaction;
        await interaction.reply({
          content: `📊 **معلومات السيرفر:**\n• الاسم: ${guild.name}\n• الأعضاء: ${guild.memberCount}\n• المالك: <@${guild.ownerId}>`
        });
      }
    },
    // 9. معلومات المستخدم
    {
      data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('عرض معلومات عضو')
        .addUserOption(opt => opt.setName('target').setDescription('العضو')),
      async execute(interaction) {
        const user = interaction.options.getUser('target') || interaction.user;
        await interaction.reply({
          content: `👤 **معلومات العضو:**\n• الاسم: ${user.tag}\n• ID: ${user.id}\n• تاريخ الإنشاء: <t:${Math.floor(user.createdTimestamp / 1000)}:R>`
        });
      }
    },
    // 10. قفل الشات
    {
      data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('قفل الروم الحالي')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        await interaction.reply({ content: '🔒 تم قفل الروم بنجاح.' });
      }
    },
    // 11. فتح الشات
    {
      data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('فتح الروم الحالي')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
        await interaction.reply({ content: '🔓 تم فتح الروم بنجاح.' });
      }
    },
    // 12. إخفاء الشات
    {
      data: new SlashCommandBuilder()
        .setName('hide')
        .setDescription('إخفاء الروم الحالي')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
        await interaction.reply({ content: '👁️‍🗨️ تم إخفاء الروم.' });
      }
    },
    // 13. إظهار الشات
    {
      data: new SlashCommandBuilder()
        .setName('show')
        .setDescription('إظهار الروم الحالي')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: true });
        await interaction.reply({ content: '👁️ تم إظهار الروم.' });
      }
    },
    // 14. إعطاء رتبة
    {
      data: new SlashCommandBuilder()
        .setName('role-add')
        .setDescription('إعطاء رتبة لعضو')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('الرتبة').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        const role = interaction.options.getRole('role');
        await member.roles.add(role);
        await interaction.reply({ content: `✅ تم إعطاء رتبة ${role.name} لـ ${member.user.tag}` });
      }
    },
    // 15. إزالة رتبة
    {
      data: new SlashCommandBuilder()
        .setName('role-remove')
        .setDescription('إزالة رتبة من عضو')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('الرتبة').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        const role = interaction.options.getRole('role');
        await member.roles.remove(role);
        await interaction.reply({ content: `✅ تم إزالة رتبة ${role.name} من ${member.user.tag}` });
      }
    },
    // 16. تغيير اللقب (Nickname)
    {
      data: new SlashCommandBuilder()
        .setName('setnick')
        .setDescription('تغيير لقب عضو')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .addStringOption(opt => opt.setName('nick').setDescription('اللقب الجديد').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        const nick = interaction.options.getString('nick');
        await member.setNickname(nick);
        await interaction.reply({ content: `📝 تم تغيير لقب ${member.user.tag} إلى ${nick}` });
      }
    },
    // 17. الصورة الشخصية (Avatar)
    {
      data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('عرض صورة الحساب')
        .addUserOption(opt => opt.setName('target').setDescription('العضو')),
      async execute(interaction) {
        const user = interaction.options.getUser('target') || interaction.user;
        await interaction.reply({ content: user.displayAvatarURL({ dynamic: true, size: 1024 }) });
      }
    },
    // 18. صورة السيرفر
    {
      data: new SlashCommandBuilder().setName('server-icon').setDescription('عرض صورة السيرفر'),
      async execute(interaction) {
        const icon = interaction.guild.iconURL({ dynamic: true, size: 1024 });
        if (!icon) return interaction.reply({ content: '❌ السيرفر لا يملك صورة.', ephemeral: true });
        await interaction.reply({ content: icon });
      }
    },
    // 19. نقل عضو صوتياً
    {
      data: new SlashCommandBuilder()
        .setName('vmove')
        .setDescription('نقل عضو إلى روم صوتي آخر')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .addChannelOption(opt => opt.setName('channel').setDescription('الروم الصوتي').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        const channel = interaction.options.getChannel('channel');
        if (!member.voice.channel) return interaction.reply({ content: '❌ العضو ليس في روم صوتي', ephemeral: true });
        await member.voice.setChannel(channel);
        await interaction.reply({ content: `🔊 تم نقل ${member.user.tag} إلى ${channel.name}` });
      }
    },
    // 20. كتم صوتي
    {
      data: new SlashCommandBuilder()
        .setName('vmute')
        .setDescription('كتم عضو صوتياً')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        if (!member.voice.channel) return interaction.reply({ content: '❌ العضو ليس في روم صوتي', ephemeral: true });
        await member.voice.setMute(true);
        await interaction.reply({ content: `🔇 تم كتم ${member.user.tag} صوتياً.` });
      }
    },
    // 21. إلغاء الكتم الصوتي
    {
      data: new SlashCommandBuilder()
        .setName('vunmute')
        .setDescription('إلغاء الكتم الصوتي عن عضو')
        .addUserOption(opt => opt.setName('target').setDescription('العضو').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        if (!member.voice.channel) return interaction.reply({ content: '❌ العضو ليس في روم صوتي', ephemeral: true });
        await member.voice.setMute(false);
        await interaction.reply({ content: `🔊 تم إلغاء الكتم الصوتي عن ${member.user.tag}.` });
      }
    },
    // 22. إرسال إعلان (Say / Embed)
    {
      data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('إرسال رسالة من البوت')
        .addStringOption(opt => opt.setName('message').setDescription('الرسالة').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      async execute(interaction) {
        const message = interaction.options.getString('message');
        await interaction.channel.send(message);
        await interaction.reply({ content: '✅ تم الإرسال.', ephemeral: true });
      }
    },
    // 23. القائمة والمساعدة
    {
      data: new SlashCommandBuilder().setName('help').setDescription('عرض قائمة الأوامر المتاحة'),
      async execute(interaction) {
        await interaction.reply({
          content: '📜 **قائمة أوامر Oscorp:**\n`/ping`, `/vkick`, `/clear`, `/ban`, `/kick`, `/timeout`, `/untimeout`, `/serverinfo`, `/userinfo`, `/lock`, `/unlock`, `/hide`, `/show`, `/role-add`, `/role-remove`, `/setnick`, `/avatar`, `/server-icon`, `/vmove`, `/vmute`, `/vunmute`, `/say`, `/help`',
          ephemeral: true
        });
      }
    }
  ]
};
