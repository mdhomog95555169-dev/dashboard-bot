const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'info',
  aliases: ['معلومات', 'سيرفر'],
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle(`📊 إحصائيات ${message.guild.name}`)
      .addFields(
        { name: '👥 عدد الأعضاء', value: `${message.guild.memberCount}`, inline: true },
        { name: '🆔 معرف الخادم', value: `${message.guild.id}`, inline: true }
      )
      .setColor('#5865F2')
      .setFooter({ text: 'OS System — Probot Core' });
    
    await message.reply({ embeds: [embed] });
  }
};
