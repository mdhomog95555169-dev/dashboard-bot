require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { commands } = require('./commands.js');

// محاولة جلب التوكن بأي اسم ممكن أو من ملف config.json إن وجد
let token = process.env.TOKEN || process.env.DISCORD_TOKEN || process.env.BOT_TOKEN;

if (!token) {
  try {
    const config = require('./config.json');
    token = config.token;
  } catch (e) {}
}

if (!token) {
  console.error('❌ لم يتم العثور على TOKEN. يرجى التأكد من وجود التوكن في ملف .env أو التشغيل مباشرة باستخدامه.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('🔄 جاري الاتصال بديسكورد وتحديد معرف البوت...');
    const user = await rest.get(Routes.user());
    const appId = user.id;

    console.log('🧹 جاري مسح كافة الأوامر القديمة لتحديث الوصف...');
    await rest.put(Routes.applicationCommands(appId), { body: [] });

    console.log('🚀 جاري تسجيل الأوامر الجديدة بالوصف والخيارات المحدثة...');
    const bodyData = commands.map(cmd => cmd.data.toJSON());
    await rest.put(Routes.applicationCommands(appId), { body: bodyData });

    console.log('✅ تم تحديث ونشر جميع أوامر السلاش بنجاح بنسبة 100%!');
  } catch (error) {
    console.error('❌ خطأ أثناء رفع الأوامر:', error);
  }
})();
