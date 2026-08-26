require('dotenv').config();
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
  console.log(`✅ Probot Style Engine active as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // 1. الاستجابة لمنشن البوت (Ping Bot)
  if (message.content.trim() === `<@${client.user.id}>` || message.content.trim() === `<@!${client.user.id}>`) {
    const pingEmbed = new EmbedBuilder()
      .setTitle('🤖 OS System Engine')
      .setDescription(`> **Prefix الحالي للبرنامج هو:** \`${PREFIX}\`\n> اكتب \`${PREFIX}help\` لفتح قائمة المساعدة والمزيد من المعلومات.`)
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
