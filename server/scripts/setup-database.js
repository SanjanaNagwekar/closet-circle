const {
    closeDatabase,
    initializeDatabase,
    openDatabase,
    resolveDatabasePath,
} = require('../database');

async function main() {
    const databasePath = resolveDatabasePath();
    const db = openDatabase(databasePath);
    try {
        await initializeDatabase(db, { seed: true });
        console.log(`Database is ready: ${databasePath}`);
    } finally {
        await closeDatabase(db);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
