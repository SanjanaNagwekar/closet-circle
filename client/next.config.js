/** @type {import('next').NextConfig} */
const rawApiBaseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:8800';

let apiBaseUrl;
try {
  const parsedApiBaseUrl = new URL(rawApiBaseUrl);
  if (!['http:', 'https:'].includes(parsedApiBaseUrl.protocol)) {
    throw new Error('API_BASE_URL must use http or https');
  }
  apiBaseUrl = parsedApiBaseUrl.toString().replace(/\/$/, '');
} catch (error) {
  throw new Error(`Invalid API_BASE_URL: ${error.message}`);
}

const nextConfig = {
  env: {
    NEXT_PUBLIC_LOGIN_ROUTE: '/api/auth/login',
  },
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
      {
        source: '/backend-health',
        destination: `${apiBaseUrl}/health`,
      },
    ];
  },
}

module.exports = nextConfig
