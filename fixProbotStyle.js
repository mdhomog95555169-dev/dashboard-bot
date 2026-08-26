const fs = require('fs');

// 1. إنشاء مجلد Plugins
if (!fs.existsSync('plugins')) fs.mkdirSync('plugins');

// 2. إضافة إضافة الترحيب والمعلومات (Welcome & Stats Plugin)
const infoPlugin = `const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'info',
  aliases: ['معلومات', 'سيرفر'],
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle(\`📊 إحصائيات \${message.guild.name}\`)
      .addFields(
        { name: '👥 عدد الأعضاء', value: \`\${message.guild.memberCount}\`, inline: true },
        { name: '🆔 معرف الخادم', value: \`\${message.guild.id}\`, inline: true }
      )
      .setColor('#5865F2')
      .setFooter({ text: 'OS System — Probot Core' });
    
    await message.reply({ embeds: [embed] });
  }
};
`;
fs.writeFileSync('plugins/info.js', infoPlugin);

// 3. إضافة إضافة الأوامر الإدارية السريعة (Moderation Plugin)
const modPlugin = `module.exports = {
  name: 'clear',
  aliases: ['مسح', 'مسح_الرسائل'],
  async execute(message, args) {
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ لا تملك صلاحية إدارة الرسائل.');
    }
    const amount = parseInt(args[0]) || 10;
    if (amount > 100 || amount < 1) return message.reply('⚠️ حدد عدداً بين 1 و 100.');
    
    await message.channel.bulkDelete(amount, true);
    const reply = await message.channel.send(\`🧹 تم مسح \${amount} رسالة بنجاح.\`);
    setTimeout(() => reply.delete().catch(() => {}), 3000);
  }
};
`;
fs.writeFileSync('plugins/mod.js', modPlugin);

// 4. إعادة بناء bot.js لدعم الـ Plugins والـ Prefix و Prefix-less
const botCode = `require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel, Partials.Message]
});

const PREFIX = '-';
client.plugins = new Collection();

// تحميل جميع الإضافات (Plugins)
const pluginFiles = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'));
for (const file of pluginFiles) {
  const plugin = require(\`./plugins/\${file}\`);
  client.plugins.set(plugin.name, plugin);
  if (plugin.aliases) {
    plugin.aliases.forEach(alias => client.plugins.set(alias, plugin));
  }
}

// تحميل أمر المساعدة الأساسي
const helpCmd = require('./help.js');

client.once('ready', () => {
  console.log(\`✅ Probot Engine Active as \${client.user.tag}\`);
});

// معالجة جميع الأوامر (Prefix & Prefix-less)
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.trim();
  let args = [];
  let cmdName = '';

  if (content.startsWith(PREFIX)) {
    args = content.slice(PREFIX.length).trim().split(/ +/);
    cmdName = args.shift().toLowerCase();
  } else {
    args = content.trim().split(/ +/);
    cmdName = args.shift().toLowerCase();
  }

  // تشغيل أمر المساعدة
  if (cmdName === 'help' || cmdName === 'م' || cmdName === 'مساعدة') {
    return helpCmd.execute(message);
  }

  // تشغيل الأوامر من الإضافات (Plugins)
  const plugin = client.plugins.get(cmdName);
  if (plugin) {
    try {
      await plugin.execute(message, args);
    } catch (err) {
      console.error('Plugin execution error:', err);
    }
  }
});

client.login(process.env.DISCORD_TOKEN || process.env.BOT_TOKEN);
`;

fs.writeFileSync('bot.js', botCode);
console.log('✅ Applied Probot Architecture with Plugins & Dual Prefix support.');
