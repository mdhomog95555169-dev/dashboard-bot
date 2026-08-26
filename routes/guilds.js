const express = require('express');
const router = express.Router();
const { isAuthorized, checkGuildPermission } = require('../auth/auth');
const { client } = require('../bot');

// GET /guilds - Display user's manageable servers
router.get('/', isAuthorized, (req, res) => {
  const userGuilds = req.user.guilds || [];
  
  // Filter guilds where user has MANAGE_GUILD (0x20) or ADMINISTRATOR (0x8) or is Owner
  const manageableGuilds = userGuilds.map(guild => {
    const permissions = BigInt(guild.permissions);
    const hasAdmin = (permissions & BigInt(0x8)) === BigInt(0x8);
    const hasManage = (permissions & BigInt(0x20)) === BigInt(0x20);
    const canManage = guild.owner || hasAdmin || hasManage;

    const botInGuild = client.guilds.cache.has(guild.id);

    return {
      ...guild,
      canManage,
      botInGuild
    };
  }).filter(g => g.canManage);

  res.render('home/guilds', {
    pageTitle: 'Select a Server - Dashboard',
    guilds: manageableGuilds
  });
});

// GET /guilds/:guildID - Manage specific server
router.get('/:guildID', isAuthorized, checkGuildPermission, (req, res) => {
  const guildID = req.params.guildID;
  const botGuild = client.guilds.cache.get(guildID);

  res.render('home/settings', {
    pageTitle: `Manage ${req.currentGuild.name}`,
    guild: req.currentGuild,
    botGuild: botGuild || null
  });
});

module.exports = router;
