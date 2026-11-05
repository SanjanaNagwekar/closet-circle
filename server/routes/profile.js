var express = require("express");

module.exports = (db, { requireUser }) => {
    var router = express.Router();
    // GETS posts for a specific user
    router.get("/posts", (req, res) => {
        console.log("getting posts");
        const { ownerID } = req.query;
        const queryPosts = `
            SELECT *
            FROM Post
            WHERE owner_id = ? AND listing_status = 'published'
              AND NOT EXISTS (
                  SELECT 1
                  FROM Transaction_Listing SoldListing
                  JOIN Transactions SoldTransaction USING (transaction_id)
                  WHERE SoldListing.post_id = Post.post_id
                    AND SoldListing.intent = 'purchase'
                    AND SoldTransaction.status = 'purchased'
              )`;
        const queryImages = `SELECT image_url FROM Post_Image WHERE post_id = ?`;
        const queryPostCategories = `SELECT category_id FROM Post_Category WHERE post_id = ?`;

        db.all(queryPosts, [ownerID], (err, posts) => {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: err.message });
                return;
            }

            // Fetch images for each post
            const postsImagesCategories = posts.map((post) => {
                return new Promise((resolve, reject) => {
                    db.all(queryImages, [post.post_id], (err, images) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        post.images = images.map((img) => img.image_url);
                        //resolve(post);
                        db.all(queryPostCategories, [post.post_id], (err, categories) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        post.categories = categories.map((cat) => cat.category_id);
                        resolve(post);
                    });
                    });
                });
            });

            // After all images have been fetched for post
            Promise.all(postsImagesCategories).then((results) => {
                res.json({ posts: results });
            }).catch((error) => {
                console.error(error.message);
                res.status(500).json({ error: error.message });
            });
        });
    })


    // GET friends list
    router.get("/friends", ...requireUser, (req, res) => {
        const email = req.currentUser.email;
        const queryFriends = `SELECT friend_id FROM Friend WHERE email = ?`;
        const queryFriendDetails = `SELECT first_name, last_name, email FROM User WHERE email = ?`;

        db.all(queryFriends, [email], (err, rows) => {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: err.messsage });
                return;
            }

            if (!rows || rows.length === 0) {
                res.json({ friends: [] });
                return;
            }

            const friendDetailsPromises = rows.map((row) => {
                return new Promise((resolve, reject) => {
                    db.get(queryFriendDetails, [row.friend_id], (err, friend) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(friend);
                    });
                });
            });

            Promise.all(friendDetailsPromises)
                .then((friends) => {
                    res.json({ friends });
                })
                .catch((error) => {
                    console.error(error.message);
                    res.status(500).json({ error: error.message });
                });
        })
    })

    // POST add friends 
    router.post("/add-friend", ...requireUser, (req, res) => {
        const email = req.currentUser.email;
        const { friend_id } = req.body;
        const queryInsertFriends = `INSERT INTO Friend (email, friend_id) VALUES (?, ?)`;

        db.run(queryInsertFriends, [email, friend_id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({});
    });
    })

    // GET Followers list
    router.get("/followers", (req, res) => {
        const { email } = req.query;
        const queryFriends = `SELECT email FROM Friend WHERE friend_id = ?`;
        const queryFriendDetails = `SELECT first_name, last_name, email FROM User WHERE email = ?`;

        db.all(queryFriends, [email], (err, rows) => {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: err.messsage });
                return;
            }

            if (!rows || rows.length === 0) {
                res.json({ followers: [] });
                return;
            }
            console.log(rows);

            const friendDetailsPromises = rows.map((row) => {
                return new Promise((resolve, reject) => {
                    db.get(queryFriendDetails, [row.email], (err, follower) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        console.log(follower);
                        resolve(follower);
                    });
                });
            });

            Promise.all(friendDetailsPromises)
                .then((followers) => {
                    res.json({ followers });
                })
                .catch((error) => {
                    console.error(error.message);
                    res.status(500).json({ error: error.message });
                });
        })
    })

    // DELETE friends
    router.delete("/remove-friend", ...requireUser, (req, res) => {
        const email = req.currentUser.email;
        const { friend_id } = req.body;
        const deleteQuery = `DELETE FROM Friend WHERE email = ? AND friend_id = ?`;

        db.run(deleteQuery, [email, friend_id], function (err) {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: "Failed to remove friend" });
                return;
            }

            res.json({ success: true, message: "Friend unfollowed" });
        })
    })
    

    // GET purchased transactions for a user
    router.get("/order-history/purchased", ...requireUser, (req, res) => {
        const email = req.currentUser.email;
        const queryTransaction = `SELECT transaction_id, purchased_date FROM Transactions WHERE email = ? AND status = 'purchased'`;
        const queryListings = `
            SELECT post_id, intent, unit_price, rental_start_date, rental_end_date
            FROM Transaction_Listing WHERE transaction_id = ?`
        const queryPosts = `SELECT title, price, sflag, bflag FROM Post WHERE post_id = ?`
        const queryPostImage = `SELECT image_url FROM Post_Image WHERE post_id = ?`

        db.all(queryTransaction, [email], (err, transactions) => {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: err.message });
                return;
            }

            if (!transactions) {
                // No purchased transactions found
                res.json({ orders: [] });
                return;
            }

            // Find all listings for all found transactions for this user
            const transactionPromises = transactions.map((transaction) => {
                return new Promise((resolve, reject) => {
                    // Find all listings in the transaction
                    db.all(queryListings, [transaction.transaction_id], (err, listingItems) => {
                        if (err) {
                            console.error(err.message);
                            res.status(500).json({ error: err.message });
                            return;
                        }

                        if (!listingItems || listingItems.length === 0) {
                            // No listings
                            res.json({ orders: [] });
                            return;
                        }

                        // Fetch details for each post in the cart
                        const orderDetailsPromises = listingItems.map((item) => {
                            return new Promise((resolve, reject) => {
                                db.get(queryPosts, [item.post_id], (err, post) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }

                                    if (!post) {
                                        resolve(null);
                                        return;
                                    }

                                    // Fetch post images
                                    db.all(queryPostImage, [item.post_id], (err, images) => {
                                        if (err) {
                                            reject(err);
                                            return;
                                        }

                                        post.images = images.map((img) => img.image_url);
                                        resolve({
                                            ...post,
                                            post_id: item.post_id,
                                            price: item.unit_price ?? post.price,
                                            intent: item.intent,
                                            rental_start_date: item.rental_start_date,
                                            rental_end_date: item.rental_end_date,
                                            purchased_date: transaction.purchased_date,
                                        });
                                    });
                                });
                            });
                        });

                        Promise.all(orderDetailsPromises)
                            // Filter out any null results
                            .then(results => resolve(results.filter(r => r !== null)))
                            .catch(reject);
                    });
                });
            });

            // Resolve all promises and return order details
            Promise.all(transactionPromises)
                .then((orderDetails) => {
                    const flattenedOrders = orderDetails.flat();
                    res.json( { orders: flattenedOrders});
                })
                .catch((error) => {
                    console.error(error.message);
                    res.status(500).json({ error: error.message });
                })
            })
        })

    // GET seller transaction history
    router.get("/seller-history", (req, res) => {
        const { email } = req.query;
        const queryTransaction = `SELECT transaction_id, purchased_date FROM Transactions WHERE status = 'purchased'`;
        const queryListings = `
            SELECT post_id, intent, unit_price, rental_start_date, rental_end_date
            FROM Transaction_Listing WHERE transaction_id = ?`
        const queryPosts = `SELECT title, price, sflag, bflag FROM Post WHERE post_id = ? AND owner_id = ?`
        const queryPostImage = `SELECT image_url FROM Post_Image WHERE post_id = ?`

        db.all(queryTransaction, [], (err, transactions) => {
            if (err) {
                console.log("err in query listings");
                console.error(err.message);
                res.status(500).json({ error: err.message });
                return;
            }

            if (!transactions) {
                // No purchased transactions found
                res.json({ orders: [] });
                return;
            }

            // Find all listings for all found transactions for this user
            const transactionPromises = transactions.map((transaction) => {
                return new Promise((resolve, reject) => {
                    // Find all listings in the transaction
                    db.all(queryListings, [transaction.transaction_id], (err, listingItems) => {
                        if (err) {
                            console.error(err.message);
                            console.log("err in query listings");
                            res.status(500).json({ error: err.message });
                            return;
                        }

                        // Fetch details for each post in the cart
                        const orderDetailsPromises = listingItems.map((item) => {
                            return new Promise((resolve, reject) => {
                                db.get(queryPosts, [item.post_id, email], (err, post) => {
                                    if (err) {
                                        console.log("err in query posts");
                                        reject(err);
                                        return;
                                    }

                                    if (!post) {
                                        resolve(null);
                                        return;
                                    }

                                    // Fetch post images
                                    db.all(queryPostImage, [item.post_id], (err, images) => {
                                        if (err) {
                                            console.log("err in query images");
                                            reject(err);
                                            return;
                                        }

                                        post.images = images.map((img) => img.image_url);
                                        resolve({
                                            ...post,
                                            post_id: item.post_id,
                                            price: item.unit_price ?? post.price,
                                            intent: item.intent,
                                            rental_start_date: item.rental_start_date,
                                            rental_end_date: item.rental_end_date,
                                            purchased_date: transaction.purchased_date,
                                        });
                                    });
                                });
                            });
                        });

                        Promise.all(orderDetailsPromises)
                            // Filer out any null results
                            .then(results => resolve(results.filter(r => r !== null)))
                            .catch(reject);
                    });
                });
            });

            // Resolve all promises and return order details
            Promise.all(transactionPromises)
                .then((orderDetails) => {
                    const flattenedOrders = orderDetails.flat();
                    res.json( { orders: flattenedOrders});
                })
                .catch((error) => {
                    console.error(error.message);
                    res.status(500).json({ error: error.message });
                })
            })
        })


        // GET wishlist/favorite items
        router.get("/wishlist", ...requireUser, (req, res) => {
            const email = req.currentUser.email;
            const queryWishlist = `SELECT W.*, P.*, U.first_name, U.last_name
                                   FROM Wishlist W, Post P, User U
                                   WHERE W.post_id = P.post_id
                                   AND P.owner_id = U.email
                                   AND W.email = ?
                                   AND P.listing_status = 'published'
                                   AND NOT EXISTS (
                                       SELECT 1
                                       FROM Transaction_Listing SoldListing
                                       JOIN Transactions SoldTransaction USING (transaction_id)
                                       WHERE SoldListing.post_id = P.post_id
                                         AND SoldListing.intent = 'purchase'
                                         AND SoldTransaction.status = 'purchased'
                                   );`;

            const queryImages = `SELECT image_url FROM Post_Image WHERE post_id = ?`;
            const queryPostCategories = `SELECT category_id FROM Post_Category WHERE post_id = ?`;
                
                db.all(queryWishlist, [email], (err, wishlistItems) => {
                    if (err) {
                        console.error(err.message);
                        res.status(500).json({ error: err.message });
                        return;
                    }
                
                // Fetch images/categories for each wishlist item
                const wishlistPromises = wishlistItems.map((item) => {
                    return new Promise((resolve, reject) => {
                        db.all(queryImages, [item.post_id], (err, images) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            item.images = images.map((img) => img.image_url);
                            
                            // Categories for the post
                            db.all(queryPostCategories, [item.post_id], (err, categories) => {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                item.categories = categories.map((cat) => cat.category_id);
                                resolve(item);
                            });
                        });
                    });
                });

                Promise.all(wishlistPromises).then((results) => {
                    res.json({ wishlist: results });
                }).catch((error) => {
                    console.error(error.message);
                    res.status(500).json({ error: error.message });
                });
            });
        });


        // POST add to wishlist
        router.post("/wishlist", ...requireUser, (req, res) => {
            const email = req.currentUser.email;
            const postId = Number(req.body.post_id);
            const availableListing = `
                SELECT post_id
                FROM Post
                WHERE post_id = ?
                  AND owner_id <> ?
                  AND listing_status = 'published'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM Transaction_Listing SoldListing
                      JOIN Transactions SoldTransaction USING (transaction_id)
                      WHERE SoldListing.post_id = Post.post_id
                        AND SoldListing.intent = 'purchase'
                        AND SoldTransaction.status = 'purchased'
                  )`;
            db.get(availableListing, [postId, email], (findError, listing) => {
                if (findError) {
                    res.status(500).json({ error: 'Failed to add favorite' });
                    return;
                }
                if (!listing) {
                    res.status(409).json({ error: 'This listing cannot be added to favorites' });
                    return;
                }

                db.run(
                    `INSERT OR IGNORE INTO Wishlist (email, post_id) VALUES (?, ?)`,
                    [email, postId],
                    function onInsert(insertError) {
                        if (insertError) {
                            console.error(insertError.message);
                            res.status(500).json({ error: 'Failed to add favorite' });
                            return;
                        }
                        res.status(this.changes === 1 ? 201 : 200).json({
                            success: true,
                            message: 'Item added to favorites',
                        });
                    },
                );
            });
        });

        // DELETE from wishlist
        router.delete("/wishlist", ...requireUser, (req, res) => {
            const email = req.currentUser.email;
            const { post_id } = req.body;
            const query = `DELETE FROM Wishlist WHERE email = ? AND post_id = ?`;
            db.run(query, [email, post_id], function(err) {
                if (err) {
                    console.error(err.message);
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.status(204).end();
            });
        });

    return router;
}
