require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const http = require('http');
const { commands } = require('./commands');

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

function reply(target, isSlash, content) {
  const payload = typeof content === 'string' ? { content } : content;
  return target.reply(payload);
}

function buildSlashCtx(interaction) {
  const guild = interaction.guild;
  const opts = interaction.options;
  return {
    guild,
    channel: interaction.channel,
    invoker: interaction.member,
    isSlash: true,
    raw: interaction,
    getUserMember: async (name) => {
      const u = opts.getUser(name);
      if (!u) return null;
      try { return await guild.members.fetch(u.id); } catch { return null; }
    },
    getString: (name) => opts.getString(name),
    getInteger: (name) => opts.getInteger(name),
    getRole: (name) => opts.getRole(name),
    getChannel: (name) => opts.getChannel(name) || interaction.channel,
    reply: (content) => reply(interaction, true, content),
  };
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
  return {
    guild,
    channel: message.channel,
    invoker: message.member,
    isSlash: false,
    raw: message,
    getUserMember: async (name) => parsed[name] || null,
    getString: (name) => parsed[name] || null,
    getInteger: (name) => (typeof parsed[name] === 'number' ? parsed[name] : null),
    getRole: (name) => parsed[name] || null,
    getChannel: (name) => parsed[name] || message.channel,
    reply: (content) => reply(message, false, content),
  };
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  if (command.permission && !checkPermission(interaction.member, command.permission)) {
    return interaction.reply({ content: '❌ لا تملك الصلاحية لاستخدام هذا الأمر.', ephemeral: true });
  }

  try {
    const ctx = buildSlashCtx(interaction);
    await command.execute(ctx);
  } catch (err) {
    console.error(err);
    const payload = { content: '⚠️ حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.editReply(payload);
    else await interaction.reply(payload);
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
    return message.reply('❌ لا تملك الصلاحية لاستخدام هذا الأمر.');
  }

  try {
    const ctx = await buildPrefixCtx(message, args, command.options || []);
    await command.execute(ctx);
  } catch (err) {
    console.error(err);
    message.reply('⚠️ حدث خطأ أثناء تنفيذ الأمر.');
  }
});

client.login(process.env.DISCORD_TOKEN);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Oscorp RP Bot is running.');
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`🌐 HTTP server listening on port ${process.env.PORT || 3000}`);
});
