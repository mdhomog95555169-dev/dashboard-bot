const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  commands: [
    {
      data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('فحص سرعة استجابة البوت'),
      async execute(interaction) {
        await interaction.reply({ content: `🏓 Pong! ${interaction.client.ws.ping}ms`, ephemeral: true });
      }
    },
    {
      data: new SlashCommandBuilder()
        .setName('vkick')
        .setDescription('طرد عضو من الروم الصوتي')
        .addUserOption(opt => opt.setName('target').setDescription('العضو المراد طرده').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
      async execute(interaction) {
        const member = interaction.options.getMember('target');
        if (!member || !member.voice.channel) {
          return interaction.reply({ content: '❌ العضو ليس متواجد في روم صوتي حالياً!', ephemeral: true });
        }
        await member.voice.setChannel(null);
        await interaction.reply({ content: `✅ تم طرد ${member.user.tag} من الروم الصوتي.` });
      }
    }
  ]
};
