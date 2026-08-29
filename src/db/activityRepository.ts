import { getDbConnection } from "./database";
import { Activity } from "../models/Activity";

export const saveActivity = async (activity: Activity): Promise<number> => {
    const db = await getDbConnection();
    const result = await db.runAsync(
        `INSERT INTO activities (type, duration, distance, date, description, routeJson, averageSpeed)
        VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
            activity.type,
            activity.duration,
            activity.distance,
            activity.date,
            activity.description || '',
            activity.routeJson || '[]',
            activity.averageSpeed
        ]
    );
    return result.lastInsertRowId;
};

export const getAllActivities = async (): Promise<Activity[]> => {
    const db = await getDbConnection();
    const rows = await db.getAllAsync<Activity>('SELECT * FROM activities ORDER BY date DESC;');
    return rows;
};

export const deleteActivity = async (id: number): Promise<void> => {
    const db = await getDbConnection();
    await db.runAsync('DELETE FROM activities WHERE id = ?;', [id]);
}