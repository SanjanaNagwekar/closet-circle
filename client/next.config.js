/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_LOGIN_ROUTE: '/api/auth/login',
  },
}

module.exports = nextConfig
