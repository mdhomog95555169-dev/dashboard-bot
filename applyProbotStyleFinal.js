const fs = require('fs');

// 1. تحديث help.js
const helpCode = `const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ComponentType } = require('discord.js');

function buildMainEmbed(client) {
  return new EmbedBuilder()
    .setTitle('⚡ OS System — Control Center')
    .setDescription(
      '> **مرحباً بك في لوحة تحكم OS.**\\n' +
      '> اختر القسم المطلوب من القائمة بالأسفل.\\n\\n' +
      '✈️ \` -ban \`\\n> حظر عضو من السيرفر\\n\\n' +
      '🔓 \` -unban \`\\n> فك الحظر بواسطة ID\\n\\n' +
      '🧹 \` -clear \`\\n> مسح عدد من الرسائل\\n\\n' +
      '🔒 \` -lock \`\\n> قفل القناة الحالية\\n\\n' +
      '🔓 \` -unlock \`\\n> فتح القناة الحالية\\n\\n' +
      '🔇 \` -mute \`\\n> إعطاء ميوت للمستخدم\\n\\n' +
      '🔊 \` -unmute \`\\n> فك الميوت عن المستخدم\\n\\n' +
      '🏷️ \` -setnick \`\\n> تغيير لقب المستخدم\\n\\n' +
      '⚙️ \` -help \`\\n> عرض قائمة المساعدة'
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
  aliases: ['مساعدة'],
  async execute(message) {
    const client = message.client;
    const mainEmbed = buildMainEmbed(client);
    const row = buildMenuRow();

    // إرسال رد بدون منشن بدون شريط أصفر (allowedMentions)
    const replyMsg = await message.channel.send({
      embeds: [mainEmbed],
      components: [row],
      allowedMentions: { repliedUser: false }
    });

    const collector = replyMsg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000
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
          '✈️ \` -ban \`\\n> حظر عضو من السيرفر\\n\\n' +
          '🔓 \` -unban \`\\n> فك الحظر بواسطة ID\\n\\n' +
          '🧹 \` -clear \`\\n> مسح عدد من الرسائل\\n\\n' +
          '🔒 \` -lock \`\\n> قفل القناة الحالية\\n\\n' +
          '🔓 \` -unlock \`\\n> فتح القناة الحالية\\n\\n' +
          '🔇 \` -mute \`\\n> إعطاء ميوت للمستخدم\\n\\n' +
          '🔊 \` -unmute \`\\n> فك الميوت عن المستخدم\\n\\n' +
          '🏷️ \` -setnick \`\\n> تغيير لقب المستخدم'
        );
      } else if (selected === 'general_category') {
        newEmbed.setTitle('🌐 الأوامر العامة').setDescription(
          '⚙️ \` -help \`\\n> عرض قائمة المساعدة\\n\\n' +
          '📊 \` -info \`\\n> عرض إحصائيات السيرفر'
        );
      }

      await i.update({ embeds: [newEmbed], components: [row] });
    });
  }
};
`;

fs.writeFileSync('help.js', helpCode);

// 2. تحديث bot.js لدعم المنشن والرد بأسلوب Probot
const botCode = `require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const helpCmd = require('./help.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message]
});

const PREFIX = '-';

client.once('ready', () => {
  console.log(\`✅ Probot Style Engine active as \${client.user.tag}\`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // 1. الاستجابة لمنشن البوت (Ping Bot)
  if (message.content.trim() === \`<@\${client.user.id}>\` || message.content.trim() === \`<@!\${client.user.id}>\`) {
    const pingEmbed = new EmbedBuilder()
      .setTitle('🤖 OS System Engine')
      .setDescription(\`> **Prefix الحالي للبرنامج هو:** \\\`\${PREFIX}\\\`\\n> اكتب \\\`\${PREFIX}help\\\` لفتح قائمة المساعدة والمزيد من المعلومات.\`)
      .setColor('#2b2d31')
      .setFooter({ text: 'OS System Engine', iconURL: client.user.displayAvatarURL() });

    return message.channel.send({ embeds: [pingEmbed], allowedMentions: { repliedUser: false } });
  }

  const content = message.content.trim();
  let cmd = '';

  if (content.startsWith(PREFIX)) {
    cmd = content.slice(PREFIX.length).trim().split(/ +/)[0].toLowerCase();
  } else {
    cmd = content.split(/ +/)[0].toLowerCase();
  }

  // 2. تنفيذ أمر المساعدة بدون اختصار "م"
  if (cmd === 'help' || cmd === 'مساعدة') {
    try {
      await helpCmd.execute(message);
    } catch (err) {
      console.error(err);
    }
  }
});

client.login(process.env.DISCORD_TOKEN || process.env.BOT_TOKEN);
`;

fs.writeFileSync('bot.js', botCode);
console.log('✅ Updated bot with Probot reply style, mention response, and removed "م" alias.');
