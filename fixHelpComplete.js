const fs = require('fs');

const helpCode = `const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ComponentType } = require('discord.js');

// 1. القائمة الرئيسية الشاملة
function buildMainEmbed() {
  return new EmbedBuilder()
    .setTitle('⚡ OS System — Control Center')
    .setDescription('> **مرحباً بك في لوحة تحكم OS.**\\n> اختر القسم المطلوب من القائمة بالأسفل لفرز الأوامر.')
    .addFields(
      { name: '✈️ ban', value: 'حظر عضو من السيرفر', inline: true },
      { name: '🔓 unban', value: 'فك الحظر بواسطة ID', inline: true },
      { name: '🧹 clear', value: 'مسح عدد من الرسائل', inline: true },
      { name: '🔒 lock', value: 'قفل القناة الحالية', inline: true },
      { name: '🔓 unlock', value: 'فتح القناة الحالية', inline: true },
      { name: '🔇 mute', value: 'إعطاء ميوت للمستخدم', inline: true },
      { name: '🔊 unmute', value: 'فك الميوت عن المستخدم', inline: true },
      { name: '🏷️ setnick', value: 'تغيير لقب المستخدم', inline: true },
      { name: '📊 info', value: 'عرض إحصائيات السيرفر', inline: true },
      { name: '⚙️ help', value: 'عرض قائمة المساعدة', inline: true }
    )
    .setColor('#2f3136')
    .setFooter({ text: 'OS System Engine' });
}

function buildMenuRow() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_menu_select')
      .setPlaceholder('🔽 اختر القسم لعرض الأوامر... ✨')
      .addOptions([
        { label: 'الرئيسية (عرض الكل)', value: 'all_category', emoji: '📜' },
        { label: 'أوامر الإدارة', value: 'mod_category', emoji: '🛡️' },
        { label: 'الأوامر العامة والمعلومات', value: 'general_category', emoji: '🌐' }
      ])
  );
}

module.exports = {
  name: 'help',
  aliases: ['م', 'مساعدة'],
  description: 'عرض قائمة المساعدة',

  async execute(message) {
    const mainEmbed = buildMainEmbed();
    const row = buildMenuRow();

    const replyMsg = await message.reply({ embeds: [mainEmbed], components: [row] });

    const collector = replyMsg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000
    });

    collector.on('collect', async i => {
      if (i.user.id !== message.author.id) {
        return i.reply({ content: 'عذراً، هذه القائمة خاصة بكاتب الأمر فقط!', ephemeral: true });
      }

      let newEmbed = new EmbedBuilder().setColor('#2f3136').setFooter({ text: 'OS System Engine' });
      const selected = i.values[0];

      if (selected === 'mod_category') {
        newEmbed.setTitle('🛡️ أوامر الإدارة المكتملة').addFields(
          { name: '✈️ ban', value: 'حظر عضو من السيرفر' },
          { name: '🔓 unban', value: 'فك الحظر بواسطة ID' },
          { name: '🧹 clear / مسح', value: 'مسح عدد من الرسائل' },
          { name: '🔒 lock', value: 'قفل القناة الحالية' },
          { name: '🔓 unlock', value: 'فتح القناة الحالية' },
          { name: '🔇 mute', value: 'إعطاء ميوت للمستخدم' },
          { name: '🔊 unmute', value: 'فك الميوت عن المستخدم' },
          { name: '🏷️ setnick', value: 'تغيير لقب المستخدم' }
        );
      } else if (selected === 'general_category') {
        newEmbed.setTitle('🌐 الأوامر العامة والمعلومات').addFields(
          { name: '⚙️ help / م', value: 'عرض قائمة المساعدة' },
          { name: '📊 info / سيرفر', value: 'عرض إحصائيات السيرفر والأعضاء' }
        );
      } else {
        newEmbed = buildMainEmbed();
      }

      await i.update({ embeds: [newEmbed], components: [row] });
    });
  }
};
`;

// تحديث ملف help.js في جميع المسارات المحتملة
fs.writeFileSync('help.js', helpCode);
if (fs.existsSync('src/commands')) fs.writeFileSync('src/commands/help.js', helpCode);
if (fs.existsSync('commands')) fs.writeFileSync('commands/help.js', helpCode);

console.log('✅ Updated help.js with all moderation & general commands in dropdown menus.');
