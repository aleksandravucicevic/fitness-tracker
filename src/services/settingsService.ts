import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = '@app_language';
const UNITS_KEY = '@app_units';

export type UnitSystem = 'metric' | 'imperial';

export const SettingsService = {
    async getLanguage(): Promise<string> {
        const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
        return lang || 'sr';
    },

    async setLanguage(lang: string): Promise<void> {
        await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    },

    async getUnitSystem(): Promise<UnitSystem> {
        const units = await AsyncStorage.getItem(UNITS_KEY);
        return (units as UnitSystem) || 'metric';
    },

    async setUnitSystem(units: UnitSystem): Promise<void> {
        await AsyncStorage.setItem(UNITS_KEY, units);
    },
};