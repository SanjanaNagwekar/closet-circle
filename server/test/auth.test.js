const test = require('node:test');
const assert = require('node:assert/strict');

const { createAuth, DEFAULT_EMAIL_CLAIM } = require('../auth');

const TEST_ENVIRONMENT = {
    AUTH0_ISSUER_BASE_URL: 'https://closet-circle-test.auth0.com/',
    AUTH0_AUDIENCE: 'https://api.closet-circle.test',
};

function createResponse() {
    return {
        statusCode: 200,
        body: undefined,
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };
}

test('authentication is marked unavailable when Auth0 is not configured', () => {
    const apiAuth = createAuth({});
    const response = createResponse();

    apiAuth.requireUser[0]({}, response);

    assert.equal(apiAuth.configured, false);
    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.body, { error: 'API authentication is not configured' });
});

test('verified token claims become the current user identity', () => {
    const apiAuth = createAuth(TEST_ENVIRONMENT);
    const attachCurrentUser = apiAuth.requireUser[1];
    const request = {
        auth: {
            payload: {
                sub: 'auth0|123',
                [DEFAULT_EMAIL_CLAIM]: '  USER1@EMAIL.COM ',
            },
        },
    };
    const response = createResponse();
    let nextCalled = false;

    attachCurrentUser(request, response, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.deepEqual(request.currentUser, {
        auth0Id: 'auth0|123',
        email: 'user1@email.com',
    });
});

test('tokens without an email claim cannot access user-owned resources', () => {
    const apiAuth = createAuth(TEST_ENVIRONMENT);
    const attachCurrentUser = apiAuth.requireUser[1];
    const response = createResponse();
    let nextCalled = false;

    attachCurrentUser(
        { auth: { payload: { sub: 'auth0|123' } } },
        response,
        () => {
            nextCalled = true;
        },
    );

    assert.equal(nextCalled, false);
    assert.equal(response.statusCode, 403);
    assert.deepEqual(response.body, {
        error: 'The access token is missing required user claims',
    });
});
