import { Auth0Client } from '@auth0/nextjs-auth0/server';

const legacyIssuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
const domain =
  process.env.AUTH0_DOMAIN ||
  legacyIssuerBaseUrl?.replace(/^https?:\/\//, '').replace(/\/$/, '');
const audience = process.env.AUTH0_AUDIENCE;

export const auth0 = new Auth0Client({
  domain,
  appBaseUrl: process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL,
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
