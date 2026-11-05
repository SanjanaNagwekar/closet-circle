const express = require("express");
const cors = require("cors");
const { authErrorHandler, createAuth } = require('./auth');
const { createImageUpload, resolveUploadsPath } = require('./listing-storage');
const {
    checkDatabase,
    closeDatabase,
    initializeDatabase,
    openDatabase,
    resolveDatabasePath,
} = require('./database');

const port = Number(process.env.PORT) || 8800;
const host = process.env.HOST || '127.0.0.1';
const clientOrigins = new Set(
    (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
);
const databasePath = resolveDatabasePath();
const uploadsPath = resolveUploadsPath(databasePath);
const apiAuth = createAuth();

const app = express();
app.disable('x-powered-by');

var profileRouter = require("./routes/profile");
const cartRouter = require('./routes/cart');
const listingsRouter = require('./routes/listings');
const rentalsRouter = require('./routes/rentals');

app.use(express.json());

// cors enables communication from front end to back end
app.use(cors({
    origin(origin, callback) {
        if (!origin || clientOrigins.has(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin is not allowed by CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
}));

const db = openDatabase(databasePath);

app.use('/api/uploads', express.static(uploadsPath, {
    dotfiles: 'deny',
    immutable: true,
    index: false,
    maxAge: '1y',
}));
app.use('/api/profile/cart', cartRouter(db, apiAuth));
app.use('/api/profile/rentals', rentalsRouter(db, apiAuth));
app.use(
    '/api/profile/listings',
    listingsRouter(db, apiAuth, {
        imageUpload: createImageUpload(uploadsPath),
        uploadsPath,
    }),
);
app.use("/api/profile", profileRouter(db, apiAuth));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'closet-circle-api' });
});

app.get('/ready', async (req, res) => {
    try {
        const ready = await checkDatabase(db) && apiAuth.configured;
        res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not-ready' });
    } catch (error) {
        res.status(503).json({ status: 'not-ready', error: error.message });
    }
});

// Default endpoint
app.get('/', (req, res) => {
    res.json("hello this is the backend")
})

app.get('/api/posts/trending', (req, res) => {
    const queryTrending = `
        SELECT
            Post.*,
            COUNT(User_Like.post_id) AS like_count
        FROM 
            Post
        LEFT JOIN
            User_Like ON Post.post_id = User_Like.post_id
        WHERE
            Post.listing_status = 'published'
            AND NOT EXISTS (
                SELECT 1
                FROM Transaction_Listing SoldListing
                JOIN Transactions SoldTransaction USING (transaction_id)
                WHERE SoldListing.post_id = Post.post_id
                  AND SoldListing.intent = 'purchase'
                  AND SoldTransaction.status = 'purchased'
            )
        GROUP BY
            Post.post_id
        ORDER BY
            like_count DESC
        LIMIT 8
    `;
    const queryImages = `SELECT image_url FROM Post_Image WHERE post_id = ?`;
    const queryUser = `SELECT first_name, last_name FROM User WHERE email = ?`;
    const queryPostCategories = `SELECT category_id FROM Post_Category WHERE post_id = ?`;

    db.all(queryTrending, [], (err, posts) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }

        // Fetch images, categories, and lister details for each product
        const postsWithDetails = posts.map((post) => {
            return new Promise((resolve, reject) => {
                db.all(queryImages, [post.post_id], (err, images) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    post.images = images.map((img) => img.image_url);

                    db.all(queryPostCategories, [post.post_id], (err, categories) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        post.categories = categories.map((cat) => cat.category_id);

                        // Fetch lister details for the post
                        db.get(queryUser, [post.owner_id], (err, user) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            if (user) {
                                post.lister = {
                                    display: `${user.first_name} ${user.last_name.charAt(0)}.`,
                                    username: post.owner_id,
                                    avatarUrl: null,
                                };
                            } else {
                                post.lister = {
                                    display: 'Unknown',
                                    username: 'unknown-user',
                                    avatarUrl: null,
                                }
                            }
                            resolve(post);
                        })
                    })
                })
            })
        })

        Promise.all(postsWithDetails)
            .then((results) => {
                res.json({ trending: results });
            })
            .catch((error) => {
                console.error(error.message);
                res.status(500).json({ error: error.message });
            });
    })
})

