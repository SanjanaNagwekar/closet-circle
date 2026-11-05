const express = require('express');
const multer = require('multer');
const { all, exec, get, run } = require('../database');
const {
    removeFiles,
    storedImagePath,
    storedImageUrl,
    validateImageSignatures,
} = require('../listing-storage');

const LISTING_STATUSES = new Set(['draft', 'published', 'archived']);
const CONDITIONS = new Set(['new', 'excellent', 'good', 'worn']);
const SIZES = new Set([
    'XX-Small', 'X-Small', 'Small', 'Medium', 'Large', 'X-Large',
    'XX-Large', '3X-Large', '4X-Large',
]);

function asyncRoute(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function parseJsonArray(value, fieldName) {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error();
        return parsed;
    } catch {
        const error = new Error(`${fieldName} must be a JSON array`);
        error.statusCode = 400;
        throw error;
    }
}

function parseBoolean(value) {
    return value === 'true' || value === '1';
}

function parseListingBody(body) {
    const rawPrice = String(body.price || '').trim();
    const categories = [...new Set(
        parseJsonArray(body.categories, 'categories')
            .map(Number)
            .filter((categoryId) => Number.isInteger(categoryId) && categoryId >= 1 && categoryId <= 15),
    )];

    return {
        title: String(body.title || '').trim(),
        description: String(body.description || '').trim(),
        itemCondition: String(body.itemCondition || '').trim(),
        size: String(body.size || '').trim(),
        price: rawPrice ? Number(rawPrice) : null,
        forSale: parseBoolean(body.forSale),
        forRent: parseBoolean(body.forRent),
        categories,
        existingImages: parseJsonArray(body.existingImages, 'existingImages')
            .filter((imageUrl) => typeof imageUrl === 'string'),
    };
}

function validateListing(listing, status, imageUrls) {
    if (!LISTING_STATUSES.has(status)) return ['Invalid listing status'];

    const errors = [];
    if (listing.title.length > 50) errors.push('Title must be 50 characters or fewer');
    if (listing.description.length > 500) errors.push('Description must be 500 characters or fewer');
    if (listing.price !== null && (!Number.isFinite(listing.price) || listing.price <= 0)) {
        errors.push('Price must be greater than zero');
    }

    if (status === 'published') {
        if (!listing.title) errors.push('Title is required');
        if (!listing.description) errors.push('Description is required');
        if (!CONDITIONS.has(listing.itemCondition)) errors.push('Select a valid condition');
        if (!SIZES.has(listing.size)) errors.push('Select a valid size');
        if (listing.price === null) errors.push('Price is required');
        if (!listing.forSale && !listing.forRent) errors.push('Select sale, rental, or both');
        if (listing.categories.length < 2) errors.push('Select an audience and item type');
        if (imageUrls.length === 0) errors.push('Add at least one image');
    }

    return errors;
}

async function getOrCreateCloset(db, email) {
    const existingCloset = await get(
        db,
        `SELECT closet_id FROM Closet_Creation WHERE admin = ? ORDER BY closet_id LIMIT 1`,
        [email],
    );
    if (existingCloset) return existingCloset.closet_id;

    const user = await get(db, `SELECT email FROM User WHERE email = ?`, [email]);
    if (!user) {
        const error = new Error('Complete your profile before creating a listing');
        error.statusCode = 409;
        throw error;
    }

    const closet = await run(
        db,
        `INSERT INTO Closet (name, public, description) VALUES (?, 1, ?)`,
        [`Personal closet: ${email}`, 'Personal marketplace listings'],
    );
    await run(
        db,
        `INSERT INTO Closet_Creation (closet_id, admin) VALUES (?, ?)`,
        [closet.lastID, email],
    );
    await run(
        db,
        `INSERT INTO Closet_Membership (closet_id, email) VALUES (?, ?)`,
        [closet.lastID, email],
    );
    return closet.lastID;
}

