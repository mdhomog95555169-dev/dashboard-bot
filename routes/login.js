/**
 * OAuth2 Login & Logout Routes
 */
const express = require('express');
const passport = require('passport');
const router = express.Router();
const { isNotAuthorized, isAuthorized } = require('../auth/auth');

// GET /login - Login Landing Page
router.get('/login', isNotAuthorized, (req, res) => {
  res.render('login/login', {
    pageTitle: 'Login to Discord Dashboard'
  });
});

// GET /auth/discord - Initiate Discord OAuth2
router.get(
  '/auth/discord',
  passport.authenticate('discord', {
    scope: ['identify', 'guilds', 'email']
  })
);

// GET /auth/discord/callback - OAuth2 Callback handler
router.get(
  '/auth/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: '/login?error=auth_failed'
  }),
  (req, res) => {
    // Successful authentication
    const returnTo = (req.session && req.session.returnTo) || '/guilds';
    if (req.session) {
      delete req.session.returnTo;
    }
    
    // Explicitly save the session before redirecting to avoid race conditions
    req.session.save((err) => {
      if (err) {
        console.error('Session save error during OAuth2 callback:', err);
      }
      res.redirect(returnTo);
    });
  }
);

// GET /logout - Safe Logout and Session Clearance
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    
    if (req.session) {
      req.session.destroy((sessionErr) => {
        if (sessionErr) console.error('Session destroy error:', sessionErr);
        res.clearCookie('discord_dashboard_sid');
        res.redirect('/');
      });
    } else {
      res.redirect('/');
    }
  });
});

module.exports = router;
