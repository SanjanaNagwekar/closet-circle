const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const SERVER_DIR = path.join(__dirname, '..');
const PORT = 18880;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const TEST_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'closet-circle-test-'));
const TEST_DATABASE_PATH = path.join(TEST_DATA_DIR, 'closet-circle.db');

let serverProcess;

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

test('upload-item route binds rental_date to the rental_end_date insert', () => {
    const profileRoute = fs.readFileSync(path.join(SERVER_DIR, 'routes', 'profile.js'), 'utf8');

    assert.match(
        profileRoute,
        /\[closet_id, owner_id, title, likes, description, date_posted, item_condition, size, price, for_rent, for_sale, rental_date\]/,
    );
});