async function loadListing(db, postId, email) {
    const listing = await get(
        db,
        `SELECT Post.*,
                EXISTS (
                    SELECT 1
                    FROM Transaction_Listing
                    JOIN Transactions USING (transaction_id)
                    WHERE Transaction_Listing.post_id = Post.post_id
                      AND Transaction_Listing.intent = 'purchase'
                      AND Transactions.status = 'purchased'
                ) AS sold
         FROM Post
         WHERE Post.post_id = ? AND Post.owner_id = ?`,
        [postId, email],
    );
    if (!listing) return null;

    const [images, categories] = await Promise.all([
        all(db, `SELECT image_url FROM Post_Image WHERE post_id = ? ORDER BY image_id`, [postId]),
        all(db, `SELECT category_id FROM Post_Category WHERE post_id = ? ORDER BY category_id`, [postId]),
    ]);
    listing.images = images.map((image) => image.image_url);
    listing.categories = categories.map((category) => category.category_id);
    return listing;
}

async function replaceListingDetails(db, postId, listing, status, imageUrls) {
    await run(
        db,
        `UPDATE Post
         SET title = ?, description = ?, item_condition = ?, size = ?, price = ?,
             bflag = ?, sflag = ?, listing_status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE post_id = ?`,
        [
            listing.title,
            listing.description,
            listing.itemCondition,
            listing.size,
            listing.price,
            listing.forRent ? 1 : 0,
            listing.forSale ? 1 : 0,
            status,
            postId,
        ],
    );

    await run(db, `DELETE FROM Post_Category WHERE post_id = ?`, [postId]);
    for (const categoryId of listing.categories) {
        await run(
            db,
            `INSERT INTO Post_Category (post_id, category_id) VALUES (?, ?)`,
            [postId, categoryId],
        );
    }

    await run(db, `DELETE FROM Post_Image WHERE post_id = ?`, [postId]);
    for (const imageUrl of imageUrls) {
        await run(
            db,
            `INSERT INTO Post_Image (post_id, image_url) VALUES (?, ?)`,
            [postId, imageUrl],
        );
    }
}

