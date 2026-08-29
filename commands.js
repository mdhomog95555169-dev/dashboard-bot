const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType
} = require('discord.js');

const DEFAULT_TICKET_CATEGORY_ID = '1542878038675431434';

function textReply(content, ephemeral = false) {
  return { content, ephemeral };
}

module.exports = {
  DEFAULT_TICKET_CATEGORY_ID,

  commands: [

    // 1. HELP COMMAND (Feeling lost? + Single Gray Embed + No DMs)
    {
      data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Feeling lost?')
        .addStringOption(opt =>
          opt
            .setName('command')
            .setDescription('Shows details about how to use a command.')
            .setRequired(false)
        ),

      async execute(interaction) {
        // إمبد واحد رصاصي بسيط وواضح في نفس الشات
        const mainEmbed = new EmbedBuilder()
          .setColor('#2b2d31')
          .setTitle('📖 Oscorp Control Systems - Help')
          .setDescription(
            '**Available Commands:**\n`ban`, `unban`, `kick`, `timeout`, `untimeout`, `warn`, `clear`, `lock`, `unlock`, `hide`, `unhide`, `slowmode`, `vkick`, `vmove`, `vmute`, `vunmute`, `vdeaf`, `vundeaf`, `role-add`, `role-remove`, `user`'
          )
          .setFooter({ text: 'Oscorp Control Systems' });

        // ephemeral: true يضمن ظهور الرد في نفس الشات لك فقط وبدون DMs نهائياً
        return interaction.reply({
          embeds: [mainEmbed],
          ephemeral: true
        });
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
          await interaction.reply(textReply(`${member.user.tag} has been kicked.`));
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

    // 22. USER PROFILE
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
          .setColor('#2b2d31')
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
