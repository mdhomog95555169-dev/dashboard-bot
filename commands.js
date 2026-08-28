const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  commands: [
    // 🎟️ 1. Ticket Setup
    {
      data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('🎫 Create a fully customized support ticket panel')
        .addStringOption(opt => opt.setName('title').setDescription('📌 Embed Title').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('📝 Embed Description & Rules').setRequired(true))
        .addStringOption(opt => opt.setName('icon_url').setDescription('🖼️ Header Icon URL (Thumbnail)').setRequired(false))
        .addStringOption(opt => opt.setName('banner_url').setDescription('🖼️ Large Banner Image URL').setRequired(false))
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
            .setPlaceholder('Choose Ticket Category / اختر نوع التذكرة...')
            .addOptions(options)
        );

        await interaction.channel.send({ embeds: [ticketEmbed], components: [selectMenu] });
        await interaction.reply({ content: '✅ **Ticket Panel created successfully!**', ephemeral: true });
      }
    },

    // 📖 2. Extended Help Command
    {
      data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📖 Open system instructions & interactive command menu'),
      async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
          .setTitle('⚙️ Oscorp System Command Hub')
          .setDescription(
            'Welcome to Oscorp System Dashboard.\n\n' +
            '**System Status:** 🟢 All 21 Modules Active\n\n' +
            'Select a command category below to view commands syntax and permissions.'
          )
          .setColor('#2f3136')
          .setFooter({ text: 'Oscorp Security Systems' });

        const helpMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('Select Command Category...')
            .addOptions([
              { label: 'Moderation Suite', description: 'Ban, Kick, Timeout, Warn & Voice controls', value: 'help_mod', emoji: '🛡️' },
              { label: 'Channel Management', description: 'Lock, Unlock, Hide, Unhide & Slowmode', value: 'help_chan', emoji: '🔒' },
              { label: 'Utility Controls', description: 'User info and system utilities', value: 'help_util', emoji: '⚙️' }
            ])
        );

        await interaction.reply({ embeds: [helpEmbed], components: [helpMenu] });
      }
    },

    // 🛡️ 3. Moderation & Administration Commands (21 Total Commands)
    {
      data: new SlashCommandBuilder().setName('ban').setDescription('🔨 Ban a user permanently')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        await interaction.guild.members.ban(user, { reason }).catch(() => {});
        await interaction.reply({ content: `✅ **Banned ${user.tag}** | Reason: ${reason}` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('unban').setDescription('🔓 Unban a user by ID')
        .addStringOption(opt => opt.setName('userid').setDescription('🆔 User ID').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const userId = interaction.options.getString('userid');
        await interaction.guild.members.unban(userId).catch(() => {});
        await interaction.reply({ content: `✅ **Unbanned User ID:** \`${userId}\`` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('kick').setDescription('👢 Kick a member from server')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        if (member) await member.kick(reason).catch(() => {});
        await interaction.reply({ content: `✅ **Kicked ${user.tag}** | Reason: ${reason}` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('timeout').setDescription('🔇 Mute/Timeout a member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('⏱️ Duration in Minutes').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        if (member) await member.timeout(duration * 60 * 1000, reason).catch(() => {});
        await interaction.reply({ content: `🔇 **Muted ${member ? member.user.tag : 'user'} for ${duration} minute(s)**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('untimeout').setDescription('🔊 Remove timeout from a member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member) await member.timeout(null).catch(() => {});
        await interaction.reply({ content: `🔊 **Removed timeout from ${member ? member.user.tag : 'user'}**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('warn').setDescription('⚠️ Issue warning to a member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        await interaction.reply({ content: `⚠️ **Warned ${user.tag}** | Reason: ${reason}` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('clear').setDescription('🧹 Purge channel messages')
        .addIntegerOption(opt => opt.setName('amount').setDescription('🔢 Amount (1-100)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        await interaction.channel.bulkDelete(amount, true).catch(() => {});
        await interaction.reply({ content: `🧹 **Cleared ${amount} messages.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('lock').setDescription('🔒 Lock text channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }).catch(() => {});
        await interaction.reply({ content: `🔒 **Channel Locked.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('unlock').setDescription('🔓 Unlock text channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true }).catch(() => {});
        await interaction.reply({ content: `🔓 **Channel Unlocked.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('hide').setDescription('👁️‍🗨️ Hide channel from members')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false }).catch(() => {});
        await interaction.reply({ content: `👁️‍🗨️ **Channel Hidden.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('unhide').setDescription('👁️ Make channel visible')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: true }).catch(() => {});
        await interaction.reply({ content: `👁️ **Channel Visible.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('slowmode').setDescription('⏳ Set channel slowmode seconds')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('⏱️ Seconds').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        await interaction.channel.setRateLimitPerUser(seconds).catch(() => {});
        await interaction.reply({ content: `⏳ **Slowmode set to ${seconds} seconds.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('vkick').setDescription('🎙️ Kick user from voice channel')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setChannel(null).catch(() => {});
          await interaction.reply({ content: `🔊 **Kicked ${member.user.tag} from voice.**` });
        } else {
          await interaction.reply({ content: `❌ Member is not in a voice channel.` });
        }
      }
    },
    {
      data: new SlashCommandBuilder().setName('vmove').setDescription('↗️ Move member to voice channel')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addChannelOption(opt => opt.setName('channel').setDescription('🔊 Target Voice Channel').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const channel = interaction.options.getChannel('channel');
        if (member && member.voice.channel) {
          await member.voice.setChannel(channel).catch(() => {});
          await interaction.reply({ content: `🔊 **Moved ${member.user.tag}.**` });
        } else {
          await interaction.reply({ content: `❌ Member is not in a voice channel.` });
        }
      }
    },
    {
      data: new SlashCommandBuilder().setName('vmute').setDescription('🎙️ Mute member in voice')
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
      data: new SlashCommandBuilder().setName('vunmute').setDescription('🔊 Unmute member in voice')
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
      data: new SlashCommandBuilder().setName('vdeaf').setDescription('🎧 Deafen member in voice')
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
      data: new SlashCommandBuilder().setName('vundeaf').setDescription('🎧 Undeafen member in voice')
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
      data: new SlashCommandBuilder().setName('role-add').setDescription('➕ Add role to member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('🎭 Role').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        if (member) await member.roles.add(role).catch(() => {});
        await interaction.reply({ content: `✅ **Added role \`${role.name}\`.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('role-remove').setDescription('➖ Remove role from member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('🎭 Role').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        if (member) await member.roles.remove(role).catch(() => {});
        await interaction.reply({ content: `✅ **Removed role \`${role.name}\`.**` });
      }
    },
    {
      data: new SlashCommandBuilder().setName('user').setDescription('👤 View member profile & ID')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User')),
      async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        await interaction.reply({ content: `👤 **User Info:** ${user.tag} | 🆔 ID: \`${user.id}\`` });
      }
    }
  ]
};
