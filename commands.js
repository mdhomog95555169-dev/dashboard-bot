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

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

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

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  const duration = value * multipliers[unit];

  if (!Number.isSafeInteger(duration) || duration <= 0) {
    return null;
  }

  return duration;
}

const tempBanTimers = new Map();

function scheduleTempUnban(guild, userId, duration) {
  const key = `${guild.id}:${userId}`;

  if (tempBanTimers.has(key)) {
    clearTimeout(tempBanTimers.get(key));
  }

  const timer = setTimeout(async () => {
    try {
      await guild.bans.remove(userId, 'Temporary ban expired');
    } catch (error) {
      console.error(`Failed to unban ${userId}:`, error.message);
    }

    tempBanTimers.delete(key);
  }, duration);

  tempBanTimers.set(key, timer);
}

module.exports = {
  DEFAULT_TICKET_CATEGORY_ID,

  commands: [

    // 1. TICKET SETUP
    {
      data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Create a customized support ticket panel')
        .addStringOption(opt =>
          opt
            .setName('title')
            .setDescription('Embed Title')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('description')
            .setDescription('Embed Description')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('cat1_label')
            .setDescription('Category 1 Name')
            .setRequired(true)
        )
        .addChannelOption(opt =>
          opt
            .setName('ticket_category')
            .setDescription('Category Channel for tickets')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('icon_url')
            .setDescription('Thumbnail image URL')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('banner_url')
            .setDescription('Banner image URL')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('cat1_emoji')
            .setDescription('Category 1 Emoji')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('cat2_label')
            .setDescription('Category 2 Name')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('cat2_emoji')
            .setDescription('Category 2 Emoji')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('cat3_label')
            .setDescription('Category 3 Name')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('cat3_emoji')
            .setDescription('Category 3 Emoji')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('cat4_label')
            .setDescription('Category 4 Name')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('cat4_emoji')
            .setDescription('Category 4 Emoji')
            .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const selectedCategory =
          interaction.options.getChannel('ticket_category');

        const categoryId =
          selectedCategory?.id || DEFAULT_TICKET_CATEGORY_ID;

        const rawIconUrl =
          interaction.options.getString('icon_url');

        const rawBannerUrl =
          interaction.options.getString('banner_url');

        const iconUrl = validImageUrl(rawIconUrl);
        const bannerUrl = validImageUrl(rawBannerUrl);

        if (rawIconUrl && !iconUrl) {
          return interaction.reply(
            textReply(
              '❌ Invalid icon URL. Please provide a valid HTTP/HTTPS image URL.',
              true
            )
          );
        }

        if (rawBannerUrl && !bannerUrl) {
          return interaction.reply(
            textReply(
              '❌ Invalid banner URL. Please provide a valid HTTP/HTTPS image URL.',
              true
            )
          );
        }

        const options = [];

        for (let i = 1; i <= 4; i++) {
          const label = interaction.options.getString(`cat${i}_label`);
          const emoji = interaction.options.getString(`cat${i}_emoji`);

          if (!label) continue;

          const option = {
            label: label.slice(0, 100),
            value: `cat_${i}_${categoryId}`
          };

          if (emoji) {
            option.emoji = emoji;
          }

          options.push(option);
        }

        if (!options.length) {
          return interaction.reply(
            textReply('❌ You must configure at least one ticket category.', true)
          );
        }

        const ticketEmbed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor('#2f3136')
          .setTimestamp();

        if (iconUrl) {
          ticketEmbed.setThumbnail(iconUrl);
        }

        if (bannerUrl) {
          ticketEmbed.setImage(bannerUrl);
        }

        const selectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('custom_ticket_select')
            .setPlaceholder('اختر قسم التذكرة...')
            .addOptions(options)
        );

        await interaction.channel.send({
          embeds: [ticketEmbed],
          components: [selectMenu]
        });

        await interaction.reply(
          textReply('🎫 Ticket panel has been created successfully!', true)
        );
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

        if (amount < 1 || amount > 100) {
          return interaction.reply(
            textReply('❌ Amount must be between 1 and 100.', true)
          );
        }

        const deleted = await interaction.channel
          .bulkDelete(amount, true)
          .catch(() => null);

        if (!deleted) {
          return interaction.reply(
            textReply('❌ I could not delete the messages.', true)
          );
        }

        await interaction.reply({
          content: `\`\`\`\n${deleted.size} messages have been deleted.\n\`\`\``
        });

        setTimeout(() => {
          interaction.deleteReply().catch(() => null);
        }, 5000);
      }
    },

    // 3. BAN
    {
      data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban User from the server')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('time')
            .setDescription('Temporary ban: 30m, 2h, 1d')
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('reason')
            .setDescription('Reason for the ban')
            .setRequired(false)
        )
        .addIntegerOption(opt =>
          opt
            .setName('bulk')
            .setDescription('Delete messages from the last 0-7 days')
            .setMinValue(0)
            .setMaxValue(7)
            .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason =
          interaction.options.getString('reason') ||
          'No reason provided';

        const time =
          interaction.options.getString('time');

        const bulk =
          interaction.options.getInteger('bulk') || 0;

        const member =
          await interaction.guild.members
            .fetch(user.id)
            .catch(() => null);

        if (
          member &&
          !member.bannable
        ) {
          return interaction.reply(
            textReply(
              '❌ I cannot ban this member because their role is higher than or equal to mine.',
              true
            )
          );
        }

        let duration = null;

        if (time) {
          duration = parseDuration(time);

          if (!duration) {
            return interaction.reply(
              textReply(
                '❌ Invalid ban duration. Examples: `30m`, `2h`, `1d`.',
                true
              )
            );
          }
        }

        try {
          await interaction.guild.members.ban(user.id, {
            reason,
            deleteMessageSeconds: bulk * 86400
          });
        } catch (error) {
          console.error('Ban error:', error);

          return interaction.reply(
            textReply('❌ I could not ban this user.', true)
          );
        }

        if (duration) {
          scheduleTempUnban(
            interaction.guild,
            user.id,
            duration
          );
        }

        const durationText =
          duration ? ` for ${time}` : '';

        await interaction.reply(
          textReply(
            `🔨 ${user.tag} has been banned${durationText}.\n📝 Reason: ${reason}`
          )
        );
      }
    },

    // 4. UNBAN
    {
      data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban User by ID')
        .addStringOption(opt =>
          opt
            .setName('userid')
            .setDescription('User ID')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

      async execute(interaction) {
        const userId =
          interaction.options.getString('userid');

        try {
          await interaction.guild.members.unban(userId);

          await interaction.reply(
            textReply(`🔓 User ${userId} has been unbanned.`)
          );
        } catch {
          await interaction.reply(
            textReply(`❌ User ${userId} is not banned.`, true)
          );
        }
      }
    },

    // 5. KICK
    {
      data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick User')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('reason')
            .setDescription('Reason')
            .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

      async execute(interaction) {
        const member =
          interaction.options.getMember('user');

        const user =
          interaction.options.getUser('user');

        const reason =
          interaction.options.getString('reason') ||
          'No reason provided';

        if (!member) {
          return interaction.reply(
            textReply('❌ Member not found.', true)
          );
        }

        if (!member.kickable) {
          return interaction.reply(
            textReply('❌ I cannot kick this member.', true)
          );
        }

        try {
          await member.kick(reason);
        } catch {
          return interaction.reply(
            textReply('❌ I could not kick this member.', true)
          );
        }

        await interaction.reply(
          textReply(`👢 ${user.tag} has been kicked.`)
        );
      }
    },

    // 6. TIMEOUT
    {
      data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout/Mute Member')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt
            .setName('duration')
            .setDescription('Duration in minutes')
            .setMinValue(1)
            .setMaxValue(40320)
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('reason')
            .setDescription('Reason')
            .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

      async execute(interaction) {
        const member =
          interaction.options.getMember('user');

        const duration =
          interaction.options.getInteger('duration');

        const reason =
          interaction.options.getString('reason') ||
          'No reason provided';

        if (!member) {
          return interaction.reply(
            textReply('❌ Member not found.', true)
          );
        }

        if (!member.moderatable) {
          return interaction.reply(
            textReply('❌ I cannot timeout this member.', true)
          );
        }

        try {
          await member.timeout(
            duration * 60000,
            reason
          );
        } catch {
          return interaction.reply(
            textReply('❌ I could not timeout this member.', true)
          );
        }

        await interaction.reply(
          textReply(
            `🔇 ${member.user.tag} has been timed out for ${duration} minutes.`
          )
        );
      }
    },

    // 7. UNTIMEOUT
    {
      data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove Timeout')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

      async execute(interaction) {
        const member =
          interaction.options.getMember('user');

        if (!member) {
          return interaction.reply(
            textReply('❌ Member not found.', true)
          );
        }

        try {
          await member.timeout(null);
        } catch {
          return interaction.reply(
            textReply('❌ I could not remove the timeout.', true)
          );
        }

        await interaction.reply(
          textReply(`🔊 ${member.user.tag}'s timeout has been removed.`)
        );
      }
    },

    // 8. WARN
    {
      data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Issue Warning')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName('reason')
            .setDescription('Reason')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

      async execute(interaction) {
        const user =
          interaction.options.getUser('user');

        const reason =
          interaction.options.getString('reason');

        await interaction.reply(
          textReply(
            `⚠️ ${user.tag} has been warned.\n📝 Reason: ${reason}`
          )
        );
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
          await interaction.channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            { SendMessages: false }
          );
        } catch {
          return interaction.reply(
            textReply('❌ I could not lock this channel.', true)
          );
        }

        await interaction.reply(
          textReply(`🔒 | ${interaction.channel} has been locked.`)
        );
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
          await interaction.channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            { SendMessages: true }
          );
        } catch {
          return interaction.reply(
            textReply('❌ I could not unlock this channel.', true)
          );
        }

        await interaction.reply(
          textReply(`🔓 | ${interaction.channel} has been unlocked.`)
        );
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
          await interaction.channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            { ViewChannel: false }
          );
        } catch {
          return interaction.reply(
            textReply('❌ I could not hide this channel.', true)
          );
        }

        await interaction.reply(
          textReply(`👁️‍🗨️ | ${interaction.channel} has been hidden.`)
        );
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
          await interaction.channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            { ViewChannel: true }
          );
        } catch {
          return interaction.reply(
            textReply('❌ I could not show this channel.', true)
          );
        }

        await interaction.reply(
          textReply(`👁️ | ${interaction.channel} is now visible.`)
        );
      }
    },

    // 13. SLOWMODE
    {
      data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set Slowmode Delay')
        .addIntegerOption(opt =>
          opt
            .setName('seconds')
            .setDescription('Seconds, 0-21600')
            .setMinValue(0)
            .setMaxValue(21600)
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      async execute(interaction) {
        const seconds =
          interaction.options.getInteger('seconds');

        try {
          await interaction.channel.setRateLimitPerUser(seconds);
        } catch {
          return interaction.reply(
            textReply('❌ I could not change slowmode.', true)
          );
        }

        if (seconds === 0) {
          return interaction.reply(
            textReply(`🐢 Slowmode disabled in ${interaction.channel}.`)
          );
        }

        await interaction.reply(
          textReply(
            `🐢 Slowmode set to ${seconds} seconds in ${interaction.channel}.`
          )
        );
      }
    },

    // 14. VKICK
    {
      data: new SlashCommandBuilder()
        .setName('vkick')
        .setDescription('Kick from Voice')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

      async execute(interaction) {
        const member =
          interaction.options.getMember('user');

        if (!member) {
          return interaction.reply(
            textReply('❌ Member not found.', true)
          );
        }

        if (!member.voice.channel) {
          return interaction.reply(
            textReply('❌ This member is not in a voice channel.', true)
          );
        }

        try {
          await member.voice.disconnect('Voice kick');
        } catch {
          return interaction.reply(
            textReply('❌ I could not disconnect this member.', true)
          );
        }

        await interaction.reply(
          textReply(`🎙️ ${member.user.tag} has been disconnected from voice.`)
        );
      }
    },

    // 15. VMOVE
    {
      data: new SlashCommandBuilder()
        .setName('vmove')
        .setDescription('Move Voice Member')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)
        )
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Voice channel')
            .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

      async execute(interaction) {
        const member =
          interaction.options.getMember('user');

        const channel =
          interaction.options.getChannel('channel');

        if (!member) {
          return interaction.reply(
            textReply('❌ Member not found.', true)
          );
        }

        if (!member.voice.channel) {
          return interaction.reply(
            textReply('❌ This member is not in a voice channel.', true)
          );
        }

        try {
          await member.voice.setChannel(channel);
        } catch {
          return interaction.reply(
            textReply('❌ I could not move this member.', true)
          );
        }

        await interaction.reply(
          textReply(`↗️ ${member.user.tag} has been moved to ${channel.name}.`)
        );
      }
    },

    // 16. VMUTE
    {
      data: new SlashCommandBuilder()
        .setName('vmute')
        .setDescription('Mute in Voice')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

      async execute(interaction) {
        const member =
          interaction.options.getMember('user');

        if (!member) {
          return interaction.reply(
            textReply('❌ Member not found.', true)
          );
        }

        if (!member.voice.channel) {
          return interaction.reply(
            textReply('❌ This member is not in a voice channel.', true)
          );
        }

        try {
          await member.voice.setMute(true);
        } catch {
          return interaction.reply(
            textReply('❌ I could not mute this member.', true)
          );
        }

        await interaction.reply(
          textReply(`🎙️ ${member.user.tag} has been voice muted.`)
        );
      }
    },

    // 17. VUNMUTE
    {
      data: new SlashCommandBuilder()
        .setName('vunmute')
        .setDescription('Unmute in Voice')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

      async execute(interaction) {
        const member =
          interaction.options.getMember('user');

        if (!member) {
          return interaction.reply(
            textReply('❌ Member not found.', true)
          );
        }

        try {
          await member.voice.setMute(false);
        } catch {
          return interaction.reply(
            textReply('❌ I could not unmute this member.', true)
          );
        }

        await interaction.reply(
          textReply(`🔊 ${member.user.tag} has been voice unmuted.`)
        );
      }
    },

    // 18. VDEAF
    {
      data: new SlashCommandBuilder()
        .setName('vdeaf')
        .setDescription('Deafen in Voice')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

      async execute(interaction) {
        const member =
          interaction.options.getMember('user');

        if (!member) {
          return interaction.reply(
            textReply('❌ Member not found.', true)
          );
        }

        if (!member.voice.channel) {
          return interaction.reply(
            textReply('❌ This member is not in a voice channel.', true)
          );
        }

        try {
          await member.voice.setDeaf(true);
        } catch {
          return interaction.reply(
            textReply('❌ I could not deafen this member.', true)
          );
        }

        await interaction.reply(
          textReply(`🎧 ${member.user.tag} has been deafened.`)
        );
      }
    },

    // 19. VUNDEAF
    {
      data: new SlashCommandBuilder()
        .setName('vundeaf')
        .setDescription('Undeafen in Voice')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),

      async execute(interaction) {
        const member =
          interaction.options.getMember('user');

        if (!member) {
          return interaction.reply(
            textReply('❌ Member not found.', true)
          );
        }

        try {
          await member.voice.setDeaf(false);
        } catch {
          return interaction.reply(
            textReply('❌ I could not undeafen this member.', true)
          );
        }

        await interaction.reply(
          textReply(`🎧 ${member.user.tag} has been undeafened.`)
        );
      }
    },

    // 20. ROLE ADD
    {
      data: new SlashCommandBuilder()
        .setName('role-add')
        .setDescription('Assign Role')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)
        )
        .addRoleOption(opt =>
          opt
            .setName('role')
            .setDescription('Role')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

      async execute(interaction) {
        const member =
          interaction.options.getMember('user');

        const role =
          interaction.options.getRole('role');

        if (!member) {
          return interaction.reply(
            textReply('❌ Member not found.', true)
          );
        }

        if (!role) {
          return interaction.reply(
            textReply('❌ Role not found.', true)
          );
        }

        if (!role.editable) {
          return interaction.reply(
            textReply('❌ I cannot manage this role.', true)
          );
        }

        try {
          await member.roles.add(role);
        } catch {
          return interaction.reply(
            textReply('❌ I could not add this role.', true)
          );
        }

        await interaction.reply(
          textReply(`➕ Role ${role.name} has been added to ${member.user.tag}.`)
        );
      }
    },

    // 21. ROLE REMOVE
    {
      data: new SlashCommandBuilder()
        .setName('role-remove')
        .setDescription('Remove Role')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('Target user')
            .setRequired(true)
        )
        .addRoleOption(opt =>
          opt
            .setName('role')
            .setDescription('Role')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

      async execute(interaction) {
        const member =
          interaction.options.getMember('user');

        const role =
          interaction.options.getRole('role');

        if (!member) {
          return interaction.reply(
            textReply('❌ Member not found.', true)
          );
        }

        if (!role) {
          return interaction.reply(
            textReply('❌ Role not found.', true)
          );
        }

        if (!role.editable) {
          return interaction.reply(
            textReply('❌ I cannot manage this role.', true)
          );
        }

        try {
          await member.roles.remove(role);
        } catch {
          return interaction.reply(
            textReply('❌ I could not remove this role.', true)
          );
        }

        await interaction.reply(
          textReply(`➖ Role ${role.name} has been removed from ${member.user.tag}.`)
        );
      }
    },

    // 22. USER PROFILE & ID
    {
      data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('View User Profile & ID')
        .addUserOption(opt =>
          opt
            .setName('target')
            .setDescription('Target user to inspect')
            .setRequired(false)
        ),

      async execute(interaction) {
        const targetUser = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        const embed = new EmbedBuilder()
          .setTitle(`👤 User Profile: ${targetUser.username}`)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
          .setColor('#5865f2')
          .addFields(
            { name: '🆔 User ID', value: `\`${targetUser.id}\``, inline: true },
            { name: '🏷️ Tag', value: `\`${targetUser.tag}\``, inline: true },
            { name: '📅 Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: false }
          )
          .setFooter({ text: 'Oscorp Control Systems' })
          .setTimestamp();

        if (member) {
          embed.addFields(
            { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: '🎭 Roles', value: member.roles.cache.map(r => r.toString()).join(', ') || 'None', inline: false }
          );
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    },

    // 23. HELP DOCUMENTATION (DM + Reaction)
    {
      data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display Documentation in DMs'),

      async execute(interaction) {
        const mainEmbed = new EmbedBuilder()
          .setTitle('🛡️ Moderation & Security Suite')
          .setDescription(
            '• </ban:0> - 🔨 Ban User\n' +
            '• </unban:0> - 🔓 Unban User by ID\n' +
            '• </kick:0> - 👢 Kick User\n' +
            '• </timeout:0> - 🔇 Timeout/Mute Member\n' +
            '• </untimeout:0> - 🔊 Remove Timeout\n' +
            '• </warn:0> - ⚠️ Issue Warning\n' +
            '• </clear:0> - 🧹 Purge Messages\n' +
            '• </role-add:0> - ➕ Assign Role\n' +
            '• </role-remove:0> - ➖ Remove Role\n' +
            '• </vkick:0> - 🎙️ Kick from Voice\n' +
            '• </vmove:0> - ↗️ Move Voice Member\n' +
            '• </vmute:0> - 🎙️ Mute in Voice\n' +
            '• </vunmute:0> - 🔊 Unmute in Voice\n' +
            '• </vdeaf:0> - 🎧 Deafen in Voice\n' +
            '• </vundeaf:0> - 🎵 Undeafen in Voice'
          )
          .setColor('#2f3136')
          .setFooter({ text: 'Oscorp Control Systems' });

        const selectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('اختر قسم الأوامر من القائمة المنسدلة لعرض تفاصيل الأوامر.')
            .addOptions([
              {
                label: 'Moderation Suite',
                value: 'help_mod',
                emoji: '🛡️'
              },
              {
                label: 'Channel Controls',
                value: 'help_channel',
                emoji: '🔒'
              },
              {
                label: 'Utility & Profile',
                value: 'help_utility',
                emoji: '⚙️'
              }
            ])
        );

        try {
          await interaction.user.send({
            content: 'اختر قسم الأوامر من القائمة المنسدلة لعرض تفاصيل الأوامر.\n\nOscorp Security Systems',
            embeds: [mainEmbed],
            components: [selectMenu]
          });

          const replyMessage = await interaction.reply({
            content: '✅ تم إرسال قائمة الأوامر إلى رسائلك الخاصة!',
            fetchReply: true
          });

          await replyMessage.react('✅').catch(() => null);

        } catch (error) {
          await interaction.reply({
            content: '❌ لم أستطع إرسال الرسالة في الخاص! يرجى فتح الرسائل الخاصة (DMs) الخاصة بك أولاً.',
            ephemeral: true
          });
        }
      }
    },

    // 24. GET EMOJI ID
    {
      data: new SlashCommandBuilder()
        .setName('get-emoji')
        .setDescription('Get the ID and code format of any server emoji')
        .addStringOption(opt =>
          opt
            .setName('emoji')
            .setDescription('Type or select the emoji')
            .setRequired(true)
        ),

      async execute(interaction) {
        const input = interaction.options.getString('emoji');
        const match = input.match(/<a?:(\w+):(\d+)>/);

        if (!match) {
          const guildEmoji = interaction.guild.emojis.cache.find(
            e => e.name === input.replace(/:/g, '')
          );

          if (guildEmoji) {
            const format = guildEmoji.animated 
              ? `<a:${guildEmoji.name}:${guildEmoji.id}>` 
              : `<:${guildEmoji.name}:${guildEmoji.id}>`;

            return interaction.reply(
              textReply(
                `🆔 **Emoji ID:** \`${guildEmoji.id}\`\n` +
                `✨ **Format:** \`${format}\`\n` +
                `📌 **Preview:** ${format}`,
                true
              )
            );
          }

          return interaction.reply(
            textReply('❌ Could not find this emoji. Make sure to send/paste the emoji directly.', true)
          );
        }

        const emojiName = match[1];
        const emojiId = match[2];
        const isAnimated = input.startsWith('<a:');
        const format = isAnimated ? `<a:${emojiName}:${emojiId}>` : `<:${emojiName}:${emojiId}>`;

        await interaction.reply(
          textReply(
            `🆔 **Emoji ID:** \`${emojiId}\`\n` +
            `✨ **Format:** \`${format}\`\n` +
            `📌 **Preview:** ${format}`,
            true
          )
        );
      }
    },

    // 25. FETCH & CLONE EMOJIS
    {
      data: new SlashCommandBuilder()
        .setName('fetch-emojis')
        .setDescription('Fetch all custom emojis from a target server and add them to THIS server')
        .addStringOption(opt =>
          opt
            .setName('server_id')
            .setDescription('Target Server ID (Guild ID)')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions),

      async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const guildId = interaction.options.getString('server_id');
        const targetGuild = interaction.client.guilds.cache.get(guildId);

        if (!targetGuild) {
          return interaction.editReply('❌ The bot is not in that target server or the Server ID is invalid.');
        }

        const emojis = await targetGuild.emojis.fetch().catch(() => null);

        if (!emojis || emojis.size === 0) {
          return interaction.editReply('❌ No custom emojis found in the target server.');
        }

        await interaction.editReply(`🔄 Starting to copy ${emojis.size} emojis from **${targetGuild.name}** to this server... Please wait.`);

        let addedCount = 0;
        let failedCount = 0;

        for (const emoji of emojis.values()) {
          try {
            await interaction.guild.emojis.create({
              attachment: emoji.url,
              name: emoji.name
            });
            addedCount++;
          } catch (err) {
            console.error(`Failed to add emoji ${emoji.name}:`, err.message);
            failedCount++;
          }
        }

        await interaction.editReply(
          `✅ **Emoji Cloning Complete!**\n\n` +
          `• 📥 **Successfully Added:** \`${addedCount}\` emojis\n` +
          `• ❌ **Failed/Skipped:** \`${failedCount}\` (e.g. server slots full or name conflict)`
        );
      }
    }

  ]
};
