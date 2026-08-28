const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  getHelpEmbed: () => {
    const embed = new EmbedBuilder()
      .setTitle('✨ مركز المساعدة والدعم - Oscorp System')
      .setDescription('أهلاً بك! استخدم القائمة السفلية للتنقل بين الأوامر والتعرف على كافة مميزات البوت.')
      .setColor('#5865F2')
      .addFields(
        { name: '🛡️ أوامر الإدارة والإشراف', value: '`/ban`, `/kick`, `/timeout`, `/untimeout`, `/clear`, `/lock`, `/unlock`, `/hide`, `/show`', inline: false },
        { name: '🔊 أوامر الرومات الصوتية', value: '`/vkick`, `/vmove`, `/vmute`, `/vunmute`', inline: false },
        { name: '👤 أوامر الأعضاء والسيرفر', value: '`/userinfo`, `/serverinfo`, `/avatar`, `/server-icon`, `/role-add`, `/role-remove`, `/setnick`', inline: false }
      )
      .setFooter({ text: 'Oscorp System • اختر القسم المطلوبة من القائمة' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_category')
        .setPlaceholder('اختر القسم للمزيد من التفاصيل...')
        .addOptions([
          { label: 'الأوامر الإدارية', description: 'عرض أساليب الحظر، المسح والقفل', value: 'admin_cmds', emoji: '🛡️' },
          { label: 'الأوامر الصوتية', description: 'إدارة الأعضاء في الرومات الصوتية', value: 'voice_cmds', emoji: '🔊' },
          { label: 'أوامر التفاعل والمعلومات', description: 'معلومات السيرفر، الأعضاء والصور', value: 'info_cmds', emoji: '👤' }
        ])
    );

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('لوحة التحكم (Dashboard)')
        .setStyle(ButtonStyle.Link)
        .setURL('https://dashboard-bot.onrender.com/dashboard'),
      new ButtonBuilder()
        .setLabel('الدعم الفني')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/')
    );

    return { embeds: [embed], components: [row, buttons] };
  }
};
