import { getDbConnection } from "./database";
import { Activity } from "../models/Activity";

export const saveActivity = async (activity: Activity): Promise<number> => {
    const db = await getDbConnection();
    const result = await db.runAsync(
        `INSERT INTO activities (type, duration, distance, date, description, routeJson, averageSpeed, steps)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
            activity.type,
            activity.duration,
            activity.distance,
            activity.date,
            activity.description || '',
            activity.routeJson || '[]',
            activity.averageSpeed,
            activity.steps ?? null
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

export const getLastActivityDate = async (): Promise<string | null> => {
    const db = await getDbConnection();
    const result = await db.getFirstAsync<{ date: string }>(
        'SELECT date FROM activities ORDER BY date DESC LIMIT 1;'
    );
    return result?.date ?? null;
}

export interface ActivityStats {
    totalDistance: number,
    totalDuration: number,
    totalCount: number,
    avgSpeed: number,
    totalSteps: number;
}

export interface ActivityStatsBreakdown {
    overall: ActivityStats;
    byType: Record<string, ActivityStats>;
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
        COALESCE(AVG(averageSpeed), 0) AS avgSpeed,
        COALESCE(SUM(steps), 0) AS totalSteps 
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
            totalSteps: 0,
        }
    );
};

export const getActivityStatsBreakdown = async (periodDays: number = 30): Promise<ActivityStatsBreakdown> => {
    const db = await getDbConnection();

    const dateThreshold = new Date();
    dateThreshold.setHours(0, 0, 0, 0);
    if(periodDays > 1)
        dateThreshold.setDate(dateThreshold.getDate() - (periodDays - 1));

    const isoDate = dateThreshold.toISOString();

    const rows = await db.getAllAsync<ActivityStats & { type: string }>(
        `SELECT type,
            COALESCE(SUM(distance), 0) AS totalDistance,
            COALESCE(SUM(duration), 0) AS totalDuration,
            COUNT(id) AS totalCount,
            COALESCE(AVG(averageSpeed), 0) AS avgSpeed, 
            COALESCE(SUM(steps), 0) AS totalSteps
        FROM activities
        WHERE date >= ?
        GROUP BY type;`,
        [isoDate]
    );

    const byType: Record<string, ActivityStats> = {};
    const overall: ActivityStats = { totalDistance: 0, totalDuration: 0, totalCount: 0, avgSpeed: 0, totalSteps: 0 };

    let weightedSpeedSum = 0;

    for(const row of rows) {
        const { type, ...stats } = row;
        byType[type] = stats;

        overall.totalDistance += stats.totalDistance;
        overall.totalDuration += stats.totalDuration;
        overall.totalCount += stats.totalCount;
        overall.totalSteps += stats.totalSteps;
        weightedSpeedSum += stats.avgSpeed * stats.totalCount;
    }

    overall.avgSpeed = overall.totalCount > 0 ? weightedSpeedSum / overall.totalCount : 0;

    return { overall, byType };
};