import { Auth0Client } from '@auth0/nextjs-auth0/server';

const legacyIssuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
const domain =
  process.env.AUTH0_DOMAIN ||
  process.env.AUTHENTICATION_AUTH0_DOMAIN ||
  legacyIssuerBaseUrl?.replace(/^https?:\/\//, '').replace(/\/$/, '');
const audience = process.env.AUTH0_AUDIENCE;
const appBaseUrl =
  process.env.APP_BASE_URL ||
  process.env.AUTH0_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const auth0 = new Auth0Client({
  domain,
  appBaseUrl,
  clientId: process.env.AUTH0_CLIENT_ID || process.env.AUTHENTICATION_AUTH0_CLIENT_ID,
  clientSecret:
    process.env.AUTH0_CLIENT_SECRET || process.env.AUTHENTICATION_AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET || process.env.AUTHENTICATION_AUTH0_SECRET,
  signInReturnToPath: '/profile',
  authorizationParameters: {
    ...(audience ? { audience } : {}),
    scope: process.env.AUTH0_SCOPE || 'openid profile email offline_access',
  },
  routes: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    callback: '/api/auth/callback',
    backChannelLogout: '/api/auth/backchannel-logout',
  },
  enableAccessTokenEndpoint: false,
  noContentProfileResponseWhenUnauthenticated: true,
});
