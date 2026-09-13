var express = require("express");
var router = express.Router();

module.exports = (db) => {
    // GETS posts for a specific user
    router.get("/posts", (req, res) => {
        console.log("getting posts");
        const { ownerID } = req.query;
        const queryPosts = `SELECT * FROM Post WHERE owner_id = ?`;
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
    router.get("/friends", (req, res) => {
        const { email } = req.query;
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
    router.post("/add-friend", (req, res) => {
        const { email, friend_id } = req.body;
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
    router.delete("/remove-friend", (req, res) => {
        const { email, friend_id } = req.body;
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
    

    // GET user's cart
    router.get("/cart", (req, res) => {
        const { email } = req.query;
        const queryTransaction = `SELECT transaction_id FROM Transactions WHERE email = ? AND status = 'pending'`;
        const queryCart = `SELECT post_id FROM Transaction_Listing WHERE transaction_id = ?`
        const queryPosts = `SELECT title, price, bflag, sflag, item_condition, size FROM Post WHERE post_id = ?`
        const queryPostImage = `SELECT image_url FROM Post_Image WHERE post_id = ?`

        db.get(queryTransaction, [email], (err, transaction) => {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: err.message });
                return;
            }

            if (!transaction) {
                // no pending transaction found
                res.json({ cart: [] });
                return;
            }

            const transactionId = transaction.transaction_id;

            // Find all post IDs in the transaction
            db.all(queryCart, [transactionId], (err, cartItems) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (!cartItems || cartItems.length === 0) {
                    // No items in the cart
                    res.json({ cart: [] });
                    return;
                }

                // Fetch details for each post in the cart
                const cartDetailsPromises = cartItems.map((item) => {
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
                                resolve({ ...post, post_id: item.post_id });
                            });
                        });
                    });
                });

                // Resolve all promises and return thte cart details
                Promise.all(cartDetailsPromises)
                    .then((cartDetails) => {
                        // Filer out any null results
                        const filteredCartDetails = cartDetails.filter((item) => item !== null);
                        res.json({ transId: transactionId, cart: filteredCartDetails });
                    })
                    .catch((error) => {
                        console.error(error.message);
                        res.status(500).json({ error: error.message });
                    })
            })
        })
    })

    // PUT cart status
    router.put("/checkout", (req, res) => {
        const { transactionId } = req.query;
        const checkoutQuery = `
            UPDATE Transactions SET status = 'purchased'
            WHERE transaction_id = ? AND status = 'pending'`;
        
        db.run(checkoutQuery, [transactionId], function (err) {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: "Failed to checkout" });
                return;
            }

            res.json({ success: true, message: "Checkout completed" });
        })
    })

    router.put("/cart/addItem", (req, res) => {
        const { transactionId, postId } = req.body;
        const addItemQuery = `INSERT INTO Transaction_Listing (transaction_id, post_id) VALUES (?, ?)`;

        db.run(addItemQuery, [transactionId, postId], function (err) {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: "Failed to add item to cart" });
                return;
            }

            res.json({ success: true, message: "Item added to cart" });
        })
    })

    // GET transaction id
    router.get("/cart/id", (req, res) => {
        const { email } = req.query;
        const query = `SELECT transaction_id FROM Transactions WHERE email = ? AND status = 'pending'`;

        db.get(query, [email], (err, row) => {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: "Failed to retrieve transaction ID" });
                return;
            }

            if (!row) {
                // no pending transaction found
                res.json({ transactionId: null, message: "No pending transaction found" });
                return;
            }

            res.json({ transactionId: row.transaction_id });
        })
    })

    // DELETE cart item
    router.delete("/cart/item", (req, res) => {
        const { transactionId, postId } = req.body;
        const deleteQuery = `DELETE FROM Transaction_Listing WHERE transaction_id = ? AND post_id = ?`;

        db.run(deleteQuery, [transactionId, postId], function (err) {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: "Failed to remove item from cart" });
                return;
            }

            res.json({ success: true, message: "Item removed from cart" });
        })
    })


    // POST for a specific user - O.C.
    router.post("/upload-item", (req, res) => {
        var post_id;
        const { closet_id, owner_id, title, likes, item_pictures, description, date_posted, item_condition, categories, size, for_sale, for_rent, price, rental_date } = req.body;
        const query = `INSERT INTO Post (closet_id, owner_id, title, likes, description, date_posted, item_condition, size, price, bflag, sflag, rental_end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const query_post_category = `INSERT INTO Post_Category (post_id, category_id) VALUES (?, ?)`;
        const query_post_images = `INSERT INTO Post_Image (post_id, image_url) VALUES (?, ?)`;
        console.log(categories);

        db.run(
            query,
            [closet_id, owner_id, title, likes, description, date_posted, item_condition, size, price, for_rent, for_sale, rental_date],
            function (err) {
                if (err) {
                    console.log("error inserting inital post");
                    console.log([closet_id, owner_id, title, likes, description, date_posted, item_condition, size]);
                    res.status(500).json({ error: err.message });
                    return;
                }
                post_id = this.lastID;

                // Associate post with multiple images
                item_pictures.forEach(image_url => {
                    db.run(
                        query_post_images,
                        [post_id, image_url],
                        function (err) {
                            if (err) {
                                console.log("error inserting images");
                                res.status(500).json({ error: err.message });
                                return;
                            }
                        }
                    )
                });

                // Associate post with each category that was selected - O.C.
                // Categories is an array of integers representing the category_id
                categories.forEach(category_id => {
                        db.run(
                            query_post_category,
                            [post_id, category_id],
                            function (err) {
                                if (err) {
                                    console.log("error inserting category");
                                    res.status(500).json({ error: err.message });
                                    return;
                                }
                            }
                        )
                });

                res.json("item saved to db"); // return success
            })

    })

    router.post("/delete-item", (req, res) => {
        const { post_id } = req.body;
        const deletePostImages = `DELETE FROM Post_Image WHERE post_id = ?`;
        const deletePostCategories = `DELETE FROM Post_Category WHERE post_id = ?`;
        const deletePost = `DELETE FROM Post WHERE post_id = ?`;
    
        // Start by deleting related data
        db.run(deletePostImages, [post_id], function (err) {
            if (err) {
                console.error("Error deleting post images:", err.message);
                res.status(500).json({ error: "Failed to delete post images" });
                return;
            }
    
            db.run(deletePostCategories, [post_id], function (err) {
                if (err) {
                    console.error("Error deleting post categories:", err.message);
                    res.status(500).json({ error: "Failed to delete post categories" });
                    return;
                }
    
                // Finally, delete the post itself
                db.run(deletePost, [post_id], function (err) {
                    if (err) {
                        console.error("Error deleting post:", err.message);
                        res.status(500).json({ error: "Failed to delete post" });
                        return;
                    }
    
                    res.json({ success: true, message: "Item deleted successfully" });
                });
            });
        });

    }) 

    // GET purchased transactions for a user
    router.get("/order-history/purchased", (req, res) => {
        const { email } = req.query;
        const queryTransaction = `SELECT transaction_id, purchased_date FROM Transactions WHERE email = ? AND status = 'purchased'`;
        const queryListings = `SELECT post_id FROM Transaction_Listing WHERE transaction_id = ?`
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
                                        resolve({ ...post, post_id: item.post_id, purchased_date: transaction.purchased_date });
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
        const queryListings = `SELECT post_id FROM Transaction_Listing WHERE transaction_id = ?`
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
                                        resolve({ ...post, post_id: item.post_id, purchased_date: transaction.purchased_date });
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
        router.get("/wishlist", (req, res) => {
            console.log("getting wishlist");
            const { email } = req.query;
            const queryWishlist = `SELECT W.*, P.*, U.first_name, U.last_name
                                   FROM Wishlist W, Post P, User U
                                   WHERE W.post_id = P.post_id
                                   AND P.owner_id = U.email
                                   AND W.email = ?;`;

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
        router.post("/wishlist", (req, res) => {
            const { email, post_id } = req.body;
            const query = `INSERT INTO Wishlist (email, post_id) VALUES (?, ?)`;
            db.run(query, [email, post_id], function(err) {
                if (err) {
                    console.error(err.message);
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ success: true, message: "Item added successfully" });
            });
        });

        // DELETE from wishlist
        router.delete("/wishlist", (req, res) => {
            const { email, post_id } = req.body;
            const query = `DELETE FROM Wishlist WHERE email = ? AND post_id = ?`;
            db.run(query, [email, post_id], function(err) {
                if (err) {
                    console.error(err.message);
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ success: true, message: "Item removed from wishlist" });
            });
        });

    return router;
}