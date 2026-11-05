const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');

const { closeDatabase, initializeDatabase, openDatabase } = require('../database');
const cartRouter = require('../routes/cart');
const profileRouter = require('../routes/profile');

const TEST_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'closet-circle-authorization-'));
const TEST_DATABASE_PATH = path.join(TEST_DATA_DIR, 'closet-circle.db');

let baseUrl;
let database;
let server;
let aliceTransactionId;
let bobTransactionId;
let availablePostId;
let favoritePostId;
let rentalPostId;
let aliceListingId;
let bobListingId;

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
    const aliceListing = await run(
        `INSERT INTO Post (
            closet_id, owner_id, title, description, item_condition, size,
            price, bflag, sflag, listing_status, updated_at
         ) VALUES (1, 'alice@example.com', 'Alice listing', 'Test listing',
                   'good', 'Medium', 12, 0, 1, 'published', CURRENT_TIMESTAMP)`,
    );
    aliceListingId = aliceListing.lastID;
    const bobListing = await run(
        `INSERT INTO Post (
            closet_id, owner_id, title, description, item_condition, size,
            price, bflag, sflag, listing_status, updated_at
         ) VALUES (1, 'bob@example.com', 'Bob listing', 'Test listing',
                   'good', 'Medium', 18, 0, 1, 'published', CURRENT_TIMESTAMP)`,
    );
    bobListingId = bobListing.lastID;

    const aliceSale = await run(
        `INSERT INTO Transactions (email, status, purchased_date)
         VALUES ('bob@example.com', 'purchased', CURRENT_TIMESTAMP)`,
    );
    const bobSale = await run(
        `INSERT INTO Transactions (email, status, purchased_date)
         VALUES ('alice@example.com', 'purchased', CURRENT_TIMESTAMP)`,
    );
    await run(
        `INSERT INTO Transaction_Listing (transaction_id, post_id, intent, unit_price)
         VALUES (?, ?, 'purchase', 12)`,
        [aliceSale.lastID, aliceListingId],
    );
    await run(
        `INSERT INTO Transaction_Listing (transaction_id, post_id, intent, unit_price)
         VALUES (?, ?, 'purchase', 18)`,
        [bobSale.lastID, bobListingId],
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

    const availablePost = await get(
        `SELECT P.post_id
         FROM Post P
         WHERE P.sflag = 1
           AND P.owner_id <> 'alice@example.com'
           AND P.listing_status = 'published'
           AND NOT EXISTS (
               SELECT 1
               FROM Transaction_Listing TL
               JOIN Transactions T USING (transaction_id)
               WHERE TL.post_id = P.post_id
                 AND TL.intent = 'purchase'
                 AND T.status = 'purchased'
           )
         ORDER BY P.post_id DESC
         LIMIT 1`,
    );
    availablePostId = availablePost.post_id;
    const favoritePost = await get(
        `SELECT P.post_id
         FROM Post P
         WHERE P.listing_status = 'published'
           AND P.owner_id <> 'alice@example.com'
           AND P.post_id <> ?
           AND NOT EXISTS (
               SELECT 1
               FROM Transaction_Listing TL
               JOIN Transactions T USING (transaction_id)
               WHERE TL.post_id = P.post_id
                 AND TL.intent = 'purchase'
                 AND T.status = 'purchased'
           )
         ORDER BY P.post_id DESC
         LIMIT 1`,
        [availablePostId],
    );
    favoritePostId = favoritePost.post_id;
    const rentalPost = await get(
        `SELECT P.post_id
         FROM Post P
         WHERE P.bflag = 1
           AND P.owner_id <> 'alice@example.com'
           AND P.listing_status = 'published'
           AND P.post_id <> ?
           AND NOT EXISTS (
               SELECT 1
               FROM Transaction_Listing TL
               JOIN Transactions T USING (transaction_id)
               WHERE TL.post_id = P.post_id
                 AND TL.intent = 'purchase'
                 AND T.status = 'purchased'
           )
         ORDER BY P.post_id DESC
         LIMIT 1`,
        [availablePostId],
    );
    rentalPostId = rentalPost.post_id;

    const app = express();
    app.use(express.json());
    const testAuth = {
        requireUser: [
            (req, res, next) => {
                const email = req.headers['x-test-user'];
                if (!email) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                req.currentUser = { email };
                next();
            },
        ],
    };
    app.use('/api/profile/cart', cartRouter(database, testAuth));
    app.use(
        '/api/profile',
        profileRouter(database, testAuth),
    );
    app.use((error, req, res, next) => {
        res.status(error.statusCode || 500).json({ error: error.message });
    });

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

test('cart reads use the authenticated user', async () => {
    const aliceResponse = await request(
        '/api/profile/cart',
        'alice@example.com',
    );
    const bobResponse = await request(
        '/api/profile/cart',
        'bob@example.com',
    );

    assert.equal(aliceResponse.status, 200);
    assert.deepEqual(await aliceResponse.json(), { cart: [] });

    assert.equal(bobResponse.status, 200);
    const bobCart = await bobResponse.json();
    assert.equal(bobCart.cart.length, 1);
    assert.equal(bobCart.cart[0].post_id, 1);
});

test('cart mutations resolve the transaction from the authenticated user', async () => {
    const ownListingResponse = await request(
        '/api/profile/cart/items',
        'alice@example.com',
        {
            method: 'POST',
            body: JSON.stringify({ postId: aliceListingId, intent: 'purchase' }),
        },
    );
    assert.equal(ownListingResponse.status, 400);

    const addResponse = await request(
        '/api/profile/cart/items',
        'alice@example.com',
        {
            method: 'POST',
            body: JSON.stringify({ postId: availablePostId, intent: 'purchase' }),
        },
    );
    assert.equal(addResponse.status, 201);

    const aliceCartResponse = await request('/api/profile/cart', 'alice@example.com');
    const aliceCart = await aliceCartResponse.json();
    assert.equal(aliceCart.cart.length, 1);
    assert.equal(aliceCart.cart[0].post_id, availablePostId);
    assert.equal(aliceCart.cart[0].intent, 'purchase');
    assert.equal(typeof aliceCart.cart[0].price, 'number');

    const bobTransaction = await get(
        `SELECT status FROM Transactions WHERE transaction_id = ?`,
        [bobTransactionId],
    );
    assert.equal(bobTransaction.status, 'pending');

});

test('favorites use the authenticated user instead of request-provided identity', async () => {
    const addResponse = await request('/api/profile/wishlist', 'alice@example.com', {
        method: 'POST',
        body: JSON.stringify({ email: 'bob@example.com', post_id: favoritePostId }),
    });
    assert.equal(addResponse.status, 201);

    const [aliceResponse, bobResponse] = await Promise.all([
        request('/api/profile/wishlist?email=bob@example.com', 'alice@example.com'),
        request('/api/profile/wishlist?email=alice@example.com', 'bob@example.com'),
    ]);
    const aliceWishlist = await aliceResponse.json();
    const bobWishlist = await bobResponse.json();
    assert.equal(aliceWishlist.wishlist.some((item) => item.post_id === favoritePostId), true);
    assert.equal(bobWishlist.wishlist.some((item) => item.post_id === favoritePostId), false);

    const removeResponse = await request('/api/profile/wishlist', 'alice@example.com', {
        method: 'DELETE',
        body: JSON.stringify({ post_id: favoritePostId }),
    });
    assert.equal(removeResponse.status, 204);
});

test('seller history cannot be read without authentication', async () => {
    const response = await fetch(`${baseUrl}/api/profile/seller-history`);
    assert.equal(response.status, 401);
});

test('seller history ignores request-provided identity', async () => {
    const response = await request(
        '/api/profile/seller-history?email=bob@example.com',
        'alice@example.com',
    );
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.orders.some((order) => order.post_id === aliceListingId), true);
    assert.equal(body.orders.some((order) => order.post_id === bobListingId), false);
});

