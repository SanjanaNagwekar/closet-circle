const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');

const { closeDatabase, initializeDatabase, openDatabase } = require('../database');
const profileRouter = require('../routes/profile');

const TEST_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'closet-circle-authorization-'));
const TEST_DATABASE_PATH = path.join(TEST_DATA_DIR, 'closet-circle.db');

let baseUrl;
let database;
let server;
let aliceTransactionId;
let bobTransactionId;

function run(sql, parameters = []) {
    return new Promise((resolve, reject) => {
        database.run(sql, parameters, function onRun(error) {
            if (error) {
                reject(error);
                return;
            }
            resolve({ changes: this.changes, lastID: this.lastID });
        });
    });
}

function get(sql, parameters = []) {
    return new Promise((resolve, reject) => {
        database.get(sql, parameters, (error, row) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(row);
        });
    });
}

function request(pathname, email, options = {}) {
    return fetch(`${baseUrl}${pathname}`, {
        ...options,
        headers: {
            'content-type': 'application/json',
            'x-test-user': email,
            ...options.headers,
        },
    });
}

test.before(async () => {
    database = openDatabase(TEST_DATABASE_PATH);
    await initializeDatabase(database, { seed: true });

    await run(
        `INSERT INTO User (email, first_name, last_name) VALUES
         ('alice@example.com', 'Alice', 'Buyer'),
         ('bob@example.com', 'Bob', 'Buyer')`,
    );

    const aliceTransaction = await get(
        `SELECT transaction_id FROM Transactions WHERE email = ? AND status = 'pending'`,
        ['alice@example.com'],
    );
    const bobTransaction = await get(
        `SELECT transaction_id FROM Transactions WHERE email = ? AND status = 'pending'`,
        ['bob@example.com'],
    );
    aliceTransactionId = aliceTransaction.transaction_id;
    bobTransactionId = bobTransaction.transaction_id;

    await run(
        `INSERT INTO Transaction_Listing (transaction_id, post_id) VALUES (?, ?)`,
        [bobTransactionId, 1],
    );

    const app = express();
    app.use(express.json());
    app.use(
        '/api/profile',
        profileRouter(database, {
            requireUser: [
                (req, res, next) => {
                    req.currentUser = { email: req.headers['x-test-user'] };
                    next();
                },
            ],
        }),
    );

    server = await new Promise((resolve) => {
        const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
    if (database) await closeDatabase(database);
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

test('cart reads use the authenticated user instead of the query string email', async () => {
    const aliceResponse = await request(
        '/api/profile/cart?email=bob@example.com',
        'alice@example.com',
    );
    const bobResponse = await request(
        '/api/profile/cart?email=alice@example.com',
        'bob@example.com',
    );

    assert.equal(aliceResponse.status, 200);
    assert.deepEqual(await aliceResponse.json(), { cart: [] });

    assert.equal(bobResponse.status, 200);
    const bobCart = await bobResponse.json();
    assert.equal(bobCart.transId, bobTransactionId);
    assert.equal(bobCart.cart.length, 1);
    assert.equal(bobCart.cart[0].post_id, 1);
});

test('checkout cannot update another user’s transaction', async () => {
    const response = await request(
        `/api/profile/checkout?transactionId=${bobTransactionId}`,
        'alice@example.com',
        { method: 'PUT' },
    );

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Pending transaction not found' });

    const transaction = await get(
        `SELECT status FROM Transactions WHERE transaction_id = ?`,
        [bobTransactionId],
    );
    assert.equal(transaction.status, 'pending');
});

test('the authorization fixture created separate pending transactions', () => {
    assert.notEqual(aliceTransactionId, bobTransactionId);
});
