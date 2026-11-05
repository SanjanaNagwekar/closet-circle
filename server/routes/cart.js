const express = require('express');
const { all, exec, get, run } = require('../database');

const CART_INTENTS = new Set(['purchase', 'rental']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function asyncRoute(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function httpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function parseRentalDates(startDateValue, endDateValue) {
    const startDate = String(startDateValue || '');
    const endDate = String(endDateValue || '');
    if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) {
        throw httpError(400, 'Choose valid rental dates');
    }

    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    if (
        Number.isNaN(start.getTime())
        || Number.isNaN(end.getTime())
        || start.toISOString().slice(0, 10) !== startDate
        || end.toISOString().slice(0, 10) !== endDate
    ) {
        throw httpError(400, 'Choose valid rental dates');
    }

    const today = new Date().toISOString().slice(0, 10);
    if (startDate < today) throw httpError(400, 'Rental start date cannot be in the past');
    if (endDate < startDate) throw httpError(400, 'Rental end date must be on or after the start date');
    return { startDate, endDate };
}

async function hasApprovedConflict(db, postId, startDate, endDate) {
    return get(
        db,
        `SELECT rental_id
         FROM Rental_Request
         WHERE post_id = ?
           AND status = 'approved'
           AND start_date <= ?
           AND end_date >= ?
         LIMIT 1`,
        [postId, endDate, startDate],
    );
}

async function hasApprovedRental(db, postId) {
    return get(
        db,
        `SELECT rental_id
         FROM Rental_Request
         WHERE post_id = ? AND status = 'approved'
         LIMIT 1`,
        [postId],
    );
}

async function pendingCart(db, email, create = false) {
    const existing = await get(
        db,
        `SELECT transaction_id FROM Transactions
         WHERE email = ? AND status = 'pending'`,
        [email],
    );
    if (existing || !create) return existing;

    try {
        const result = await run(
            db,
            `INSERT INTO Transactions (email, status) VALUES (?, 'pending')`,
            [email],
        );
        return { transaction_id: result.lastID };
    } catch (error) {
        if (error.code !== 'SQLITE_CONSTRAINT') throw error;
        return get(
            db,
            `SELECT transaction_id FROM Transactions
             WHERE email = ? AND status = 'pending'`,
            [email],
        );
    }
}

async function cartItems(db, transactionId) {
    if (!transactionId) return [];

    const items = await all(
        db,
        `SELECT P.post_id, P.owner_id, P.title, P.description, P.item_condition,
                P.size, P.bflag, P.sflag, P.listing_status,
                TL.intent, TL.rental_start_date, TL.rental_end_date,
                COALESCE(TL.unit_price, P.price) AS price,
                EXISTS (
                    SELECT 1
                    FROM Transaction_Listing PurchasedListing
                    JOIN Transactions PurchasedTransaction USING (transaction_id)
                    WHERE PurchasedListing.post_id = P.post_id
                      AND PurchasedListing.intent = 'purchase'
                      AND PurchasedTransaction.status = 'purchased'
                ) AS sold
         FROM Transaction_Listing TL
         JOIN Post P ON P.post_id = TL.post_id
         WHERE TL.transaction_id = ?
         ORDER BY P.title`,
        [transactionId],
    );

    await Promise.all(items.map(async (item) => {
        const images = await all(
            db,
            `SELECT image_url FROM Post_Image WHERE post_id = ? ORDER BY image_id`,
            [item.post_id],
        );
        item.images = images.map((image) => image.image_url);
    }));
    return items;
}

function validateAvailableListing(listing, email, intent) {
    if (!listing || listing.listing_status !== 'published') {
        throw httpError(404, 'This listing is no longer available');
    }
    if (listing.owner_id === email) {
        throw httpError(400, 'You cannot add your own listing to your cart');
    }
    if (intent === 'purchase' && listing.sflag !== 1) {
        throw httpError(409, 'This listing is not available for purchase');
    }
    if (intent === 'rental' && listing.bflag !== 1) {
        throw httpError(409, 'This listing is not available for rent');
    }
    if (intent === 'purchase' && listing.sold === 1) {
        throw httpError(409, 'This item has already been sold');
    }
}

async function loadAvailableListing(db, postId) {
    return get(
        db,
        `SELECT P.*,
                EXISTS (
                    SELECT 1
                    FROM Transaction_Listing TL
                    JOIN Transactions T USING (transaction_id)
                    WHERE TL.post_id = P.post_id
                      AND TL.intent = 'purchase'
                      AND T.status = 'purchased'
                ) AS sold
         FROM Post P
         WHERE P.post_id = ?`,
        [postId],
    );
}

module.exports = (db, { requireUser }) => {
    const router = express.Router();

    router.get('/', ...requireUser, asyncRoute(async (req, res) => {
        const cart = await pendingCart(db, req.currentUser.email);
        res.json({
            cart: await cartItems(db, cart?.transaction_id),
        });
    }));

    router.post('/items', ...requireUser, asyncRoute(async (req, res) => {
        const postId = Number(req.body.postId);
        const intent = String(req.body.intent || 'purchase');
        if (!Number.isInteger(postId) || !CART_INTENTS.has(intent)) {
            throw httpError(400, 'Choose a valid listing and cart option');
        }

        await exec(db, 'BEGIN IMMEDIATE;');
        try {
            const listing = await loadAvailableListing(db, postId);
            validateAvailableListing(listing, req.currentUser.email, intent);
            if (intent === 'purchase' && await hasApprovedRental(db, postId)) {
                throw httpError(409, 'This item is currently committed to a rental');
            }
            const rentalDates = intent === 'rental'
                ? parseRentalDates(req.body.startDate, req.body.endDate)
                : { startDate: null, endDate: null };
            if (
                intent === 'rental'
                && await hasApprovedConflict(
                    db,
                    postId,
                    rentalDates.startDate,
                    rentalDates.endDate,
                )
            ) {
                throw httpError(409, 'This item is already booked for those dates');
            }
            const cart = await pendingCart(db, req.currentUser.email, true);
            await run(
                db,
                `INSERT INTO Transaction_Listing (
                    transaction_id, post_id, intent, unit_price,
                    rental_start_date, rental_end_date
                 ) VALUES (?, ?, ?, ?, ?, ?)
                 ON CONFLICT(transaction_id, post_id)
                 DO UPDATE SET intent = excluded.intent,
                               unit_price = excluded.unit_price,
                               rental_start_date = excluded.rental_start_date,
                               rental_end_date = excluded.rental_end_date`,
                [
                    cart.transaction_id,
                    postId,
                    intent,
                    listing.price,
                    rentalDates.startDate,
                    rentalDates.endDate,
                ],
            );
            await exec(db, 'COMMIT;');
            res.status(201).json({
                message: intent === 'rental' ? 'Rental request added to cart' : 'Item added to cart',
            });
        } catch (error) {
            await exec(db, 'ROLLBACK;');
            throw error;
        }
    }));

    router.delete('/items/:postId', ...requireUser, asyncRoute(async (req, res) => {
        const postId = Number(req.params.postId);
        const cart = await pendingCart(db, req.currentUser.email);
        if (!Number.isInteger(postId) || !cart) {
            throw httpError(404, 'Cart item not found');
        }

        const result = await run(
            db,
            `DELETE FROM Transaction_Listing
             WHERE transaction_id = ? AND post_id = ?`,
            [cart.transaction_id, postId],
        );
        if (result.changes === 0) throw httpError(404, 'Cart item not found');
        res.status(204).end();
    }));

    router.post('/checkout', ...requireUser, asyncRoute(async (req, res) => {
        await exec(db, 'BEGIN IMMEDIATE;');
        try {
            const cart = await pendingCart(db, req.currentUser.email);
            const items = await cartItems(db, cart?.transaction_id);
            if (!cart || items.length === 0) throw httpError(400, 'Your cart is empty');

            for (const item of items) {
                validateAvailableListing(item, req.currentUser.email, item.intent);
                if (item.price === null || item.price <= 0) {
                    throw httpError(409, `${item.title} no longer has a valid price`);
                }
                if (item.intent === 'purchase' && await hasApprovedRental(db, item.post_id)) {
                    throw httpError(409, `${item.title} is currently committed to a rental`);
                }
                if (item.intent === 'rental') {
                    const rentalDates = parseRentalDates(
                        item.rental_start_date,
                        item.rental_end_date,
                    );
                    if (await hasApprovedConflict(
                        db,
                        item.post_id,
                        rentalDates.startDate,
                        rentalDates.endDate,
                    )) {
                        throw httpError(409, `${item.title} is already booked for those dates`);
                    }
                }
            }

            const purchaseIds = items
                .filter((item) => item.intent === 'purchase')
                .map((item) => item.post_id);
            if (purchaseIds.length > 0) {
                const placeholders = purchaseIds.map(() => '?').join(', ');
                await run(
                    db,
                    `UPDATE Post
                     SET listing_status = 'archived', updated_at = CURRENT_TIMESTAMP
                     WHERE post_id IN (${placeholders})`,
                    purchaseIds,
                );
                await run(
                    db,
                    `UPDATE Rental_Request
                     SET status = 'declined', decision_at = CURRENT_TIMESTAMP,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE status = 'pending'
                       AND post_id IN (${placeholders})`,
                    purchaseIds,
                );
            }

            const rentalItems = items.filter((item) => item.intent === 'rental');
            const purchaseCount = items.length - rentalItems.length;
            for (const item of rentalItems) {
                await run(
                    db,
                    `INSERT INTO Rental_Request (
                        transaction_id, post_id, renter_email, seller_email,
                        start_date, end_date, daily_rate
                     ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        cart.transaction_id,
                        item.post_id,
                        req.currentUser.email,
                        item.owner_id,
                        item.rental_start_date,
                        item.rental_end_date,
                        item.price,
                    ],
                );
            }

            const checkout = await run(
                db,
                `UPDATE Transactions
                 SET status = 'purchased'
                 WHERE transaction_id = ? AND email = ? AND status = 'pending'`,
                [cart.transaction_id, req.currentUser.email],
            );
            if (checkout.changes !== 1) {
                throw httpError(409, 'Your cart changed before checkout. Please try again');
            }
            await exec(db, 'COMMIT;');
            const message = purchaseCount > 0 && rentalItems.length > 0
                ? 'Order placed and rental requests submitted'
                : rentalItems.length > 0
                    ? 'Rental request submitted'
                    : 'Order placed successfully';
            res.json({
                message,
                orderId: cart.transaction_id,
                itemCount: items.length,
                purchaseCount,
                rentalRequestCount: rentalItems.length,
            });
        } catch (error) {
            await exec(db, 'ROLLBACK;');
            throw error;
        }
    }));

    return router;
};
