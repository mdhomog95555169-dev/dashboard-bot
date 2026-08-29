const fs = require('fs');
const { REST, Routes } = require('discord.js');
const { commands } = require('./commands.js');

// 1. جلب التوكن من بيئة التشغيل أو من index.js تلقائياً
let token = process.env.TOKEN || process.env.DISCORD_TOKEN;

if (!token) {
  try {
    const indexContent = fs.readFileSync('./index.js', 'utf8');
    const match = indexContent.match(/['"]([A-Za-z0-9_\-]{24,28}\.[A-Za-z0-9_\-]{6}\.[A-Za-z0-9_\-]{27,38})['"]/);
    if (match) token = match[1];
  } catch (e) {}
}

if (!token) {
  console.error('❌ تعذر العثور على التوكن. سنقوم برفع الأوامر باستخدام التوكن الممرر.');
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('🔄 جاري جلب معرّف البوت وتحديث أوامر السلاش...');
    const user = await rest.get(Routes.user());
    
    console.log('🚀 جاري رفع الأوامر إلى ديسكورد...');
    const bodyData = commands.map(cmd => cmd.data.toJSON());
    await rest.put(Routes.applicationCommands(user.id), { body: bodyData });

    console.log('✅ تم رفع وتحديث جميع الأوامر بنجاح 100%!');
  } catch (error) {
    console.error('❌ خطأ أثناء رفع الأوامر:', error.message);
  }
})();
