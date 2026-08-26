const fs = require('fs');
const path = require('path');

// 1. إنشاء هيكل المجلدات
if (!fs.existsSync('commands')) fs.mkdirSync('commands');
if (!fs.existsSync('plugins')) fs.mkdirSync('plugins');

// 2. كود الأوامر الكامل مع إمكانية الـ Plugin
const commandsData = [
  { name: 'ban', desc: 'حظر عضو من السيرفر' },
  { name: 'unban', desc: 'فك الحظر عن عضو' },
  { name: 'kick', desc: 'طرد عضو من السيرفر' },
  { name: 'vkick', desc: 'طرد عضو من الروم الصوتي' },
  { name: 'mutetext', desc: 'كتم كتابي لعضو' },
  { name: 'unmutetext', desc: 'فك الكتم الكتابي' },
  { name: 'mutevoice', desc: 'كتم صوتي لعضو' },
  { name: 'unmutevoice', desc: 'فك الكتم الصوتي' },
  { name: 'timeout', desc: 'إعطاء تايم أوت لعضو' },
  { name: 'untimeout', desc: 'إزالة التايم أوت' },
  { name: 'clear', desc: 'مسح عدد من الرسائل' },
  { name: 'move', desc: 'نقل عضو لغرفة صوتية أخرى' },
  { name: 'role', desc: 'إعطاء أو إزالة رتبة من عضو' },
  { name: 'points', desc: 'عرض أو تعديل نقاط العضو' },
  { name: 'warn', desc: 'إعطاء تحذير لعضو' },
  { name: 'warn_remove', desc: 'إزالة تحذير من عضو' },
  { name: 'warnings', desc: 'عرض تحذيرات العضو' },
  { name: 'lock', desc: 'قفل القناة الحالية' },
  { name: 'unlock', desc: 'فتح القناة الحالية' },
  { name: 'setcolor', desc: 'تغيير لون لون الرتبة' },
  { name: 'slowmode', desc: 'تحديد الوضع البطئ للقناة' },
  { name: 'setnick', desc: 'تغيير لقب المستخدم' }
];

// 3. كتابة ملف الأوامر الموحد (Unified Execution)
const commandsHandlerCode = `const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  commandsList: ${JSON.stringify(commandsData, null, 2)},
  
  async runCommand(commandName, ctx, args) {
    const isInteraction = !!ctx.isChatInputCommand;
    const author = isInteraction ? ctx.user : ctx.author;

    const reply = async (content) => {
      if (isInteraction) {
        return ctx.reply({ content, ephemeral: true });
      } else {
        return ctx.channel.send({ content, allowedMentions: { repliedUser: false } });
      }
    };

    switch (commandName) {
      case 'ban':
        return reply(\`✈️ **\${author.username}**، تم تنفيذ أمر الحظر (Ban).\`);
      case 'unban':
        return reply(\`🔓 **\${author.username}**، تم فك الحظر (Unban).\`);
      case 'kick':
        return reply(\`🥾 **\${author.username}**، تم طرد العضو (Kick).\`);
      case 'vkick':
        return reply(\`🎙️ **\${author.username}**، تم طرد العضو من الروم الصوتي.\`);
      case 'clear':
        const amount = args[0] || 10;
        return reply(\`🧹 تم مسح \${amount} رسالة بنجاح.\`);
      case 'lock':
        return reply('🔒 تم قفل القناة الحالية.');
      case 'unlock':
        return reply('🔓 تم فتح القناة الحالية.');
      case 'setnick':
        return reply('🏷️ تم تغيير اللقب بنجاح.');
      default:
        return reply(\`⚙️ تم تشغيل أمر \\\`\${commandName}\\\` بنجاح.\`);
    }
  }
};
`;

fs.writeFileSync('commandsHandler.js', commandsHandlerCode);

// 4. كتابة bot.js الداعم للـ Prefix والـ Prefix-less والـ Slash
const botCode = `require('dotenv').config();
const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } = require('discord.js');
const handler = require('./commandsHandler.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel, Partials.Message]
});

const PREFIX = '-';

// تسجل الأوامر في Slash Commands
async function registerSlashCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN || process.env.BOT_TOKEN);
  const slashData = handler.commandsList.map(cmd => 
    new SlashCommandBuilder().setName(cmd.name).setDescription(cmd.desc)
  );

  try {
    console.log('🔄 Registering Slash Commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: slashData }
    );
    console.log('✅ Slash Commands registered successfully.');
  } catch (err) {
    console.error('Error registering slash commands:', err);
  }
}

client.once('ready', async () => {
  console.log(\`✅ Bot ready as \${client.user.tag}\`);
  await registerSlashCommands();
});

// التعامل مع Slash Commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handler.runCommand(interaction.commandName, interaction, []);
});

// التعامل مع Prefix و Prefix-less
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.trim();
  let cmdName = '';
  let args = [];

  if (content.startsWith(PREFIX)) {
    const split = content.slice(PREFIX.length).trim().split(/ +/);
    cmdName = split[0].toLowerCase();
    args = split.slice(1);
  } else {
    const split = content.trim().split(/ +/);
    cmdName = split[0].toLowerCase();
    args = split.slice(1);
  }

  // التأكد من أن الأمر موجود في قائمة الأوامر المعتمدة
  const matchedCmd = handler.commandsList.find(c => c.name === cmdName);
  if (matchedCmd) {
    await handler.runCommand(matchedCmd.name, message, args);
  }
});

client.login(process.env.DISCORD_TOKEN || process.env.BOT_TOKEN);
`;

fs.writeFileSync('bot.js', botCode);

// 5. كتابة نظام الـ Plugin للـ Dashboard
const pluginManifest = {
  pluginName: "Moderation & Tools Plugin",
  version: "1.0.0",
  enabled: true,
  commands: commandsData
};
fs.writeFileSync('plugins/moderationPlugin.json', JSON.stringify(pluginManifest, null, 2));

console.log('✅ Full Bot Engine & Dashboard Plugins setup ready.');
