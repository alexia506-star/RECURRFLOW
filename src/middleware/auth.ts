import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Request, Response, NextFunction } from 'express';

// Configure OAuth2 strategy for monday.com
passport.use('monday', new OAuth2Strategy({
  authorizationURL: 'https://auth.monday.com/oauth2/authorize',
  tokenURL: 'https://auth.monday.com/oauth2/token',
  clientID: process.env.MONDAY_CLIENT_ID!,
  clientSecret: process.env.MONDAY_CLIENT_SECRET!,
  callbackURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-app-domain.com/auth/callback'
    : 'http://localhost:3000/auth/callback'
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
  try {
    // Store user and tokens in database
    // This will be implemented when we have the database setup
    const user = {
      accessToken,
      refreshToken,
      profile
    };
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// Middleware to ensure user is authenticated
export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

export default passport;