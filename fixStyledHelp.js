const fs = require('fs');

const helpCode = `const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ComponentType } = require('discord.js');

// 1. بناء التصميم المطابق للشرائط والأشكال بالصورة
function buildMainEmbed(client) {
  return new EmbedBuilder()
    .setTitle('⚡ OS System — Control Center')
    .setDescription(
      '> **مرحباً بك في لوحة تحكم OS.**\\n' +
      '> اختر القسم المطلوب من القائمة بالأسفل.\\n\\n' +
      '✈️ \` /ban \`\\n' +
      '> حظر عضو من السيرفر\\n\\n' +
      '🔓 \` /unban \`\\n' +
      '> فك الحظر بواسطة ID\\n\\n' +
      '🧹 \` /clear \`\\n' +
      '> مسح عدد من الرسائل\\n\\n' +
      '🔒 \` /lock \`\\n' +
      '> قفل القناة الحالية\\n\\n' +
      '🔓 \` /unlock \`\\n' +
      '> فتح القناة الحالية\\n\\n' +
      '🔇 \` /mute \`\\n' +
      '> إعطاء ميوت للمستخدم\\n\\n' +
      '🔊 \` /unmute \`\\n' +
      '> فك الميوت عن المستخدم\\n\\n' +
      '🏷️ \` /setnick \`\\n' +
      '> تغيير لقب المستخدم\\n\\n' +
      '⚙️ \` /help \`\\n' +
      '> عرض قائمة المساعدة'
    )
    .setColor('#2b2d31')
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({ text: 'OS System Engine', iconURL: client.user.displayAvatarURL() });
}

function buildMenuRow() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_menu_select')
      .setPlaceholder('✨ ...اختر القسم')
      .addOptions([
        { label: 'أوامر الإدارة', value: 'mod_category', emoji: '🛡️' },
        { label: 'الأوامر العامة', value: 'general_category', emoji: '🌐' }
      ])
  );
}

module.exports = {
  name: 'help',
  aliases: ['م', 'مساعدة'],
  description: 'عرض قائمة المساعدة',

  async execute(message) {
    const client = message.client;
    const mainEmbed = buildMainEmbed(client);
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

      const selected = i.values[0];
      let newEmbed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({ text: 'OS System Engine', iconURL: client.user.displayAvatarURL() });

      if (selected === 'mod_category') {
        newEmbed.setTitle('🛡️ أوامر الإدارة').setDescription(
          '✈️ \` /ban \`\\n> حظر عضو من السيرفر\\n\\n' +
          '🔓 \` /unban \`\\n> فك الحظر بواسطة ID\\n\\n' +
          '🧹 \` /clear \`\\n> مسح عدد من الرسائل\\n\\n' +
          '🔒 \` /lock \`\\n> قفل القناة الحالية\\n\\n' +
          '🔓 \` /unlock \`\\n> فتح القناة الحالية\\n\\n' +
          '🔇 \` /mute \`\\n> إعطاء ميوت للمستخدم\\n\\n' +
          '🔊 \` /unmute \`\\n> فك الميوت عن المستخدم\\n\\n' +
          '🏷️ \` /setnick \`\\n> تغيير لقب المستخدم'
        );
      } else if (selected === 'general_category') {
        newEmbed.setTitle('🌐 الأوامر العامة').setDescription(
          '⚙️ \` /help \`\\n> عرض قائمة المساعدة\\n\\n' +
          '📊 \` /info \`\\n> عرض إحصائيات السيرفر'
        );
      } else {
        newEmbed = buildMainEmbed(client);
      }

      await i.update({ embeds: [newEmbed], components: [row] });
    });
  }
};
`;

// حفظ التحديث على جميع الملفات الممكنة
fs.writeFileSync('help.js', helpCode);
if (fs.existsSync('src/commands')) fs.writeFileSync('src/commands/help.js', helpCode);
if (fs.existsSync('commands')) fs.writeFileSync('commands/help.js', helpCode);

console.log('✅ Applied exact visual style with blockquotes and inline code tags.');
