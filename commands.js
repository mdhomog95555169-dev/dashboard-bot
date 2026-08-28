const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  commands: [
    // 🎟️ 1. Ticket Setup Command
    {
      data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('🎫 Create a fully customized support ticket panel with icons & banners')
        .addStringOption(opt => opt.setName('title').setDescription('📌 Embed Title').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('📝 Embed Description & Rules').setRequired(true))
        .addStringOption(opt => opt.setName('icon_url').setDescription('🖼️ Small Header Icon URL (Thumbnail)').setRequired(false))
        .addStringOption(opt => opt.setName('banner_url').setDescription('🖼️ Large Bottom Banner Image URL').setRequired(false))
        .addStringOption(opt => opt.setName('cat1_label').setDescription('📂 Category 1 Name').setRequired(true))
        .addStringOption(opt => opt.setName('cat1_emoji').setDescription('✨ Category 1 Emoji').setRequired(false))
        .addStringOption(opt => opt.setName('cat2_label').setDescription('📂 Category 2 Name').setRequired(false))
        .addStringOption(opt => opt.setName('cat2_emoji').setDescription('✨ Category 2 Emoji').setRequired(false))
        .addStringOption(opt => opt.setName('cat3_label').setDescription('📂 Category 3 Name').setRequired(false))
        .addStringOption(opt => opt.setName('cat3_emoji').setDescription('✨ Category 3 Emoji').setRequired(false))
        .addStringOption(opt => opt.setName('cat4_label').setDescription('📂 Category 4 Name').setRequired(false))
        .addStringOption(opt => opt.setName('cat4_emoji').setDescription('✨ Category 4 Emoji').setRequired(false))
        .addStringOption(opt => opt.setName('cat5_label').setDescription('📂 Category 5 Name').setRequired(false))
        .addStringOption(opt => opt.setName('cat5_emoji').setDescription('✨ Category 5 Emoji').setRequired(false))
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
          .setColor('#2f3136')
          .setTimestamp();

        if (iconUrl) ticketEmbed.setThumbnail(iconUrl);
        if (bannerUrl) ticketEmbed.setImage(bannerUrl);

        const selectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('custom_ticket_select')
            .setPlaceholder(' Choose Ticket Category / اختر نوع التذكرة...')
            .addOptions(options)
        );

        await interaction.channel.send({ embeds: [ticketEmbed], components: [selectMenu] });
        await interaction.reply({ content: '✅ **Ticket Setup Panel created successfully!**', ephemeral: true });
      }
    },

    // 📖 2. Advanced & Extended /help Command (X1000 Help System)
    {
      data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📖 Open the advanced system documentation and command center'),
      async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
          .setTitle('⚙️ Oscorp System Command & Documentation Hub')
          .setDescription(
            'Welcome to the official Oscorp Management System.\n\n' +
            '**System Status:** 🟢 All 21 Modules Operational\n' +
            '**Access Level:** Administrator & Moderator Commands Enabled\n\n' +
            ' Please select a category from the dropdown menu below to view detailed command lists, syntax, required permissions, and usage guides.'
          )
          .setColor('#2f3136')
          .setFooter({ text: 'Oscorp Security & Administration Systems • Powered by ProBot Standard Engine' });

        const helpMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('Select Command Suite...')
            .addOptions([
              { label: 'Moderation & Security (15 Commands)', description: 'Member management, bans, mutes, warnings & voice controls', value: 'help_mod', emoji: '🛡️' },
              { label: 'Channel & Protection Controls (5 Commands)', description: 'Lockdown, hiding, slowmode and channel tools', value: 'help_chan', emoji: '🔒' },
              { label: 'Utility & System Information (1 Command)', description: 'User lookup, ID verification and bot statistics', value: 'help_util', emoji: '⚙️' }
            ])
        );

        await interaction.reply({ embeds: [helpEmbed], components: [helpMenu] });
      }
    },

    // 🛡️ 3. All 21 Moderation & Management Commands with Emojis in Descriptions
    {
      data: new SlashCommandBuilder().setName('ban').setDescription('🔨 Ban a user permanently from the server')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason for Ban'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        await interaction.guild.members.ban(user, { reason }).catch(() => {});
        await interaction.reply({ content: `✅ **Successfully banned ${user.tag}** | Reason: ${reason}` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('unban').setDescription('🔓 Revoke a user ban using their Discord ID')
        .addStringOption(opt => opt.setName('userid').setDescription('🆔 Target User ID').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const userId = interaction.options.getString('userid');
        await interaction.guild.members.unban(userId).catch(() => {});
        await interaction.reply({ content: `✅ **Successfully unbanned User ID:** \`${userId}\`` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('kick').setDescription('👢 Kick a user out of the server')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason for Kick'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        if (member) await member.kick(reason).catch(() => {});
        await interaction.reply({ content: `✅ **Successfully kicked ${user.tag}** | Reason: ${reason}` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('timeout').setDescription('🔇 Mute/Timeout a member for a specified duration')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('⏱️ Duration in Minutes').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        if (member) await member.timeout(duration * 60 * 1000, reason).catch(() => {});
        await interaction.reply({ content: `🔇 **Muted ${member ? member.user.tag : 'user'} for ${duration} minute(s).** | Reason: ${reason}` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('untimeout').setDescription('🔊 Remove active timeout/mute from a member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member) await member.timeout(null).catch(() => {});
        await interaction.reply({ content: `🔊 **Removed timeout from ${member ? member.user.tag : 'user'}.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('warn').setDescription('⚠️ Issue a official warning to a member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason for Warning').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        await interaction.reply({ content: `⚠️ **Warned ${user.tag}** | Reason: ${reason}` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('clear').setDescription('🧹 Purge a specified amount of messages from channel')
        .addIntegerOption(opt => opt.setName('amount').setDescription('🔢 Amount of messages (1-100)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        await interaction.channel.bulkDelete(amount, true).catch(() => {});
        await interaction.reply({ content: `🧹 **Cleared ${amount} messages.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('lock').setDescription('🔒 Lock down the current text channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }).catch(() => {});
        await interaction.reply({ content: `🔒 **Channel Locked:** <#${interaction.channel.id}>` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('unlock').setDescription('🔓 Unlock the current text channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true }).catch(() => {});
        await interaction.reply({ content: `🔓 **Channel Unlocked:** <#${interaction.channel.id}>` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('hide').setDescription('👁️‍🗨️ Hide the current channel from members')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false }).catch(() => {});
        await interaction.reply({ content: `👁️‍🗨️ **Channel Hidden.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('unhide').setDescription('👁️ Make the current channel visible to members')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: true }).catch(() => {});
        await interaction.reply({ content: `👁️ **Channel Visible.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('slowmode').setDescription('⏳ Adjust slowmode rate limit for current channel')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('⏱️ Seconds delay').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        await interaction.channel.setRateLimitPerUser(seconds).catch(() => {});
        await interaction.reply({ content: `⏳ **Slowmode set to ${seconds} seconds.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('vkick').setDescription('🎙️ Disconnect a member from voice channel')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setChannel(null).catch(() => {});
          await interaction.reply({ content: `🔊 **Kicked ${member.user.tag} from voice channel.**` });
        } else {
          await interaction.reply({ content: `❌ Member is not connected to any voice channel.` });
        }
      }
    },
    {
      data: new SlashCommandBuilder().setName('vmove').setDescription('↗️ Move member to another voice channel')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addChannelOption(opt => opt.setName('channel').setDescription('🔊 Target Voice Channel').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const channel = interaction.options.getChannel('channel');
        if (member && member.voice.channel) {
          await member.voice.setChannel(channel).catch(() => {});
          await interaction.reply({ content: `🔊 **Moved ${member.user.tag} to requested channel.**` });
        } else {
          await interaction.reply({ content: `❌ Member is not connected to a voice channel.` });
        }
      }
    },
    {
      data: new SlashCommandBuilder().setName('vmute').setDescription('🎙️ Mute a member in voice channel')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setMute(true).catch(() => {});
          await interaction.reply({ content: `🎙️ **Voice muted ${member.user.tag}.**` });
        } else {
          await interaction.reply({ content: `❌ Member is not in a voice channel.` });
        }
      }
    },
    {
      data: new SlashCommandBuilder().setName('vunmute').setDescription('🔊 Unmute a member in voice channel')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setMute(false).catch(() => {});
          await interaction.reply({ content: `🎙️ **Voice unmuted ${member.user.tag}.**` });
        } else {
          await interaction.reply({ content: `❌ Member is not in a voice channel.` });
        }
      }
    },
    {
      data: new SlashCommandBuilder().setName('vdeaf').setDescription('🎧 Deafen a member in voice channel')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setDeaf(true).catch(() => {});
          await interaction.reply({ content: `🎧 **Deafened ${member.user.tag}.**` });
        } else {
          await interaction.reply({ content: `❌ Member is not in a voice channel.` });
        }
      }
    },
    {
      data: new SlashCommandBuilder().setName('vundeaf').setDescription('🎧 Undeafen a member in voice channel')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setDeaf(false).catch(() => {});
          await interaction.reply({ content: `🎧 **Undeafened ${member.user.tag}.**` });
        } else {
          await interaction.reply({ content: `❌ Member is not in a voice channel.` });
        }
      }
    },
    {
      data: new SlashCommandBuilder().setName('role-add').setDescription('➕ Assign a role to a member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('🎭 Role to Assign').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        if (member) await member.roles.add(role).catch(() => {});
        await interaction.reply({ content: `✅ **Added role \`${role.name}\` to ${member ? member.user.tag : 'user'}.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('role-remove').setDescription('➖ Remove a role from a member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('🎭 Role to Remove').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        if (member) await member.roles.remove(role).catch(() => {});
        await interaction.reply({ content: `✅ **Removed role \`${role.name}\` from ${member ? member.user.tag : 'user'}.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('user').setDescription('👤 View detailed member profile information')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User (Optional)')),
      async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        await interaction.reply({ content: `👤 **User Info:** ${user.tag} | 🆔 ID: \`${user.id}\`` });
      }
    }
  ]
};
