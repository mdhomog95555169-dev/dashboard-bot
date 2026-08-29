const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType
} = require('discord.js');

const DEFAULT_TICKET_CATEGORY_ID = '1542878038675431434';

function textReply(content, ephemeral = false) {
  return { content, ephemeral };
}

function validImageUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseDuration(input) {
  if (!input) return null;
  const match = String(input).trim().match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  const duration = value * multipliers[unit];
  if (!Number.isSafeInteger(duration) || duration <= 0) return null;
  return duration;
}

// Database of Help Information for Moderation & General Commands
const COMMANDS_HELP_DATA = {
  ban: {
    description: 'Bans a member from the server.',
    usage: '/ban [user] (time m/h/d/mo/y) (reason)',
    examples: [
      '/ban @User',
      '/ban @User spamming',
      '/ban @User 1h spamming',
      '/ban @User 1d spamming',
      '/ban @User 1w'
    ]
  },
  unban: {
    description: 'Unbans a user using their Discord User ID.',
    usage: '/unban [userid]',
    examples: [
      '/unban 123456789012345678'
    ]
  },
  kick: {
    description: 'Kicks a user from the server.',
    usage: '/kick [user] (reason)',
    examples: [
      '/kick @User',
      '/kick @User Breaking rules'
    ]
  },
  timeout: {
    description: 'Timeout a user from sending messages, react or join voice channels.',
    usage: '/timeout [user] (duration_minutes) (reason)',
    examples: [
      '/timeout @User 10',
      '/timeout @User 60 Spamming in channels'
    ]
  },
  untimeout: {
    description: 'Removes the active timeout/mute from a member.',
    usage: '/untimeout [user]',
    examples: [
      '/untimeout @User'
    ]
  },
  warn: {
    description: 'Issues a formal warning to a user.',
    usage: '/warn [user] [reason]',
    examples: [
      '/warn @User Inappropriate language'
    ]
  },
  clear: {
    description: 'Cleans and purges messages from a text channel.',
    usage: '/clear [amount]',
    examples: [
      '/clear 10',
      '/clear 100'
    ]
  },
  lock: {
    description: 'Locks the current text channel to prevent users from typing.',
    usage: '/lock',
    examples: ['/lock']
  },
  unlock: {
    description: 'Unlocks the current text channel.',
    usage: '/unlock',
    examples: ['/unlock']
  },
  hide: {
    description: 'Hides the channel from regular members.',
    usage: '/hide',
    examples: ['/hide']
  },
  unhide: {
    description: 'Makes the channel visible to members again.',
    usage: '/unhide',
    examples: ['/unhide']
  },
  slowmode: {
    description: 'Sets slowmode delay for members in the text channel.',
    usage: '/slowmode [seconds]',
    examples: [
      '/slowmode 5',
      '/slowmode 0'
    ]
  },
  vkick: {
    description: 'Disconnects a user from a voice channel.',
    usage: '/vkick [user]',
    examples: ['/vkick @User']
  },
  vmove: {
    description: 'Moves a voice member to another voice channel.',
    usage: '/vmove [user] [channel]',
    examples: ['/vmove @User #GeneralVoice']
  },
  vmute: {
    description: 'Mutes a member in voice channels.',
    usage: '/vmute [user]',
    examples: ['/vmute @User']
  },
  vunmute: {
    description: 'Unmutes a member in voice channels.',
    usage: '/vunmute [user]',
    examples: ['/vunmute @User']
  },
  vdeaf: {
    description: 'Deafens a member in voice channels.',
    usage: '/vdeaf [user]',
    examples: ['/vdeaf @User']
  },
  vundeaf: {
    description: 'Undeafens a member in voice channels.',
    usage: '/vundeaf [user]',
    examples: ['/vundeaf @User']
  },
  'role-add': {
    description: 'Assigns a specified role to a member.',
    usage: '/role-add [user] [role]',
    examples: ['/role-add @User @VIP']
  },
  'role-remove': {
    description: 'Removes a specified role from a member.',
    usage: '/role-remove [user] [role]',
    examples: ['/role-remove @User @VIP']
  },
  user: {
    description: 'Displays detailed user profile information and ID.',
    usage: '/user (target)',
    examples: ['/user', '/user @User']
  }
};

