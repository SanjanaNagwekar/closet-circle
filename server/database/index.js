const fs = require('node:fs');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

const SERVER_ROOT = path.join(__dirname, '..');
const DEFAULT_DATABASE_PATH = path.join(SERVER_ROOT, 'data', 'closet-circle.db');
const MIGRATIONS_PATH = path.join(__dirname, 'migrations');
const LEGACY_SETUP_PATH = path.join(SERVER_ROOT, 'databases', 'createdb.sql');

function resolveDatabasePath(environment = process.env) {
    const configuredPath = environment.DATABASE_PATH?.trim();
    const databasePath = configuredPath
        ? path.resolve(SERVER_ROOT, configuredPath)
        : DEFAULT_DATABASE_PATH;

    if (databasePath === path.parse(databasePath).root) {
        throw new Error('DATABASE_PATH cannot point to a filesystem root');
    }

    return databasePath;
}

function openDatabase(databasePath = resolveDatabasePath()) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    return new sqlite3.Database(databasePath);
}

function exec(db, sql) {
    return new Promise((resolve, reject) => {
        db.exec(sql, (error) => error ? reject(error) : resolve());
    });
}

function get(db, sql, parameters = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, parameters, (error, row) => error ? reject(error) : resolve(row));
    });
}

function all(db, sql, parameters = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, parameters, (error, rows) => error ? reject(error) : resolve(rows));
    });
}

function run(db, sql, parameters = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, parameters, function onRun(error) {
            if (error) {
                reject(error);
                return;
            }
            resolve({ changes: this.changes, lastID: this.lastID });
        });
    });
}

function closeDatabase(db) {
    return new Promise((resolve, reject) => {
        db.close((error) => error ? reject(error) : resolve());
    });
}

async function applyMigrations(db) {
    await exec(db, `
        CREATE TABLE IF NOT EXISTS schema_migrations (
            migration_id TEXT PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `);

    const migrationFiles = fs.readdirSync(MIGRATIONS_PATH)
        .filter((fileName) => fileName.endsWith('.sql'))
        .sort();

    for (const fileName of migrationFiles) {
        const existingMigration = await get(
            db,
            'SELECT migration_id FROM schema_migrations WHERE migration_id = ?',
            [fileName],
        );
        if (existingMigration) continue;

        const migrationSql = fs.readFileSync(path.join(MIGRATIONS_PATH, fileName), 'utf8');
        await exec(db, 'BEGIN IMMEDIATE;');
        try {
            await exec(db, migrationSql);
            await run(
                db,
                'INSERT INTO schema_migrations (migration_id) VALUES (?)',
                [fileName],
            );
            await exec(db, 'COMMIT;');
        } catch (error) {
            await exec(db, 'ROLLBACK;');
            throw new Error(`Migration ${fileName} failed: ${error.message}`);
        }
    }
}

function readDemoSeedSql() {
    const setupSql = fs.readFileSync(LEGACY_SETUP_PATH, 'utf8');
    const marker = '-- INSERT Statements';
    const markerIndex = setupSql.indexOf(marker);
    if (markerIndex === -1) {
        throw new Error(`Could not find seed marker in ${LEGACY_SETUP_PATH}`);
    }
    return setupSql.slice(markerIndex + marker.length).trim();
}

async function seedDatabase(db) {
    const existingUser = await get(db, 'SELECT email FROM User LIMIT 1');
    if (existingUser) return { seeded: false };

    await exec(db, 'BEGIN IMMEDIATE;');
    try {
        await exec(db, readDemoSeedSql());
        await exec(db, 'COMMIT;');
        return { seeded: true };
    } catch (error) {
        await exec(db, 'ROLLBACK;');
        throw new Error(`Demo seed failed: ${error.message}`);
    }
}

async function initializeDatabase(db, { seed = false } = {}) {
    await exec(db, `
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA busy_timeout = 5000;
    `);
    await applyMigrations(db);
    if (seed) await seedDatabase(db);
}

async function checkDatabase(db) {
    const result = await get(db, 'SELECT 1 AS ready');
    return result?.ready === 1;
}

module.exports = {
    all,
    applyMigrations,
    checkDatabase,
    closeDatabase,
    initializeDatabase,
    openDatabase,
    exec,
    get,
    resolveDatabasePath,
    run,
    seedDatabase,
};
