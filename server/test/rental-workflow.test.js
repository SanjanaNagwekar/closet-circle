const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');

const { closeDatabase, get, initializeDatabase, openDatabase, run } = require('../database');
const cartRouter = require('../routes/cart');
const rentalsRouter = require('../routes/rentals');

const TEST_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'closet-circle-rentals-'));
const TEST_DATABASE_PATH = path.join(TEST_DATA_DIR, 'closet-circle.db');
const START_DATE = '2099-07-10';
const END_DATE = '2099-07-13';

let baseUrl;
let database;
let listing;
let renterOneRequestId;
let renterTwoRequestId;
let server;

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

async function addAndCheckoutRental(email) {
    const addResponse = await request('/api/profile/cart/items', email, {
        method: 'POST',
        body: JSON.stringify({
            postId: listing.post_id,
            intent: 'rental',
            startDate: START_DATE,
            endDate: END_DATE,
        }),
    });
    assert.equal(addResponse.status, 201);

    const checkoutResponse = await request('/api/profile/cart/checkout', email, {
        method: 'POST',
    });
    assert.equal(checkoutResponse.status, 200);
}

test.before(async () => {
    database = openDatabase(TEST_DATABASE_PATH);
    await initializeDatabase(database, { seed: true });
    await run(
        database,
        `INSERT INTO User (email, first_name, last_name) VALUES
         ('renter-one@example.com', 'Renter', 'One'),
         ('renter-two@example.com', 'Renter', 'Two'),
         ('renter-three@example.com', 'Renter', 'Three')`,
    );

    listing = await get(
        database,
        `SELECT P.post_id, P.owner_id
         FROM Post P
         WHERE P.bflag = 1
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
    await run(database, `UPDATE Post SET sflag = 1 WHERE post_id = ?`, [listing.post_id]);

    const testAuth = {
        requireUser: [
            (req, res, next) => {
                req.currentUser = { email: req.headers['x-test-user'] };
                next();
            },
        ],
    };
    const app = express();
    app.use(express.json());
    app.use('/api/profile/cart', cartRouter(database, testAuth));
    app.use('/api/profile/rentals', rentalsRouter(database, testAuth));
    app.use((error, req, res, next) => {
        res.status(error.statusCode || 500).json({ error: error.message });
    });

    server = await new Promise((resolve) => {
        const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (database) await closeDatabase(database);
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

test('rental checkout creates pending requests for overlapping dates', async () => {
    await addAndCheckoutRental('renter-one@example.com');
    await addAndCheckoutRental('renter-two@example.com');

    const renterOne = await get(
        database,
        `SELECT rental_id, status FROM Rental_Request WHERE renter_email = ?`,
        ['renter-one@example.com'],
    );
    const renterTwo = await get(
        database,
        `SELECT rental_id, status FROM Rental_Request WHERE renter_email = ?`,
        ['renter-two@example.com'],
    );
    renterOneRequestId = renterOne.rental_id;
    renterTwoRequestId = renterTwo.rental_id;
    assert.equal(renterOne.status, 'pending');
    assert.equal(renterTwo.status, 'pending');
});

test('only the seller can approve a pending request', async () => {
    const renterResponse = await request(
        `/api/profile/rentals/${renterOneRequestId}/status`,
        'renter-one@example.com',
        {
            method: 'PATCH',
            body: JSON.stringify({ status: 'approved' }),
        },
    );
    assert.equal(renterResponse.status, 404);

    const sellerResponse = await request(
        `/api/profile/rentals/${renterOneRequestId}/status`,
        listing.owner_id,
        {
            method: 'PATCH',
            body: JSON.stringify({ status: 'approved' }),
        },
    );
    assert.equal(sellerResponse.status, 200);
    assert.equal((await sellerResponse.json()).rental.status, 'approved');
});

test('a buyer cannot cancel a rental after seller approval', async () => {
    const response = await request(
        `/api/profile/rentals/${renterOneRequestId}/status`,
        'renter-one@example.com',
        {
            method: 'PATCH',
            body: JSON.stringify({ status: 'cancelled' }),
        },
    );
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /pending/i);
});

test('overlapping requests cannot both be approved', async () => {
    const response = await request(
        `/api/profile/rentals/${renterTwoRequestId}/status`,
        listing.owner_id,
        {
            method: 'PATCH',
            body: JSON.stringify({ status: 'approved' }),
        },
    );
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /conflict/i);
});

test('an item committed to an approved rental cannot be purchased', async () => {
    const response = await request('/api/profile/cart/items', 'renter-two@example.com', {
        method: 'POST',
        body: JSON.stringify({
            postId: listing.post_id,
            intent: 'purchase',
        }),
    });
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /committed to a rental/i);
});

test('a renter can cancel a pending request', async () => {
    const response = await request(
        `/api/profile/rentals/${renterTwoRequestId}/status`,
        'renter-two@example.com',
        {
            method: 'PATCH',
            body: JSON.stringify({ status: 'cancelled' }),
        },
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).rental.status, 'cancelled');
});

test('the seller can complete an approved rental', async () => {
    const today = new Date().toISOString().slice(0, 10);
    await run(
        database,
        `UPDATE Rental_Request SET start_date = ?, end_date = ? WHERE rental_id = ?`,
        [today, today, renterOneRequestId],
    );
    const response = await request(
        `/api/profile/rentals/${renterOneRequestId}/status`,
        listing.owner_id,
        {
            method: 'PATCH',
            body: JSON.stringify({ status: 'completed' }),
        },
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).rental.status, 'completed');
});

test('buyer and seller rental views are scoped to the authenticated user', async () => {
    const [buyerResponse, sellerResponse, otherBuyerResponse] = await Promise.all([
        request('/api/profile/rentals/buyer', 'renter-one@example.com'),
        request('/api/profile/rentals/seller', listing.owner_id),
        request('/api/profile/rentals/buyer', 'renter-two@example.com'),
    ]);
    const buyerRentals = (await buyerResponse.json()).rentals;
    const sellerRentals = (await sellerResponse.json()).rentals;
    const otherBuyerRentals = (await otherBuyerResponse.json()).rentals;

    assert.equal(buyerRentals.length, 1);
    assert.equal(buyerRentals[0].status, 'completed');
    assert.equal(sellerRentals.length >= 2, true);
    assert.equal(otherBuyerRentals.length, 1);
    assert.equal(otherBuyerRentals[0].status, 'cancelled');
});

test('past rental dates are rejected', async () => {
    const response = await request('/api/profile/cart/items', 'renter-one@example.com', {
        method: 'POST',
        body: JSON.stringify({
            postId: listing.post_id,
            intent: 'rental',
            startDate: '2020-01-01',
            endDate: '2020-01-03',
        }),
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /past/i);
});

test('a completed rental no longer blocks purchase and pending requests are declined', async () => {
    await addAndCheckoutRental('renter-three@example.com');

    const addResponse = await request('/api/profile/cart/items', 'renter-two@example.com', {
        method: 'POST',
        body: JSON.stringify({
            postId: listing.post_id,
            intent: 'purchase',
        }),
    });
    assert.equal(addResponse.status, 201);

    const checkoutResponse = await request('/api/profile/cart/checkout', 'renter-two@example.com', {
        method: 'POST',
    });
    assert.equal(checkoutResponse.status, 200);

    const pendingRequest = await get(
        database,
        `SELECT status FROM Rental_Request WHERE renter_email = ? AND post_id = ?`,
        ['renter-three@example.com', listing.post_id],
    );
    const purchasedListing = await get(
        database,
        `SELECT listing_status FROM Post WHERE post_id = ?`,
        [listing.post_id],
    );
    assert.equal(pendingRequest.status, 'declined');
    assert.equal(purchasedListing.listing_status, 'archived');
});
