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

// عرض إعدادات السيرفر المحددة
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
    console.error('❌ Dashboard Error:', error);
    res.status(500).send('Error loading dashboard.');
  }
});

// حفظ إعدادات الترحيب من الداشبورد
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
    console.error('❌ Welcome Save Error:', error);
    res.status(500).send('Error saving welcome settings.');
  }
});

// حفظ إعدادات AutoMod من الداشبورد
app.post('/dashboard/:guildID/automod', async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.redirect('/login');
    const { autoModEnabled } = req.body;

    await Settings.findOneAndUpdate(
      { guildId: req.params.guildID },
      { autoModEnabled: autoModEnabled === 'on' || autoModEnabled === true },
      { upsert: true }
    );
    res.redirect(`/dashboard/${req.params.guildID}?success=true`);
  } catch (error) {
    console.error('❌ AutoMod Save Error:', error);
    res.status(500).send('Error saving AutoMod settings.');
  }
});

// حفظ إعدادات التذاكر من الداشبورد
app.post('/dashboard/:guildID/tickets', async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.redirect('/login');
    const { ticketCategory } = req.body;

    await Settings.findOneAndUpdate(
      { guildId: req.params.guildID },
      { ticketCategory },
      { upsert: true }
    );
    res.redirect(`/dashboard/${req.params.guildID}?success=true`);
  } catch (error) {
    console.error('❌ Ticket Save Error:', error);
    res.status(500).send('Error saving Ticket settings.');
  }
});

module.exports = app;
