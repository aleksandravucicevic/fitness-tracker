import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDbConnection = async (): Promise<SQLite.SQLiteDatabase> => {
    if(!dbInstance)
        dbInstance = await SQLite.openDatabaseAsync('fitness_tracker.db');

    return dbInstance;
}

export const initDatabase = async (): Promise<void> => {
    const db = await getDbConnection();

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        duration INTEGER NOT NULL,
        distance REAL NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        routeJson TEXT,
        averageSpeed REAL NOT NULL,
        steps INTEGER
        );
    `);

    // migracija za bazu kreiranu prije uvođenja stvarnog pedometra
    const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(activities);`);
    const hasStepsColumn = columns.some((col) => col.name === 'steps');
    if (!hasStepsColumn) {
        await db.execAsync(`ALTER TABLE activities ADD COLUMN steps INTEGER;`);
    }

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        targetValue REAL NOT NULL,
        period TEXT NOT NULL
        );
    `);
};