import { Auth0Client } from '@auth0/nextjs-auth0/server';

const legacyIssuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
const domain =
  process.env.AUTH0_DOMAIN ||
  legacyIssuerBaseUrl?.replace(/^https?:\/\//, '').replace(/\/$/, '');

export const auth0 = new Auth0Client({
  domain,
  appBaseUrl: process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL,
  routes: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    callback: '/api/auth/callback',
    backChannelLogout: '/api/auth/backchannel-logout',
  },
  noContentProfileResponseWhenUnauthenticated: true,
});
