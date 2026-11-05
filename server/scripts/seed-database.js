const {
    closeDatabase,
    initializeDatabase,
    openDatabase,
    resolveDatabasePath,
    seedDatabase,
} = require('../database');

async function main() {
    const databasePath = resolveDatabasePath();
    const db = openDatabase(databasePath);
    try {
        await initializeDatabase(db);
        const { seeded } = await seedDatabase(db);
        console.log(seeded
            ? `Demo data seeded: ${databasePath}`
            : `Seed skipped because data already exists: ${databasePath}`);
    } finally {
        await closeDatabase(db);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
