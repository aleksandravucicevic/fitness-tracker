import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = '@app_language';
const UNITS_KEY = '@app_units';
const NOTIF_KEY = '@app_notifications_enabled';
const NOTIF_TIME_KEY = '@notification_time';
const LAST_INACTIVITY_ALERT_KEY = '@last_activity_alert_date'

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
    },

    async getNotificationTime(): Promise<{ hour: number; minute: number }> {
        try {
            const time = await AsyncStorage.getItem(NOTIF_TIME_KEY);
            return time ? JSON.parse(time) : { hour: 20, minute: 0};
        } catch {
            return { hour: 20, minute: 0 };
        }
    },

    async setNotificationTime(hour: number, minute: number): Promise<void> {
        try {
            await AsyncStorage.setItem(NOTIF_TIME_KEY, JSON.stringify({ hour, minute}));
        } catch (error) {
            console.error('Greška pri čuvanju vremena za notifikacije:', error);
        }
    },

    async getLastInactivityAlertDate(): Promise<string | null> {
        return AsyncStorage.getItem(LAST_INACTIVITY_ALERT_KEY);
    },

    async setLastActivityAlertDate(isoDate : string): Promise<void> {
        await AsyncStorage.setItem(LAST_INACTIVITY_ALERT_KEY, isoDate);
    },
};