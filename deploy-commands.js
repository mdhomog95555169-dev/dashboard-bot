require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { commands } = require('./commands.js');

const token = process.env.TOKEN || process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID || process.env.APPLICATION_ID;

if (!token) {
  console.error('❌ TOKEN is missing in environment variables.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('🔄 Fetching Bot Application ID...');
    const user = await rest.get(Routes.user());
    const appId = clientId || user.id;

    console.log('🧹 Deleting Old Global Commands...');
    await rest.put(Routes.applicationCommands(appId), { body: [] });

    console.log('🚀 Registering New Commands (Feeling lost?)...');
    const bodyData = commands.map(cmd => cmd.data.toJSON());
    await rest.put(Routes.applicationCommands(appId), { body: bodyData });

    console.log('✅ Success! All commands deployed perfectly.');
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
})();
