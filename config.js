require('dotenv').config();

module.exports = {
  token: process.env.TOKEN || process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID || process.env.CLIENTID,
  mongoUri: process.env.MONGO_URI || process.env.MONGO_URL,
  clientSecret: process.env.CLIENT_SECRET
};
