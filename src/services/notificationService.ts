import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { SettingsService } from './settingsService';
import i18n from 'i18next';

const isExpoGo = Constants.appOwnership === 'expo';

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

export const scheduleDailyReminder = async (lastActivityDate?: Date | null) => {
    const isEnabled = await SettingsService.getNotificationEnabled();
    await Notifications.cancelAllScheduledNotificationsAsync();

    if(!isEnabled) return;

    const hasPermission = await requestNotificationPermissions();
    if(!hasPermission) return;

    const { hour, minute } = await SettingsService.getNotificationTime();

    const today = new Date();
    const hasTrainedToday = lastActivityDate ? (
        new Date(lastActivityDate).getDate() === today.getDate() &&
        new Date(lastActivityDate).getMonth() === today.getMonth() && 
        new Date(lastActivityDate).getFullYear() === today.getFullYear()
    ) : false;

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