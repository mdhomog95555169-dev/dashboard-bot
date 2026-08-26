require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
const http = require('http');
const { commands, createEmbed } = require('./commands');

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

function checkPermission(member, permission) {
  if (!permission) return true;
  return member.permissions.has(permission);
}

async function resolveMemberArg(guild, raw) {
  if (!raw) return null;
  const id = raw.replace(/[<@!>]/g, '');
  try { return await guild.members.fetch(id); } catch { return null; }
}

async function resolveRoleArg(guild, raw) {
  if (!raw) return null;
  const id = raw.replace(/[<@&>]/g, '');
  let role = guild.roles.cache.get(id);
  if (!role) role = guild.roles.cache.find((r) => r.name.toLowerCase() === raw.toLowerCase());
  return role || null;
}

function resolveChannelArg(guild, raw, fallback) {
  if (!raw) return fallback;
  const id = raw.replace(/[<#>]/g, '');
  return guild.channels.cache.get(id) || fallback;
}

function buildContext(guild, channel, invoker, isSlash, rawObj, optsFetcher) {
  const replyEmbed = (embed) => rawObj.reply({ embeds: [embed] });
  const replySuccess = (messageText, fields = []) => {
    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('✅ نجاح العملية')
      .setDescription(messageText)
      .setFooter({ text: 'OS System Engine' })
      .setTimestamp();
    if (fields.length) embed.addFields(fields);
    return rawObj.reply({ embeds: [embed] });
  };
  const replyError = (messageText) => {
    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('❌ خطأ في التنفيذ')
      .setDescription(messageText)
      .setFooter({ text: 'OS System Engine' })
      .setTimestamp();
    return rawObj.reply({ embeds: [embed], ephemeral: isSlash });
  };

  return {
    guild,
    channel,
    invoker,
    isSlash,
    raw: rawObj,
    replyEmbed,
    replySuccess,
    replyError,
    ...optsFetcher
  };
}

function buildSlashCtx(interaction) {
  const opts = interaction.options;
  return buildContext(
    interaction.guild,
    interaction.channel,
    interaction.member,
    true,
    interaction,
    {
      getUserMember: async (name) => {
        const u = opts.getUser(name);
        if (!u) return null;
        try { return await interaction.guild.members.fetch(u.id); } catch { return null; }
      },
      getString: (name) => opts.getString(name),
      getInteger: (name) => opts.getInteger(name),
      getRole: (name) => opts.getRole(name),
      getChannel: (name) => opts.getChannel(name) || interaction.channel,
    }
  );
}

async function buildPrefixCtx(message, args, optionDefs) {
  const guild = message.guild;
  const parsed = {};
  let idx = 0;
  for (const def of optionDefs) {
    if (def.type === 'user') {
      parsed[def.name] = args[idx] ? await resolveMemberArg(guild, args[idx]) : null;
      idx++;
    } else if (def.type === 'role') {
      parsed[def.name] = args[idx] ? await resolveRoleArg(guild, args[idx]) : null;
      idx++;
    } else if (def.type === 'channel') {
      parsed[def.name] = args[idx] ? resolveChannelArg(guild, args[idx], message.channel) : message.channel;
      idx++;
    } else if (def.type === 'integer') {
      const n = parseInt(args[idx], 10);
      parsed[def.name] = Number.isNaN(n) ? null : n;
      idx++;
    } else {
      if (def.consumeRest) {
        parsed[def.name] = args.slice(idx).join(' ') || null;
        idx = args.length;
      } else {
        parsed[def.name] = args[idx] || null;
        idx++;
      }
    }
  }

  return buildContext(
    guild,
    message.channel,
    message.member,
    false,
    message,
    {
      getUserMember: async (name) => parsed[name] || null,
      getString: (name) => parsed[name] || null,
      getInteger: (name) => (typeof parsed[name] === 'number' ? parsed[name] : null),
      getRole: (name) => parsed[name] || null,
      getChannel: (name) => parsed[name] || message.channel,
    }
  );
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  if (command.permission && !checkPermission(interaction.member, command.permission)) {
    const errEmbed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('❌ ليس لديك صلاحية')
      .setDescription('أنت لا تملك الصلاحيات الكافية لاستخدام هذا الأمر.');
    return interaction.reply({ embeds: [errEmbed], ephemeral: true });
  }

  try {
    const ctx = buildSlashCtx(interaction);
    await command.execute(ctx);
  } catch (err) {
    console.error(err);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();
  const command = client.commands.get(cmdName);
  if (!command) return;

  if (command.permission && !checkPermission(message.member, command.permission)) {
    const errEmbed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('❌ ليس لديك صلاحية')
      .setDescription('أنت لا تملك الصلاحيات الكافية لاستخدام هذا الأمر.');
    return message.reply({ embeds: [errEmbed] });
  }

  try {
    const ctx = await buildPrefixCtx(message, args, command.options || []);
    await command.execute(ctx);
  } catch (err) {
    console.error(err);
  }
});

client.login(process.env.DISCORD_TOKEN);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Oscorp RP Bot ProBot Style is Online.');
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`🌐 HTTP server listening on port ${process.env.PORT || 3000}`);
});
