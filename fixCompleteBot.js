const fs = require('fs');
const path = require('path');

// 1. كود ملف help.js المطور
const helpCode = `const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ComponentType } = require('discord.js');

function buildHelpPayload() {
  const embed = new EmbedBuilder()
    .setTitle('⚡ OS System — Control Center')
    .setDescription('> **مرحباً بك في لوحة تحكم OS.**\\n> اختر القسم المطلوب من القائمة بالأسفل.')
    .addFields(
      { name: '✈️ ban', value: 'حظر عضو من السيرفر' },
      { name: '🔓 unban', value: 'فك الحظر بواسطة ID' },
      { name: '🧹 clear', value: 'مسح عدد من الرسائل' },
      { name: '🔒 lock', value: 'قفل القناة الحالية' },
      { name: '🔓 unlock', value: 'فتح القناة الحالية' },
      { name: '🔇 mute', value: 'إعطاء ميوت للمستخدم' },
      { name: '🔊 unmute', value: 'فك الميوت عن المستخدم' },
      { name: '🏷️ setnick', value: 'تغيير لقب المستخدم' },
      { name: '⚙️ help', value: 'عرض قائمة المساعدة' }
    )
    .setColor('#2f3136')
    .setFooter({ text: 'OS System Engine' });

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_menu_select')
      .setPlaceholder('🔽 اختر القسم... ✨')
      .addOptions([
        { label: 'أوامر الإدارة', value: 'mod_category', emoji: '🛡️' },
        { label: 'الأوامر العامة', value: 'general_category', emoji: '🌐' }
      ])
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  name: 'help',
  aliases: ['م', 'مساعدة'],
  description: 'عرض قائمة المساعدة',

  async execute(message) {
    const payload = buildHelpPayload();
    const replyMsg = await message.reply(payload);
    
    const collector = replyMsg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 120000 });
    collector.on('collect', async i => {
      if (i.user.id !== message.author.id) {
        return i.reply({ content: 'عذراً، هذه القائمة خاصة بكاتب الأمر فقط!', ephemeral: true });
      }
      let newEmbed = new EmbedBuilder().setColor('#2f3136').setFooter({ text: 'OS System Engine' });
      if (i.values[0] === 'mod_category') {
        newEmbed.setTitle('🛡️ أوامر الإدارة').addFields(
          { name: '✈️ ban', value: 'حظر عضو من السيرفر' },
          { name: '🔓 unban', value: 'فك الحظر بواسطة ID' },
          { name: '🧹 clear', value: 'مسح عدد من الرسائل' },
          { name: '🔒 lock', value: 'قفل القناة الحالية' },
          { name: '🔓 unlock', value: 'فتح القناة الحالية' }
        );
      } else {
        newEmbed.setTitle('🌐 الأوامر العامة').addFields({ name: '⚙️ help', value: 'عرض قائمة المساعدة' });
      }
      await i.update({ embeds: [newEmbed], components: payload.components });
    });
  },

  async executeSlash(interaction) {
    await interaction.deferReply();
    const payload = buildHelpPayload();
    const responseMsg = await interaction.editReply(payload);

    const collector = responseMsg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 120000 });
    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'عذراً، هذه القائمة خاصة بكاتب الأمر فقط!', ephemeral: true });
      }
      let newEmbed = new EmbedBuilder().setColor('#2f3136').setFooter({ text: 'OS System Engine' });
      if (i.values[0] === 'mod_category') {
        newEmbed.setTitle('🛡️ أوامر الإدارة').addFields(
          { name: '✈️ ban', value: 'حظر عضو من السيرفر' },
          { name: '🔓 unban', value: 'فك الحظر بواسطة ID' },
          { name: '🧹 clear', value: 'مسح عدد من الرسائل' },
          { name: '🔒 lock', value: 'قفل القناة الحالية' },
          { name: '🔓 unlock', value: 'فتح القناة الحالية' }
        );
      } else {
        newEmbed.setTitle('🌐 الأوامر العامة').addFields({ name: '⚙️ help', value: 'عرض قائمة المساعدة' });
      }
      await i.update({ embeds: [newEmbed], components: payload.components });
    });
  }
};
`;

fs.writeFileSync('help.js', helpCode);
if (fs.existsSync('src/commands')) fs.writeFileSync('src/commands/help.js', helpCode);
if (fs.existsSync('commands')) fs.writeFileSync('commands/help.js', helpCode);

console.log('✅ Synchronized help command files.');
