const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const sqlite3 = require('sqlite3');

const SERVER_DIR = path.join(__dirname, '..');
const PORT = 18880;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const TEST_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'closet-circle-test-'));
const TEST_DATABASE_PATH = path.join(TEST_DATA_DIR, 'closet-circle.db');

let serverProcess;

function runDatabase(sql, parameters = []) {
    const database = new sqlite3.Database(TEST_DATABASE_PATH);
    return new Promise((resolve, reject) => {
        database.run(sql, parameters, function onRun(error) {
            database.close();
            if (error) {
                reject(error);
                return;
            }
            resolve({ changes: this.changes, lastID: this.lastID });
        });
    });
}

async function waitForServer(timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        if (serverProcess.exitCode !== null) {
            throw new Error(`Server exited before becoming ready with code ${serverProcess.exitCode}`);
        }

        try {
            const response = await fetch(`${BASE_URL}/ready`);
            if (response.ok) return;
        } catch (_) {
            // The server may still be starting up. Retry until the timeout.
        }

        await new Promise((resolve) => setTimeout(resolve, 150));
    }

    throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

test.before(async () => {
    serverProcess = spawn(process.execPath, ['index.js'], {
        cwd: SERVER_DIR,
        env: {
            ...process.env,
            PORT: String(PORT),
            CLIENT_ORIGINS: 'http://localhost:3000',
            DATABASE_PATH: TEST_DATABASE_PATH,
            SEED_DATABASE_ON_START: 'true',
            AUTH0_ISSUER_BASE_URL: 'https://closet-circle-test.auth0.com/',
            AUTH0_AUDIENCE: 'https://api.closet-circle.test',
            AUTH0_EMAIL_CLAIM: 'https://closet-circle.app/email',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    serverProcess.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
    });

    try {
        await waitForServer();
    } catch (error) {
        if (stderr) error.message += `\nServer stderr:\n${stderr}`;
        throw error;
    }
});

test.after(async () => {
    if (serverProcess && serverProcess.exitCode === null) {
        serverProcess.kill('SIGTERM');
        await new Promise((resolve) => serverProcess.once('exit', resolve));
    }
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

test('GET / returns the backend health response', async () => {
    const response = await fetch(`${BASE_URL}/`);
    assert.equal(response.status, 200);
    assert.equal(await response.json(), 'hello this is the backend');
});

test('GET /health reports the service status', async () => {
    const response = await fetch(`${BASE_URL}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
        status: 'ok',
        service: 'closet-circle-api',
    });
});

test('GET /ready confirms database access', async () => {
    const response = await fetch(`${BASE_URL}/ready`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ready' });
});

test('GET /api/posts/trending returns posts with lister metadata', async () => {
    const response = await fetch(`${BASE_URL}/api/posts/trending`);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.ok(Array.isArray(data.trending));

    for (const post of data.trending) {
        assert.ok(post.lister, `Post ${post.post_id} is missing lister metadata`);
        assert.equal(typeof post.lister.display, 'string');
        assert.equal(typeof post.lister.username, 'string');
    }
});

test('public marketplace endpoints exclude draft and archived listings', async () => {
    await runDatabase(
        `INSERT INTO Post (
            closet_id, owner_id, title, item_condition, size, price,
            bflag, sflag, listing_status
         ) VALUES (1, 'user1@email.com', ?, 'good', 'Medium', 10, 0, 1, 'draft')`,
        ['Private draft listing'],
    );
    await runDatabase(
        `INSERT INTO Post (
            closet_id, owner_id, title, item_condition, size, price,
            bflag, sflag, listing_status
         ) VALUES (1, 'user1@email.com', ?, 'good', 'Medium', 10, 0, 1, 'archived')`,
        ['Archived listing'],
    );

    const [allPostsResponse, profilePostsResponse] = await Promise.all([
        fetch(`${BASE_URL}/api/posts-all`),
        fetch(`${BASE_URL}/api/profile/posts?ownerID=user1@email.com`),
    ]);
    assert.equal(allPostsResponse.status, 200);
    assert.equal(profilePostsResponse.status, 200);

    const publicTitles = (await allPostsResponse.json()).posts.map((post) => post.title);
    const profileTitles = (await profilePostsResponse.json()).posts.map((post) => post.title);
    assert.equal(publicTitles.includes('Private draft listing'), false);
    assert.equal(publicTitles.includes('Archived listing'), false);
    assert.equal(profileTitles.includes('Private draft listing'), false);
    assert.equal(profileTitles.includes('Archived listing'), false);
});

test('protected endpoints reject requests without an access token', async () => {
    const response = await fetch(`${BASE_URL}/api/profile/cart?email=user1@email.com`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Unauthorized' });
});

test('debug endpoints are not exposed', async () => {
    const [usersResponse, postCategoryResponse, unavailableResponse] = await Promise.all([
        fetch(`${BASE_URL}/api/users`),
        fetch(`${BASE_URL}/api/post-cat`),
        fetch(`${BASE_URL}/api/all-unavailable`),
    ]);

    assert.equal(usersResponse.status, 404);
    assert.equal(postCategoryResponse.status, 404);
    assert.equal(unavailableResponse.status, 404);
});

test('legacy mutation endpoints are not exposed', async () => {
    const [uploadResponse, deleteResponse, cartIdResponse, checkoutResponse] = await Promise.all([
        fetch(`${BASE_URL}/api/profile/upload-item`, { method: 'POST' }),
        fetch(`${BASE_URL}/api/profile/delete-item`, { method: 'POST' }),
        fetch(`${BASE_URL}/api/profile/cart/id`),
        fetch(`${BASE_URL}/api/profile/checkout`, { method: 'PUT' }),
    ]);

    assert.equal(uploadResponse.status, 404);
    assert.equal(deleteResponse.status, 404);
    assert.equal(cartIdResponse.status, 404);
    assert.equal(checkoutResponse.status, 404);
});
