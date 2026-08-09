const { google } = require('googleapis');
const { redirectUri } = require('../_google');

module.exports = async (req, res) => {
  const code = req.query.code;
  if (!code) {
    res.status(400).send('Missing ?code from Google.');
    return;
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri()
  );

  try {
    const { tokens } = await client.getToken(code);
    // Shown once, never stored server-side: copy refresh_token into the
    // GOOGLE_REFRESH_TOKEN env var on Vercel, then delete/rotate if this
    // page is ever exposed publicly.
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(
      tokens.refresh_token
        ? `Copie cette valeur dans GOOGLE_REFRESH_TOKEN sur Vercel :\n\n${tokens.refresh_token}`
        : `Pas de refresh_token reçu (Google n'en renvoie qu'au premier consentement). ` +
          `Révoque l'accès sur https://myaccount.google.com/permissions puis relance /api/oauth/start.`
    );
  } catch (err) {
    res.status(500).send(`Erreur d'échange du code : ${String(err)}`);
  }
};
