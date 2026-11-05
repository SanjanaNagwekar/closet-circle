const express = require('express');
const { all, exec, get, run } = require('../database');

const SELLER_ACTIONS = new Set(['approved', 'declined', 'completed']);

function asyncRoute(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function httpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function loadRental(db, rentalId) {
    return get(
        db,
        `SELECT Rental_Request.*, Post.title, Post.description, Post.size,
                Post.item_condition,
                Renter.first_name AS renter_first_name,
                Renter.last_name AS renter_last_name,
                Seller.first_name AS seller_first_name,
                Seller.last_name AS seller_last_name
         FROM Rental_Request
         JOIN Post USING (post_id)
         JOIN User Renter ON Renter.email = Rental_Request.renter_email
         JOIN User Seller ON Seller.email = Rental_Request.seller_email
         WHERE rental_id = ?`,
        [rentalId],
    );
}

async function withImages(db, rentals) {
    await Promise.all(rentals.map(async (rental) => {
        const images = await all(
            db,
            `SELECT image_url FROM Post_Image WHERE post_id = ? ORDER BY image_id`,
            [rental.post_id],
        );
        rental.images = images.map((image) => image.image_url);
    }));
    return rentals;
}

function rentalQuery(ownerColumn) {
    return `
        SELECT Rental_Request.*, Post.title, Post.description, Post.size,
               Post.item_condition,
               Renter.first_name AS renter_first_name,
               Renter.last_name AS renter_last_name,
               Seller.first_name AS seller_first_name,
               Seller.last_name AS seller_last_name
        FROM Rental_Request
        JOIN Post USING (post_id)
        JOIN User Renter ON Renter.email = Rental_Request.renter_email
        JOIN User Seller ON Seller.email = Rental_Request.seller_email
        WHERE Rental_Request.${ownerColumn} = ?
        ORDER BY Rental_Request.created_at DESC`;
}

module.exports = (db, { requireUser }) => {
    const router = express.Router();

    router.get('/buyer', ...requireUser, asyncRoute(async (req, res) => {
        const rentals = await all(
            db,
            rentalQuery('renter_email'),
            [req.currentUser.email],
        );
        res.json({ rentals: await withImages(db, rentals) });
    }));

    router.get('/seller', ...requireUser, asyncRoute(async (req, res) => {
        const rentals = await all(
            db,
            rentalQuery('seller_email'),
            [req.currentUser.email],
        );
        res.json({ rentals: await withImages(db, rentals) });
    }));

    router.patch('/:rentalId/status', ...requireUser, asyncRoute(async (req, res) => {
        const rentalId = Number(req.params.rentalId);
        const nextStatus = String(req.body.status || '');
        if (!Number.isInteger(rentalId)) throw httpError(400, 'Invalid rental request');

        await exec(db, 'BEGIN IMMEDIATE;');
        try {
            const rental = await loadRental(db, rentalId);
            if (!rental) throw httpError(404, 'Rental request not found');

            if (nextStatus === 'cancelled') {
                if (rental.renter_email !== req.currentUser.email) {
                    throw httpError(404, 'Rental request not found');
                }
                if (rental.status !== 'pending') {
                    throw httpError(409, 'Only pending requests can be cancelled');
                }
                await run(
                    db,
                    `UPDATE Rental_Request
                     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                     WHERE rental_id = ?`,
                    [rentalId],
                );
            } else {
                if (!SELLER_ACTIONS.has(nextStatus)) {
                    throw httpError(400, 'Invalid rental status');
                }
                if (rental.seller_email !== req.currentUser.email) {
                    throw httpError(404, 'Rental request not found');
                }

                if (nextStatus === 'completed') {
                    if (rental.status !== 'approved') {
                        throw httpError(409, 'Only approved rentals can be completed');
                    }
                    const today = new Date().toISOString().slice(0, 10);
                    if (today < rental.start_date) {
                        throw httpError(409, 'This rental has not started yet');
                    }
                    await run(
                        db,
                        `UPDATE Rental_Request
                         SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE rental_id = ?`,
                        [rentalId],
                    );
                } else {
                    if (rental.status !== 'pending') {
                        throw httpError(409, 'This request has already been decided');
                    }

                    if (nextStatus === 'approved') {
                        const today = new Date().toISOString().slice(0, 10);
                        if (rental.end_date < today) {
                            throw httpError(409, 'These rental dates have already passed');
                        }
                        const conflict = await get(
                            db,
                            `SELECT rental_id
                             FROM Rental_Request
                             WHERE post_id = ?
                               AND status = 'approved'
                               AND rental_id <> ?
                               AND start_date <= ?
                               AND end_date >= ?
                             LIMIT 1`,
                            [rental.post_id, rentalId, rental.end_date, rental.start_date],
                        );
                        if (conflict) {
                            throw httpError(409, 'These dates conflict with an approved rental');
                        }
                    }

                    await run(
                        db,
                        `UPDATE Rental_Request
                         SET status = ?, decision_at = CURRENT_TIMESTAMP,
                             updated_at = CURRENT_TIMESTAMP
                         WHERE rental_id = ?`,
                        [nextStatus, rentalId],
                    );
                }
            }

            await exec(db, 'COMMIT;');
            res.json({ rental: await loadRental(db, rentalId) });
        } catch (error) {
            await exec(db, 'ROLLBACK;');
            throw error;
        }
    }));

    return router;
};
