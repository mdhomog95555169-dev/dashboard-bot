const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Feeling lost?'),

  async execute(interaction) {
    // إمبد واحد بسيط ونظيف بدون إمبد داخلي وبدون DMs
    const mainEmbed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle('🛡️ Oscorp Control Systems - Help')
      .setDescription(
        '**Available Commands:**\n`ban`, `unban`, `kick`, `timeout`, `untimeout`, `warn`, `clear`, `lock`, `unlock`, `hide`, `unhide`, `slowmode`, `vkick`, `vmove`, `vmute`, `vunmute`, `vdeaf`, `vundeaf`, `role-add`, `role-remove`, `user`'
      )
      .setFooter({ text: 'Oscorp Control Systems' });

    // الرد المباشر في الشات دون إرسال أي شيء في الخاص
    return interaction.reply({
      embeds: [mainEmbed],
      ephemeral: true
    });
  }
};
