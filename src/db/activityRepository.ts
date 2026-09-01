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

export interface ActivityStats {
    totalDistance: number,
    totalDuration: number,
    totalCount: number,
    avgSpeed: number;
}

export const getActivityStats = async (type: string = 'ALL', periodDays: number = 30): Promise<ActivityStats> => {
    const db = await getDbConnection();

    const dateThreshold = new Date();
    dateThreshold.setHours(0, 0, 0, 0);
    if(periodDays > 1)
        dateThreshold.setDate(dateThreshold.getDate() - (periodDays - 1));
    
    const isoDate = dateThreshold.toISOString();

    let query = `SELECT COALESCE(SUM(distance), 0) AS totalDistance,
        COALESCE(SUM(duration), 0) AS totalDuration,
        COUNT(id) AS totalCount,
        COALESCE(AVG(averageSpeed), 0) AS avgSpeed
        FROM activities WHERE date >= ?`;
    
    const params: any[] = [isoDate];

    if(type !== 'ALL'){
        query += ' AND type = ?';
        params.push(type);
    }

    const result = await db.getFirstAsync<ActivityStats>(query, params);

    return (
        result || {
            totalDistance: 0,
            totalDuration: 0,
            totalCount: 0,
            avgSpeed: 0,
        }
    );
};