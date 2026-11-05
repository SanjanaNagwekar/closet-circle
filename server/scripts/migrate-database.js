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
        await initializeDatabase(db);
        console.log(`Database migrations are current: ${databasePath}`);
    } finally {
        await closeDatabase(db);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
