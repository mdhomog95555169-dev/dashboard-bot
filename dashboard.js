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

app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login');
  res.render('dashboard-select', { user: req.user });
});

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

// حفظ إعدادات AutoMod الشاملة
app.post('/dashboard/:guildID/automod', async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.redirect('/login');
    const { autoModEnabled, antiLinks, badWordsInput, punishmentType, timeoutDuration } = req.body;

    // تحويل الكلمات الممنوعة من النص إلى مصفوفة (Array) حتى 10 كلمات أو أكثر
    let parsedBadWords = [];
    if (badWordsInput) {
      parsedBadWords = badWordsInput.split(',').map(word => word.trim().toLowerCase()).filter(w => w.length > 0);
    }

    await Settings.findOneAndUpdate(
      { guildId: req.params.guildID },
      { 
        autoModEnabled: autoModEnabled === 'on' || autoModEnabled === true,
        antiLinks: antiLinks === 'on' || antiLinks === true,
        badWords: parsedBadWords,
        punishmentType: punishmentType || 'timeout',
        timeoutDuration: parseInt(timeoutDuration) || 10
      },
      { upsert: true }
    );
    res.redirect(`/dashboard/${req.params.guildID}?success=true`);
  } catch (error) {
    console.error('❌ AutoMod Save Error:', error);
    res.status(500).send('Error saving AutoMod settings.');
  }
});

module.exports = app;
