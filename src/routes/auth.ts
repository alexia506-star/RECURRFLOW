import express from 'express';
import passport from '../middleware/auth';
import { MondayTokenResponse } from '../types';

const router = express.Router();

// Start OAuth flow
router.get('/monday', passport.authenticate('monday', {
  scope: ['boards:read', 'boards:write', 'webhooks:write', 'account:read', 'users:read']
}));

// OAuth callback
router.get('/callback', 
  passport.authenticate('monday', { failureRedirect: '/auth/error' }),
  (req, res) => {
    // Successful authentication
    res.redirect(process.env.NODE_ENV === 'production' 
      ? 'https://your-app-domain.com/dashboard'
      : 'http://localhost:3000/dashboard'
    );
  }
);

// Exchange code for token (for direct API usage)
router.post('/monday', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const tokenResponse = await fetch('https://auth.monday.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MONDAY_CLIENT_ID!,
        client_secret: process.env.MONDAY_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.NODE_ENV === 'production' 
          ? 'https://your-app-domain.com/auth/callback'
          : 'http://localhost:3000/auth/callback'
      })
    });

    const tokenData = await tokenResponse.json() as MondayTokenResponse;
    
    if (!tokenResponse.ok) {
      return res.status(400).json({ error: 'Failed to exchange code for token', details: tokenData });
    }

    // Store tokens in session or database
    req.session.mondayTokens = tokenData;
    
    res.json({ 
      success: true, 
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in 
    });
  } catch (error) {
    console.error('OAuth token exchange error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session destruction failed' });
      }
      res.json({ success: true });
    });
  });
});

// Error handler
router.get('/error', (req, res) => {
  res.status(401).json({ error: 'Authentication failed' });
});

export default router;