test('checkout completes only the current user cart and opens a fresh cart', async () => {
    const response = await request('/api/profile/cart/checkout', 'alice@example.com', {
        method: 'POST',
    });
    assert.equal(response.status, 200);

    const completed = await get(
        `SELECT status FROM Transactions WHERE transaction_id = ?`,
        [aliceTransactionId],
    );
    assert.equal(completed.status, 'purchased');

    const newCart = await get(
        `SELECT transaction_id FROM Transactions WHERE email = ? AND status = 'pending'`,
        ['alice@example.com'],
    );
    assert.notEqual(newCart.transaction_id, aliceTransactionId);

    const bobTransaction = await get(
        `SELECT status FROM Transactions WHERE transaction_id = ?`,
        [bobTransactionId],
    );
    assert.equal(bobTransaction.status, 'pending');

    const listing = await get(
        `SELECT listing_status FROM Post WHERE post_id = ?`,
        [availablePostId],
    );
    assert.equal(listing.listing_status, 'archived');

    const unavailableResponse = await request('/api/profile/cart/items', 'bob@example.com', {
        method: 'POST',
        body: JSON.stringify({ postId: availablePostId, intent: 'purchase' }),
    });
    assert.equal(unavailableResponse.status, 404);
});

test('rental intent is preserved without archiving the listing', async () => {
    const addResponse = await request('/api/profile/cart/items', 'alice@example.com', {
        method: 'POST',
        body: JSON.stringify({
            postId: rentalPostId,
            intent: 'rental',
            startDate: '2099-06-01',
            endDate: '2099-06-03',
        }),
    });
    assert.equal(addResponse.status, 201);

    const cartResponse = await request('/api/profile/cart', 'alice@example.com');
    const cart = await cartResponse.json();
    assert.equal(cart.cart[0].intent, 'rental');
    assert.equal(cart.cart[0].rental_start_date, '2099-06-01');
    assert.equal(cart.cart[0].rental_end_date, '2099-06-03');

    const checkoutResponse = await request('/api/profile/cart/checkout', 'alice@example.com', {
        method: 'POST',
    });
    assert.equal(checkoutResponse.status, 200);
    assert.equal((await checkoutResponse.json()).message, 'Rental request submitted');

    const listing = await get(
        `SELECT listing_status FROM Post WHERE post_id = ?`,
        [rentalPostId],
    );
    assert.equal(listing.listing_status, 'published');

    const rentalRequest = await get(
        `SELECT status, start_date, end_date
         FROM Rental_Request
         WHERE renter_email = ? AND post_id = ?`,
        ['alice@example.com', rentalPostId],
    );
    assert.equal(rentalRequest.status, 'pending');
    assert.equal(rentalRequest.start_date, '2099-06-01');
    assert.equal(rentalRequest.end_date, '2099-06-03');
});

test('the authorization fixture created separate pending transactions', () => {
    assert.notEqual(aliceTransactionId, bobTransactionId);
});
