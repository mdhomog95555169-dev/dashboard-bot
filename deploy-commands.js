require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { commands } = require('./commands');

const slashCmds = commands.map((c) => {
  const obj = {
    name: c.name,
    description: c.description,
    options: [],
  };

  if (c.options) {
    obj.options = c.options.map((opt) => {
      let typeNum = 3; // STRING
      if (opt.type === 'user') typeNum = 6;
      if (opt.type === 'integer') typeNum = 4;
      if (opt.type === 'role') typeNum = 8;
      if (opt.type === 'channel') typeNum = 7;

      return {
        name: opt.name,
        description: opt.description || opt.name,
        type: typeNum,
        required: !!opt.required,
      };
    });
  }
  return obj;
});

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('⏳ جاري تسجيل أوامر الـ Slash Commands لدى ديسكورد...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID || '1343717142436843580'),
      { body: slashCmds }
    );
    console.log('✅ تم تسجيل جميع الـ Slash Commands بنجاح!');
  } catch (error) {
    console.error('❌ حدث خطأ أثناء التسجيل:', error);
  }
})();
