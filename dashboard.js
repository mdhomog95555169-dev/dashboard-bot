const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const config = require('./config');
const { Settings } = require('./database');

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

// صفحة اختيار السيرفر
app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login');
  res.render('dashboard-select', { user: req.user });
});

// عرض إعدادات السيرفر
app.get('/dashboard/:guildID', async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.redirect('/login');

    const guildId = req.params.guildID;
    const guild = req.user.guilds ? req.user.guilds.find(g => g.id === guildId) : null;

    if (!guild) return res.redirect('/dashboard');

    let settings = await Settings.findOne({ guildId });
    if (!settings) {
      settings = await Settings.create({ guildId });
    }

    res.render('dashboard', {
      user: req.user,
      guild: guild,
      settings: settings
    });
  } catch (error) {
    console.error('❌ Dashboard GET Error:', error);
    res.status(500).send('حدث خطأ أثناء تحميل بيانات الداشبورد.');
  }
});

// حفظ إعدادات العامة (Settings)
app.post('/dashboard/:guildID/settings', async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.redirect('/login');
    const { prefix, botName, activity } = req.body;
    
    await Settings.findOneAndUpdate(
      { guildId: req.params.guildID },
      { prefix, botName, activity },
      { upsert: true }
    );
    res.redirect(`/dashboard/${req.params.guildID}?success=true`);
  } catch (error) {
    console.error('❌ Settings POST Error:', error);
    res.status(500).send('حدث خطأ أثناء حفظ الإعدادات.');
  }
});

// حفظ إعدادات الترحيب (Welcome)
app.post('/dashboard/:guildID/welcome', async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.redirect('/login');
    const { welcomeChannel, welcomeMessage, autoRole } = req.body;

    await Settings.findOneAndUpdate(
      { guildId: req.params.guildID },
      { welcomeChannel, welcomeMessage, autoRole },
      { upsert: true }
    );
    res.redirect(`/dashboard/${req.params.guildID}?success=true`);
  } catch (error) {
    console.error('❌ Welcome POST Error:', error);
    res.status(500).send('حدث خطأ أثناء حفظ إعدادات الترحيب.');
  }
});

// حفظ إعدادات الحماية (AutoMod / Moderation)
app.post('/dashboard/:guildID/automod', async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.redirect('/login');
    const { autoModEnabled } = req.body;

    await Settings.findOneAndUpdate(
      { guildId: req.params.guildID },
      { autoModEnabled: autoModEnabled === 'on' },
      { upsert: true }
    );
    res.redirect(`/dashboard/${req.params.guildID}?success=true`);
  } catch (error) {
    console.error('❌ AutoMod POST Error:', error);
    res.status(500).send('حدث خطأ أثناء حفظ إعدادات الحماية.');
  }
});

module.exports = app;
