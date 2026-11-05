const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');

const { closeDatabase, initializeDatabase, openDatabase } = require('../database');
const {
    createImageUpload,
    resolveUploadsPath,
    storedImagePath,
} = require('../listing-storage');
const listingsRouter = require('../routes/listings');

const TEST_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'closet-circle-listings-'));
const TEST_DATABASE_PATH = path.join(TEST_DATA_DIR, 'closet-circle.db');
const VALID_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nHQAAAAASUVORK5CYII=',
    'base64',
);

let baseUrl;
let database;
let server;
let uploadsPath;

function listingForm(overrides = {}) {
    const values = {
        title: 'Blue denim jacket',
        price: '28.50',
        forSale: 'true',
        forRent: 'true',
        itemCondition: 'excellent',
        size: 'Medium',
        description: 'A structured denim jacket in excellent condition.',
        categories: JSON.stringify([1, 6, 13]),
        existingImages: JSON.stringify([]),
        status: 'published',
        ...overrides,
    };
    const form = new FormData();
    for (const [key, value] of Object.entries(values)) form.set(key, value);
    return form;
}

function request(pathname, email, options = {}) {
    return fetch(`${baseUrl}${pathname}`, {
        ...options,
        headers: {
            'x-test-user': email,
            ...options.headers,
        },
    });
}

test.before(async () => {
    database = openDatabase(TEST_DATABASE_PATH);
    await initializeDatabase(database, { seed: true });
    uploadsPath = resolveUploadsPath(TEST_DATABASE_PATH, {
        UPLOADS_PATH: path.join(TEST_DATA_DIR, 'uploads'),
    });

    const app = express();
    app.use(express.json());
    app.use(
        '/api/profile/listings',
        listingsRouter(
            database,
            {
                requireUser: [
                    (req, res, next) => {
                        req.currentUser = { email: req.headers['x-test-user'] };
                        next();
                    },
                ],
            },
            {
                imageUpload: createImageUpload(uploadsPath),
                uploadsPath,
            },
        ),
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
    if (server) await new Promise((resolve) => server.close(resolve));
    if (database) await closeDatabase(database);
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

test('a seller can save an incomplete draft', async () => {
    const response = await request('/api/profile/listings', 'user1@email.com', {
        method: 'POST',
        body: listingForm({
            title: '',
            price: '',
            description: '',
            categories: '[]',
            status: 'draft',
        }),
    });

    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.listing.listing_status, 'draft');
    assert.deepEqual(data.listing.images, []);
});

test('publishing requires complete listing information and an image', async () => {
    const response = await request('/api/profile/listings', 'user1@email.com', {
        method: 'POST',
        body: listingForm(),
    });

    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /image/i);
});

test('a seller can publish, edit, archive, and delete a listing with a real image upload', async () => {
    const createForm = listingForm();
    createForm.append('images', new Blob([VALID_PNG], { type: 'image/png' }), 'jacket.png');

    const createResponse = await request('/api/profile/listings', 'user1@email.com', {
        method: 'POST',
        body: createForm,
    });
    assert.equal(createResponse.status, 201);
    const created = (await createResponse.json()).listing;
    assert.equal(created.listing_status, 'published');
    assert.equal(created.images.length, 1);
    assert.ok(fs.existsSync(storedImagePath(created.images[0], uploadsPath)));

    const updateForm = listingForm({
        title: 'Updated denim jacket',
        existingImages: JSON.stringify(created.images),
    });
    const updateResponse = await request(
        `/api/profile/listings/${created.post_id}`,
        'user1@email.com',
        { method: 'PUT', body: updateForm },
    );
    assert.equal(updateResponse.status, 200);
    const updated = (await updateResponse.json()).listing;
    assert.equal(updated.title, 'Updated denim jacket');
    assert.deepEqual(updated.images, created.images);

    const otherUserResponse = await request(
        `/api/profile/listings/${created.post_id}`,
        'user2@email.com',
        { method: 'PUT', body: updateForm },
    );
    assert.equal(otherUserResponse.status, 404);

    const otherUserDeleteResponse = await request(
        `/api/profile/listings/${created.post_id}`,
        'user2@email.com',
        { method: 'DELETE' },
    );
    assert.equal(otherUserDeleteResponse.status, 404);

    const archiveResponse = await request(
        `/api/profile/listings/${created.post_id}/status`,
        'user1@email.com',
        {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ status: 'archived' }),
        },
    );
    assert.equal(archiveResponse.status, 200);
    assert.equal((await archiveResponse.json()).listing.listing_status, 'archived');

    const deleteResponse = await request(
        `/api/profile/listings/${created.post_id}`,
        'user1@email.com',
        { method: 'DELETE' },
    );
    assert.equal(deleteResponse.status, 204);
    assert.equal(fs.existsSync(storedImagePath(created.images[0], uploadsPath)), false);
});

test('an uploaded file must contain valid image data', async () => {
    const form = listingForm();
    form.append('images', new Blob(['not an image'], { type: 'image/png' }), 'fake.png');

    const response = await request('/api/profile/listings', 'user1@email.com', {
        method: 'POST',
        body: form,
    });

    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /valid image/i);
});
