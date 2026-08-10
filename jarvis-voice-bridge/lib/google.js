const { google } = require('googleapis');

function googleAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri()
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

function redirectUri() {
  const base = process.env.PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`;
  return `${base}/api/oauth/callback`;
}

module.exports = { googleAuthClient, redirectUri };
