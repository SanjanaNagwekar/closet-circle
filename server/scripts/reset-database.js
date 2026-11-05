const fs = require('node:fs');
const path = require('node:path');
const { resolveDatabasePath } = require('../database');

const databasePath = resolveDatabasePath();

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DATABASE_RESET !== 'true') {
    throw new Error('Production database reset requires ALLOW_DATABASE_RESET=true');
}

if (path.extname(databasePath) !== '.db') {
    throw new Error(`Refusing to reset a non-.db path: ${databasePath}`);
}

fs.rmSync(databasePath, { force: true });
console.log(`Removed database: ${databasePath}`);
