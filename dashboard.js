const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const config = require('./config');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'oscorp_secret_key',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// صفحة القائمة الرئيسية للداشبورد
app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login');
  res.render('dashboard-select', { user: req.user });
});

// إصلاح خطأ 500 عند فتح سيرفر معين
app.get('/dashboard/:guildID', async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.redirect('/login');

    const guildId = req.params.guildID;
    const guild = req.user.guilds ? req.user.guilds.find(g => g.id === guildId) : null;

    if (!guild) {
      return res.redirect('/dashboard');
    }

    // إعدادات افتراضية لمنع توقف السيرفر في حال عدم وجود بيانات مسبقة
    const defaultSettings = {
      prefix: '!',
      welcomeChannel: '',
      autoRole: ''
    };

    res.render('dashboard', {
      user: req.user,
      guild: guild,
      settings: defaultSettings
    });
  } catch (error) {
    console.error('❌ Dashboard Error:', error);
    res.status(500).send('حدث خطأ داخلي في السيرفر، تم تسجيل الخطأ.');
  }
});

module.exports = app;
