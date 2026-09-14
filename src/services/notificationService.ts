import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { SettingsService } from './settingsService';
import i18n from 'i18next';

const isExpoGo = Constants.appOwnership === 'expo';
const INACTIVITY_THRESHOLD_DAYS = 3;

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if(existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if(finalStatus !== 'granted')
        return false;

    if(Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#00E676',
            });
        } catch (error) {
            console.log('Greška postavljanja nativnog push kanala unutar Expo Go.');
        }
    }

    return true;
};

// broj dana neaktivnosti
const daysBetween = (from: Date, to: Date): number => {
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((end.getTime() - start.getTime()) / (1000*60*60*24));
}

export const scheduleDailyReminder = async (lastActivityDate?: Date | null) => {
    const isEnabled = await SettingsService.getNotificationEnabled();
    await Notifications.cancelAllScheduledNotificationsAsync();

    if(!isEnabled) return;

    const hasPermission = await requestNotificationPermissions();
    if(!hasPermission) return;

    const { hour, minute } = await SettingsService.getNotificationTime();
    const today = new Date();

    const daysSinceLastActivity = lastActivityDate ? daysBetween(new Date(lastActivityDate), today) : null;
    const hasTrainedToday = daysSinceLastActivity === 0;
    const isLongInactive = daysSinceLastActivity != null && daysSinceLastActivity <= INACTIVITY_THRESHOLD_DAYS;

    // podsjetnik u slučaju da korisnik nije bio aktivan duži vremenski period
    if(isLongInactive) {
        const todayKey = today.toISOString().slice(0, 10);
        const lastAlertSent = await SettingsService.getLastInactivityAlertDate();

        if(lastAlertSent !== todayKey) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: i18n.t('notificationsInactiveTitle'),
                    body: i18n.t('notificationsInactiveBody', { days: daysSinceLastActivity }),
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: 0,
                    repeats: false,
                },
            });
            await SettingsService.setLastActivityAlertDate(todayKey);
        }
    }

    // redovni dnevni podsjetnik
    let targetDate = new Date();
    targetDate.setHours(hour, minute, 0, 0);

    if(targetDate.getTime() <= today.getTime() || hasTrainedToday)
        targetDate.setDate(targetDate.getDate() + 1);

    await Notifications.scheduleNotificationAsync({
        content: {
            title: i18n.t('notificationsReminderTitle'),
            body: i18n.t('notificationsReminderBody'),
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: targetDate.getHours(),
            minute: targetDate.getMinutes(),
        },
    });
};

// TODO
// TRENUTNI PODJSTNIK (ZA TESTIRANJE)!
export const sendInstantNotification = async () => {
    const hasPermission = await requestNotificationPermissions();
    if(!hasPermission)
        return;

    await Notifications.scheduleNotificationAsync({
        content: {
            title: i18n.t('notificationsTestTitle'),
            body: i18n.t('notificationsTestBody'),
        },
        trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5, // 5 sekundi delay
        repeats: false,
        },
    });
};