module.exports = (db, { requireUser }, { imageUpload, uploadsPath }) => {
    const router = express.Router();
    const uploadImages = imageUpload.array('images', 5);

    router.get('/', ...requireUser, asyncRoute(async (req, res) => {
        const posts = await all(
            db,
            `SELECT post_id FROM Post WHERE owner_id = ? ORDER BY updated_at DESC, date_posted DESC`,
            [req.currentUser.email],
        );
        const listings = await Promise.all(
            posts.map((post) => loadListing(db, post.post_id, req.currentUser.email)),
        );
        res.json({ listings });
    }));

    router.post('/', ...requireUser, uploadImages, asyncRoute(async (req, res) => {
        const files = req.files || [];
        try {
            validateImageSignatures(files);
            const listing = parseListingBody(req.body);
            const status = req.body.status === 'published' ? 'published' : 'draft';
            const imageUrls = files.map((file) => storedImageUrl(file));
            const errors = validateListing(listing, status, imageUrls);
            if (errors.length) {
                const error = new Error(errors.join('. '));
                error.statusCode = 400;
                throw error;
            }

            await exec(db, 'BEGIN IMMEDIATE;');
            try {
                const closetId = await getOrCreateCloset(db, req.currentUser.email);
                const result = await run(
                    db,
                    `INSERT INTO Post (
                        closet_id, owner_id, title, likes, description, item_condition,
                        size, price, bflag, sflag, listing_status, updated_at
                     ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [
                        closetId,
                        req.currentUser.email,
                        listing.title,
                        listing.description,
                        listing.itemCondition,
                        listing.size,
                        listing.price,
                        listing.forRent ? 1 : 0,
                        listing.forSale ? 1 : 0,
                        status,
                    ],
                );
                await replaceListingDetails(db, result.lastID, listing, status, imageUrls);
                await exec(db, 'COMMIT;');
                const savedListing = await loadListing(db, result.lastID, req.currentUser.email);
                res.status(201).json({ listing: savedListing });
            } catch (error) {
                await exec(db, 'ROLLBACK;');
                throw error;
            }
        } catch (error) {
            removeFiles(files);
            throw error;
        }
    }));

    router.put('/:postId', ...requireUser, uploadImages, asyncRoute(async (req, res) => {
        const files = req.files || [];
        try {
            validateImageSignatures(files);
            const postId = Number(req.params.postId);
            const currentListing = await loadListing(db, postId, req.currentUser.email);
            if (!currentListing) {
                const error = new Error('Listing not found');
                error.statusCode = 404;
                throw error;
            }

            const listing = parseListingBody(req.body);
            const status = req.body.status || currentListing.listing_status;
            const currentImages = new Set(currentListing.images);
            const existingImages = listing.existingImages.filter((imageUrl) => currentImages.has(imageUrl));
            const newImageUrls = files.map((file) => storedImageUrl(file));
            const imageUrls = [...existingImages, ...newImageUrls];
            const errors = validateListing(listing, status, imageUrls);
            if (errors.length) {
                const error = new Error(errors.join('. '));
                error.statusCode = 400;
                throw error;
            }

            await exec(db, 'BEGIN IMMEDIATE;');
            try {
                await replaceListingDetails(db, postId, listing, status, imageUrls);
                await exec(db, 'COMMIT;');
            } catch (error) {
                await exec(db, 'ROLLBACK;');
                throw error;
            }

            const removedImages = currentListing.images.filter((imageUrl) => !existingImages.includes(imageUrl));
            removeFiles(
                removedImages
                    .map((imageUrl) => storedImagePath(imageUrl, uploadsPath))
                    .filter(Boolean),
            );
            const savedListing = await loadListing(db, postId, req.currentUser.email);
            res.json({ listing: savedListing });
        } catch (error) {
            removeFiles(files);
            throw error;
        }
    }));

    router.patch('/:postId/status', ...requireUser, asyncRoute(async (req, res) => {
        const postId = Number(req.params.postId);
        const status = String(req.body.status || '');
        const listing = await loadListing(db, postId, req.currentUser.email);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }

        if (!LISTING_STATUSES.has(status)) {
            res.status(400).json({ error: 'Invalid listing status' });
            return;
        }

        if (status === 'published') {
            const values = {
                title: listing.title,
                description: listing.description,
                itemCondition: listing.item_condition,
                size: listing.size,
                price: listing.price,
                forSale: listing.sflag === 1,
                forRent: listing.bflag === 1,
                categories: listing.categories,
            };
            const errors = validateListing(values, status, listing.images);
            if (errors.length) {
                res.status(400).json({ error: errors.join('. ') });
                return;
            }
        }

        await run(
            db,
            `UPDATE Post SET listing_status = ?, updated_at = CURRENT_TIMESTAMP
             WHERE post_id = ? AND owner_id = ?`,
            [status, postId, req.currentUser.email],
        );
        res.json({ listing: await loadListing(db, postId, req.currentUser.email) });
    }));

    router.delete('/:postId', ...requireUser, asyncRoute(async (req, res) => {
        const postId = Number(req.params.postId);
        const listing = await loadListing(db, postId, req.currentUser.email);
        if (!listing) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }

        const transaction = await get(
            db,
            `SELECT transaction_id FROM Transaction_Listing WHERE post_id = ? LIMIT 1`,
            [postId],
        );
        if (transaction) {
            res.status(409).json({ error: 'Archive listings that are part of an order' });
            return;
        }

        await run(
            db,
            `DELETE FROM Post WHERE post_id = ? AND owner_id = ?`,
            [postId, req.currentUser.email],
        );
        removeFiles(
            listing.images
                .map((imageUrl) => storedImagePath(imageUrl, uploadsPath))
                .filter(Boolean),
        );
        res.status(204).end();
    }));

    router.use((error, req, res, next) => {
        if (error instanceof multer.MulterError) {
            const message = error.code === 'LIMIT_FILE_SIZE'
                ? 'Each image must be 5 MB or smaller'
                : 'Upload up to five JPEG, PNG, or WebP images';
            res.status(400).json({ error: message });
            return;
        }
        next(error);
    });

    return router;
};
