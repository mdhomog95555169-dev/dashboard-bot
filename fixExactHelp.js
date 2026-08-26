const fs = require('fs');
const path = require('path');

const exactHelpCode = `const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ComponentType } = require('discord.js');

module.exports = {
  name: 'help',
  aliases: ['م', 'مساعدة'],
  description: 'عرض قائمة المساعدة',
  async execute(message, args) {
    const mainEmbed = new EmbedBuilder()
      .setTitle('⚡ OS System — Control Center')
      .setDescription('> **مرحباً بك في لوحة تحكم OS.**\\n> اختر القسم المطلوب من القائمة بالأسفل.')
      .addFields(
        { name: '✈️ /ban', value: 'حظر عضو من السيرفر' },
        { name: '🔓 /unban', value: 'فك الحظر بواسطة ID' },
        { name: '🧹 /clear', value: 'مسح عدد من الرسائل' },
        { name: '🔒 /lock', value: 'قفل القناة الحالية' },
        { name: '🔓 /unlock', value: 'فتح القناة الحالية' },
        { name: '🔇 /mute', value: 'إعطاء ميوت للمستخدم' },
        { name: '🔊 /unmute', value: 'فك الميوت عن المستخدم' },
        { name: '🏷️ /setnick', value: 'تغيير لقب المستخدم' },
        { name: '⚙️ /help', value: 'عرض قائمة المساعدة' }
      )
      .setColor('#2f3136')
      .setFooter({ text: 'OS System Engine' });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_menu_select')
      .setPlaceholder('🔽 اختر القسم... ✨')
      .addOptions([
        { label: 'أوامر الإدارة', value: 'mod_category', emoji: '🛡️' },
        { label: 'الأوامر العامة', value: 'general_category', emoji: '🌐' }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const responseMsg = await message.reply({ embeds: [mainEmbed], components: [row] });

    const collector = responseMsg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 120000 });

    collector.on('collect', async i => {
      if (i.user.id !== message.author.id) {
        return i.reply({ content: 'عذراً، هذه القائمة خاصة بكاتب الأمر فقط!', ephemeral: true });
      }

      let newEmbed = new EmbedBuilder().setColor('#2f3136').setFooter({ text: 'OS System Engine' });

      if (i.values[0] === 'mod_category') {
        newEmbed.setTitle('🛡️ أوامر الإدارة')
          .addFields(
            { name: '✈️ /ban', value: 'حظر عضو من السيرفر' },
            { name: '🔓 /unban', value: 'فك الحظر بواسطة ID' },
            { name: '🧹 /clear', value: 'مسح عدد من الرسائل' },
            { name: '🔒 /lock', value: 'قفل القناة الحالية' },
            { name: '🔓 /unlock', value: 'فتح القناة الحالية' },
            { name: '🔇 /mute', value: 'إعطاء ميوت للمستخدم' },
            { name: '🔊 /unmute', value: 'فك الميوت عن المستخدم' },
            { name: '🏷️ /setnick', value: 'تغيير لقب المستخدم' }
          );
      } else if (i.values[0] === 'general_category') {
        newEmbed.setTitle('🌐 الأوامر العامة')
          .addFields(
            { name: '⚙️ /help', value: 'عرض قائمة المساعدة' }
          );
      }

      await i.update({ embeds: [newEmbed], components: [row] });
    });
  }
};
`;

const targetDirs = ['src/commands', 'commands', 'src/cmds'];
targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.writeFileSync(path.join(dir, 'help.js'), exactHelpCode);
  }
});
fs.writeFileSync('help.js', exactHelpCode);

if (fs.existsSync('bot.js')) {
  let code = fs.readFileSync('bot.js', 'utf8');
  code = code.replace(/if\s*\(commandName === 'help'[\s\S]*?\}\n/g, '');
  fs.writeFileSync('bot.js', code);
}

console.log('✅ Updated help.js successfully!');
