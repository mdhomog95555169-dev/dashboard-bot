const { PermissionFlagsBits } = require('discord.js');
const { getWarnings, addWarning, removeWarning, getPoints, addPoints } = require('./data');

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
    name: 'ban',
    description: 'حظر عضو من السيرفر',
    permission: PermissionFlagsBits.BanMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو المراد حظره' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'سبب الحظر' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason') || 'لا يوجد سبب';
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      if (!member.bannable) return ctx.reply('❌ لا يمكنني حظر هذا العضو (صلاحيات أعلى مني).');
      await member.ban({ reason });
      return ctx.reply(`✅ تم حظر **${member.user.tag}**\nالسبب: ${reason}`);
    },
  },
  {
    name: 'unban',
    description: 'فك حظر عضو عبر الآيدي',
    permission: PermissionFlagsBits.BanMembers,
    options: [{ name: 'user_id', type: 'string', required: true, description: 'آيدي العضو' }],
    execute: async (ctx) => {
      const id = ctx.getString('user_id');
      if (!id) return ctx.reply('❌ يجب إدخال آيدي العضو.');
      try {
        await ctx.guild.bans.remove(id, 'فك حظر عبر الأمر');
        return ctx.reply(`✅ تم فك الحظر عن العضو صاحب الآيدي \`${id}\`.`);
      } catch {
        return ctx.reply('❌ لم يتم العثور على حظر بهذا الآيدي.');
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
      const reason = ctx.getString('reason') || 'لا يوجد سبب';
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      if (!member.kickable) return ctx.reply('❌ لا يمكنني طرد هذا العضو.');
      await member.kick(reason);
      return ctx.reply(`✅ تم طرد **${member.user.tag}**\nالسبب: ${reason}`);
    },
  },
  {
    name: 'vkick',
    description: 'طرد عضو من الروم الصوتي',
    permission: PermissionFlagsBits.MoveMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'العضو' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      if (!member.voice.channel) return ctx.reply('❌ العضو ليس في روم صوتي.');
      await member.voice.disconnect('طرد صوتي عبر الأمر');
      return ctx.reply(`✅ تم طرد **${member.user.tag}** من الروم الصوتي.`);
    },
  },
  {
    name: 'timeout',
    description: 'إسكات مؤقت لعضو (Timeout)',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'duration', type: 'string', required: true, description: 'المدة مثل 10m أو 2h أو 1d' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'السبب' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const durationRaw = ctx.getString('duration');
      const reason = ctx.getString('reason') || 'لا يوجد سبب';
      const ms = parseDuration(durationRaw);
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      if (!ms || ms <= 0 || ms > 28 * 86400000) return ctx.reply('❌ مدة غير صالحة (الحد الأقصى 28 يوم). مثال: 10m, 2h, 1d');
      await member.timeout(ms, reason);
      return ctx.reply(`✅ تم إسكات **${member.user.tag}** لمدة ${durationRaw}\nالسبب: ${reason}`);
    },
  },
  {
    name: 'untimeout',
    description: 'إلغاء الإسكات المؤقت',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'العضو' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      await member.timeout(null);
      return ctx.reply(`✅ تم إلغاء الإسكات عن **${member.user.tag}**.`);
    },
  },
  {
    name: 'mutetext',
    description: 'كتم عضو عن الكتابة في جميع الرومات',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'السبب' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason') || 'لا يوجد سبب';
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      const role = await ensureMutedRole(ctx.guild);
      await member.roles.add(role, reason);
      return ctx.reply(`✅ تم كتم **${member.user.tag}** عن الكتابة.\nالسبب: ${reason}`);
    },
  },
  {
    name: 'unmutetext',
    description: 'إلغاء كتم الكتابة عن عضو',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'العضو' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      const role = await ensureMutedRole(ctx.guild);
      await member.roles.remove(role);
      return ctx.reply(`✅ تم إلغاء كتم الكتابة عن **${member.user.tag}**.`);
    },
  },
  {
    name: 'mutevoice',
    description: 'كتم صوت عضو في الروم الصوتي',
    permission: PermissionFlagsBits.MuteMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'العضو' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      if (!member.voice.channel) return ctx.reply('❌ العضو ليس في روم صوتي.');
      await member.voice.setMute(true, 'كتم صوتي عبر الأمر');
      return ctx.reply(`✅ تم كتم صوت **${member.user.tag}**.`);
    },
  },
  {
    name: 'unmutevoice',
    description: 'إلغاء كتم صوت عضو',
    permission: PermissionFlagsBits.MuteMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'العضو' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      await member.voice.setMute(false, 'إلغاء كتم صوتي عبر الأمر');
      return ctx.reply(`✅ تم إلغاء كتم صوت **${member.user.tag}**.`);
    },
  },
  {
    name: 'warn',
    description: 'إضافة تحذير لعضو',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'reason', type: 'string', required: true, consumeRest: true, description: 'سبب التحذير' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason');
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      if (!reason) return ctx.reply('❌ يجب كتابة سبب التحذير.');
      const warning = addWarning(ctx.guild.id, member.id, reason, ctx.invoker.id);
      return ctx.reply(`⚠️ تم تحذير **${member.user.tag}**\nالسبب: ${reason}\nمعرّف التحذير: \`${warning.id}\``);
    },
  },
  {
    name: 'warn_remove',
    description: 'حذف تحذير معين من عضو',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'warn_id', type: 'string', required: true, description: 'معرّف التحذير' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const warnId = ctx.getString('warn_id');
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      const removed = removeWarning(ctx.guild.id, member.id, warnId);
      if (!removed) return ctx.reply('❌ لم يتم العثور على تحذير بهذا المعرّف.');
      return ctx.reply(`✅ تم حذف التحذير \`${warnId}\` من **${member.user.tag}**.`);
    },
  },
  {
    name: 'warnings',
    description: 'عرض تحذيرات عضو',
    permission: PermissionFlagsBits.ModerateMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'العضو' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      const warns = getWarnings(ctx.guild.id, member.id);
      if (!warns.length) return ctx.reply(`✅ لا يوجد تحذيرات لـ **${member.user.tag}**.`);
      const list = warns.map((w, i) => `**${i + 1}.** \`${w.id}\` - ${w.reason} (بواسطة <@${w.moderatorId}>)`).join('\n');
      return ctx.reply(`⚠️ تحذيرات **${member.user.tag}** (${warns.length}):\n${list}`);
    },
  },
  {
    name: 'clear',
    description: 'حذف عدد من الرسائل',
    permission: PermissionFlagsBits.ManageMessages,
    options: [{ name: 'amount', type: 'integer', required: true, description: 'عدد الرسائل (1-100)' }],
    execute: async (ctx) => {
      let amount = ctx.getInteger('amount');
      if (!amount || amount < 1) return ctx.reply('❌ أدخل عدداً صحيحاً بين 1 و100.');
      if (amount > 100) amount = 100;
      const deleted = await ctx.channel.bulkDelete(amount, true);
      const msg = await ctx.reply(`✅ تم حذف ${deleted.size} رسالة.`);
      if (!ctx.isSlash && msg && msg.delete) setTimeout(() => msg.delete().catch(() => {}), 4000);
    },
  },
  {
    name: 'setnick',
    description: 'تغيير اسم عضو',
    permission: PermissionFlagsBits.ManageNicknames,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'nickname', type: 'string', required: true, consumeRest: true, description: 'الاسم الجديد' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const nickname = ctx.getString('nickname');
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      if (!nickname) return ctx.reply('❌ يجب كتابة الاسم الجديد.');
      if (!member.manageable) return ctx.reply('❌ لا يمكنني تعديل اسم هذا العضو.');
      await member.setNickname(nickname);
      return ctx.reply(`✅ تم تغيير اسم **${member.user.tag}** إلى **${nickname}**.`);
    },
  },
  {
    name: 'points',
    description: 'نظام نقاط الأعضاء (إضافة/خصم/عرض)',
    permission: PermissionFlagsBits.ManageGuild,
    options: [
      { name: 'action', type: 'string', required: true, description: 'add / remove / show' },
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'amount', type: 'integer', required: false, description: 'عدد النقاط' },
    ],
    execute: async (ctx) => {
      const action = (ctx.getString('action') || '').toLowerCase();
      const member = await ctx.getUserMember('user');
      const amount = ctx.getInteger('amount') || 0;
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      if (action === 'add') {
        const total = addPoints(ctx.guild.id, member.id, Math.abs(amount));
        return ctx.reply(`✅ تم إضافة ${Math.abs(amount)} نقطة لـ **${member.user.tag}**. الرصيد الحالي: ${total}`);
      }
      if (action === 'remove') {
        const total = addPoints(ctx.guild.id, member.id, -Math.abs(amount));
        return ctx.reply(`✅ تم خصم ${Math.abs(amount)} نقطة من **${member.user.tag}**. الرصيد الحالي: ${total}`);
      }
      if (action === 'show') {
        const total = getPoints(ctx.guild.id, member.id);
        return ctx.reply(`📊 رصيد **${member.user.tag}**: ${total} نقطة.`);
      }
      return ctx.reply('❌ الإجراء غير صالح، استخدم: add / remove / show');
    },
  },
  {
    name: 'lock',
    description: 'قفل الروم الحالي',
    permission: PermissionFlagsBits.ManageChannels,
    options: [{ name: 'channel', type: 'channel', required: false, description: 'الروم (اختياري)' }],
    execute: async (ctx) => {
      const channel = ctx.getChannel('channel') || ctx.channel;
      await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: false });
      return ctx.reply(`🔒 تم قفل الروم ${channel}.`);
    },
  },
  {
    name: 'unlock',
    description: 'فتح الروم الحالي',
    permission: PermissionFlagsBits.ManageChannels,
    options: [{ name: 'channel', type: 'channel', required: false, description: 'الروم (اختياري)' }],
    execute: async (ctx) => {
      const channel = ctx.getChannel('channel') || ctx.channel;
      await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: true });
      return ctx.reply(`🔓 تم فتح الروم ${channel}.`);
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
      if (!member) return ctx.reply('❌ لم يتم العثور على العضو.');
      if (!role) return ctx.reply('❌ لم يتم العثور على الرتبة.');
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        return ctx.reply(`✅ تم إزالة رتبة **${role.name}** من **${member.user.tag}**.`);
      }
      await member.roles.add(role);
      return ctx.reply(`✅ تم إضافة رتبة **${role.name}** لـ **${member.user.tag}**.`);
    },
  },
  {
    name: 'setcolor',
    description: 'تغيير لون رتبة',
    permission: PermissionFlagsBits.ManageRoles,
    options: [
      { name: 'role', type: 'role', required: true, description: 'الرتبة' },
      { name: 'color', type: 'string', required: true, description: 'اللون بصيغة HEX مثل #ff0000' },
    ],
    execute: async (ctx) => {
      const role = ctx.getRole('role');
      const color = ctx.getString('color');
      if (!role) return ctx.reply('❌ لم يتم العثور على الرتبة.');
      if (!color || !/^#?[0-9a-fA-F]{6}$/.test(color)) return ctx.reply('❌ صيغة اللون غير صحيحة، استخدم مثل #ff0000');
      await role.setColor(color.startsWith('#') ? color : `#${color}`);
      return ctx.reply(`🎨 تم تغيير لون رتبة **${role.name}**.`);
    },
  },
  {
    name: 'slowmode',
    description: 'تحديد وضع البطيء للروم',
    permission: PermissionFlagsBits.ManageChannels,
    options: [
      { name: 'seconds', type: 'integer', required: true, description: 'عدد الثواني (0 للإيقاف)' },
      { name: 'channel', type: 'channel', required: false, description: 'الروم (اختياري)' },
    ],
    execute: async (ctx) => {
      const seconds = ctx.getInteger('seconds');
      const channel = ctx.getChannel('channel') || ctx.channel;
      if (seconds === null || seconds < 0 || seconds > 21600) return ctx.reply('❌ القيمة يجب أن تكون بين 0 و21600 ثانية.');
      await channel.setRateLimitPerUser(seconds);
      return ctx.reply(seconds === 0 ? `✅ تم إيقاف وضع البطيء في ${channel}.` : `🐢 تم ضبط وضع البطيء على ${seconds} ثانية في ${channel}.`);
    },
  },
];

module.exports = { commands, ensureMutedRole };
