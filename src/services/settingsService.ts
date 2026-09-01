import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = '@app_language';
const UNITS_KEY = '@app_units';
const NOTIF_KEY = '@app_notifications_enabled';

export type UnitSystem = 'metric' | 'imperial';
export type Language = 'sr' | 'en';

export const SettingsService = {
    async getLanguage(): Promise<Language> {
        const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
        return (lang as Language) || 'sr';
    },

    async setLanguage(lang: Language): Promise<void> {
        await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    },

    async getUnitSystem(): Promise<UnitSystem> {
        const units = await AsyncStorage.getItem(UNITS_KEY);
        return (units as UnitSystem) || 'metric';
    },

    async setUnitSystem(units: UnitSystem): Promise<void> {
        await AsyncStorage.setItem(UNITS_KEY, units);
    },

    async getNotificationEnabled(): Promise<boolean> {
        const enabled = await AsyncStorage.getItem(NOTIF_KEY);
        return enabled !== null ? JSON.parse(enabled) : true;
    },

    async setNotificationsEnabled(enabled: boolean): Promise<void> {
        await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(enabled));
    }
};