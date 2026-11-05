const { auth, UnauthorizedError } = require('express-oauth2-jwt-bearer');

const DEFAULT_EMAIL_CLAIM = 'https://closet-circle.app/email';

function getIssuerBaseUrl(environment) {
    if (environment.AUTH0_ISSUER_BASE_URL) {
        return environment.AUTH0_ISSUER_BASE_URL;
    }
    if (environment.AUTH0_DOMAIN) {
        return `https://${environment.AUTH0_DOMAIN}/`;
    }
    return null;
}

function createAuth(environment = process.env) {
    const issuerBaseURL = getIssuerBaseUrl(environment);
    const audience = environment.AUTH0_AUDIENCE;
    const emailClaim = environment.AUTH0_EMAIL_CLAIM || DEFAULT_EMAIL_CLAIM;

    if (!issuerBaseURL || !audience) {
        const authNotConfigured = (req, res) => {
            res.status(503).json({ error: 'API authentication is not configured' });
        };
        return {
            configured: false,
            requireUser: [authNotConfigured],
        };
    }

    const validateAccessToken = auth({
        audience,
        issuerBaseURL,
        tokenSigningAlg: 'RS256',
    });

    const attachCurrentUser = (req, res, next) => {
        const payload = req.auth?.payload;
        const email = payload?.[emailClaim] || payload?.email;

        if (!payload?.sub || typeof email !== 'string' || !email.trim()) {
            res.status(403).json({ error: 'The access token is missing required user claims' });
            return;
        }

        req.currentUser = {
            auth0Id: payload.sub,
            email: email.trim().toLowerCase(),
        };
        next();
    };

    return {
        configured: true,
        requireUser: [validateAccessToken, attachCurrentUser],
    };
}

function authErrorHandler(error, req, res, next) {
    if (error instanceof UnauthorizedError) {
        res.status(error.statusCode || 401).json({ error: 'Unauthorized' });
        return;
    }
    next(error);
}

module.exports = {
    DEFAULT_EMAIL_CLAIM,
    authErrorHandler,
    createAuth,
};
