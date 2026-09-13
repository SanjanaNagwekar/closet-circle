/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_LOGIN_ROUTE: '/api/auth/login',
    // Vercel is used as a frontend-only portfolio demo. Keep the normal
    // Auth0-backed behavior for local development unless explicitly enabled.
    NEXT_PUBLIC_DEMO_MODE:
      process.env.VERCEL === '1'
        ? 'true'
        : process.env.NEXT_PUBLIC_DEMO_MODE || 'false',
  },
}

module.exports = nextConfig
