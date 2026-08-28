const { PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getWarnings, addWarning, removeWarning, getPoints, addPoints } = require('./database');

// ProBot-style plain text replies — no embeds in direct commands.
function ok(text) { return { content: text }; }
function fail(text) { return { content: text }; }

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
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
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

// جدول حظر مؤقت في الذاكرة فقط - لا تنجو من إعادة تشغيل البوت (redeploy)
const tempBanTimers = new Map();
function scheduleTempUnban(guild, userId, ms) {
  const key = `${guild.id}-${userId}`;
  if (tempBanTimers.has(key)) clearTimeout(tempBanTimers.get(key));
  const timer = setTimeout(async () => {
    try { await guild.bans.remove(userId, 'Temporary ban expired'); } catch {}
    tempBanTimers.delete(key);
  }, ms);
  tempBanTimers.set(key, timer);
}

function attachHelpCollector(message, ctx, buildEmbed) {
  const collector = message.createMessageComponentCollector({ time: 60000 });
  collector.on('collect', async (i) => {
    if (i.user.id !== ctx.invoker.id) return i.reply({ content: '❌ This menu is not for you.', ephemeral: true });
    await i.update({ embeds: [buildEmbed(i.values[0])] });
  });
  collector.on('end', async () => { try { await message.edit({ components: [] }); } catch {} });
}

// ---------------- /help content (exact spec) ----------------
const HELP_CATEGORIES = {
  moderation: {
    label: 'Moderation',
    emoji: '🛡️',
    description:
      '**Welcome to OS Control Center.**\n**Select a category from the menu below.**\n\n' +
      '✈️ `/ban`\nBan a member from the server\n\n' +
      '🔓 `/unban`\nUnban a member by ID\n\n' +
      '👢 `/kick`\nKick a member from the server\n\n' +
      '🔊 `/vkick`\nKick a member from voice channel\n\n' +
      '⏱️ `/timeout`\nTimeout a member\n\n' +
      '🔄 `/untimeout`\nRemove timeout from a member\n\n' +
      '🔇 `/mutetext`\nMute text for a member\n\n' +
      '🔊 `/unmutetext`\nUnmute text for a member\n\n' +
      '🔇 `/mutevoice`\nMute voice for a member\n\n' +
      '🔊 `/unmutevoice`\nUnmute voice for a member\n\n' +
      '⚠️ `/warn`\nWarn a member\n\n' +
      '🗑️ `/warn_remove`\nRemove a warning from a member\n\n' +
      '📋 `/warnings`\nView warnings of a member\n\n' +
      '🧹 `/clear`\nClear a specified number of messages',
  },
  channels: {
    label: 'Channels & Roles',
    emoji: '📂',
    description:
      '**Welcome to OS Control Center.**\n**Select a category from the menu below.**\n\n' +
      '🔒 `/lock`\nLock the current channel\n\n' +
      '🔓 `/unlock`\nUnlock the current channel\n\n' +
      '🎭 `/role`\nAdd or remove a role\n\n' +
      '🎨 `/setcolor`\nChange a role color\n\n' +
      '🐢 `/slowmode`\nSet channel slowmode\n\n' +
      '🏷️ `/setnick`\nChange a user\'s nickname\n\n' +
      '📊 `/points`\nUser points system',
  },
  utility: {
    label: 'Utility',
    emoji: '🧰',
    description:
      '**Welcome to OS Control Center.**\n**Select a category from the menu below.**\n\n' +
      '📢 `/embed`\nSend a custom embed\n\n' +
      '💬 `/say`\nMake the bot say a message\n\n' +
      '🤖 `/botinfo`\nBot information & stats\n\n' +
      '⚙️ `/help`\nDisplay the help menu',
  },
};

function buildHelpEmbed(key, botAvatarUrl) {
  const cat = HELP_CATEGORIES[key];
  const embed = new EmbedBuilder()
    .setTitle('⚡ OS System — Control Center')
    .setDescription(cat.description)
    .setColor(0x5865f2)
    .setFooter({ text: 'OS System Engine' });
  if (botAvatarUrl) embed.setThumbnail(botAvatarUrl);
  return embed;
}

