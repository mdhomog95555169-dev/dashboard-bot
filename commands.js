const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  commands: [
    // -------------------------------------------------------------
    // 🎟️ 1. أمر إعداد لوحة التذاكر المخصص (Ticket Setup)
    // -------------------------------------------------------------
    {
      data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('إنشاء لوحة تذاكر مخصصة مع إيكون وبنر وأقسام')
        .addStringOption(opt => opt.setName('title').setDescription('عنوان اللوحة / Embed Title').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('وصف وتعليمات اللوحة').setRequired(true))
        .addStringOption(opt => opt.setName('icon_url').setDescription('رابط آيكون صغير / Small Icon URL').setRequired(false))
        .addStringOption(opt => opt.setName('banner_url').setDescription('رابط بنر كبير / Large Banner URL').setRequired(false))
        
        // الأقسام (حتى 5 أقسام)
        .addStringOption(opt => opt.setName('cat1_label').setDescription('اسم القسم 1').setRequired(true))
        .addStringOption(opt => opt.setName('cat1_emoji').setDescription('إيموجي القسم 1 (رمز أو Custom ID)').setRequired(false))
        
        .addStringOption(opt => opt.setName('cat2_label').setDescription('اسم القسم 2').setRequired(false))
        .addStringOption(opt => opt.setName('cat2_emoji').setDescription('إيموجي القسم 2').setRequired(false))
        
        .addStringOption(opt => opt.setName('cat3_label').setDescription('اسم القسم 3').setRequired(false))
        .addStringOption(opt => opt.setName('cat3_emoji').setDescription('إيموجي القسم 3').setRequired(false))
        
        .addStringOption(opt => opt.setName('cat4_label').setDescription('اسم القسم 4').setRequired(false))
        .addStringOption(opt => opt.setName('cat4_emoji').setDescription('إيموجي القسم 4').setRequired(false))
        
        .addStringOption(opt => opt.setName('cat5_label').setDescription('اسم القسم 5').setRequired(false))
        .addStringOption(opt => opt.setName('cat5_emoji').setDescription('إيموجي القسم 5').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const iconUrl = interaction.options.getString('icon_url');
        const bannerUrl = interaction.options.getString('banner_url');

        const options = [];
        for (let i = 1; i <= 5; i++) {
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
          .setColor('#5865F2')
          .setTimestamp();

        if (iconUrl) ticketEmbed.setThumbnail(iconUrl);
        if (bannerUrl) ticketEmbed.setImage(bannerUrl);

        const selectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('custom_ticket_select')
            .setPlaceholder('اختر نوع التذكرة / Choose Ticket Category...')
            .addOptions(options)
        );

        await interaction.channel.send({ embeds: [ticketEmbed], components: [selectMenu] });
        await interaction.reply({ content: '✅ **تم إنشاء لوحة التذاكر بنجاح!**' });
      }
    },

    // -------------------------------------------------------------
    // 📖 2. أمر المساعدة الشامل (/help) بأسلوب ProBot
    // -------------------------------------------------------------
    {
      data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('عرض قائمة أوامر البوت المتاحة'),
      async execute(interaction) {
        const helpText = `
📌 **قائمة أوامر البوت المتاحة:**

🛡️ **أوامر الإشراف والأعضاء (Moderation & Utility):**
• \`/ban <member> [reason]\` - حظر عضو من السيرفر
• \`/kick <member> [reason]\` - طرد عضو من السيرفر
• \`/timeout <member> <minutes> [reason]\` - إعطاء تايم أوت (إسكات) لعضو
• \`/untimeout <member>\` - إزالة التايم أوت عن عضو
• \`/clear <amount>\` - مسح عدد محدد من الرسائل (1-100)
• \`/vkick <member>\` - طرد عضو من الروم الصوتي

🔒 **أوامر إشراف القنوات (Channel Moderation):**
• \`/lock\` - قفل القناة الحالية
• \`/unlock\` - فتح القناة الحالية
• \`/hide\` - إخفاء القناة عن الأعضاء
• \`/unhide\` - إظهار القناة للأعضاء
• \`/slowmode <seconds>\` - تفعيل وضع البطء للرسائل

ℹ️ **أوامر المعلومات والمرافق (Utility):**
• \`/user [member]\` - عرض معلومات حسابك أو عضو آخر
• \`/server\` - عرض معلومات وإحصائيات السيرفر
• \`/avatar [member]\` - عرض صورة الحساب الشخصي

🎟️ **إدارة التذاكر:**
• \`/ticket-setup\` - إعداد لوحة التذاكر الاحترافية
`;
        await interaction.reply({ content: helpText });
      }
    },

    // -------------------------------------------------------------
    // 🛡️ 3. أوامر الإشراف والأعضاء (Moderation Commands)
    // -------------------------------------------------------------
    {
      data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('حظر عضو من السيرفر')
        .addUserOption(opt => opt.setName('target').setDescription('العضو المستهدف').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'بدون سبب مذكور';
        await interaction.guild.members.ban(target, { reason });
        await interaction.reply({ content: `✅ **تم حظر ${target.tag} بنجاح.** | السبب: ${reason}` });
      }
    },
    {
      data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('طرد عضو من السيرفر')
        .addUserOption(opt => opt.setName('target').setDescription('العضو المستهدف').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'بدون سبب مذكور';
        if (!member) return interaction.reply({ content: '❌ لم يتم العثور على العضو.' });
        await member.kick(reason);
        await interaction.reply({ content: `✅ **تم طرد ${member.user.tag} بنجاح.** | السبب: ${reason}` });
      }
    },
    {
      data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('إسكات / تايم أوت للعضو')
        .addUserOption(opt => opt.setName('target').setDescription('العضو المستهدف').setRequired(true))
        .addIntegerOption(opt => opt.setName('minutes').setDescription('المدة بالدقائق').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        const minutes = interaction.options.getInteger('minutes');
        const reason = interaction.options.getString('reason') || 'بدون سبب مذكور';
        if (!member) return interaction.reply({ content: '❌ لم يتم العثور على العضو.' });
        await member.timeout(minutes * 60 * 1000, reason);
        await interaction.reply({ content: `🔇 **تم إعطاء تايم أوت لـ ${member.user.tag} لمدة ${minutes} دقيقة.** | السبب: ${reason}` });
      }
    },
    {
      data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('إزالة التايم أوت عن العضو')
        .addUserOption(opt => opt.setName('target').setDescription('العضو المستهدف').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        if (!member) return interaction.reply({ content: '❌ لم يتم العثور على العضو.' });
        await member.timeout(null);
        await interaction.reply({ content: `🔊 **تم إزالة التايم أوت عن ${member.user.tag}.**` });
      }
    },
    {
      data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('مسح عدد محدد من الرسائل')
        .addIntegerOption(opt => opt.setName('amount').setDescription('عدد الرسائل (1-100)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        if (amount < 1 || amount > 100) return interaction.reply({ content: '❌ اختر عدداً بين 1 و 100.' });
        await interaction.channel.bulkDelete(amount, true);
        await interaction.reply({ content: `🧹 **تم حذف ${amount} رسالة بنجاح.**` });
      }
    },
    {
      data: new SlashCommandBuilder()
        .setName('vkick')
        .setDescription('طرد عضو من الروم الصوتي')
        .addUserOption(opt => opt.setName('target').setDescription('العضو المستهدف').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        if (!member || !member.voice.channel) return interaction.reply({ content: '❌ العضو ليس متواجداً في روم صوتي!' });
        await member.voice.setChannel(null);
        await interaction.reply({ content: `🔊 **تم طرد ${member.user.tag} من الروم الصوتي.**` });
      }
    },

    // -------------------------------------------------------------
    // 🔒 4. أوامر إشراف القنوات (Channel Moderation)
    // -------------------------------------------------------------
    {
      data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('قفل الروم الحالي')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        await interaction.reply({ content: `🔒 **تم قفل القناة بنجاح:** <#${interaction.channel.id}>` });
      }
    },
    {
      data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('فتح الروم الحالي')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
        await interaction.reply({ content: `🔓 **تم فتح القناة بنجاح:** <#${interaction.channel.id}>` });
      }
    },
    {
      data: new SlashCommandBuilder()
        .setName('hide')
        .setDescription('إخفاء الروم عن باقي الأعضاء')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
        await interaction.reply({ content: `👁️‍🗨️ **تم إخفاء القناة بنجاح.**` });
      }
    },
    {
      data: new SlashCommandBuilder()
        .setName('unhide')
        .setDescription('إظهار الروم للأعضاء')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: true });
        await interaction.reply({ content: `👁️ **تم إظهار القناة بنجاح.**` });
      }
    },
    {
      data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('تحديد الوقت بين الرسائل (وضع البطء)')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('المدة بالثواني (0 لإيقافه)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        await interaction.channel.setRateLimitPerUser(seconds);
        if (seconds === 0) {
          await interaction.reply({ content: `🚀 **تم إيقاف وضع البطء (Slowmode).**` });
        } else {
          await interaction.reply({ content: `⏳ **تم تحديد وضع البطء إلى ${seconds} ثانية.**` });
        }
      }
    },

    // -------------------------------------------------------------
    // ℹ️ 5. أوامر المرافق والمعلومات (Utility Commands)
    // -------------------------------------------------------------
    {
      data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('عرض معلومات الحساب')
        .addUserOption(opt => opt.setName('target').setDescription('العضو (اختياري)')),
      async execute(interaction) {
        const user = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const joinedAt = member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'غير معروف';
        const createdAt = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;
        
        await interaction.reply({
          content: `👤 **معلومات العضو:** ${user.tag}\n🆔 **ID:** \`${user.id}\` \n📅 **تاريخ إنشاء الحساب:** ${createdAt}\n📥 **تاريخ الانضمام للسيرفر:** ${joinedAt}`
        });
      }
    },
    {
      data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('عرض معلومات السيرفر'),
      async execute(interaction) {
        const guild = interaction.guild;
        const createdAt = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;
        await interaction.reply({
          content: `🏰 **اسم السيرفر:** ${guild.name}\n🆔 **ID:** \`${guild.id}\` \n👥 **عدد الأعضاء:** \`${guild.memberCount}\` \n👑 **المالك:** <@${guild.ownerId}>\n📅 **تاريخ الإنشاء:** ${createdAt}`
        });
      }
    },
    {
      data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('عرض صورة الحساب الشخصي')
        .addUserOption(opt => opt.setName('target').setDescription('العضو (اختياري)')),
      async execute(interaction) {
        const user = interaction.options.getUser('target') || interaction.user;
        const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });
        await interaction.reply({ content: `🖼️ **صورة الحساب الشخصي لـ ${user.tag}:**\n${avatarUrl}` });
      }
    }
  ]
};
