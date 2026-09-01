import { SettingsService, UnitSystem } from '../services/settingsService';

const COEFFICIENT = 0.621371;

export const getUnitSystem = async (): Promise<UnitSystem> => {
    return await SettingsService.getUnitSystem();
}

export const kmToMiles = (km: number) : number => {
    return km * COEFFICIENT;
}

export const milesToKm = (miles: number): number => {
    return miles / COEFFICIENT;
}

export const metersToMiles = (meters: number): number => {
    return kmToMiles(meters/1000);
}

export const kmhToMph = (kmh: number): number => {
    return kmh * COEFFICIENT;
}

export const formatDistance = (meters: number, unitSystem: UnitSystem = 'metric', decimals: number = 2): string => {
    if(unitSystem === 'imperial') {
        const miles = metersToMiles(meters);
        return `${miles.toFixed(decimals)} mi`;
    }
    const km = meters / 1000;
    return `${km.toFixed(decimals)} km`;
};

export const formatDistanceValue = (meters: number, unitSystem: UnitSystem = 'metric'): { value: string; unit: string } => {
    if(unitSystem === 'imperial') {
        return { value: metersToMiles(meters).toFixed(2), unit: 'mi' };
    }
    return { value: (meters/1000).toFixed(2), unit: 'km' };
};

export const formatSpeed = (speedKmh: number, unitSystem: UnitSystem = 'metric', decimals: number = 1): string => {
    if(unitSystem === 'imperial') {
        const mph = kmhToMph(speedKmh);
        return `${mph.toFixed(decimals)} mph`;
    }
    return `${speedKmh.toFixed(decimals)} km/h`;
};

export const convertKmToDisplay = (km: number, unitSystem: UnitSystem = 'metric'): number => {
    if(unitSystem === 'imperial')
        return kmToMiles(km);
    return km;
}

export const formatTime = (seconds: number, includeSeconds: boolean = false): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if(includeSeconds) {
        const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
        return hrs > 0 ? `${hrs} h ${mins} min ${secsStr} s` : `${mins} min ${secsStr} s`;
    }

    return hrs > 0 ? `${hrs} h ${mins} min` : `${mins} min`;
}

export const formatCalories = (calories: number): string => {
    return `${Math.round(calories)} kcal`;
}