module.exports = {
  DEFAULT_TICKET_CATEGORY_ID,

  commands: [

    // 1. HELP COMMAND (ProBot Style Documentation)
    {
      data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows details about how to use a command.')
        .addStringOption(opt =>
          opt
            .setName('command')
            .setDescription('The command you want information about')
            .setRequired(false)
            .addChoices(
              { name: 'ban', value: 'ban' },
              { name: 'unban', value: 'unban' },
              { name: 'kick', value: 'kick' },
              { name: 'timeout', value: 'timeout' },
              { name: 'untimeout', value: 'untimeout' },
              { name: 'warn', value: 'warn' },
              { name: 'clear', value: 'clear' },
              { name: 'lock', value: 'lock' },
              { name: 'unlock', value: 'unlock' },
              { name: 'hide', value: 'hide' },
              { name: 'unhide', value: 'unhide' },
              { name: 'slowmode', value: 'slowmode' },
              { name: 'vkick', value: 'vkick' },
              { name: 'vmove', value: 'vmove' },
              { name: 'vmute', value: 'vmute' },
              { name: 'vunmute', value: 'vunmute' },
              { name: 'vdeaf', value: 'vdeaf' },
              { name: 'vundeaf', value: 'vundeaf' },
              { name: 'role-add', value: 'role-add' },
              { name: 'role-remove', value: 'role-remove' },
              { name: 'user', value: 'user' }
            )
        ),

      async execute(interaction) {
        const cmdName = interaction.options.getString('command');

        if (!cmdName) {
          const listEmbed = new EmbedBuilder()
            .setTitle('📖 Oscorp Moderation Commands Help')
            .setDescription('للحصول على شرح تفصيلي وطريقة استخدام أمر معين، اكتب:\n`/help command:اسم_الأمر`')
            .addFields({
              name: '🛠️ Available Commands',
              value: '`ban`, `unban`, `kick`, `timeout`, `untimeout`, `warn`, `clear`, `lock`, `unlock`, `hide`, `unhide`, `slowmode`, `vkick`, `vmove`, `vmute`, `vunmute`, `vdeaf`, `vundeaf`, `role-add`, `role-remove`, `user`'
            })
            .setColor('#2f3136')
            .setFooter({ text: 'Oscorp Control Systems' });

          return interaction.reply({ embeds: [listEmbed], ephemeral: true });
        }

        const data = COMMANDS_HELP_DATA[cmdName];

        if (!data) {
          return interaction.reply(textReply('❌ Command not found in help database.', true));
        }

        const helpEmbed = new EmbedBuilder()
          .setTitle(`Command: ${cmdName}`)
          .setDescription(data.description)
          .addFields(
            { name: 'Usage:', value: `\`\`\`text\n${data.usage}\n\`\`\``, inline: false },
            { name: 'Examples:', value: `\`\`\`text\n${data.examples.join('\n')}\n\`\`\``, inline: false }
          )
          .setColor('#2f3136')
          .setFooter({ text: 'Oscorp Control Systems' });

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
      }
    },

    // 2. CLEAR
    {
      data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Purge Messages from the channel')
        .addIntegerOption(opt =>
          opt
            .setName('amount')
            .setDescription('Number of messages to delete (1-100)')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

      async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const deleted = await interaction.channel.bulkDelete(amount, true).catch(() => null);

        if (!deleted) {
          return interaction.reply(textReply('❌ I could not delete the messages.', true));
        }

        await interaction.reply({ content: `\`\`\`\n${deleted.size} messages have been deleted.\n\`\`\`` });
        setTimeout(() => interaction.deleteReply().catch(() => null), 3000);
      }
    },

    // 3. BAN
    {
      data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban User from the server')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(opt => opt.setName('time').setDescription('Temporary ban: 30m, 2h, 1d').setRequired(false))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (member && !member.bannable) {
          return interaction.reply(textReply('❌ I cannot ban this member.', true));
        }

        try {
          await interaction.guild.members.ban(user.id, { reason });
          await interaction.reply(textReply(`🔨 ${user.tag} has been banned.\n📝 Reason: ${reason}`));
        } catch {
          await interaction.reply(textReply('❌ I could not ban this user.', true));
        }
      }
    },

    // 4. UNBAN
    {
      data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban User by ID')
        .addStringOption(opt => opt.setName('userid').setDescription('User ID').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

      async execute(interaction) {
        const userId = interaction.options.getString('userid');
        try {
          await interaction.guild.members.unban(userId);
          await interaction.reply(textReply(`🔓 User ${userId} has been unbanned.`));
        } catch {
          await interaction.reply(textReply(`❌ User ${userId} is not banned.`, true));
        }
      }
    },

    // 5. KICK
    {
      data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick User')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!member || !member.kickable) {
          return interaction.reply(textReply('❌ I cannot kick this member.', true));
        }

        try {
          await member.kick(reason);
          await interaction.reply(textReply(`👢 ${member.user.tag} has been kicked.`));
        } catch {
          await interaction.reply(textReply('❌ I could not kick this member.', true));
        }
      }
    },

    // 6. TIMEOUT
    {
      data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout/Mute Member')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in minutes').setMinValue(1).setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!member || !member.moderatable) {
          return interaction.reply(textReply('❌ I cannot timeout this member.', true));
        }

        try {
          await member.timeout(duration * 60000, reason);
          await interaction.reply(textReply(`🔇 ${member.user.tag} has been timed out for ${duration} minutes.`));
        } catch {
          await interaction.reply(textReply('❌ I could not timeout this member.', true));
        }
      }
    },

    // 7. UNTIMEOUT
    {
      data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove Timeout')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (!member) return interaction.reply(textReply('❌ Member not found.', true));

        try {
          await member.timeout(null);
          await interaction.reply(textReply(`🔊 ${member.user.tag}'s timeout has been removed.`));
        } catch {
          await interaction.reply(textReply('❌ I could not remove the timeout.', true));
        }
      }
    },

    // 8. WARN
    {
      data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Issue Warning')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        await interaction.reply(textReply(`⚠️ ${user.tag} has been warned.\n📝 Reason: ${reason}`));
      }
    },

    // 9. LOCK
    {
      data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock Text Channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      async execute(interaction) {
        try {
          await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
          await interaction.reply(textReply(`🔒 | ${interaction.channel} has been locked.`));
        } catch {
          await interaction.reply(textReply('❌ I could not lock this channel.', true));
        }
      }
    },

    // 10. UNLOCK
    {
      data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock Text Channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      async execute(interaction) {
        try {
          await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
          await interaction.reply(textReply(`🔓 | ${interaction.channel} has been unlocked.`));
        } catch {
          await interaction.reply(textReply('❌ I could not unlock this channel.', true));
        }
      }
    },

    // 11. HIDE
    {
      data: new SlashCommandBuilder()
        .setName('hide')
        .setDescription('Hide Channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      async execute(interaction) {
        try {
          await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
          await interaction.reply(textReply(`👁️‍🗨️ | ${interaction.channel} has been hidden.`));
        } catch {
          await interaction.reply(textReply('❌ I could not hide this channel.', true));
        }
      }
    },

    // 12. UNHIDE
    {
      data: new SlashCommandBuilder()
        .setName('unhide')
        .setDescription('Show Channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      async execute(interaction) {
        try {
          await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: true });
          await interaction.reply(textReply(`👁️ | ${interaction.channel} is now visible.`));
        } catch {
          await interaction.reply(textReply('❌ I could not show this channel.', true));
        }
      }
    },

    // 13. SLOWMODE
    {
      data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set Slowmode Delay')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('Seconds, 0-21600').setMinValue(0).setMaxValue(21600).setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        try {
          await interaction.channel.setRateLimitPerUser(seconds);
          await interaction.reply(textReply(`🐢 Slowmode set to ${seconds} seconds in ${interaction.channel}.`));
        } catch {
          await interaction.reply(textReply('❌ I could not change slowmode.', true));
        }
      }
    },

    // 14. VKICK
    {
      data: new SlashCommandBuilder()
        .setName('vkick')
        .setDescription('Kick from Voice')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (!member || !member.voice.channel) return interaction.reply(textReply('❌ Member not in voice.', true));

        try {
          await member.voice.disconnect('Voice kick');
          await interaction.reply(textReply(`🎙️ ${member.user.tag} disconnected from voice.`));
        } catch {
          await interaction.reply(textReply('❌ Could not disconnect member.', true));
        }
      }
    },

    // 15. VMOVE
    {
      data: new SlashCommandBuilder()
        .setName('vmove')
        .setDescription('Move Voice Member')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addChannelOption(opt => opt.setName('channel').setDescription('Voice channel').addChannelTypes(ChannelType.GuildVoice).setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const channel = interaction.options.getChannel('channel');

        if (!member || !member.voice.channel) return interaction.reply(textReply('❌ Member not in voice.', true));

        try {
          await member.voice.setChannel(channel);
          await interaction.reply(textReply(`↗️ ${member.user.tag} moved to ${channel.name}.`));
        } catch {
          await interaction.reply(textReply('❌ Could not move member.', true));
        }
      }
    },

    // 16. VMUTE
    {
      data: new SlashCommandBuilder()
        .setName('vmute')
        .setDescription('Mute in Voice')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (!member || !member.voice.channel) return interaction.reply(textReply('❌ Member not in voice.', true));

        try {
          await member.voice.setMute(true);
          await interaction.reply(textReply(`🎙️ ${member.user.tag} voice muted.`));
        } catch {
          await interaction.reply(textReply('❌ Could not voice mute member.', true));
        }
      }
    },

    // 17. VUNMUTE
    {
      data: new SlashCommandBuilder()
        .setName('vunmute')
        .setDescription('Unmute in Voice')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (!member) return interaction.reply(textReply('❌ Member not found.', true));

        try {
          await member.voice.setMute(false);
          await interaction.reply(textReply(`🔊 ${member.user.tag} voice unmuted.`));
        } catch {
          await interaction.reply(textReply('❌ Could not voice unmute member.', true));
        }
      }
    },

    // 18. VDEAF
    {
      data: new SlashCommandBuilder()
        .setName('vdeaf')
        .setDescription('Deafen in Voice')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (!member || !member.voice.channel) return interaction.reply(textReply('❌ Member not in voice.', true));

        try {
          await member.voice.setDeaf(true);
          await interaction.reply(textReply(`🎧 ${member.user.tag} deafened.`));
        } catch {
          await interaction.reply(textReply('❌ Could not deafen member.', true));
        }
      }
    },

    // 19. VUNDEAF
    {
      data: new SlashCommandBuilder()
        .setName('vundeaf')
        .setDescription('Undeafen in Voice')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (!member) return interaction.reply(textReply('❌ Member not found.', true));

        try {
          await member.voice.setDeaf(false);
          await interaction.reply(textReply(`🎧 ${member.user.tag} undeafened.`));
        } catch {
          await interaction.reply(textReply('❌ Could not undeafen member.', true));
        }
      }
    },

    // 20. ROLE ADD
    {
      data: new SlashCommandBuilder()
        .setName('role-add')
        .setDescription('Assign Role')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');

        if (!member || !role) return interaction.reply(textReply('❌ Invalid user or role.', true));

        try {
          await member.roles.add(role);
          await interaction.reply(textReply(`➕ Role ${role.name} assigned to ${member.user.tag}.`));
        } catch {
          await interaction.reply(textReply('❌ Could not add role.', true));
        }
      }
    },

    // 21. ROLE REMOVE
    {
      data: new SlashCommandBuilder()
        .setName('role-remove')
        .setDescription('Remove Role')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');

        if (!member || !role) return interaction.reply(textReply('❌ Invalid user or role.', true));

        try {
          await member.roles.remove(role);
          await interaction.reply(textReply(`➖ Role ${role.name} removed from ${member.user.tag}.`));
        } catch {
          await interaction.reply(textReply('❌ Could not remove role.', true));
        }
      }
    },

    // 22. USER PROFILE & ID
    {
      data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('View User Profile & ID')
        .addUserOption(opt => opt.setName('target').setDescription('Target user').setRequired(false)),

      async execute(interaction) {
        const targetUser = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        const embed = new EmbedBuilder()
          .setTitle(`👤 User Profile: ${targetUser.username}`)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
          .setColor('#2f3136')
          .addFields(
            { name: '🆔 User ID', value: `\`${targetUser.id}\``, inline: true },
            { name: '🏷️ Tag', value: `\`${targetUser.tag}\``, inline: true }
          )
          .setFooter({ text: 'Oscorp Control Systems' });

        if (member) {
          embed.addFields({ name: '🎭 Roles', value: member.roles.cache.map(r => r.toString()).join(', ') || 'None', inline: false });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

  ]
};
