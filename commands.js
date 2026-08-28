const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  commands: [
    // 🎟️ 1. Ticket Setup Command
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

    // 📖 2. Help Command
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

    // 🧹 3. Clear Command (Deleting messages... -> Embed result)
    {
      data: new SlashCommandBuilder().setName('clear').setDescription('🧹 Purge specified amount of messages')
        .addIntegerOption(opt => opt.setName('amount').setDescription('🔢 Number of messages (1-100)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        
        // الرد الأولي كما في الصورة
        await interaction.reply({ content: 'Deleting messages ...' });

        // حذف الرسائل
        const deleted = await interaction.channel.bulkDelete(amount, true).catch(() => null);
        const count = deleted ? deleted.size : amount;

        const clearEmbed = new EmbedBuilder()
          .setDescription(`\`\`\`${count} messages have been deleted.\`\`\``)
          .setColor('#2f3136');

        // التعديل للإمبد التفاعلي المتناسق
        await interaction.editReply({ content: null, embeds: [clearEmbed] });
      }
    },

    // 🔨 Ban Command
    {
      data: new SlashCommandBuilder().setName('ban').setDescription('🔨 Ban a user permanently')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        await interaction.guild.members.ban(user, { reason }).catch(() => {});
        
        const embed = new EmbedBuilder()
          .setTitle('🔨 Member Banned')
          .setDescription(`User **${user.tag}** has been banned.\n**Reason:** ${reason}`)
          .setColor('#ed4245');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔓 Unban Command
    {
      data: new SlashCommandBuilder().setName('unban').setDescription('🔓 Unban a user by ID')
        .addStringOption(opt => opt.setName('userid').setDescription('🆔 User ID').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      async execute(interaction) {
        const userId = interaction.options.getString('userid');
        await interaction.guild.members.unban(userId).catch(() => {});
        
        const embed = new EmbedBuilder()
          .setTitle('🔓 Member Unbanned')
          .setDescription(`User ID \`${userId}\` has been unbanned.`)
          .setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 👢 Kick Command
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

        const embed = new EmbedBuilder()
          .setTitle('👢 Member Kicked')
          .setDescription(`User **${user.tag}** was kicked.\n**Reason:** ${reason}`)
          .setColor('#fee75c');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔇 Timeout Command
    {
      data: new SlashCommandBuilder().setName('timeout').setDescription('🔇 Timeout/Mute a member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('⏱️ Duration in Minutes').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        if (member) await member.timeout(duration * 60 * 1000, reason).catch(() => {});

        const embed = new EmbedBuilder()
          .setTitle('🔇 Member Timed Out')
          .setDescription(`**${member ? member.user.tag : 'User'}** has been muted for **${duration} minute(s)**.\n**Reason:** ${reason}`)
          .setColor('#ed4245');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔊 Untimeout Command
    {
      data: new SlashCommandBuilder().setName('untimeout').setDescription('🔊 Remove timeout from a member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member) await member.timeout(null).catch(() => {});

        const embed = new EmbedBuilder()
          .setTitle('🔊 Timeout Removed')
          .setDescription(`Timeout removed for **${member ? member.user.tag : 'User'}**.`)
          .setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // ⚠️ Warn Command
    {
      data: new SlashCommandBuilder().setName('warn').setDescription('⚠️ Issue warning to a member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('📝 Reason').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        const embed = new EmbedBuilder()
          .setTitle('⚠️ Member Warned')
          .setDescription(`Warning issued to **${user.tag}**.\n**Reason:** ${reason}`)
          .setColor('#fee75c');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔒 Lock Command
    {
      data: new SlashCommandBuilder().setName('lock').setDescription('🔒 Lock text channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }).catch(() => {});

        const embed = new EmbedBuilder()
          .setTitle('🔒 Channel Locked')
          .setDescription(`Channel <#${interaction.channel.id}> is now locked.`)
          .setColor('#ed4245');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🔓 Unlock Command
    {
      data: new SlashCommandBuilder().setName('unlock').setDescription('🔓 Unlock text channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true }).catch(() => {});

        const embed = new EmbedBuilder()
          .setTitle('🔓 Channel Unlocked')
          .setDescription(`Channel <#${interaction.channel.id}> is now unlocked.`)
          .setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 👁️‍🗨️ Hide Command
    {
      data: new SlashCommandBuilder().setName('hide').setDescription('👁️‍🗨️ Hide channel from members')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false }).catch(() => {});

        const embed = new EmbedBuilder()
          .setTitle('👁️‍🗨️ Channel Hidden')
          .setDescription(`This channel is now hidden.`)
          .setColor('#2f3136');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 👁️ Unhide Command
    {
      data: new SlashCommandBuilder().setName('unhide').setDescription('👁️ Make channel visible')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: true }).catch(() => {});

        const embed = new EmbedBuilder()
          .setTitle('👁️ Channel Visible')
          .setDescription(`This channel is now visible to members.`)
          .setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // ⏳ Slowmode Command
    {
      data: new SlashCommandBuilder().setName('slowmode').setDescription('⏳ Set channel slowmode seconds')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('⏱️ Seconds').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        await interaction.channel.setRateLimitPerUser(seconds).catch(() => {});

        const embed = new EmbedBuilder()
          .setTitle('⏳ Slowmode Updated')
          .setDescription(`Channel slowmode set to **${seconds} seconds**.`)
          .setColor('#5865f2');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 🎙️ VKick Command
    {
      data: new SlashCommandBuilder().setName('vkick').setDescription('🎙️ Kick user from voice channel')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setChannel(null).catch(() => {});
          const embed = new EmbedBuilder()
            .setTitle('🎙️ Voice Kick')
            .setDescription(`Disconnected **${member.user.tag}** from voice.`)
            .setColor('#ed4245');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ Member is not connected to any voice channel.', ephemeral: true });
        }
      }
    },

    // ↗️ VMove Command
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
          const embed = new EmbedBuilder()
            .setTitle('↗️ Voice Move')
            .setDescription(`Moved **${member.user.tag}** to <#${channel.id}>.`)
            .setColor('#5865f2');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ Member is not in a voice channel.', ephemeral: true });
        }
      }
    },

    // 🎙️ VMute Command
    {
      data: new SlashCommandBuilder().setName('vmute').setDescription('🎙️ Mute member in voice')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setMute(true).catch(() => {});
          const embed = new EmbedBuilder()
            .setTitle('🎙️ Voice Mute')
            .setDescription(`Muted **${member.user.tag}** in voice.`)
            .setColor('#ed4245');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ Member is not in a voice channel.', ephemeral: true });
        }
      }
    },

    // 🔊 VUnmute Command
    {
      data: new SlashCommandBuilder().setName('vunmute').setDescription('🔊 Unmute member in voice')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setMute(false).catch(() => {});
          const embed = new EmbedBuilder()
            .setTitle('🔊 Voice Unmute')
            .setDescription(`Unmuted **${member.user.tag}** in voice.`)
            .setColor('#57f287');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ Member is not in a voice channel.', ephemeral: true });
        }
      }
    },

    // 🎧 VDeaf Command
    {
      data: new SlashCommandBuilder().setName('vdeaf').setDescription('🎧 Deafen member in voice')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setDeaf(true).catch(() => {});
          const embed = new EmbedBuilder()
            .setTitle('🎧 Voice Deafen')
            .setDescription(`Deafened **${member.user.tag}** in voice.`)
            .setColor('#ed4245');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ Member is not in a voice channel.', ephemeral: true });
        }
      }
    },

    // 🎧 VUndeaf Command
    {
      data: new SlashCommandBuilder().setName('vundeaf').setDescription('🎧 Undeafen member in voice')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (member && member.voice.channel) {
          await member.voice.setDeaf(false).catch(() => {});
          const embed = new EmbedBuilder()
            .setTitle('🎧 Voice Undeafen')
            .setDescription(`Undeafened **${member.user.tag}** in voice.`)
            .setColor('#57f287');
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ content: '❌ Member is not in a voice channel.', ephemeral: true });
        }
      }
    },

    // ➕ Role Add Command
    {
      data: new SlashCommandBuilder().setName('role-add').setDescription('➕ Add role to member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('🎭 Role').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        if (member) await member.roles.add(role).catch(() => {});

        const embed = new EmbedBuilder()
          .setTitle('➕ Role Added')
          .setDescription(`Role **${role.name}** added to **${member ? member.user.tag : 'User'}**.`)
          .setColor('#57f287');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // ➖ Role Remove Command
    {
      data: new SlashCommandBuilder().setName('role-remove').setDescription('➖ Remove role from member')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('🎭 Role').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        if (member) await member.roles.remove(role).catch(() => {});

        const embed = new EmbedBuilder()
          .setTitle('➖ Role Removed')
          .setDescription(`Role **${role.name}** removed from **${member ? member.user.tag : 'User'}**.`)
          .setColor('#ed4245');
        await interaction.reply({ embeds: [embed] });
      }
    },

    // 👤 User Info Command
    {
      data: new SlashCommandBuilder().setName('user').setDescription('👤 View member profile & ID')
        .addUserOption(opt => opt.setName('user').setDescription('👤 Target User')),
      async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;

        const embed = new EmbedBuilder()
          .setTitle('👤 User Profile')
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: 'User Tag', value: `${user.tag}`, inline: true },
            { name: 'User ID', value: `\`${user.id}\``, inline: true }
          )
          .setColor('#2f3136');
        await interaction.reply({ embeds: [embed] });
      }
    }
  ]
};
