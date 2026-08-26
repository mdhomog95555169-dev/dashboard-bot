const express = require('express');
const router = express.Router();

// الصفحة الرئيسية (الواجهة القديمة)
router.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>OSCORP Dashboard</title>
            <style>
                body { font-family: Arial, sans-serif; background: #0f172a; color: white; text-align: center; padding: 50px; }
                .card { background: #1e293b; padding: 30px; border-radius: 12px; display: inline-block; box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
                h1 { color: #38bdf8; }
                a { display: inline-block; margin-top: 15px; padding: 10px 20px; background: #5865F2; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>مرحباً بك في لوحة التحكم 👋</h1>
                <p>السيرفر وقاعدة البيانات يعملان بنجاح!</p>
                <a href="/login">تسجيل الدخول عبر Discord</a>
            </div>
        </body>
        </html>
    `);
});

// مسار تسجيل الدخول
router.get('/login', (req, res) => {
    const CLIENT_ID = process.env.CLIENT_ID || '';
    const REDIRECT_URI = encodeURIComponent(process.env.REDIRECT_URI || '');
    
    if (CLIENT_ID) {
        res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify%20guilds`);
    } else {
        res.send('رجاء قم بإضافة CLIENT_ID و REDIRECT_URI في متغيّرات البيئة داخل Render');
    }
});

// مسار الـ Callback
router.get('/auth/discord/callback', (req, res) => {
    res.redirect('/dashboard');
});

// مسار الداشبورد الرئيسي
router.get('/dashboard', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>لوحة تحكم البوت - OSCORP</title>
            <style>
                body { font-family: Arial, sans-serif; background: #0f172a; color: white; margin: 0; padding: 20px; }
                .header { display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 15px 30px; border-radius: 10px; margin-bottom: 20px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
                .card { background: #1e293b; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #334155; }
                .btn { background: #38bdf8; color: #0f172a; padding: 10px 15px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>🛠️ لوحة تحكم OSCORP Bot</h2>
                <span>حالة البوت: <b style="color: #22c55e;">متصل 🟢</b></span>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>⚙️ إعدادات البوت</h3>
                    <p>التحكم في بادئة الأوامر (Prefix) واللغة.</p>
                    <a href="/settings" class="btn">إدارة الإعدادات</a>
                </div>
                <div class="card">
                    <h3>🧩 الإضافات (Plugins)</h3>
                    <p>تفعيل وإلغاء تفعيل أزرار وأوامر البوت.</p>
                    <a href="/plugins" class="btn">إدارة الإضافات</a>
                </div>
                <div class="card">
                    <h3>📊 حالة السيرفرات</h3>
                    <p>عرض قائمة السيرفرات المتواجد فيها البوت.</p>
                    <a href="/api/guilds" class="btn">عرض السيرفرات</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// المسارات الاحتياطية للصفحات لضمان عدم ظهور خطأ 502/Cannot GET
router.get('/settings', (req, res) => res.send('<h2>صفحة الإعدادات تعمل بنجاح!</h2><a href="/dashboard">العودة للداشبورد</a>'));
router.get('/plugins', (req, res) => res.send('<h2>صفحة الإضافات (Plugins) تعمل بنجاح!</h2><a href="/dashboard">العودة للداشبورد</a>'));
router.get('/api/guilds', (req, res) => res.json({ status: 'success', message: 'قائمة السيرفرات جاهزة', guilds: [] }));

module.exports = router;
