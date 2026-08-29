const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Feeling lost?')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('اسم الأمر للحصول على شرح')
        .setRequired(false)
    ),

  async execute(interaction) {
    const commandName = interaction.options.getString('command');

    // الإمبد الرئيسي الشامل والنظيف
    const mainEmbed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle('🛡️ Oscorp Control Systems - Help')
      .setDescription(
        '**Available Commands:**\n`ban`, `unban`, `kick`, `timeout`, `untimeout`, `warn`, `clear`, `lock`, `unlock`, `hide`, `unhide`, `slowmode`, `vkick`, `vmove`, `vmute`, `vunmute`, `vdeaf`, `vundeaf`, `role-add`, `role-remove`, `user`'
      )
      .setFooter({ text: 'Oscorp Control Systems' });

    // الرد في نفس الروم بدون إرسال أي شيء في الخاص
    return interaction.reply({
      embeds: [mainEmbed],
      ephemeral: true // مخفي للمستخدم في نفس الروم وبدون DMs
    });
  }
};
