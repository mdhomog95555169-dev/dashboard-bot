require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { commands } = require('./commands');

function buildOption(builder, opt) {
  const setup = (o) => o.setName(opt.name).setDescription(opt.description || opt.name).setRequired(!!opt.required);
  switch (opt.type) {
    case 'user': return builder.addUserOption(setup);
    case 'role': return builder.addRoleOption(setup);
    case 'channel': return builder.addChannelOption(setup);
    case 'integer': return builder.addIntegerOption(setup);
    default: return builder.addStringOption(setup);
  }
}

const body = commands.map((cmd) => {
  const builder = new SlashCommandBuilder().setName(cmd.name).setDescription(cmd.description);
  for (const opt of cmd.options || []) buildOption(builder, opt);
  return builder.toJSON();
});

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
      console.log(`✅ تم تسجيل ${body.length} أمر Slash على السيرفر (${guildId}).`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body });
      console.log(`✅ تم تسجيل ${body.length} أمر Slash عالمياً.`);
    }
  } catch (err) {
    console.error(err);
  }
})();
