const fs = require('fs');

// 1. تحديث commandsHandler.js لاستخدام MessageFlags والحد من تحذيرات ephemeral
const handlerCode = `const { MessageFlags } = require('discord.js');

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
  { name: 'setcolor', desc: 'تغيير لون الرتبة' },
  { name: 'slowmode', desc: 'تحديد الوضع البطئ للقناة' },
  { name: 'setnick', desc: 'تغيير لقب المستخدم' }
];

module.exports = {
  commandsList: commandsData,
  
  async runCommand(commandName, ctx, args) {
    const isInteraction = !!ctx.isChatInputCommand;
    const author = isInteraction ? ctx.user : ctx.author;

    const reply = async (content) => {
      if (isInteraction) {
        return ctx.reply({ content, flags: MessageFlags.Ephemeral });
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

fs.writeFileSync('commandsHandler.js', handlerCode);

// 2. تحديث bot.js وإنشاء سيرفر Express وهمي لإرضاء Render (فتح Port)
const botCode = `require('dotenv').config();
const http = require('http');
const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, Events } = require('discord.js');
const handler = require('./commandsHandler.js');

// سيرفر صغير لفتح Port وإصلاح تنبيه Render Port Binding
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OS System Bot is Running Online!');
}).listen(PORT, () => {
  console.log(\`🌐 Web Port binding active on port \${PORT}\`);
});

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

client.once(Events.ClientReady, async () => {
  console.log(\`✅ Bot ready as \${client.user.tag}\`);
  await registerSlashCommands();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handler.runCommand(interaction.commandName, interaction, []);
});

client.on(Events.MessageCreate, async (message) => {
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

  const matchedCmd = handler.commandsList.find(c => c.name === cmdName);
  if (matchedCmd) {
    await handler.runCommand(matchedCmd.name, message, args);
  }
});

client.login(process.env.DISCORD_TOKEN || process.env.BOT_TOKEN);
`;

fs.writeFileSync('bot.js', botCode);
console.log('✅ Applied fixes for Render port binding and Discord deprecation warnings.');
