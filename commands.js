const { PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getWarnings, addWarning, removeWarning, getPoints, addPoints } = require('./database');

function ok(description) { return { embeds: [new EmbedBuilder().setColor(0x2ecc71).setDescription(description)] }; }
function fail(description) { return { embeds: [new EmbedBuilder().setColor(0xe74c3c).setDescription(description)] }; }

function resolveChannelMention(guild, raw) {
  const id = raw.replace(/[<#>]/g, '');
  return guild.channels.cache.get(id) || null;
}

function formatUptime(ms) {
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return `${days}ي ${hours}س ${minutes}د ${seconds}ث`;
}

async function ensureMutedRole(guild) {
  let role = guild.roles.cache.find((r) => r.name === 'Muted-Text');
  if (!role) {
    role = await guild.roles.create({ name: 'Muted-Text', color: 'Grey', reason: 'Auto-created mute role' });
    for (const [, channel] of guild.channels.cache) {
      try { await channel.permissionOverwrites.edit(role, { SendMessages: false, AddReactions: false }); } catch {}
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
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2].toLowerCase()];
  return value * mult;
}

function attachHelpCollector(message, ctx, buildEmbed) {
  const collector = message.createMessageComponentCollector({ time: 60000 });
  collector.on('collect', async (i) => {
    if (i.user.id !== ctx.invoker.id) return i.reply({ content: '❌ هذه القائمة ليست لك.', ephemeral: true });
    await i.update({ embeds: [buildEmbed(i.values[0])] });
  });
  collector.on('end', async () => { try { await message.edit({ components: [] }); } catch {} });
}

const commands = [
  {
    name: 'ban', description: 'حظر عضو من السيرفر', permission: PermissionFlagsBits.BanMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو المراد حظره' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'سبب الحظر' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason') || 'لا يوجد سبب';
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      if (!member.bannable) return ctx.reply(fail('❌ لا يمكنني حظر هذا العضو (صلاحيات أعلى مني).'));
      await member.ban({ reason });
      return ctx.reply(ok(`✅ تم حظر **${member.user.tag}**\nالسبب: ${reason}`));
    },
  },
  {
    name: 'unban', description: 'فك حظر عضو عبر الآيدي', permission: PermissionFlagsBits.BanMembers,
    options: [{ name: 'user_id', type: 'string', required: true, description: 'آيدي العضو' }],
    execute: async (ctx) => {
      const id = ctx.getString('user_id');
      if (!id) return ctx.reply(fail('❌ يجب إدخال آيدي العضو.'));
      try {
        await ctx.guild.bans.remove(id, 'فك حظر عبر الأمر');
        return ctx.reply(ok(`✅ تم فك الحظر عن العضو صاحب الآيدي \`${id}\`.`));
      } catch { return ctx.reply(fail('❌ لم يتم العثور على حظر بهذا الآيدي.')); }
    },
  },
  {
    name: 'kick', description: 'طرد عضو من السيرفر', permission: PermissionFlagsBits.KickMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو المراد طرده' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'سبب الطرد' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason') || 'لا يوجد سبب';
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      if (!member.kickable) return ctx.reply(fail('❌ لا يمكنني طرد هذا العضو.'));
      await member.kick(reason);
      return ctx.reply(ok(`✅ تم طرد **${member.user.tag}**\nالسبب: ${reason}`));
    },
  },
  {
    name: 'vkick', description: 'طرد عضو من الروم الصوتي', permission: PermissionFlagsBits.MoveMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'السبب' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      if (!member.voice.channel) return ctx.reply(fail('❌ العضو ليس في روم صوتي.'));
      await member.voice.disconnect('طرد صوتي عبر الأمر');
      return ctx.reply(ok(`✅ تم طرد **${member.user.tag}** من الروم الصوتي.`));
    },
  },
  {
    name: 'timeout', description: 'إسكات مؤقت لعضو (Timeout)', permission: PermissionFlagsBits.ModerateMembers,
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
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      if (!ms || ms <= 0 || ms > 28 * 86400000) return ctx.reply(fail('❌ مدة غير صالحة (الحد الأقصى 28 يوم). مثال: 10m, 2h, 1d'));
      await member.timeout(ms, reason);
      return ctx.reply(ok(`✅ تم إسكات **${member.user.tag}** لمدة ${durationRaw}\nالسبب: ${reason}`));
    },
  },
  {
    name: 'untimeout', description: 'إلغاء الإسكات المؤقت', permission: PermissionFlagsBits.ModerateMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'العضو' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      await member.timeout(null);
      return ctx.reply(ok(`✅ تم إلغاء الإسكات عن **${member.user.tag}**.`));
    },
  },
  {
    name: 'mutetext', description: 'كتم عضو عن الكتابة في جميع الرومات', permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'السبب' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason') || 'لا يوجد سبب';
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      const role = await ensureMutedRole(ctx.guild);
      await member.roles.add(role, reason);
      return ctx.reply(ok(`✅ تم كتم **${member.user.tag}** عن الكتابة.\nالسبب: ${reason}`));
    },
  },
  {
    name: 'unmutetext', description: 'إلغاء كتم الكتابة عن عضو', permission: PermissionFlagsBits.ModerateMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'العضو' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      const role = await ensureMutedRole(ctx.guild);
      await member.roles.remove(role);
      return ctx.reply(ok(`✅ تم إلغاء كتم الكتابة عن **${member.user.tag}**.`));
    },
  },
  {
    name: 'mutevoice', description: 'كتم صوت عضو في الروم الصوتي', permission: PermissionFlagsBits.MuteMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'السبب' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      if (!member.voice.channel) return ctx.reply(fail('❌ العضو ليس في روم صوتي.'));
      await member.voice.setMute(true, ctx.getString('reason') || 'كتم صوتي عبر الأمر');
      return ctx.reply(ok(`✅ تم كتم صوت **${member.user.tag}**.`));
    },
  },
  {
    name: 'unmutevoice', description: 'إلغاء كتم صوت عضو', permission: PermissionFlagsBits.MuteMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'العضو' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      await member.voice.setMute(false, 'إلغاء كتم صوتي عبر الأمر');
      return ctx.reply(ok(`✅ تم إلغاء كتم صوت **${member.user.tag}**.`));
    },
  },
  {
    name: 'warn', description: 'إضافة تحذير لعضو', permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'reason', type: 'string', required: true, consumeRest: true, description: 'سبب التحذير' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason');
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      if (!reason) return ctx.reply(fail('❌ يجب كتابة سبب التحذير.'));
      const warning = addWarning(ctx.guild.id, member.id, reason, ctx.invoker.id);
      return ctx.reply(ok(`⚠️ تم تحذير **${member.user.tag}**\nالسبب: ${reason}\nمعرّف التحذير: \`${warning.id}\``));
    },
  },
  {
    name: 'warn_remove', description: 'حذف تحذير معين من عضو', permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'warn_id', type: 'string', required: true, description: 'معرّف التحذير' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const warnId = ctx.getString('warn_id');
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      const removed = removeWarning(ctx.guild.id, member.id, warnId);
      if (!removed) return ctx.reply(fail('❌ لم يتم العثور على تحذير بهذا المعرّف.'));
      return ctx.reply(ok(`✅ تم حذف التحذير \`${warnId}\` من **${member.user.tag}**.`));
    },
  },
  {
    name: 'warnings', description: 'عرض تحذيرات عضو', permission: PermissionFlagsBits.ModerateMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'العضو' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      const warns = getWarnings(ctx.guild.id, member.id);
      if (!warns.length) return ctx.reply(ok(`✅ لا يوجد تحذيرات لـ **${member.user.tag}**.`));
      const list = warns.map((w, i) => `**${i + 1}.** \`${w.id}\` - ${w.reason} (بواسطة <@${w.moderator_id}>)`).join('\n');
      return ctx.reply({ embeds: [new EmbedBuilder().setColor(0xf1c40f).setTitle(`⚠️ تحذيرات ${member.user.tag}`).setDescription(list)] });
    },
  },
  {
    name: 'clear', description: 'حذف عدد من الرسائل', permission: PermissionFlagsBits.ManageMessages,
    options: [{ name: 'amount', type: 'integer', required: true, description: 'عدد الرسائل (1-100)' }],
    execute: async (ctx) => {
      let amount = ctx.getInteger('amount');
      if (!amount || amount < 1) return ctx.reply(fail('❌ أدخل عدداً صحيحاً بين 1 و100.'));
      if (amount > 100) amount = 100;
      const deleted = await ctx.channel.bulkDelete(amount, true);
      const msg = await ctx.reply(ok(`✅ تم حذف ${deleted.size} رسالة.`));
      if (!ctx.isSlash && msg?.delete) setTimeout(() => msg.delete().catch(() => {}), 4000);
    },
  },
  {
    name: 'setnick', description: 'تغيير اسم عضو', permission: PermissionFlagsBits.ManageNicknames,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'nickname', type: 'string', required: true, consumeRest: true, description: 'الاسم الجديد' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const nickname = ctx.getString('nickname');
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      if (!nickname) return ctx.reply(fail('❌ يجب كتابة الاسم الجديد.'));
      if (!member.manageable) return ctx.reply(fail('❌ لا يمكنني تعديل اسم هذا العضو.'));
      await member.setNickname(nickname);
      return ctx.reply(ok(`✅ تم تغيير اسم **${member.user.tag}** إلى **${nickname}**.`));
    },
  },
  {
    name: 'points', description: 'نظام نقاط الأعضاء (إضافة/خصم/عرض)', permission: PermissionFlagsBits.ManageGuild,
    options: [
      { name: 'action', type: 'string', required: true, description: 'add / remove / show' },
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'amount', type: 'integer', required: false, description: 'عدد النقاط' },
    ],
    execute: async (ctx) => {
      const action = (ctx.getString('action') || '').toLowerCase();
      const member = await ctx.getUserMember('user');
      const amount = ctx.getInteger('amount') || 0;
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      if (action === 'add') return ctx.reply(ok(`✅ تم إضافة ${Math.abs(amount)} نقطة لـ **${member.user.tag}**. الرصيد: ${addPoints(ctx.guild.id, member.id, Math.abs(amount))}`));
      if (action === 'remove') return ctx.reply(ok(`✅ تم خصم ${Math.abs(amount)} نقطة من **${member.user.tag}**. الرصيد: ${addPoints(ctx.guild.id, member.id, -Math.abs(amount))}`));
      if (action === 'show') return ctx.reply(ok(`📊 رصيد **${member.user.tag}**: ${getPoints(ctx.guild.id, member.id)} نقطة.`));
      return ctx.reply(fail('❌ الإجراء غير صالح، استخدم: add / remove / show'));
    },
  },
  {
    name: 'lock', description: 'قفل الروم الحالي', permission: PermissionFlagsBits.ManageChannels,
    options: [{ name: 'channel', type: 'channel', required: false, description: 'الروم (اختياري)' }],
    execute: async (ctx) => {
      const channel = ctx.getChannel('channel') || ctx.channel;
      await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: false });
      return ctx.reply(ok(`🔒 تم قفل الروم ${channel}.`));
    },
  },
  {
    name: 'unlock', description: 'فتح الروم الحالي', permission: PermissionFlagsBits.ManageChannels,
    options: [{ name: 'channel', type: 'channel', required: false, description: 'الروم (اختياري)' }],
    execute: async (ctx) => {
      const channel = ctx.getChannel('channel') || ctx.channel;
      await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: true });
      return ctx.reply(ok(`🔓 تم فتح الروم ${channel}.`));
    },
  },
  {
    name: 'role', description: 'إضافة أو إزالة رتبة من عضو', permission: PermissionFlagsBits.ManageRoles,
    options: [
      { name: 'user', type: 'user', required: true, description: 'العضو' },
      { name: 'role', type: 'role', required: true, description: 'الرتبة' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const role = ctx.getRole('role');
      if (!member) return ctx.reply(fail('❌ لم يتم العثور على العضو.'));
      if (!role) return ctx.reply(fail('❌ لم يتم العثور على الرتبة.'));
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        return ctx.reply(ok(`✅ تم إزالة رتبة **${role.name}** من **${member.user.tag}**.`));
      }
      await member.roles.add(role);
      return ctx.reply(ok(`✅ تم إضافة رتبة **${role.name}** لـ **${member.user.tag}**.`));
    },
  },
  {
    name: 'setcolor', description: 'تغيير لون رتبة', permission: PermissionFlagsBits.ManageRoles,
    options: [
      { name: 'role', type: 'role', required: true, description: 'الرتبة' },
      { name: 'color', type: 'string', required: true, description: 'اللون HEX مثل #ff0000' },
    ],
    execute: async (ctx) => {
      const role = ctx.getRole('role');
      const color = ctx.getString('color');
      if (!role) return ctx.reply(fail('❌ لم يتم العثور على الرتبة.'));
      if (!color || !/^#?[0-9a-fA-F]{6}$/.test(color)) return ctx.reply(fail('❌ صيغة اللون غير صحيحة، استخدم مثل #ff0000'));
      await role.setColor(color.startsWith('#') ? color : `#${color}`);
      return ctx.reply(ok(`🎨 تم تغيير لون رتبة **${role.name}**.`));
    },
  },
  {
    name: 'slowmode', description: 'تحديد وضع البطيء للروم', permission: PermissionFlagsBits.ManageChannels,
    options: [
      { name: 'seconds', type: 'integer', required: true, description: 'عدد الثواني (0 للإيقاف)' },
      { name: 'channel', type: 'channel', required: false, description: 'الروم (اختياري)' },
    ],
    execute: async (ctx) => {
      const seconds = ctx.getInteger('seconds');
      const channel = ctx.getChannel('channel') || ctx.channel;
      if (seconds === null || seconds < 0 || seconds > 21600) return ctx.reply(fail('❌ القيمة يجب أن تكون بين 0 و21600 ثانية.'));
      await channel.setRateLimitPerUser(seconds);
      return ctx.reply(ok(seconds === 0 ? `✅ تم إيقاف وضع البطيء في ${channel}.` : `🐢 تم ضبط وضع البطيء على ${seconds} ثانية في ${channel}.`));
    },
  },
  {
    name: 'embed', description: 'إرسال رسالة Embed مخصصة', permission: PermissionFlagsBits.ManageMessages,
    options: [
      { name: 'title', type: 'string', required: true, description: 'عنوان الرسالة' },
      { name: 'description', type: 'string', required: true, consumeRest: true, description: 'نص الرسالة (استخدم | فقط في وضع الـ Prefix للفصل بين العنوان والنص)' },
      { name: 'color', type: 'string', required: false, description: 'اللون HEX مثل #5865f2' },
      { name: 'channel', type: 'channel', required: false, description: 'الروم (اختياري)' },
    ],
    execute: async (ctx) => {
      let title, description, color, channel;
      if (ctx.isSlash) {
        title = ctx.getString('title');
        description = ctx.getString('description');
        color = ctx.getString('color') || '#5865f2';
        channel = ctx.getChannel('channel') || ctx.channel;
      } else {
        const tokens = [...(ctx.args || [])];
        channel = ctx.channel;
        if (tokens[0] && /^<#\d+>$/.test(tokens[0])) {
          channel = resolveChannelMention(ctx.guild, tokens.shift()) || ctx.channel;
        }
        if (!tokens.length) return ctx.reply(fail('❌ الاستخدام: `-embed [#روم] العنوان | الوصف`'));
        const [t, d] = tokens.join(' ').split('|').map((s) => s?.trim());
        title = t || '📢 إعلان';
        description = d || t;
        color = '#5865f2';
      }
      if (!/^#?[0-9a-fA-F]{6}$/.test(color)) return ctx.reply(fail('❌ صيغة اللون غير صحيحة.'));
      if (!color.startsWith('#')) color = `#${color}`;
      await channel.send({ embeds: [new EmbedBuilder().setTitle(title).setDescription(description).setColor(color)] });
      return ctx.reply(ok(`✅ تم إرسال الـ Embed إلى ${channel}.`));
    },
  },
  {
    name: 'say', description: 'إرسال رسالة نصية بواسطة البوت', permission: PermissionFlagsBits.ManageMessages,
    options: [
      { name: 'message', type: 'string', required: true, consumeRest: true, description: 'نص الرسالة' },
      { name: 'channel', type: 'channel', required: false, description: 'الروم (اختياري)' },
    ],
    execute: async (ctx) => {
      let message, channel;
      if (ctx.isSlash) {
        message = ctx.getString('message');
        channel = ctx.getChannel('channel') || ctx.channel;
      } else {
        const tokens = [...(ctx.args || [])];
        channel = ctx.channel;
        if (tokens[0] && /^<#\d+>$/.test(tokens[0])) {
          channel = resolveChannelMention(ctx.guild, tokens.shift()) || ctx.channel;
        }
        message = tokens.join(' ');
      }
      if (!message) return ctx.reply(fail('❌ يجب كتابة نص الرسالة.'));
      await channel.send({ content: message });
      return ctx.reply(ok(`✅ تم إرسال الرسالة إلى ${channel}.`));
    },
  },
  {
    name: 'botinfo', description: 'عرض معلومات البوت وحالته', options: [],
    execute: async (ctx) => {
      const client = ctx.raw.client;
      const embed = new EmbedBuilder()
        .setTitle('🤖 معلومات البوت - OS System Engine')
        .setColor(0x5865f2)
        .addFields(
          { name: 'عدد السيرفرات', value: `${client.guilds.cache.size}`, inline: true },
          { name: 'عدد المستخدمين', value: `${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`, inline: true },
          { name: 'زمن الاستجابة', value: `${client.ws.ping}ms`, inline: true },
          { name: 'وقت التشغيل', value: formatUptime(client.uptime), inline: true },
        )
        .setTimestamp();
      return ctx.reply({ embeds: [embed] });
    },
  },
  {
    name: 'help', description: 'عرض قائمة المساعدة التفاعلية', options: [],
    execute: async (ctx) => {
      const categories = {
        moderation: { label: '🛡️ الإدارة', desc: '`ban` `unban` `kick` `vkick` `timeout` `untimeout` `mutetext` `unmutetext` `mutevoice` `unmutevoice` `warn` `warn_remove` `warnings` `clear`' },
        channels: { label: '📂 الرومات والرتب', desc: '`lock` `unlock` `role` `setcolor` `slowmode` `setnick` `points`' },
        utility: { label: '🧰 أدوات عامة', desc: '`embed` `say` `botinfo` `help`' },
      };
      const buildEmbed = (key) => new EmbedBuilder().setTitle(`📖 قائمة الأوامر - ${categories[key].label}`).setDescription(categories[key].desc).setColor(0x5865f2);
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('help_menu').setPlaceholder('اختر قسم الأوامر').addOptions(
          { label: 'الإدارة', value: 'moderation', emoji: '🛡️' },
          { label: 'الرومات والرتب', value: 'channels', emoji: '📂' },
          { label: 'أدوات عامة', value: 'utility', emoji: '🧰' },
        )
      );
      if (ctx.isSlash) {
        await ctx.raw.reply({ embeds: [buildEmbed('moderation')], components: [row] });
        const message = await ctx.raw.fetchReply();
        attachHelpCollector(message, ctx, buildEmbed);
      } else {
        const message = await ctx.raw.reply({ embeds: [buildEmbed('moderation')], components: [row] });
        attachHelpCollector(message, ctx, buildEmbed);
      }
    },
  },
];

module.exports = { commands };
