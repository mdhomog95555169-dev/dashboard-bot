const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getWarnings, addWarning, removeWarning } = require('./data');

function createEmbed(title, description, color = '#5865F2') {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: 'OS System Engine' })
    .setTimestamp();
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
        .setDescription('مرحباً بك في لوحة تحكم OS.\nيمكنك استخدام الأوامر عبر البادئة `-` أو عبر `/` الـ Slash Commands:')
        .addFields(
          { name: '🛡️ الإدارة والحظر', value: '`/ban [user] [reason]`\n`/unban [user_id]`\n`/kick [user] [reason]`', inline: true },
          { name: '⏱️ العقوبات والميوت', value: '`/timeout [user] [duration] [reason]`\n`/untimeout [user]`', inline: true },
          { name: '🧹 التنظيم والرتب', value: '`/clear [amount]`\n`/lock` | `/unlock`\n`/role [user] [role]`\n`/setnick [user] [nickname]`', inline: false },
          { name: '⚠️ التحذيرات', value: '`/warn [user] [reason]`\n`/warn_remove [user] [warn_id]`\n`/warnings [user]`', inline: false }
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
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'سبب الحظر' }
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason') || 'لا يوجد سبب محدد';
      if (!member) return ctx.replyError('لم يتم العثور على هذا العضو.');
      if (!member.bannable) return ctx.replyError('لا يمكن حظر هذا العضو بسبب صلاحياته أو رتبته.');
      await member.ban({ reason });
      return ctx.replySuccess(`تم حظر **${member.user.tag}** بنجاح.`, [{ name: 'السبب', value: reason, inline: true }]);
    }
  },
  {
    name: 'unban',
    description: 'فك الحظر عن عضو بـ ID',
    permission: PermissionFlagsBits.BanMembers,
    options: [{ name: 'user_id', type: 'string', required: true, description: 'معرف الحساب (ID)' }],
    execute: async (ctx) => {
      const id = ctx.getString('user_id');
      if (!id) return ctx.replyError('يرجى كتابة الآيدي الخاص بالمستخدم.');
      try {
        await ctx.guild.bans.remove(id);
        return ctx.replySuccess(`تم فك الحظر عن الحساب صاحب الآيدي \`${id}\`.`);
      } catch {
        return ctx.replyError('لم يتم العثور على حظر بهذا الرقم.');
      }
    }
  },
  {
    name: 'kick',
    description: 'طرد عضو من السيرفر',
    permission: PermissionFlagsBits.KickMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو المراد طرده' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'السبب' }
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason') || 'لا يوجد سبب محدد';
      if (!member) return ctx.replyError('لم يتم العثور على العضو.');
      if (!member.kickable) return ctx.replyError('لا يمكن طرد هذا العضو.');
      await member.kick(reason);
      return ctx.replySuccess(`تم طرد **${member.user.tag}** من السيرفر.`, [{ name: 'السبب', value: reason, inline: true }]);
    }
  },
  {
    name: 'clear',
    description: 'حذف عدد محدد من الرسائل',
    permission: PermissionFlagsBits.ManageMessages,
    options: [{ name: 'amount', type: 'integer', required: true, description: 'عدد الرسائل (1-100)' }],
    execute: async (ctx) => {
      const amount = ctx.getInteger('amount');
      if (!amount || amount < 1 || amount > 100) return ctx.replyError('يرجى تحديد عدد بين 1 و 100.');
      const deleted = await ctx.channel.bulkDelete(amount, true);
      const resEmbed = createEmbed('🧹 مسح الرسائل', `تم مسح **${deleted.size}** رسالة بنجاح.`);
      const msg = await ctx.replyEmbed(resEmbed);
      if (!ctx.isSlash && msg && msg.delete) setTimeout(() => msg.delete().catch(() => {}), 4000);
    }
  },
  {
    name: 'timeout',
    description: 'إسكات عضو مؤقتاً',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'duration', type: 'string', required: true, description: 'المدة (مثال: 10m, 1h, 1d)' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'السبب' }
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const durationRaw = ctx.getString('duration');
      const reason = ctx.getString('reason') || 'بدون سبب';
      const ms = parseDuration(durationRaw);
      if (!member) return ctx.replyError('لم يتم العثور على العضو.');
      if (!ms) return ctx.replyError('صيغة الوقت غير صحيحة. مثال: `10m`, `2h`, `1d`.');
      await member.timeout(ms, reason);
      return ctx.replySuccess(`تم إعطاء تايم أوت لـ **${member.user.tag}** لمدة \`${durationRaw}\`.`);
    }
  },
  {
    name: 'untimeout',
    description: 'إلغاء التايم أوت',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'العضو' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.replyError('لم يتم العثور على العضو.');
      await member.timeout(null);
      return ctx.replySuccess(`تم فك التايم أوت عن **${member.user.tag}**.`);
    }
  },
  {
    name: 'lock',
    description: 'قفل القناة الحالية',
    permission: PermissionFlagsBits.ManageChannels,
    execute: async (ctx) => {
      await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: false });
      return ctx.replySuccess(`🔒 تم قفل القناة ${ctx.channel} بنجاح.`);
    }
  },
  {
    name: 'unlock',
    description: 'فتح القناة الحالية',
    permission: PermissionFlagsBits.ManageChannels,
    execute: async (ctx) => {
      await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: true });
      return ctx.replySuccess(`🔓 تم فتح القناة ${ctx.channel} بنجاح.`);
    }
  },
  {
    name: 'setnick',
    description: 'تغيير لقب عضو',
    permission: PermissionFlagsBits.ManageNicknames,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'nickname', type: 'string', required: true, consumeRest: true, description: 'اللقب الجديد' }
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const nick = ctx.getString('nickname');
      if (!member || !nick) return ctx.replyError('يرجى تحديد العضو واللقب الجديد.');
      await member.setNickname(nick);
      return ctx.replySuccess(`🏷️ تم تغيير لقب **${member.user.tag}** إلى **${nick}**.`);
    }
  }
];

module.exports = { commands, createEmbed };
