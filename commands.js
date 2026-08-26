const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getWarnings, addWarning, removeWarning, getPoints, addPoints } = require('./data');

// دالة إنشاء Embed بتنسيق برو بوت
function createEmbed(title, description, color = '#5865F2', footer = 'OS | System Engine') {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: footer })
    .setTimestamp();
}

async function ensureMutedRole(guild) {
  let role = guild.roles.cache.find((r) => r.name === 'Muted-Text');
  if (!role) {
    role = await guild.roles.create({ name: 'Muted-Text', color: 'Grey', reason: 'Auto-created mute role' });
    for (const [, channel] of guild.channels.cache) {
      try { await channel.permissionOverwrites.edit(role, { SendMessages: false, AddReactions: false }); }
      catch {}
    }
  }
  return role;
}

function parseDuration(input) {
  if (!input) return null;
  const match = String(input).match(/^(\d+)(s|m|h|d)$/i);
  if (!match) {
    const n = parseInt(input, 10);
    return Number.isNaN(n) ? null : n * 60 * 1000;
  }
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return value * mult;
}

const commands = [
  {
    name: 'help',
    description: 'عرض قائمة الأوامر المتاحة في البوت',
    execute: async (ctx) => {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('⚡ OS System — Control Center')
        .setDescription('مرحباً بك في لوحة تحكم OS.\nقائمة الأوامر المتاحة الموزعة حسب الصلاحيات:')
        .addFields(
          { name: '🛡️ أوامر الإدارة والطرد', value: '`/ban` | `/unban` | `/kick` | `/vkick` | `/timeout` | `/untimeout`', inline: false },
          { name: '🔇 أوامر الكتم والإسكات', value: '`/mutetext` | `/unmutetext` | `/mutevoice` | `/unmutevoice`', inline: false },
          { name: '⚠️ التحذيرات والنقاط', value: '`/warn` | `/warn_remove` | `/warnings` | `/points`', inline: false },
          { name: '⚙️ إدارة القنوات والرتب', value: '`/clear` | `/lock` | `/unlock` | `/role` | `/setcolor` | `/slowmode` | `/setnick`', inline: false }
        )
        .setFooter({ text: 'OS System Engine' })
        .setTimestamp();
      return ctx.replyEmbed(embed);
    }
  },
  {
    name: 'ban',
    description: 'حظر عضو من السيرفر',
    permission: PermissionFlagsBits.BanMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو المراد حظره' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'سبب الحظر' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason') || 'لا يوجد سبب محدد';
      if (!member) return ctx.replyError('لم يتم العثور على هذا العضو في السيرفر.');
      if (!member.bannable) return ctx.replyError('لا يمكنني حظر هذا العضو (رتبته أعلى مني أو يملك صلاحيات إدارة).');
      
      await member.ban({ reason });
      return ctx.replySuccess(`تم حظر العضو **${member.user.tag}** بنجاح.`, [
        { name: 'السبب', value: reason, inline: true },
        { name: 'المشرف', value: `<@${ctx.invoker.id}>`, inline: true }
      ]);
    },
  },
  {
    name: 'unban',
    description: 'فك حظر عضو بواسطة الآيدي',
    permission: PermissionFlagsBits.BanMembers,
    options: [{ name: 'user_id', type: 'string', required: true, description: 'آيدي العضو (ID)' }],
    execute: async (ctx) => {
      const id = ctx.getString('user_id');
      if (!id) return ctx.replyError('يرجى تحديد آيدي العضو المراد فك الحظر عنه.');
      try {
        await ctx.guild.bans.remove(id, `فك حظر بواسطة ${ctx.invoker.user.tag}`);
        return ctx.replySuccess(`تم فك الحظر عن الحساب صاحب الآيدي \`${id}\` بنجاح.`);
      } catch {
        return ctx.replyError('لم يتم العثور على حظر مسجل بهذا الآيدي.');
      }
    },
  },
  {
    name: 'kick',
    description: 'طرد عضو من السيرفر',
    permission: PermissionFlagsBits.KickMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو المراد طرده' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'سبب الطرد' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason') || 'لا يوجد سبب محدد';
      if (!member) return ctx.replyError('لم يتم العثور على العضو.');
      if (!member.kickable) return ctx.replyError('لا يمكن طرد هذا العضو بسبب رتبته.');
      await member.kick(reason);
      return ctx.replySuccess(`تم طرد **${member.user.tag}** من السيرفر.`, [
        { name: 'السبب', value: reason, inline: true }
      ]);
    },
  },
  {
    name: 'timeout',
    description: 'إسكات مؤقت لعضو (Timeout)',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'duration', type: 'string', required: true, description: 'المدة (مثال: 10m, 2h, 1d)' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'السبب' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const durationRaw = ctx.getString('duration');
      const reason = ctx.getString('reason') || 'لا يوجد سبب';
      const ms = parseDuration(durationRaw);
      if (!member) return ctx.replyError('لم يتم العثور على العضو.');
      if (!ms || ms <= 0 || ms > 28 * 86400000) return ctx.replyError('صيغة الوقت غير صحيحة. استخدم قيم مثل: `10m`, `2h`, `1d` (الحد الأقصى 28 يوماً).');
      
      await member.timeout(ms, reason);
      return ctx.replySuccess(`تم تطبيق الإسكات المؤقت على **${member.user.tag}**.`, [
        { name: 'المدة', value: durationRaw, inline: true },
        { name: 'السبب', value: reason, inline: true }
      ]);
    },
  },
  {
    name: 'untimeout',
    description: 'إلغاء الإسكات المؤقت',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'العضو' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.replyError('لم يتم العثور على العضو.');
      await member.timeout(null);
      return ctx.replySuccess(`تم إلغاء الإسكات المؤقت عن **${member.user.tag}**.`);
    },
  },
  {
    name: 'clear',
    description: 'حذف عدد محدد من الرسائل',
    permission: PermissionFlagsBits.ManageMessages,
    options: [{ name: 'amount', type: 'integer', required: true, description: 'عدد الرسائل المراد مسحها (1-100)' }],
    execute: async (ctx) => {
      let amount = ctx.getInteger('amount');
      if (!amount || amount < 1 || amount > 100) return ctx.replyError('يرجى إدخال عدد رسائل صحيح بين 1 و 100.');
      
      const deleted = await ctx.channel.bulkDelete(amount, true);
      const resEmbed = createEmbed('🧹 مسح الرسائل', `تم مسح **${deleted.size}** رسالة بنجاح.`, '#5865F2');
      const msg = await ctx.replyEmbed(resEmbed);
      if (!ctx.isSlash && msg && msg.delete) setTimeout(() => msg.delete().catch(() => {}), 4000);
    },
  },
  {
    name: 'warn',
    description: 'إضافة تحذير لإدارة المخالفات',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو المخالف' },
      { name: 'reason', type: 'string', required: true, consumeRest: true, description: 'سبب التحذير' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason');
      if (!member) return ctx.replyError('لم يتم العثور على العضو.');
      if (!reason) return ctx.replyError('يجب كتابة سبب التحذير.');
      const warning = addWarning(ctx.guild.id, member.id, reason, ctx.invoker.id);
      return ctx.replySuccess(`تم تحذير العضو **${member.user.tag}**`, [
        { name: 'معرف التحذير (ID)', value: `\`${warning.id}\``, inline: true },
        { name: 'السبب', value: reason, inline: true }
      ]);
    },
  },
  {
    name: 'warn_remove',
    description: 'حذف تحذير سابق عن عضو',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'warn_id', type: 'string', required: true, description: 'معرف التحذير' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const warnId = ctx.getString('warn_id');
      if (!member) return ctx.replyError('لم يتم العثور على العضو.');
      const removed = removeWarning(ctx.guild.id, member.id, warnId);
      if (!removed) return ctx.replyError('لم يتم العثور على تحذير مطابق لهذا المعرّف.');
      return ctx.replySuccess(`تم حذف التحذير \`${warnId}\` من العضو **${member.user.tag}**.`);
    },
  },
  {
    name: 'warnings',
    description: 'عرض قائمة تحذيرات العضو',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'العضو' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.replyError('لم يتم العثور على العضو.');
      const warns = getWarnings(ctx.guild.id, member.id);
      if (!warns.length) return ctx.replySuccess(`لا يوجد أي تحذيرات مسجلة على **${member.user.tag}**.`);
      const list = warns.map((w, i) => `**${i + 1}.** \`${w.id}\` — ${w.reason} (بواسطة <@${w.moderatorId}>)`).join('\n');
      const embed = createEmbed(`⚠️ سجل تحذيرات ${member.user.username}`, list, '#FEE75C');
      return ctx.replyEmbed(embed);
    },
  },
  {
    name: 'lock',
    description: 'قفل القناة الحالية أمام الكتابة',
    permission: PermissionFlagsBits.ManageChannels,
    options: [{ name: 'channel', type: 'channel', required: false, description: 'القناة' }],
    execute: async (ctx) => {
      const channel = ctx.getChannel('channel') || ctx.channel;
      await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: false });
      return ctx.replySuccess(`🔒 تم قفل القناة ${channel} بنجاح.`);
    },
  },
  {
    name: 'unlock',
    description: 'فتح القناة الحالية للجميع',
    permission: PermissionFlagsBits.ManageChannels,
    options: [{ name: 'channel', type: 'channel', required: false, description: 'القناة' }],
    execute: async (ctx) => {
      const channel = ctx.getChannel('channel') || ctx.channel;
      await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: true });
      return ctx.replySuccess(`🔓 تم فتح القناة ${channel} بنجاح.`);
    },
  },
  {
    name: 'setnick',
    description: 'تغيير لقب عضو في السيرفر',
    permission: PermissionFlagsBits.ManageNicknames,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'nickname', type: 'string', required: true, consumeRest: true, description: 'اللقب الجديد' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const nickname = ctx.getString('nickname');
      if (!member) return ctx.replyError('لم يتم العثور على العضو.');
      if (!nickname) return ctx.replyError('يرجى تحديد اللقب الجديد.');
      if (!member.manageable) return ctx.replyError('لا يمكنني تغيير لقب هذا العضو بسبب رتبته.');
      await member.setNickname(nickname);
      return ctx.replySuccess(`🏷️ تم تغيير لقب **${member.user.tag}** إلى **${nickname}** بنجاح.`);
    },
  },
  {
    name: 'role',
    description: 'إضافة أو إزالة رتبة من عضو',
    permission: PermissionFlagsBits.ManageRoles,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'role', type: 'role', required: true, description: 'الرتبة' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const role = ctx.getRole('role');
      if (!member) return ctx.replyError('لم يتم العثور على العضو.');
      if (!role) return ctx.replyError('لم يتم العثور على الرتبة المحدد.');
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        return ctx.replySuccess(`تم سحب رتبة **${role.name}** من **${member.user.tag}**.`);
      }
      await member.roles.add(role);
      return ctx.replySuccess(`تم إعطاء رتبة **${role.name}** لـ **${member.user.tag}**.`);
    },
  },
  {
    name: 'slowmode',
    description: 'ضبط الوضع البطيء للقناة',
    permission: PermissionFlagsBits.ManageChannels,
    options: [
      { name: 'seconds', type: 'integer', required: true, description: 'عدد الثواني (0 للإلغاء)' },
      { name: 'channel', type: 'channel', required: false, description: 'القناة' },
    ],
    execute: async (ctx) => {
      const seconds = ctx.getInteger('seconds');
      const channel = ctx.getChannel('channel') || ctx.channel;
      if (seconds === null || seconds < 0 || seconds > 21600) return ctx.replyError('المدة يجب أن تكون بين 0 و 21600 ثانية.');
      await channel.setRateLimitPerUser(seconds);
      return ctx.replySuccess(seconds === 0 ? `تم إيقاف وضع البطيء في ${channel}.` : `🐢 تم ضبط الوضع البطيء إلى **${seconds} ثانية** في ${channel}.`);
    },
  }
];

module.exports = { commands, createEmbed, ensureMutedRole };
