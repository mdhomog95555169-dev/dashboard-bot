const { Collection, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

// مصفوفة الأوامر والـ Aliases الخاصة بك (تستطيع الربط بقاعدة البيانات أو ملف JSON)
const commandsData = [
  { name: 'ban', aliases: ['م', 'حظر'], description: 'حظر عضو من السيرفر' },
  { name: 'kick', aliases: ['طرد'], description: 'طرد عضو من السيرفر' },
  { name: 'clear', aliases: ['مسح', 'purge'], description: 'مسح الرسائل' },
  { name: 'mute', aliases: ['اسكات', 'ميوت'], description: 'إسكات عضو' },
  { name: 'unmute', aliases: ['فك_الميوت'], description: 'إلغاء إسكات عضو' },
  { name: 'ticket', aliases: ['تذكرة', 'الدعم'], description: 'فتح تذكرة دعم' },
  { name: 'ping', aliases: ['سرعة', 'بنج'], description: 'فحص سرعة استجابة البوت' },
  { name: 'help', aliases: ['مساعدة', 'اوامر'], description: 'قائمة الأوامر' }
];

function setupCommandHandler(client, PREFIX = '-') {
  client.commands = new Collection();
  client.aliases = new Collection();

  // تسجيل الأوامر والـ Aliases
  commandsData.forEach(cmd => {
    client.commands.set(cmd.name, cmd);
    if (cmd.aliases && Array.isArray(cmd.aliases)) {
      cmd.aliases.forEach(alias => {
        client.aliases.set(alias.toLowerCase(), cmd.name);
      });
    }
  });

  // 1. معالجة الرسائل النصية (Prefix & Prefix-less)
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    let content = message.content.trim();
    let commandName = '';
    let args = [];

    // التعامل مع Prefix أو بدون Prefix
    if (content.startsWith(PREFIX)) {
      args = content.slice(PREFIX.length).trim().split(/ +/);
      commandName = args.shift().toLowerCase();
    } else {
      args = content.split(/ +/);
      commandName = args.shift().toLowerCase();
    }

    // البحث عن الأمر بالاسم الأصلي أو عبر الـ Alias
    let targetCmdName = client.commands.has(commandName) 
      ? commandName 
      : client.aliases.get(commandName);

    if (targetCmdName) {
      const command = client.commands.get(targetCmdName);
      console.log(`[Command Executed] Command: ${command.name} | Triggered By: ${commandName}`);
      
      // تنفيذ كود الأمر هنا
      // مثال لتوضيح التنفيذ:
      // message.reply(`تم التعرف على الأمر: **${command.name}** عبر الاختصار: **${commandName}**`);
    }
  });

  // 2. معالجة الـ Slash Commands (/ban, /kick, etc.)
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (command) {
      await interaction.reply({ content: `تم تشغيل Slash Command للأمر: **${command.name}**`, ephemeral: true });
    }
  });
}

// دالة لتسجيل الـ Slash Commands لدى Discord API
async function registerSlashCommands(clientId, guildId, token) {
  const slashCommands = commandsData.map(cmd => 
    new SlashCommandBuilder()
      .setName(cmd.name)
      .setDescription(cmd.description)
  );

  const rest = new REST({ version: '10' }).setToken(token);
  try {
    console.log('جاري تسجيل Slash Commands...');
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: slashCommands }
    );
    console.log('تم تسجيل Slash Commands بنجاح!');
  } catch (error) {
    console.error('خطأ أثناء تسجيل Slash Commands:', error);
  }
}

module.exports = { setupCommandHandler, registerSlashCommands };
