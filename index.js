require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
const http = require('http');
const { commands, createEmbed } = require('./commands');
const { getAllAliases, setAlias } = require('./data');

const PREFIX = '-';
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();
for (const cmd of commands) client.commands.set(cmd.name, cmd);

function buildContext(guild, channel, invoker, isSlash, rawObj, optsFetcher) {
  return {
    guild,
    channel,
    invoker,
    isSlash,
    raw: rawObj,
    replyEmbed: (embed) => rawObj.reply({ embeds: [embed] }),
    replySuccess: (text, fields = []) => {
      const embed = new EmbedBuilder().setColor('#57F287').setTitle('✅ تم بنجاح').setDescription(text).setTimestamp();
      if (fields.length) embed.addFields(fields);
      return rawObj.reply({ embeds: [embed] });
    },
    replyError: (text) => {
      const embed = new EmbedBuilder().setColor('#ED4245').setTitle('❌ خطأ في الإجراء').setDescription(text).setTimestamp();
      return rawObj.reply({ embeds: [embed], ephemeral: isSlash });
    },
    ...optsFetcher
  };
}

client.once('ready', () => {
  console.log(`✅ OS System Engine Connected as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  if (command.permission && !interaction.member.permissions.has(command.permission)) {
    return interaction.reply({ embeds: [createEmbed('❌ لا تملك الصلاحية', 'ليس لديك إذن لاستخدام هذا الأمر.', '#ED4245')], ephemeral: true });
  }

  const opts = interaction.options;
  const ctx = buildContext(interaction.guild, interaction.channel, interaction.member, true, interaction, {
    getUserMember: async (name) => {
      const u = opts.getUser(name);
      return u ? interaction.guild.members.fetch(u.id).catch(() => null) : null;
    },
    getString: (name) => opts.getString(name),
    getInteger: (name) => opts.getInteger(name),
    getRole: (name) => opts.getRole(name),
    getChannel: (name) => opts.getChannel(name) || interaction.channel,
  });

  try { await command.execute(ctx); } catch (e) { console.error(e); }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const inputCmd = args.shift().toLowerCase();

  // فحص الأوامر أو الاختصارات التخصيصية
  let command = client.commands.get(inputCmd);
  if (!command) {
    const aliases = getAllAliases();
    const realName = Object.keys(aliases).find(key => aliases[key] === inputCmd);
    if (realName) command = client.commands.get(realName);
  }

  if (!command) return;

  if (command.permission && !message.member.permissions.has(command.permission)) {
    return message.reply({ embeds: [createEmbed('❌ لا تملك الصلاحية', 'أنت لا تملك الصلاحيات الكافية.', '#ED4245')] });
  }

  const parsed = {};
  let idx = 0;
  const optionDefs = command.options || [];

  for (const def of optionDefs) {
    if (def.type === 'user') {
      const raw = args[idx++];
      parsed[def.name] = raw ? await message.guild.members.fetch(raw.replace(/[<@!>]/g, '')).catch(() => null) : null;
    } else if (def.type === 'integer') {
      const n = parseInt(args[idx++], 10);
      parsed[def.name] = Number.isNaN(n) ? null : n;
    } else {
      if (def.consumeRest) {
        parsed[def.name] = args.slice(idx).join(' ') || null;
        idx = args.length;
      } else {
        parsed[def.name] = args[idx++] || null;
      }
    }
  }

  const ctx = buildContext(message.guild, message.channel, message.member, false, message, {
    getUserMember: async (name) => parsed[name] || null,
    getString: (name) => parsed[name] || null,
    getInteger: (name) => parsed[name] || null,
    getRole: (name) => parsed[name] || null,
    getChannel: (name) => message.channel,
  });

  try { await command.execute(ctx); } catch (e) { console.error(e); }
});

// خادم الـ Dashboard التفاعلي لإدارة اختصارات الأوامر عبر المتصفح
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  const aliases = getAllAliases();
  let listHtml = commands.map(c => `
    <div style="margin-bottom: 12px; background: #2f3136; padding: 10px; border-radius: 6px;">
      <strong>/${c.name}</strong> - ${c.description} <br/>
      <small style="color:#aaa;">الاختصار الحالي: ${aliases[c.name] || 'لا يوجد'}</small>
    </div>
  `).join('');

  res.end(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head><title>OS System Command Dashboard</title></head>
    <body style="font-family: sans-serif; background: #36393f; color: white; padding: 20px;">
      <h2>⚡ لوحة التحكم في اختصارات الأوامر (OS Engine)</h2>
      <p>جميع أوامر البوت تعمل الآن بـ 100% كـ Slash Commands أو Prefix commands (-):</p>
      ${listHtml}
    </body>
    </html>
  `);
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`🌐 Dashboard running on port ${process.env.PORT || 3000}`);
});

client.login(process.env.DISCORD_TOKEN);
