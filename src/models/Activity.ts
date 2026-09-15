export type ActivityType = 'RUNNING' | 'WALKING' | 'CYCLING' | 'OTHER' ;

export interface LocationPoint {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    speed?: number | null;
    timestamp: number;
}

export interface Activity {
    id?: number;
    type: ActivityType;
    duration: number;
    distance: number;
    date: string;
    description?: string;
    routeJson?: string;
    averageSpeed: number;
    steps?: number;
}

export interface Goal {
    id?: number;
    type: 'STEPS' | 'DISTANCE' | 'DURATION';
    targetValue: number;
    period: 'DAILY' | 'WEEKLY';
}