// Route to get all posts
app.get('/api/posts-all', (req, res) => {
    const sqlSelectAll = `
        SELECT *
        FROM Post
        WHERE listing_status = 'published'
          AND NOT EXISTS (
              SELECT 1
              FROM Transaction_Listing SoldListing
              JOIN Transactions SoldTransaction USING (transaction_id)
              WHERE SoldListing.post_id = Post.post_id
                AND SoldListing.intent = 'purchase'
                AND SoldTransaction.status = 'purchased'
          )`;
    const queryImages = `SELECT image_url FROM Post_Image WHERE post_id = ?`;
    const queryUser = `SELECT first_name, last_name FROM User WHERE email = ?`;
    const queryPostCategories = `SELECT category_id FROM Post_Category WHERE post_id = ?`;

        db.all(sqlSelectAll, (err, posts) => {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: err.message });
                return;
            }

            // Fetch images and lister details for each post
            const postsWithDetails = posts.map((post) => {
                return new Promise((resolve, reject) => {
                    db.all(queryImages, [post.post_id], (err, images) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        post.images = images.map((img) => img.image_url);

                        db.all(queryPostCategories, [post.post_id], (err, categories) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            post.categories = categories.map((cat) => cat.category_id);

                        // Fetch lister details for the post
                        db.get(queryUser, [post.owner_id], (err, user) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            if (user) {
                                // construct lister object
                                post.lister = {
                                    display: `${user.first_name} ${user.last_name.charAt(0)}.`,
                                    username: post.owner_id,
                                    avatarUrl: null,    // Placeholder for avatar URL
                                };
                            } else {
                                // default lister object
                                post.lister = {
                                    display: 'Unknown',
                                    username: 'unknown-user',
                                    avatarUrl: null,
                                }
                            }
                            resolve(post);
                        })
                        })
                    });
                });
            });

            // After all images have been fetched for post
            Promise.all(postsWithDetails).then((results) => {
                res.json({ posts: results });
            }).catch((error) => {
                console.error(error.message);
                res.status(500).json({ error: error.message });
            });
        });
});

// Route to add a user into table User of closet_circle_database
// note: used in client/app/users/new/page.tsx
app.post('/api/users/new', ...apiAuth.requireUser, (req, res) => {
    const { first_name, last_name, bio } = req.body;
    const email = req.currentUser.email;
    const sqlInsert = `INSERT INTO User (email, first_name, last_name, bio) VALUES (?, ?, ?, ?)`;
    db.run(sqlInsert, [email, first_name, last_name, bio], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID });
    });
});

// Route to get a specific user based on email
// note: used in client/app/profile/page.tsx to display first & last name, bio
app.get('/api/profile', (req, res) => {
    //console.log(req.body);
    const { email } = req.query;
    console.log("email query " + email);
    const sqlSelect = `SELECT email, first_name, last_name, join_date, bio FROM User WHERE email = ?`;
    db.all(sqlSelect, email, function (err, rows) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        console.log("running query");
        console.log("rows: " + rows);
        res.json({ users: rows });
    });
});

app.use(authErrorHandler);

app.use((error, req, res, next) => {
    console.error(error);
    res.status(error.statusCode || 500).json({
        error: error.statusCode ? error.message : 'Internal server error',
    });
});


let server;

async function startServer() {
    const seedOnStart = process.env.SEED_DATABASE_ON_START === 'true';
    await initializeDatabase(db, { seed: seedOnStart });

    return new Promise((resolve, reject) => {
        server = app.listen(port, host, () => {
            console.log(`Server is running on http://${host}:${port}`);
            console.log(`Database: ${databasePath}`);
            console.log(`Uploads: ${uploadsPath}`);
            console.log(`Authentication: ${apiAuth.configured ? 'configured' : 'not configured'}`);
            resolve(server);
        });
        server.once('error', reject);
    });
}

async function shutdown(signal) {
    console.log(`Received ${signal}; shutting down`);
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
    await closeDatabase(db);
}

if (require.main === module) {
    startServer().catch((error) => {
        console.error('Failed to start server:', error);
        process.exitCode = 1;
    });

    for (const signal of ['SIGINT', 'SIGTERM']) {
        process.once(signal, () => {
            shutdown(signal)
                .then(() => process.exit(0))
                .catch((error) => {
                    console.error('Failed to shut down cleanly:', error);
                    process.exit(1);
                });
        });
    }
}

module.exports = { app, startServer };
