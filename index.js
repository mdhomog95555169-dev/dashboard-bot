const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config');
const { commands } = require('./commands');
const database = require('./database');
const dashboard = require('./dashboard');
const { getHelpEmbed } = require('./help');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.commands = new Collection();
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

async function deployCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    const commandData = commands.map(cmd => cmd.data.toJSON());
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commandData }
    );
    console.log('✅ تم تسجيل جميع أوامر Slash بنجاح!');
  } catch (error) {
    console.error('❌ خطأ أثناء تسجيل الأوامر:', error);
  }
}

client.once('ready', async () => {
  console.log(`🤖 تم تسجيل الدخول بواسطة: ${client.user.tag}`);
  await database.connect();
  await deployCommands();

  // تشغيل سيرفر الداشبورد
  const PORT = process.env.PORT || 3000;
  dashboard.listen(PORT, () => {
    console.log(`🌐 Dashboard is running on port ${PORT}`);
  });
});

// الرد عند إشارة (منشن) البوت
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // التحقق من منشن البوت المباشر بدون everyone
  if (message.mentions.has(client.user) && !message.mentions.everyone) {
    const mentionEmbed = new EmbedBuilder()
      .setTitle('👋 Need Help?')
      .setDescription(`مرحباً بك <@${message.author.id}>!\nأنا بوت **Oscorp** الخاص بإدارة السيرفر والداشبورد.\n\nلمعرفة جميع الأوامر المتاحة استخدم الأمر: \`/help\``)
      .setColor('#5865F2')
      .setThumbnail(client.user.displayAvatarURL());

    const btnRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('قائمة الأوامر (/help)')
        .setCustomId('btn_open_help')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel('الداشبورد')
        .setStyle(ButtonStyle.Link)
        .setURL('https://dashboard-bot.onrender.com/dashboard')
    );

    return message.reply({ embeds: [mentionEmbed], components: [btnRow] });
  }
});

// معالجة التفاعلات (Slash Commands & Buttons)
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      if (interaction.commandName === 'help') {
        const helpData = getHelpEmbed();
        return await interaction.reply(helpData);
      }
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      const replyOptions = { content: 'حدث خطأ أثناء تنفيذ هذا الأمر!', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyOptions);
      } else {
        await interaction.reply(replyOptions);
      }
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === 'btn_open_help') {
      const helpData = getHelpEmbed();
      await interaction.reply({ ...helpData, ephemeral: true });
    }
  }
});

client.login(config.token);
