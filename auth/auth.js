/**
 * Authentication Middleware
 * Prevents recursive login loops and handles session state correctly.
 */

// Middleware to ensure user is authenticated
function isAuthorized(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // Store requested URL to redirect back after successful login
  if (req.session) {
    req.session.returnTo = req.originalUrl;
  }
  
  return res.redirect('/login');
}

// Middleware to redirect authenticated users away from login page
function isNotAuthorized(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/guilds');
  }
  return next();
}

// Middleware to verify user has Manage Server / Admin permissions in target Guild
function checkGuildPermission(req, res, next) {
  const guildId = req.params.guildID || req.query.guildID;
  if (!guildId || !req.user || !req.user.guilds) {
    return res.redirect('/guilds');
  }

  const userGuild = req.user.guilds.find(g => g.id === guildId);
  if (!userGuild) {
    return res.status(403).render('error_pages/404', {
      pageTitle: 'Forbidden',
      message: 'You are not a member of this Discord server.'
    });
  }

  // Check if owner or has MANAGE_GUILD (0x20) or ADMINISTRATOR (0x8)
  const permissions = BigInt(userGuild.permissions);
  const MANAGE_GUILD = BigInt(0x20);
  const ADMINISTRATOR = BigInt(0x8);

  const hasPermission = userGuild.owner || 
    (permissions & MANAGE_GUILD) === MANAGE_GUILD || 
    (permissions & ADMINISTRATOR) === ADMINISTRATOR;

  if (!hasPermission) {
    return res.status(403).render('error_pages/404', {
      pageTitle: 'Unauthorized',
      message: 'You do not have Manage Server permissions for this server.'
    });
  }

  req.currentGuild = userGuild;
  next();
}

module.exports = {
  isAuthorized,
  isNotAuthorized,
  checkGuildPermission
};
