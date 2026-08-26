/**
 * Passport.js Discord OAuth2 Strategy Configuration
 * Fixed for accurate user & guild synchronization without token expiration lockouts.
 */
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

// Serialize User into the Session
passport.serializeUser((user, done) => {
  // Store the essential user payload
  done(null, user);
});

// Deserialize User from the Session
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Validate Environment Variables
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const callbackURL = process.env.CALLBACK_URL || 'http://localhost:3000/auth/discord/callback';

if (!clientID || !clientSecret) {
  console.error('❌ FATAL: CLIENT_ID or CLIENT_SECRET is missing in environment variables!');
}

passport.use(
  new DiscordStrategy(
    {
      clientID: clientID,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      scope: ['identify', 'guilds', 'email'],
      prompt: 'consent' // Forces consent dialog if needed or ensure token issuance
    },
    (accessToken, refreshToken, profile, done) => {
      // Attach accessToken to profile for live guild fetches if needed
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;
      profile.fetchedAt = Date.now();
      
      return done(null, profile);
    }
  )
);