const commands = [
  {
    name: 'ban', description: 'Ban a member from the server', permission: PermissionFlagsBits.BanMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'The member to ban' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'Reason for the ban' },
      { name: 'bulk', type: 'integer', required: false, description: 'Delete messages from the last X days (0-7)' },
      { name: 'time', type: 'string', required: false, description: 'Temporary ban duration, e.g. 1d, 12h (leave empty for permanent)' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason') || 'No reason provided';
      let bulk = ctx.getInteger('bulk') || 0;
      const time = ctx.getString('time');
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      if (!member.bannable) return ctx.reply(fail('❌ I cannot ban this member (higher role than mine).'));
      if (bulk < 0) bulk = 0;
      if (bulk > 7) bulk = 7;
      const ms = time ? parseDuration(time) : null;
      if (time && (!ms || ms <= 0)) return ctx.reply(fail('❌ Invalid duration. Example: 1d, 12h, 30m'));
      await member.ban({ reason, deleteMessageSeconds: bulk * 86400 });
      if (ms) scheduleTempUnban(ctx.guild, member.id, ms);
      const suffix = ms ? ` for **${time}**` : '';
      return ctx.reply(ok(`🔨 **${member.user.tag}** has been banned${suffix}!\n📝 Reason: ${reason}`));
    },
  },
  {
    name: 'unban', description: 'Unban a user by ID', permission: PermissionFlagsBits.BanMembers,
    options: [{ name: 'user_id', type: 'string', required: true, description: 'The ID of the user to unban' }],
    execute: async (ctx) => {
      const id = ctx.getString('user_id');
      if (!id) return ctx.reply(fail('❌ You must provide a user ID.'));
      try {
        await ctx.guild.bans.remove(id, 'Unbanned via command');
        return ctx.reply(ok(`✅ User \`${id}\` has been unbanned!`));
      } catch { return ctx.reply(fail('❌ No ban found for this ID.')); }
    },
  },
  {
    name: 'kick', description: 'Kick a member from the server', permission: PermissionFlagsBits.KickMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'The member to kick' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'Reason for the kick' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason') || 'No reason provided';
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      if (!member.kickable) return ctx.reply(fail('❌ I cannot kick this member.'));
      await member.kick(reason);
      return ctx.reply(ok(`👢 **${member.user.tag}** has been kicked!\n📝 Reason: ${reason}`));
    },
  },
  {
    name: 'vkick', description: 'Disconnect a member from their voice channel', permission: PermissionFlagsBits.MoveMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'The member to disconnect' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'Reason' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      if (!member.voice.channel) return ctx.reply(fail('❌ Member is not in a voice channel.'));
      await member.voice.disconnect(ctx.getString('reason') || 'Voice kick via command');
      return ctx.reply(ok(`🔊 **${member.user.tag}** has been kicked from the voice channel!`));
    },
  },
  {
    name: 'timeout', description: 'Timeout a member', permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'The member to timeout' },
      { name: 'duration', type: 'string', required: true, description: 'Duration, e.g. 10m, 2h, 1d' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'Reason' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const durationRaw = ctx.getString('duration');
      const reason = ctx.getString('reason') || 'No reason provided';
      const ms = parseDuration(durationRaw);
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      if (!ms || ms <= 0 || ms > 28 * 86400000) return ctx.reply(fail('❌ Invalid duration (max 28 days). Example: 10m, 2h, 1d'));
      await member.timeout(ms, reason);
      return ctx.reply(ok(`⏱️ **${member.user.tag}** has been timed out for **${durationRaw}**!\n📝 Reason: ${reason}`));
    },
  },
  {
    name: 'untimeout', description: 'Remove a timeout from a member', permission: PermissionFlagsBits.ModerateMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'The member' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      await member.timeout(null);
      return ctx.reply(ok(`✅ **${member.user.tag}**'s timeout has been removed!`));
    },
  },
  {
    name: 'mutetext', description: 'Mute a member from all text channels', permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'The member' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'Reason' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason') || 'No reason provided';
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      const role = await ensureMutedRole(ctx.guild);
      await member.roles.add(role, reason);
      return ctx.reply(ok(`🔇 **${member.user.tag}** has been muted from text!\n📝 Reason: ${reason}`));
    },
  },
  {
    name: 'unmutetext', description: 'Unmute a member from text channels', permission: PermissionFlagsBits.ModerateMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'The member' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      const role = await ensureMutedRole(ctx.guild);
      await member.roles.remove(role);
      return ctx.reply(ok(`🔊 **${member.user.tag}** has been unmuted from text!`));
    },
  },
  {
    name: 'mutevoice', description: 'Server-mute a member in voice', permission: PermissionFlagsBits.MuteMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'The member' },
      { name: 'reason', type: 'string', required: false, consumeRest: true, description: 'Reason' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      if (!member.voice.channel) return ctx.reply(fail('❌ Member is not in a voice channel.'));
      await member.voice.setMute(true, ctx.getString('reason') || 'Voice mute via command');
      return ctx.reply(ok(`🔇 **${member.user.tag}** has been muted from voice!`));
    },
  },
  {
    name: 'unmutevoice', description: 'Remove voice mute from a member', permission: PermissionFlagsBits.MuteMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'The member' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      await member.voice.setMute(false, 'Voice unmute via command');
      return ctx.reply(ok(`🔊 **${member.user.tag}** has been unmuted from voice!`));
    },
  },
  {
    name: 'warn', description: 'Warn a member', permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'The member' },
      { name: 'reason', type: 'string', required: true, consumeRest: true, description: 'Reason for the warning' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const reason = ctx.getString('reason');
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      if (!reason) return ctx.reply(fail('❌ You must provide a reason.'));
      const warning = await addWarning(ctx.guild.id, member.id, reason, ctx.invoker.id);
      return ctx.reply(ok(`⚠️ **${member.user.tag}** has been warned!\n📝 Reason: ${reason}\n🆔 Warn ID: \`${warning.id}\``));
    },
  },
  {
    name: 'warn_remove', description: 'Remove a specific warning', permission: PermissionFlagsBits.ModerateMembers,
    options: [
      { name: 'user', type: 'user', required: true, description: 'The member' },
      { name: 'warn_id', type: 'string', required: true, description: 'The warning ID' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const warnId = ctx.getString('warn_id');
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      const removed = await removeWarning(ctx.guild.id, member.id, warnId);
      if (!removed) return ctx.reply(fail('❌ No warning found with this ID.'));
      return ctx.reply(ok(`✅ Warning \`${warnId}\` has been removed from **${member.user.tag}**!`));
    },
  },
  {
    name: 'warnings', description: 'View a member\'s warning history', permission: PermissionFlagsBits.ModerateMembers,
    options: [{ name: 'user', type: 'user', required: true, description: 'The member' }],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      const warns = await getWarnings(ctx.guild.id, member.id);
      if (!warns.length) return ctx.reply(ok(`✅ **${member.user.tag}** has no warnings.`));
      const list = warns.map((w, i) => `**${i + 1}.** \`${w.id}\` - ${w.reason} (by <@${w.moderatorId}>)`).join('\n');
      return ctx.reply(ok(`⚠️ Warnings — ${member.user.tag}\n${list}`));
    },
  },
  {
    name: 'clear', description: 'Bulk delete messages (1-100)', permission: PermissionFlagsBits.ManageMessages,
    options: [{ name: 'amount', type: 'integer', required: true, description: 'Number of messages to delete (1-100)' }],
    execute: async (ctx) => {
      let amount = ctx.getInteger('amount');
      if (!amount || amount < 1) return ctx.reply(fail('❌ Enter a number between 1 and 100.'));
      if (amount > 100) amount = 100;
      const deleted = await ctx.channel.bulkDelete(amount, true);
      const msg = await ctx.reply(ok(`🧹 Cleared **${deleted.size}** messages!`));
      if (!ctx.isSlash && msg?.delete) setTimeout(() => msg.delete().catch(() => {}), 4000);
    },
  },
  {
    name: 'setnick', description: 'Change a member\'s nickname', permission: PermissionFlagsBits.ManageNicknames,
    options: [
      { name: 'user', type: 'user', required: true, description: 'The member' },
      { name: 'nickname', type: 'string', required: true, consumeRest: true, description: 'New nickname' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const nickname = ctx.getString('nickname');
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      if (!nickname) return ctx.reply(fail('❌ You must provide a nickname.'));
      if (!member.manageable) return ctx.reply(fail('❌ I cannot edit this member\'s nickname.'));
      await member.setNickname(nickname);
      return ctx.reply(ok(`📝 **${member.user.tag}**'s nickname has been changed to **${nickname}**!`));
    },
  },
  {
    name: 'points', description: 'Manage member points', permission: PermissionFlagsBits.ManageGuild,
    options: [
      { name: 'action', type: 'string', required: true, description: 'add / remove / show' },
      { name: 'user', type: 'user', required: true, description: 'The member' },
      { name: 'amount', type: 'integer', required: false, description: 'Points amount' },
    ],
    execute: async (ctx) => {
      const action = (ctx.getString('action') || '').toLowerCase();
      const member = await ctx.getUserMember('user');
      const amount = ctx.getInteger('amount') || 0;
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      if (action === 'add') {
        const balance = await addPoints(ctx.guild.id, member.id, Math.abs(amount));
        return ctx.reply(ok(`✅ Added **${Math.abs(amount)}** points to **${member.user.tag}**! Balance: ${balance}`));
      }
      if (action === 'remove') {
        const balance = await addPoints(ctx.guild.id, member.id, -Math.abs(amount));
        return ctx.reply(ok(`✅ Removed **${Math.abs(amount)}** points from **${member.user.tag}**! Balance: ${balance}`));
      }
      if (action === 'show') {
        const balance = await getPoints(ctx.guild.id, member.id);
        return ctx.reply(ok(`📊 **${member.user.tag}**'s balance: **${balance}** points.`));
      }
      return ctx.reply(fail('❌ Invalid action, use: add / remove / show'));
    },
  },
  {
    name: 'lock', description: 'Lock a channel', permission: PermissionFlagsBits.ManageChannels,
    options: [{ name: 'channel', type: 'channel', required: false, description: 'The channel (optional)' }],
    execute: async (ctx) => {
      const channel = ctx.getChannel('channel') || ctx.channel;
      await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: false });
      return ctx.reply(ok(`🔒 **#${channel.name}** has been locked!`));
    },
  },
  {
    name: 'unlock', description: 'Unlock a channel', permission: PermissionFlagsBits.ManageChannels,
    options: [{ name: 'channel', type: 'channel', required: false, description: 'The channel (optional)' }],
    execute: async (ctx) => {
      const channel = ctx.getChannel('channel') || ctx.channel;
      await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: true });
      return ctx.reply(ok(`🔓 **#${channel.name}** has been unlocked!`));
    },
  },
  {
    name: 'role', description: 'Add or remove a role from a member', permission: PermissionFlagsBits.ManageRoles,
    options: [
      { name: 'user', type: 'user', required: true, description: 'The member' },
      { name: 'role', type: 'role', required: true, description: 'The role' },
    ],
    execute: async (ctx) => {
      const member = await ctx.getUserMember('user');
      const role = ctx.getRole('role');
      if (!member) return ctx.reply(fail('❌ Member not found.'));
      if (!role) return ctx.reply(fail('❌ Role not found.'));
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        return ctx.reply(ok(`✅ Role **${role.name}** has been removed from **${member.user.tag}**!`));
      }
      await member.roles.add(role);
      return ctx.reply(ok(`✅ Role **${role.name}** has been added to **${member.user.tag}**!`));
    },
  },
  {
    name: 'setcolor', description: 'Change a role\'s color', permission: PermissionFlagsBits.ManageRoles,
    options: [
      { name: 'role', type: 'role', required: true, description: 'The role' },
      { name: 'color', type: 'string', required: true, description: 'HEX color, e.g. #ff0000' },
    ],
    execute: async (ctx) => {
      const role = ctx.getRole('role');
      const color = ctx.getString('color');
      if (!role) return ctx.reply(fail('❌ Role not found.'));
      if (!color || !/^#?[0-9a-fA-F]{6}$/.test(color)) return ctx.reply(fail('❌ Invalid color format, use e.g. #ff0000'));
      await role.setColor(color.startsWith('#') ? color : `#${color}`);
      return ctx.reply(ok(`🎨 Role **${role.name}**'s color has been updated!`));
    },
  },
  {
    name: 'slowmode', description: 'Set slowmode for a channel', permission: PermissionFlagsBits.ManageChannels,
    options: [
      { name: 'seconds', type: 'integer', required: true, description: 'Seconds (0 to disable)' },
      { name: 'channel', type: 'channel', required: false, description: 'The channel (optional)' },
    ],
    execute: async (ctx) => {
      const seconds = ctx.getInteger('seconds');
      const channel = ctx.getChannel('channel') || ctx.channel;
      if (seconds === null || seconds < 0 || seconds > 21600) return ctx.reply(fail('❌ Value must be between 0 and 21600 seconds.'));
      await channel.setRateLimitPerUser(seconds);
      return ctx.reply(ok(seconds === 0 ? `✅ Slowmode disabled in **#${channel.name}**!` : `🐢 Slowmode set to **${seconds}s** in **#${channel.name}**!`));
    },
  },
  {
    name: 'embed', description: 'Send a custom embed message', permission: PermissionFlagsBits.ManageMessages,
    options: [
      { name: 'title', type: 'string', required: true, description: 'Embed title' },
      { name: 'description', type: 'string', required: true, consumeRest: true, description: 'Embed description (use | in prefix mode to separate title/description)' },
      { name: 'color', type: 'string', required: false, description: 'HEX color, e.g. #5865f2' },
      { name: 'channel', type: 'channel', required: false, description: 'The channel (optional)' },
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
        if (tokens[0] && /^<#\d+>$/.test(tokens[0])) channel = resolveChannelMention(ctx.guild, tokens.shift()) || ctx.channel;
        if (!tokens.length) return ctx.reply(fail('❌ Usage: `-embed [#channel] title | description`'));
        const [t, d] = tokens.join(' ').split('|').map((s) => s?.trim());
        title = t || '📢 Announcement';
        description = d || t;
        color = '#5865f2';
      }
      if (!/^#?[0-9a-fA-F]{6}$/.test(color)) return ctx.reply(fail('❌ Invalid color format.'));
      if (!color.startsWith('#')) color = `#${color}`;
      await channel.send({ embeds: [new EmbedBuilder().setTitle(title).setDescription(description).setColor(color)] });
      return ctx.reply(ok(`✅ Embed sent to ${channel}!`));
    },
  },
  {
    name: 'say', description: 'Make the bot send a message', permission: PermissionFlagsBits.ManageMessages,
    options: [
      { name: 'message', type: 'string', required: true, consumeRest: true, description: 'The message content' },
      { name: 'channel', type: 'channel', required: false, description: 'The channel (optional)' },
    ],
    execute: async (ctx) => {
      let message, channel;
      if (ctx.isSlash) {
        message = ctx.getString('message');
        channel = ctx.getChannel('channel') || ctx.channel;
      } else {
        const tokens = [...(ctx.args || [])];
        channel = ctx.channel;
        if (tokens[0] && /^<#\d+>$/.test(tokens[0])) channel = resolveChannelMention(ctx.guild, tokens.shift()) || ctx.channel;
        message = tokens.join(' ');
      }
      if (!message) return ctx.reply(fail('❌ You must provide a message.'));
      await channel.send({ content: message });
      return ctx.reply(ok(`✅ Message sent to ${channel}!`));
    },
  },
  {
    name: 'botinfo', description: 'View bot info and status', options: [],
    execute: async (ctx) => {
      const client = ctx.raw.client;
      const lines = [
        '🤖 OS System Engine — Bot Info',
        `Servers: ${client.guilds.cache.size}`,
        `Users: ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`,
        `Ping: ${client.ws.ping}ms`,
        `Uptime: ${formatUptime(client.uptime)}`,
      ];
      return ctx.reply(ok(lines.join('\n')));
    },
  },
  {
    name: 'help', description: 'View the interactive help menu', options: [],
    execute: async (ctx) => {
      const client = ctx.raw.client;
      const botAvatarUrl = client.user.displayAvatarURL();
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('help_menu').setPlaceholder('Choose a category').addOptions(
          { label: 'Moderation', value: 'moderation', emoji: '🛡️' },
          { label: 'Channels & Roles', value: 'channels', emoji: '📂' },
          { label: 'Utility', value: 'utility', emoji: '🧰' },
        )
      );
      const buildEmbed = (key) => buildHelpEmbed(key, botAvatarUrl);
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

module.exports = { commands, buildHelpEmbed, HELP_CATEGORIES };
